import { GoogleGenAI } from "@google/genai";
import { MODEL_TEXT, MODEL_VISUAL, SYSTEM_INSTRUCTION_TEXT, PROMPT_TEXT_NOTE, PROMPT_VISUAL_NOTE } from '../constants';
import { NoteType } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

const resizeImage = async (file: File, maxDim = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w *= ratio;
          h *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = () => reject(new Error("Failed to load image for resizing"));
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const calculateFrameDetailScore = (ctx: CanvasRenderingContext2D, width: number, height: number): number => {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let sum = 0;
    let sumSq = 0;
    let pixelCount = 0;

    // Analyze every 10th pixel for performance efficiency
    const step = 4 * 10; 
    for (let i = 0; i < data.length; i += step) {
      // Standard luminance calculation: 0.299R + 0.587G + 0.114B
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      
      sum += lum;
      sumSq += lum * lum;
      pixelCount++;
    }

    if (pixelCount === 0) return 0;

    const mean = sum / pixelCount;
    const variance = (sumSq / pixelCount) - (mean * mean);
    return variance;
  } catch (e) {
    console.warn("Error calculating frame score", e);
    return 0;
  }
};

const extractFrameFromVideo = async (file: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    try {
      // Wait for metadata to load to get duration
      await new Promise<void>((res, rej) => {
        if (video.readyState >= 1) {
          res();
          return;
        }
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error("Video load error"));
        setTimeout(() => rej(new Error("Video metadata load timeout")), 5000);
      });

      const duration = video.duration;
      // Heuristic: Sample 3 points to find the most "detailed" frame.
      // Avoids black screens at start/end or transitions.
      const timePoints = duration < 2 
        ? [duration / 2] 
        : [duration * 0.2, duration * 0.5, duration * 0.8];

      let bestScore = -1;
      let bestFrameBase64 = '';
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context failed");

      // Process frames sequentially
      for (const time of timePoints) {
        await new Promise<void>((res) => {
           // If time is close to current, seeked might not fire if we don't handle it carefully
           // But here we are jumping around.
           const onSeeked = () => {
             video.removeEventListener('seeked', onSeeked);
             res();
           };
           video.addEventListener('seeked', onSeeked);
           video.currentTime = time;
        });

        // Resize logic to keep payload reasonable
        const maxDim = 1024;
        let w = video.videoWidth;
        let h = video.videoHeight;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w *= ratio;
          h *= ratio;
        }
        canvas.width = w;
        canvas.height = h;

        ctx.drawImage(video, 0, 0, w, h);
        
        const score = calculateFrameDetailScore(ctx, w, h);
        
        // Always keep at least the first frame if everything fails score check
        if (score > bestScore || bestScore === -1) {
          bestScore = score;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          bestFrameBase64 = dataUrl.split(',')[1];
        }
      }

      if (!bestFrameBase64) throw new Error("Could not extract any frame from video");
      resolve(bestFrameBase64);

    } catch (e) {
      reject(e);
    } finally {
      URL.revokeObjectURL(video.src);
      video.remove();
    }
  });
};

export const generateTextNote = async (files: File[]): Promise<string> => {
  const ai = getAiClient();
  
  const contentParts = await Promise.all(files.map(async (file) => {
    // Re-implement simple fileToBase64 for text notes but with resize for images
    if (file.type.startsWith('image/')) {
        return {
             inlineData: { mimeType: file.type, data: await resizeImage(file) }
        };
    } else {
        // For video in text notes, we send the video file directly if supported,
        // or we could extract frames. 
        // Gemini 3 Flash supports video. Let's send the video file bytes.
        return {
            inlineData: { mimeType: file.type, data: await fileToBase64(file) }
        }
    }
  }));

  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_TEXT,
    },
    contents: {
      parts: [
        ...contentParts,
        {
          text: PROMPT_TEXT_NOTE,
        },
      ],
    },
  });

  return response.text || "No notes generated.";
};

// Helper for raw base64 (used for video files in text notes)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const generateVisualNote = async (files: File[]): Promise<string> => {
  const ai = getAiClient();
  
  const contentParts = await Promise.all(files.map(async (file) => {
    let base64Data: string;
    let mimeType: string;

    // Handle Video Inputs by extracting the "best" frame for visual notes
    if (file.type.startsWith('video/')) {
        base64Data = await extractFrameFromVideo(file);
        mimeType = 'image/jpeg';
    } else {
        // Resize images for visual notes to ensure they fit model context window/req limits
        base64Data = await resizeImage(file);
        // resizeImage returns jpeg or png based on input, but toDataURL default might be mixed.
        // resizeImage ensures correct mimeType in toDataURL call but returns just base64.
        // We need to know the mimeType. resizeImage implementation above preserves png or forces jpeg.
        mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    }

    return {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };
  }));

  try {
      // gemini-2.5-flash-image (Nano Banana)
      const response = await ai.models.generateContent({
        model: MODEL_VISUAL,
        contents: {
          parts: [
            ...contentParts,
            {
              text: PROMPT_VISUAL_NOTE,
            },
          ],
        },
        config: {
            // Explicitly requesting image output configuration
            imageConfig: {
                aspectRatio: "1:1",
            }
        }
      });

      // Extract image from response
      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) {
          throw new Error("Model returned no content parts. The request might have been blocked.");
      }

      for (const part of parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      // If text is returned instead of an image
      const text = response.text;
      if (text) {
          console.warn("Model returned text:", text);
          throw new Error(`Model returned text instead of image: ${text.slice(0, 100)}...`);
      }
      
      throw new Error("No visual note generated. The model response was empty.");
      
  } catch (error: any) {
      console.error("Generate Visual Note Error:", error);
      throw error;
  }
};

export const generateNote = async (files: File[], type: NoteType): Promise<string> => {
  if (files.length === 0) throw new Error("No files provided");
  
  if (type === NoteType.TEXT) {
    return generateTextNote(files);
  } else {
    return generateVisualNote(files);
  }
};
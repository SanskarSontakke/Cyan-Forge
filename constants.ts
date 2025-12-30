
export const MODEL_TEXT = 'gemini-3-flash-preview';
export const MODEL_VISUAL = 'gemini-2.5-flash-image';

export const SYSTEM_INSTRUCTION_TEXT = `
You are an expert analyst and note-taker. 
Your goal is to analyze the provided image(s) or video(s) and create clear, structured, and useful notes in Markdown format.
Focus on key details, actionable items, and a summary of the visual content.
Use bullet points, headers, and bold text for readability.
Keep the tone professional and objective.
If multiple inputs are provided, synthesize the information into a cohesive summary.
`;

export const PROMPT_TEXT_NOTE = "Analyze this media collection and generate comprehensive notes.";
export const PROMPT_VISUAL_NOTE = "Generate a single high-quality image. This image should be a professional visual note or schematic diagram summarizing the provided inputs. The style MUST be clean, neutral, and professional: light background (white or off-white), clear dark lines for diagrams, and a standard, balanced color palette. Avoid dark backgrounds, high-contrast neon, or cyberpunk aesthetics. Do not output text, only generate the image.";

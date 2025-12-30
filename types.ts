export type MediaType = 'image' | 'video';

export interface MediaFile {
  file: File;
  previewUrl: string;
  type: MediaType;
}

export enum NoteType {
  TEXT = 'TEXT',
  VISUAL = 'VISUAL',
}

export interface Note {
  id: string;
  createdAt: number;
  type: NoteType;
  content: string; // Markdown text or Base64 Image URL
  relatedMediaUrls: string[];
}

export interface ProcessingState {
  isProcessing: boolean;
  error: string | null;
}
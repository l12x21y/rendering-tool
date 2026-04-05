
export type ArtStyle = 'Watercolor' | 'Colored Pencil' | 'Anime' | '3D Model';

export interface StyleMetrics {
  colorPalette: string[]; // Hex codes
  saturationLevel: number; // 0-100
  contrastLevel: number; // 0-100
  lineWeight: 'Thin' | 'Medium' | 'Thick' | 'None';
  textureType: string; // e.g., "Paper", "Canvas", "Digital"
  lightingStyle: string; // e.g., "Soft", "Cinematic"
}

export interface CustomStyle {
  id: string;
  name: string;
  description: string;
  trainingData: StyleLabStep[];
  latestMetrics?: StyleMetrics;
  createdAt: number;
}

export interface StyleLabStep {
  step: number;
  userFeedback: string;
  refinedStyleDescription: string;
  structuredData: StyleMetrics;
  imageUrl?: string;
  timestamp: number;
}

export interface GenerationSettings {
  style: string; // Changed from ArtStyle to string to support custom IDs
  intensity: number; // 0-100
  softness: number; // 0-100
  paperTexture: boolean;
  styleReferenceImage: string | null; // Base64 string
  customStyleDescription?: string; // For passing the custom prompt
}

export interface GeneratedImage {
  url: string;
  timestamp: number;
}

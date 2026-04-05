import { GoogleGenAI, Type } from "@google/genai";
import { GenerationSettings, StyleMetrics } from "../types";

// Allow dynamic injection of API Key
let activeApiKey = process.env.API_KEY || "";

export const setApiKey = (key: string) => {
  activeApiKey = key;
};

// Helper to get a fresh client instance using the dynamic key
const getAiClient = () => {
  if (!activeApiKey) {
    console.warn("Gemini API Key is missing! Please provide one via setApiKey().");
  }
  return new GoogleGenAI({ apiKey: activeApiKey });
};

// --- Style Lab Functions ---

export const refineStyleDescription = async (
  currentDescription: string,
  userFeedback: string,
  sketchContext: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `
      You are an expert Art Director AI specialized in rendering sketches.
      
      Context:
      - The user has provided a sketch of: "${sketchContext}"
      - We are defining a rendering style to transform this sketch into final art.
      - Current Style Definition: "${currentDescription || 'Standard artistic render'}"
      - User's Feedback on previous render: "${userFeedback}"
      
      Task:
      - Write a precise, visual Style Description Prompt.
      - Focus on: Medium (watercolor, oil, 3d), Lighting, Color Palette, Texture, and Line work.
      - DO NOT describe the subject content (e.g. "a cat"), only describe the HOW (the style).
      - Output ONLY the raw style description string.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Refine Style Error:", error);
    throw error;
  }
};

export const extractStyleMetrics = async (styleDescription: string): Promise<StyleMetrics> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Analyze the following art style description and extract quantitative data suitable for a configuration file.
      
      Style Description: "${styleDescription}"
      
      Output JSON format matching this schema:
      {
        "colorPalette": ["#hex", "#hex", ...], // Extract 3-5 dominant colors inferred from the style
        "saturationLevel": number, // 0-100 inferred
        "contrastLevel": number, // 0-100 inferred
        "lineWeight": "Thin" | "Medium" | "Thick" | "None",
        "textureType": string, // e.g. "Cold Press Paper", "Smooth Digital", "Canvas"
        "lightingStyle": string // Short descriptor
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
            saturationLevel: { type: Type.NUMBER },
            contrastLevel: { type: Type.NUMBER },
            lineWeight: { type: Type.STRING, enum: ['Thin', 'Medium', 'Thick', 'None'] },
            textureType: { type: Type.STRING },
            lightingStyle: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as StyleMetrics;
  } catch (error) {
    console.warn("Metrics Extraction Failed, using defaults", error);
    return {
      colorPalette: ['#000000', '#ffffff'],
      saturationLevel: 50,
      contrastLevel: 50,
      lineWeight: 'Medium',
      textureType: 'Standard',
      lightingStyle: 'Neutral'
    };
  }
};

export const generateStylePreview = async (
  base64Sketch: string,
  sketchSubject: string,
  styleDescription: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    const fullPrompt = `
      Task: Transform the attached sketch line-art into a fully rendered artwork.
      
      Subject Content: ${sketchSubject}
      
      APPLY THIS VISUAL STYLE STRICTLY:
      ${styleDescription}
      
      Requirements:
      - Keep the composition exactly as the sketch.
      - High resolution, professional finish.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [
          { inlineData: { data: base64Sketch, mimeType: 'image/jpeg' } },
          { text: fullPrompt }
        ] 
      },
    });

    const respParts = response.candidates?.[0]?.content?.parts;
    if (!respParts) throw new Error("No content generated");

    for (const part of respParts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image in response");
  } catch (error) {
    console.error("Preview Generation Error:", error);
    throw error;
  }
};

// --- Main Generation Function ---

export const generateArt = async (
  base64Image: string,
  settings: GenerationSettings
): Promise<string> => {
  const ai = getAiClient();
  let stylePrompt = "";
  
  // If it's a preset style, use hardcoded prompts
  switch (settings.style) {
    case 'Watercolor':
      stylePrompt = "high-quality watercolor illustration";
      break;
    case 'Colored Pencil':
      stylePrompt = "colored pencil sketch with visible strokes, cross-hatching";
      break;
    case 'Anime':
      stylePrompt = "high-quality anime style illustration, cel shading, clean lines, vibrant";
      break;
    case '3D Model':
      stylePrompt = "3D rendered style, blender cycles render, soft lighting, ambient occlusion, clay render aesthetic";
      break;
    default:
      // If it's a custom style, we expect the description to be passed in settings
      if (settings.customStyleDescription) {
        stylePrompt = settings.customStyleDescription;
      } else {
        stylePrompt = "artistic illustration";
      }
  }

  // Construct parameter-based prompts (only apply to presets or if needed)
  // For custom styles, we trust the custom description mostly, but we can append these as subtle modifiers
  const intensityPrompt = settings.intensity < 30 
    ? "pale, desaturated colors" 
    : settings.intensity > 70 
      ? "vibrant, highly saturated, colorful" 
      : "balanced colors";

  const softnessPrompt = settings.softness > 70
    ? "diffuse edges, dreamy blur, soft focus"
    : settings.softness < 30
      ? "sharp details, defined edges, crisp"
      : "gentle edges";

  let texturePrompt = "";
  if (settings.paperTexture) {
     if (settings.style === 'Watercolor') texturePrompt = "visible cold-press watercolor paper texture";
     else if (settings.style === 'Colored Pencil') texturePrompt = "visible sketchbook paper grain";
     else texturePrompt = "subtle surface texture"; 
  } else {
    texturePrompt = "smooth finish";
  }

  let fullPrompt = "";

  if (settings.customStyleDescription) {
    // Custom Style Logic
    fullPrompt = `
      Transform the first image into the following style:
      ${settings.customStyleDescription}
      
      Additional adjustments:
      - ${intensityPrompt}
      - ${softnessPrompt}
      ${settings.paperTexture ? `- ${texturePrompt}` : ''}
      
      Maintain the original composition and subject matter of the source image.
    `;
  } else {
    // Preset Style Logic
    fullPrompt = `
      Transform the first image into a ${stylePrompt}.
      Style requirements:
      - ${intensityPrompt}
      - ${softnessPrompt}
      - ${texturePrompt}
      - Maintain the original composition and subject matter of the source image.
    `;
  }

  if (settings.styleReferenceImage) {
    fullPrompt += `
    \nIMPORTANT: Use the second image provided as a STRICT STYLE REFERENCE. 
    Analyze the second image's color palette, lighting, shading technique, and artistic stroke style.
    Apply that specific aesthetic to the content of the first image.
    `;
  } else {
    fullPrompt += `\n- Artistic, high-quality look.`;
  }

  const parts: any[] = [
    {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    }
  ];

  if (settings.styleReferenceImage) {
    parts.push({
      inlineData: {
        data: settings.styleReferenceImage,
        mimeType: 'image/jpeg',
      },
    });
  }

  parts.push({ text: fullPrompt });

  try {
    // Determine model based on complexity. Flash-Image is generally good for style transfer.
    // If the custom style prompt is very long/complex, we still use flash-image for speed.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
    });

    const respParts = response.candidates?.[0]?.content?.parts;
    
    if (!respParts) {
      throw new Error("No content generated");
    }

    for (const part of respParts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated in the response");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
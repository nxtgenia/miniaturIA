import { GoogleGenAI } from "@google/genai";

export const MODELS = {
  PRO_IMAGE: "gemini-3-pro-image-preview",
};

export async function generateThumbnail(
  baseImageBase64: string,
  prompt: string,
  referenceImages: { data: string; mimeType: string }[] = []
) {
  // Use API_KEY (user selected) or GEMINI_API_KEY (default)
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const baseMimeType = baseImageBase64.split(',')[0].split(':')[1].split(';')[0];
  const baseData = baseImageBase64.split(',')[1];

  const parts: any[] = [
    {
      inlineData: {
        data: baseData,
        mimeType: baseMimeType,
      },
    },
    { 
      text: `BASE IMAGE: Use this image as the background/base for the thumbnail.
INSTRUCTIONS: ${prompt}
${referenceImages.length > 0 ? 'REFERENCE IMAGES: Use the following images as character/object references as tagged in the prompt (@img1, @img2, etc.).' : ''}` 
    },
  ];

  // Add reference images if any
  referenceImages.forEach((ref, index) => {
    parts.push({
      inlineData: {
        data: ref.data.split(',')[1],
        mimeType: ref.mimeType,
      },
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: MODELS.PRO_IMAGE,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K",
        },
      },
    });

    let modelTextResponse = "";
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        if (part.text) {
          modelTextResponse += part.text + " ";
        }
      }
    }

    if (modelTextResponse.trim()) {
      throw new Error(`El modelo no generó una imagen. Respuesta del modelo: ${modelTextResponse.trim()}`);
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      throw new Error(`La generación falló. Razón: ${finishReason}`);
    }

    throw new Error("No se generó ninguna imagen y no hubo respuesta de texto del modelo.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export function getYouTubeThumbnail(url: string) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    const videoId = match[2];
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return null;
}

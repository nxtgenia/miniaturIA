import { GoogleGenAI, Type } from "@google/genai";

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

  // Text part at the end
  parts.push({ 
    text: `BASE IMAGE: Use the first image as the background/base for the thumbnail.
INSTRUCTIONS: ${prompt}
${referenceImages.length > 0 ? 'REFERENCE IMAGES: Use the subsequent images as character/object references as tagged in the prompt (@img1, @img2, etc.).' : ''}` 
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

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("El modelo no devolvió ninguna respuesta. Esto puede deberse a filtros de seguridad o un error interno.");
    }

    const candidate = response.candidates[0];
    
    // Handle specific finish reasons
    if (candidate.finishReason === 'SAFETY') {
      throw new Error("La generación fue bloqueada por los filtros de seguridad. Intenta con un prompt menos sensible o imágenes diferentes.");
    }

    if (candidate.finishReason === 'IMAGE_OTHER') {
      throw new Error("Error interno de generación (IMAGE_OTHER). Esto suele ocurrir cuando el modelo no puede procesar la combinación de imágenes y prompt. Intenta simplificar las instrucciones o usar menos imágenes de referencia.");
    }

    if (candidate.finishReason === 'IMAGE_RECITATION') {
      throw new Error("La generación fue bloqueada por derechos de autor (IMAGE_RECITATION). El modelo detectó una similitud excesiva con contenido protegido. Intenta cambiar ligeramente el prompt o usar una imagen base diferente.");
    }

    let modelTextResponse = "";
    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        if (part.text) {
          modelTextResponse += part.text + " ";
        }
      }
    }

    if (modelTextResponse.trim()) {
      throw new Error(`El modelo respondió con texto pero no generó imagen: ${modelTextResponse.trim()}`);
    }

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`La generación falló. Razón: ${candidate.finishReason}`);
    }

    throw new Error("No se generó ninguna imagen. Intenta ajustar tu prompt.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Re-throw with a more user-friendly message if it's a known error string
    if (error.message?.includes('IMAGE_OTHER')) {
       throw new Error("Error de generación (IMAGE_OTHER): El modelo tuvo problemas para procesar tu solicitud. Prueba simplificando el prompt o reduciendo el número de imágenes de referencia.");
    }
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

export async function generateViralTitles(topic: string) {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `Eres un experto en "Packaging" de YouTube con un enfoque humano y conversacional. 
Tu tarea es generar 5 títulos virales basados en la masterclass, pero evitando sonar como un robot o un bot de SEO.

REGLAS DE ORO (Tono Humano):
- Habla como un creador real se dirigiría a su comunidad.
- Evita palabras excesivamente "clickbait" genéricas que suenen falsas.
- Usa un lenguaje natural, crudo y directo.
- El título debe sonar como algo que tú le contarías a un amigo con entusiasmo o preocupación.

PRINCIPIOS TÉCNICOS (Masterclass):
1. LONGITUD: Máximo 60 caracteres.
2. SINERGIA: Debe ser una promesa emocional intrigante.
3. GATILLOS: Curiosidad, miedo, sorpresa, urgencia.

PATRONES (Úsalos de forma natural):
- MÉTODO/SECRETO: "Cómo logré X sin hacer Y" (pero que suene real).
- RAZÓN/EXPLICACIÓN: "Por qué dejé de hacer X" o "La verdad sobre X".
- COMPARACIÓN: "Probé X y Y, y no hay color".
- SHOCK: "No me esperaba esto de X".
- PREGUNTA: "¿Realmente vale la pena X?".

INSTRUCCIONES DE SALIDA:
Para cada título, da una explicación corta de por qué ese ángulo conecta emocionalmente con un humano (no con un algoritmo).

Devuelve un array JSON de objetos con "title" y "explanation".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tema del vídeo: ${topic}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["title", "explanation"]
          }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No se generaron títulos");
    return JSON.parse(text) as { title: string; explanation: string }[];
  } catch (error) {
    console.error("Error generating titles:", error);
    throw error;
  }
}

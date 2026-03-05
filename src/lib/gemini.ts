import { GoogleGenAI, Type } from "@google/genai";
import { API_URL } from './config';
import { supabase } from './supabase';

const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
const KIE_API_BASE = "https://api.kie.ai";

// Helper: Upload image via server-side proxy (much faster than browser upload)
// If already a URL, returns it directly
export async function uploadImageToUrl(base64Image: string): Promise<string> {
  if (base64Image.startsWith('http://') || base64Image.startsWith('https://')) {
    return base64Image;
  }

  const res = await fetch(`${API_URL}/api/upload-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUri: base64Image }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Error subiendo imagen: ${(err as any)?.error || res.status}`);
  }

  const data = await res.json() as { url: string };
  return data.url;
}

export async function generateThumbnail(
  baseImageBase64: string,
  prompt: string,
  referenceImages: { data: string; mimeType: string; tag?: string }[] = []
) {
  // Upload images to get URLs (kie.ai requires URLs, not base64)
  console.log("Subiendo imágenes...");
  const uploadPromises: Promise<string>[] = [uploadImageToUrl(baseImageBase64)];
  referenceImages.forEach((ref) => {
    uploadPromises.push(uploadImageToUrl(ref.data));
  });

  const imageUrls = await Promise.all(uploadPromises);
  console.log("Imágenes subidas:", imageUrls);

  // Send the user's prompt directly, converting UI tags (@img1, @obj1) to @fil format
  let fullPrompt = prompt;
  referenceImages.forEach((ref, index) => {
    if (ref.tag) {
      const filTag = `@fil${index + 2}`;
      fullPrompt = fullPrompt.replace(new RegExp(ref.tag, 'g'), filTag);
    }
  });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error("No hay sesión activa de usuario.");
  }

  const authHeader = { "Authorization": `Bearer ${session.access_token}` };
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Step 1: Create the task (returns immediately with taskId)
      const startResponse = await fetch(`${API_URL}/api/start-generation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ fullPrompt, imageUrls })
      });

      if (!startResponse.ok) {
        const err = await startResponse.json().catch(() => ({}));
        throw new Error((err as any).error || 'Error al iniciar la generación');
      }

      const { taskId } = await startResponse.json();
      if (!taskId) throw new Error("No se recibió taskId del servidor");

      // Step 2: Poll status from the frontend (no server-side timeout risk)
      const maxAttempts = 150; // 5 minutes at 2s intervals
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `${API_URL}/api/generation-status/${taskId}`,
          { headers: authHeader }
        );

        if (!statusResponse.ok) continue;

        const status = await statusResponse.json();

        if (status.state === 'success') return status.url;
        if (status.state === 'fail') {
          // Transient error from kie.ai — retry with a new task
          console.warn(`Intento ${attempt}/${MAX_RETRIES} fallido: ${status.error}`);
          throw new Error(status.error || 'La generación falló');
        }
        // state === 'pending' → keep polling
      }

      throw new Error("Timeout");
    } catch (error: any) {
      if (attempt === MAX_RETRIES) {
        console.error("API Error tras todos los intentos:", error);
        throw new Error("No se pudo generar la imagen tras varios intentos. Por favor, inténtalo de nuevo.");
      }
      // Wait 3s before retrying
      console.warn(`Reintentando generación (${attempt}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  throw new Error("Error inesperado en la generación.");
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

export async function generateViralTitles(topic: string, channelUrl: string = "", fixedWord: string = "", wordPosition: 'start' | 'end' = 'end') {
  const apiKey = GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  let systemInstruction = `Eres un experto en "Packaging" de YouTube con un enfoque humano y conversacional.
Tu tarea es generar 5 títulos virales para un vídeo, aplicando las técnicas avanzadas de la Masterclass de Creación de Títulos.`;

  if (channelUrl) {
    systemInstruction += `\n\n🎯 INSTRUCCIÓN ESPECIAL Y PERSONALIZADA PARA ESTE CANAL:
El usuario ha proporcionado su canal de YouTube (o un canal de referencia): ${channelUrl}
POR FAVOR, USA TU ACCESO A BÚSQUEDA WEB PARA ANALIZAR ESTE CANAL.
1. Revisa qué tipo de títulos han funcionado mejor en el pasado.
2. Identifica el "tono" y el estilo de la audiencia (ej. ¿es educativo, de entretenimiento, sensacionalista, profesional?).
3. Descubre qué emociones resuenan más con sus espectadores.
4. BASÁNDOTE EN ESE ANÁLISIS, ADAPTA TUS TÍTULOS. No des títulos genéricos; haz que suenen como si pertenecieran naturalmente a los mayores éxitos de ESE canal, pero aplicando las técnicas virales descritas abajo.`;
  }

  systemInstruction += `\n\n⚠️ REGLA #0 — NUNCA COPIES Y PEGUES:
- JAMÁS generes un título genérico o que suene a "copia de la copia". Cada título debe ser PIONERO en su ángulo.
- Si un título suena a algo que ya se ha visto 100 veces en YouTube, DESCÁRTALO y busca otro ángulo.
- El objetivo es que si un espectador ve el vídeo original Y el tuyo en el feed, NO parezcan lo mismo. Si son iguales, el espectador entrará al que ya conoce y te quedarás sin clic.

📐 PRINCIPIOS TÉCNICOS:
1. LONGITUD: Máximo 60 caracteres.
2. MAYÚSCULAS SELECTIVAS: Lo más importante del título va en MAYÚSCULAS. Los conectores ("que", "de", "con", "y", "un") van en minúscula. Las demás palabras llevan la primera letra en mayúscula. NUNCA todo en minúscula ni todo en mayúscula.
   - Ejemplo correcto: "La ÚNICA Fruta que Destruye el ALZHEIMER"
   - Ejemplo incorrecto: "la unica fruta que destruye el alzheimer" / "LA UNICA FRUTA QUE DESTRUYE EL ALZHEIMER"
3. GATILLOS EMOCIONALES: Curiosidad, miedo, sorpresa, urgencia, exclusividad. El título debe provocar una emoción que obligue al clic.
4. TONO HUMANO: Habla como un creador real, no como un bot de SEO. El título debe sonar como algo que le contarías a un amigo con entusiasmo o preocupación.`;

  if (fixedWord) {
    const positionText = wordPosition === 'start' ? 'AL PRINCIPIO DEL TÍTULO' : 'AL FINAL DEL TÍTULO';
    systemInstruction += `\n\n🎯 REGLA ESTRICTA DE PALABRA FIJA:
El usuario ha solicitado que TODOS los títulos generados obligatoriamente contengan la palabra/frase exacta: "${fixedWord}"
Debes colocar esta palabra/frase EXACTAMENTE ${positionText} en los 5 títulos generados.
- Ejemplo si es al inicio: "${fixedWord} Así Destruyes tu Canal"
- Ejemplo si es al final: "Así Destruyes tu Canal ${fixedWord}"
Asegúrate de que la gramática tenga sentido con esta palabra añadida.`;
  }

  systemInstruction += `\n\n🔧 TÉCNICAS DE REESCRITURA (aplica al menos una diferente por título):

TÉCNICA 1 — CAMBIAR EL ORDEN:
Reorganiza los elementos del título. Si normalmente pondrías "6 Frutas que Destruyen el Alzheimer — Frank Suárez", cámbialo a "Frank Suárez: Estas 6 FRUTAS Destruyen el Alzheimer" o "Destruye el ALZHEIMER con Estas 6 Frutas".

TÉCNICA 2 — CREAR EXCLUSIVIDAD (Singular vs Plural):
Si el contenido tiene un listado (6 frutas, 5 ejercicios, 10 consejos), en vez de revelar el número, usa el singular para generar mayor necesidad y exclusividad.
- En vez de "6 Frutas que Destruyen el Alzheimer" → "La ÚNICA Fruta que Destruye el Alzheimer"
- Esto genera más urgencia porque el espectador siente que hay UNA sola cosa que necesita saber.

TÉCNICA 3 — USAR UNA AUTORIDAD RELEVANTE:
Apalancarse de una figura de autoridad al inicio del título usando "dos puntos" para dar credibilidad inmediata. No uses siempre la misma autoridad; busca una que sea específica y relevante al tema.
- "Neurólogo: Esta Fruta Provoca DEMENCIA Grave"
- "Médico Cerebral: DEJA de Comer Esto"
- "Ex-Ingeniero de Google: Así Funciona el ALGORITMO"

TÉCNICA 4 — ATACAR EL ÁNGULO OPUESTO:
En vez de hablar del beneficio, habla de lo que lo CAUSA o lo EMPEORA. Ataca el dolor contrario.
- Original: "6 Frutas que Destruyen el Alzheimer" (beneficio)
- Opuesto: "6 Frutas que PROVOCAN Alzheimer" (causa/dolor)
- Esto funciona porque el miedo a perder es más fuerte que el deseo de ganar.

TÉCNICA 5 — USAR SINÓNIMOS Y TÉRMINOS RELACIONADOS:
No repitas las mismas palabras que todo el mundo usa. Busca sinónimos o conceptos relacionados que amplíen el alcance.
- "Alzheimer" → "Demencia", "Pérdida de Memoria", "Deterioro Cognitivo"
- "Destruye" → "Acelera", "Provoca", "Revierte", "Rejuvenece"
- "Ganar dinero" → "Escalar ingresos", "Vivir de esto", "Monetizar"

TÉCNICA 6 — COMBINAR OPUESTOS (MÁS VALOR):
Junta lo malo y lo bueno en un solo título para aportar más valor y generar mayor curiosidad.
- "4 Frutas que DAÑAN tu Cerebro y 4 que lo PROTEGEN de la Demencia"
- "5 Hábitos que DESTRUYEN tu Canal y 3 que lo VIRALIZAN"

TÉCNICA 7 — REMIXAR COMPETENCIA:
Investiga qué títulos han funcionado en la competencia y mezcla elementos de diferentes títulos exitosos para crear algo nuevo y mejor. No copies, REMEZCLA.
- Si un título usa "como médico te ruego" y otro usa "acelera la demencia", combínalos: "Como MÉDICO te Ruego: Deja Esta Fruta que Acelera la DEMENCIA"

🎯 INSTRUCCIONES DE SALIDA:
Para cada título genera:
- "title": El título viral (máx 60 caracteres, con mayúsculas selectivas).
- "technique": El nombre de la técnica principal aplicada (ej: "Ángulo Opuesto", "Exclusividad Singular", "Autoridad + Opuesto", "Combinar Opuestos", "Cambio de Orden", "Remix de Competencia", "Sinónimos").
- "explanation": Una explicación concisa de por qué este ángulo conecta emocionalmente con un humano (no con un algoritmo) y por qué es diferente a lo que ya existe.

Genera 5 títulos, cada uno usando una técnica DIFERENTE. Que ninguno se parezca entre sí.
CRÍTICO: Devuelve tu respuesta ÚNICAMENTE como un array de objetos JSON puro. SIN formato markdown (\`\`\`json), SIN texto extra inicial o final, solo el JSON array [{},{},{}].`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: `Tema del vídeo: ${topic}` }] }],
        tools: channelUrl ? [{ googleSearch: {} }] : undefined
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Error de Gemini (${response.status}): ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No se generaron títulos: Respuesta vacía de la API");

    // Extract JSON array even if the model added surrounding text
    text = text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No se encontró JSON válido en la respuesta de la API");
    text = jsonMatch[0];

    return { titles: JSON.parse(text) };
  } catch (error: any) {
    console.error("Error generating titles:", error);
    throw error;
  }
}

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function translateContent(text: string): Promise<Record<string, string>> {
  if (!text) return { ru: '', en: '', by: '', jp: '', de: '', fr: '', zh: '' };

  const prompt = `Translate the following text into the specified languages. Maintain the original formatting (like HTML tags if present).
  
Text to translate:
${text}

Return a JSON object where keys are language codes ('ru', 'en', 'by', 'jp', 'de', 'fr', 'zh') and values are the translated text.
For 'by', use Belarusian.
For 'zh', use Simplified Chinese.
If the original text is already in one of these languages, just copy it to the corresponding key.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ru: { type: Type.STRING },
            en: { type: Type.STRING },
            by: { type: Type.STRING },
            jp: { type: Type.STRING },
            de: { type: Type.STRING },
            fr: { type: Type.STRING },
            zh: { type: Type.STRING },
          },
          required: ["ru", "en", "by", "jp", "de", "fr", "zh"],
        },
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate content");
  }
}

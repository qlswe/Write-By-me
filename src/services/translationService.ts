import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function translateContent(
  text: string,
  targetLanguages: string[] = ['ru', 'by', 'jp', 'de', 'fr', 'zh']
): Promise<Record<string, string>> {
  if (!text || text.trim() === '') {
    const result: Record<string, string> = {};
    for (const lang of targetLanguages) {
      result[lang] = '';
    }
    return result;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text into the following languages: ${targetLanguages.join(', ')}. 
Keep HTML tags intact if there are any.
Text to translate:
${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: targetLanguages.reduce((acc, lang) => {
            acc[lang] = { type: Type.STRING };
            return acc;
          }, {} as Record<string, any>),
          required: targetLanguages,
        },
      },
    });

    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

export async function translatePostFields(
  title: string,
  summary: string,
  content: string,
  targetLanguages: string[] = ['ru', 'by', 'jp', 'de', 'fr', 'zh']
): Promise<{ title: Record<string, string>, summary: Record<string, string>, content: Record<string, string> }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following title, summary, and content into these languages: ${targetLanguages.join(', ')}.
Keep HTML tags intact in the content. If a field is empty, return empty strings for it.

Title: ${title || ' '}
Summary: ${summary || ' '}
Content: ${content || ' '}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.OBJECT,
              properties: targetLanguages.reduce((acc, lang) => {
                acc[lang] = { type: Type.STRING };
                return acc;
              }, {} as Record<string, any>),
              required: targetLanguages,
            },
            summary: {
              type: Type.OBJECT,
              properties: targetLanguages.reduce((acc, lang) => {
                acc[lang] = { type: Type.STRING };
                return acc;
              }, {} as Record<string, any>),
              required: targetLanguages,
            },
            content: {
              type: Type.OBJECT,
              properties: targetLanguages.reduce((acc, lang) => {
                acc[lang] = { type: Type.STRING };
                return acc;
              }, {} as Record<string, any>),
              required: targetLanguages,
            }
          },
          required: ['title', 'summary', 'content'],
        },
      },
    });

    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

export async function translateContent(text: string): Promise<Record<string, string>> {
  if (!text) return { ru: '', en: '', by: '', de: '', fr: '', zh: '' };

  const prompt = `Translate the following text into the specified languages. Maintain the original formatting (like HTML tags if present).
  
Text to translate:
${text}

Return a JSON object where keys are language codes ('ru', 'en', 'by', 'de', 'fr', 'zh') and values are the translated text.
For 'by', use Belarusian.
For 'zh', use Simplified Chinese.
If the original text is already in one of these languages, just copy it to the corresponding key.
IMPORTANT: Return ONLY valid JSON. No markdown formatting, no backticks, no explanations. Just the JSON object.`;

  try {
    const systemContent = "You are a precise translation AI. You output only valid JSON without any markdown formatting.";
    const seed = Math.floor(Math.random() * 1000000);

    const url = new URL(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
    url.searchParams.append('system', systemContent);
    url.searchParams.append('model', 'openai');
    url.searchParams.append('jsonMode', 'true');
    url.searchParams.append('seed', seed.toString());
    
    const response = await fetch(url.toString(), { credentials: "omit" });

    if (!response.ok) {
      throw new Error(`Custom Neural Engine API error: ${response.statusText}`);
    }

    const textResponse = await response.text();
    // Try to parse the response, handling potential markdown formatting if the model ignored instructions
    const jsonStr = textResponse.replace(/^```json\n/, '').replace(/\n```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate content");
  }
}

export async function translateContent(text: string): Promise<Record<string, string>> {
  if (!text) return { ru: '', en: '', by: '', jp: '', de: '', fr: '', zh: '' };

  const prompt = `Translate the following text into the specified languages. Maintain the original formatting (like HTML tags if present).
  
Text to translate:
${text}

Return a JSON object where keys are language codes ('ru', 'en', 'by', 'jp', 'de', 'fr', 'zh') and values are the translated text.
For 'by', use Belarusian.
For 'zh', use Simplified Chinese.
If the original text is already in one of these languages, just copy it to the corresponding key.
IMPORTANT: Return ONLY valid JSON. No markdown formatting, no backticks, no explanations. Just the JSON object.`;

  try {
    const systemContent = "You are a precise translation AI. You output only valid JSON without any markdown formatting.";
    const seed = Math.floor(Math.random() * 1000000);

    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: prompt }
        ],
        model: "openai",
        jsonMode: true,
        seed
      })
    });

    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.statusText}`);
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

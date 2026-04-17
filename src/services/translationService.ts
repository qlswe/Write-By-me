export async function translateContent(
  text: string,
  targetLanguages: string[] = ['ru', 'by', 'de', 'fr', 'zh']
): Promise<Record<string, string>> {
  if (!text || text.trim() === '') {
    const result: Record<string, string> = {};
    for (const lang of targetLanguages) {
      result[lang] = '';
    }
    return result;
  }

  try {
    const prompt = `Translate the following text into the following languages: ${targetLanguages.join(', ')}. 
Keep HTML tags intact if there are any.
Text to translate:
${text}

IMPORTANT: Return ONLY valid JSON. No markdown formatting, no backticks, no explanations. Just the JSON object where keys are language codes and values are the translated text.`;

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
    const jsonStr = textResponse.replace(/^```json\n/, '').replace(/\n```$/, '').trim();
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
  targetLanguages: string[] = ['ru', 'by', 'de', 'fr', 'zh']
): Promise<{ title: Record<string, string>, summary: Record<string, string>, content: Record<string, string> }> {
  try {
    const prompt = `Translate the following title, summary, and content into these languages: ${targetLanguages.join(', ')}.
Keep HTML tags intact in the content. If a field is empty, return empty strings for it.

Title: ${title || ' '}
Summary: ${summary || ' '}
Content: ${content || ' '}

IMPORTANT: Return ONLY valid JSON. No markdown formatting, no backticks, no explanations. 
The JSON object must have three top-level keys: "title", "summary", and "content".
Each of these keys must contain an object where keys are language codes and values are the translated text.`;

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
    const jsonStr = textResponse.replace(/^```json\n/, '').replace(/\n```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

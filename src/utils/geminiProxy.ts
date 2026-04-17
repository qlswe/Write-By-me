export const moderateContentWithProxy = async (prompt: string, apiKey: string): Promise<boolean> => {
  const moderationPrompt = `You are a content moderator for a forum. Analyze the following text and determine if it is appropriate.
  Text to moderate:
  ${prompt}

  Approve the text if it is generally acceptable. Reject it ONLY if it contains severe hate speech, illegal content, or extreme gore.
  Return a JSON object with a single boolean field 'isApproved'.
  IMPORTANT: Return ONLY valid JSON. No markdown formatting, no backticks, no explanations. Just the JSON object.`;

  try {
    const systemContent = "You are a precise moderation AI. You output only valid JSON without any markdown formatting.";
    const seed = Math.floor(Math.random() * 1000000);

    const url = new URL(`https://text.pollinations.ai/${encodeURIComponent(moderationPrompt)}`);
    url.searchParams.append('system', systemContent);
    url.searchParams.append('model', 'openai');
    url.searchParams.append('jsonMode', 'true');
    url.searchParams.append('seed', seed.toString());
    
    console.log('[Aha Stealth Protocol] Initiating moderation sequence via Custom Neural Engine...');
    const response = await fetch(url.toString(), { credentials: "omit" });

    if (!response.ok) {
      console.warn(`[Aha Stealth Protocol] Moderation API error: ${response.statusText}`);
      return true; // Fail open
    }

    const textResponse = await response.text();
    const jsonStr = textResponse.replace(/^```json\n/, '').replace(/\n```$/, '').trim();
    const parsed = JSON.parse(jsonStr);
    
    return parsed?.isApproved ?? true;
  } catch (error) {
    console.warn(`[Aha Stealth Protocol] Moderation connection failed. Rerouting to Fail-Open safety protocol.`, error);
    return true; // Fail open
  }
};


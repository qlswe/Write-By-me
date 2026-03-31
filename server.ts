interface AIResponse {
  text: string;
  provider: 'pollinations_standalone' | 'error';
}

interface PollinationsPayload {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model: string;
  seed: number;
}

/**
 * Ministry AI: Автономный модуль генерации контента.
 * Не требует Google API и локального сервера.
 */
export const askMinistryAI = async (
  userPrompt: string, 
  lang: string = "ru"
): Promise<AIResponse> => {
  
  const hsrContext: string = `
    KNOWLEDGE_BASE: Honkai: Star Rail (HSR).
    - Aeons: Beings of immense power (Nanook, Lan, IX, etc.).
    - Paths: Concepts followed by Aeons and mortals.
    - Astral Express: Led by Himeko.
    - Characters: Trailblazer, March 7th, Dan Heng, Welt, Kafka, Acheron, Firefly.
  `;

  const personality: string = `
    PERSONALITY:
    - Tone: Mix of formal Ministry official and witty AI.
    - Style: Technical terms + dry humor.
    - Role: You are the "Ministry AI".
    - Interaction: Be helpful but occasionally sarcastic about Aeons.
  `;

  const systemInstruction: string = `You are Ministry AI. Lang: ${lang}. ${personality} ${hsrContext}`;

  try {
    const payload: PollinationsPayload = {
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ],
      model: 'openai',
      seed: Math.floor(Math.random() * 888)
    };

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const text: string = await response.text();
    
    return { 
      text: text || "Система пуста. Эоны поглотили ответ.", 
      provider: 'pollinations_standalone' 
    };

  } catch (error) {
    console.error("[MINISTRY_ERROR]:", error);
    return { 
      text: "Критическая ошибка систем связи. Вероятно, вмешательство Стелларона.", 
      provider: 'error' 
    };
  }
};
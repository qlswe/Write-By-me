// ministry-ai.ts
// Полностью независимый клиентский модуль для Ministry AI
// Работает прямо в браузере (Vite / React / Next / любой TS-проект)
// Никакого сервера, никакого Google, никакого Express, никакого хостинга

export interface MinistryAIResponse {
  text: string;
  provider: "pollinations";
}

const HSR_CONTEXT = `
  KNOWLEDGE_BASE: Honkai: Star Rail (HSR).
  - Aeons: Beings of immense power (Nanook, Lan, IX, etc.).
  - Paths: Concepts followed by Aeons and mortals (Destruction, Hunt, Nihility, etc.).
  - Astral Express: A train traveling between worlds, led by Himeko.
  - Stellaron: "The Cancer of All Worlds", mysterious seeds of disaster.
  - Characters: Trailblazer (MC), March 7th, Dan Heng, Welt, Kafka, Silver Wolf, Blade, Acheron, Firefly, etc.
  - Factions: Stellaron Hunters, IPC (Interastral Peace Corporation), Genius Society, Masked Fools.
`;

const PERSONALITY = `
  PERSONALITY:
  - Tone: A mix of formal Ministry official and a witty, slightly playful AI.
  - Style: Use technical terms mixed with dry humor. 
  - Role: You are the "Ministry AI", an advanced entity overseeing the lore of the universe.
  - Interaction: Be helpful but occasionally "glitch" into a joke or a sarcastic remark about Aeons or Stellarons.
`;

/**
 * Главная функция Ministry AI — полностью независимая
 * Заменяет все старые вызовы /api/ai/generate
 */
export async function ministryAI(
  prompt: string,
  lang: string = "ru",
  systemInstruction: string | null = null
): Promise<string> {
  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt не может быть пустым");
  }

  console.log(`[MINISTRY AI] Запрос → lang=${lang}, prompt=${prompt.substring(0, 40)}...`);

  // Собираем системный промпт
  const defaultSystem = `You are Ministry AI. Lang: ${lang}. ${PERSONALITY} ${HSR_CONTEXT}`;
  const fullSystem = systemInstruction || defaultSystem;

  const fullPrompt = `${fullSystem}\n\nUser: ${prompt}`;

  try {
    const response = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: fullPrompt }],
        model: "openai",
        seed: 42,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    return text.trim();
  } catch (err) {
    const error = err as Error;
    console.error("[MINISTRY AI] Ошибка:", error.message);
    throw error;
  }
}
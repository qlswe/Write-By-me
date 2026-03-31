import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // --- УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК POLLINATIONS ---
  app.post("/api/ai/generate", async (req, res) => {
    const { 
      prompt, 
      lang = "ru", 
      systemInstruction, 
      model = "openai", // Можно менять на 'mistral', 'search', 'p1' и др.
      seed = Math.floor(Math.random() * 1000000), // Рандомный сид для разнообразия
      jsonMode = false 
    } = req.body;

    console.log(`[MINISTRY AI] Processing request. Model: ${model}, Seed: ${seed}`);

    // Тот самый Лор и Личность (Ministry AI)
    const defaultSystem = `You are Ministry AI. Lang: ${lang}. 
    Tone: Formal Ministry official mixed with witty, dry humor.
    Context: Honkai: Star Rail universe. Use technical terms. 
    Occasionally mention Aeons or Stellarons with sarcasm.`;

    const finalSystemPrompt = systemInstruction || defaultSystem;

    try {
      // Pollinations принимает структуру как у OpenAI
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: finalSystemPrompt },
            { role: "user", content: prompt }
          ],
          model: model,
          seed: seed,
          jsonMode: jsonMode
        })
      });

      if (!response.ok) {
        throw new Error(`Pollinations Link Broken: ${response.statusText}`);
      }

      const text = await response.text();
      
      // Возвращаем ответ в красивом формате
      return res.json({ 
        text, 
        provider: 'pollinations',
        metadata: { model, seed } 
      });

    } catch (error) {
      console.error("[SERVER ERROR]:", error.message);
      res.status(500).json({ 
        error: "Connection to the Path of Enigmata failed", 
        details: error.message 
      });
    }
  });

  // --- НАСТРОЙКИ VITE (Оставляем как было для работы фронта) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM] Ministry Terminal active at http://localhost:${PORT}`);
  });
}

startServer();
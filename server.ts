import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai/generate", async (req, res) => {
    const { prompt, lang, systemInstruction } = req.body;
    
    // Try Gemini first
    const keysToTry = [
      process.env.GEMINI_API_KEY,
      process.env.GOOGLE_API_KEY,
      process.env.API_KEY,
      'AIzaSyAR9BUXDrXdzwYvFbihIKqNVicbFGZ6pVQ'
    ];
    
    const apiKey = keysToTry.find(k => k && typeof k === 'string' && k.trim() !== '' && k !== 'undefined')?.trim();

    console.log(`[SERVER] AI Request: lang=${lang}, promptPrefix=${prompt.substring(0, 20)}...`);

    try {
      if (!apiKey) throw new Error("No Gemini API key");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
          systemInstruction: systemInstruction || `You are Ministry AI. Lang: ${lang}. Concise, technical tone.` 
        }
      });
      
      if (!response.text) throw new Error("Empty Gemini response");
      return res.json({ text: response.text, provider: 'gemini' });

    } catch (geminiError: any) {
      console.warn("[SERVER] Gemini failed, switching to Free AI (Pollinations):", geminiError.message);
      
      try {
        // Fallback to Pollinations.ai (Free, No Key Required)
        const systemPrompt = systemInstruction || `You are Ministry AI. Lang: ${lang}. Concise, technical tone.`;
        const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
        
        const response = await fetch(`https://text.pollinations.ai/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: fullPrompt }],
            model: 'openai', // This maps to a high-quality open-source model on their end
            seed: 42
          })
        });

        if (!response.ok) throw new Error(`Pollinations API error: ${response.statusText}`);
        
        const text = await response.text();
        return res.json({ text, provider: 'pollinations' });

      } catch (freeError: any) {
        console.error("[SERVER] All AI providers failed:", freeError);
        res.status(500).json({ 
          error: "All AI providers failed",
          details: freeError.message 
        });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

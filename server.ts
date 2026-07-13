import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoints for container and deployment validation
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  // API Route for proxying AI requests
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, lang = 'ru', systemInstruction, history = [] } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Lazy-initialization inside handler
      const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyAR9BUXDrXdzwYvFbihIKqNVicbFGZ6pVQ';
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const formattedHistory = history.map((h: { role: string; content: string }) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));

      // Try multiple models in sequence to avoid 503/UNAVAILABLE errors
      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
      let responseText = "";
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting generation with model: ${modelName}`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              ...formattedHistory,
              { role: 'user', parts: [{ text: prompt }] }
            ],
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          });

          if (response && response.text) {
            responseText = response.text;
            console.log(`Successfully generated content using model: ${modelName}`);
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} failed or was unavailable:`, err.message || err);
          lastError = err;
        }
      }

      if (!responseText && lastError) {
        throw lastError;
      }

      res.json({ text: responseText.trim() });
    } catch (error: any) {
      console.error("Server AI Generation Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

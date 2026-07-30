import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static uploads for videos and media files
  app.use('/uploads', express.static(uploadsDir));

  // Health check endpoints for container and deployment validation
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  // Upload endpoint for videos and images to keep Firestore documents lightweight (<1MB)
  app.post("/api/upload", async (req, res) => {
    try {
      const { fileData, fileName } = req.body;
      if (!fileData) {
        return res.status(400).json({ error: "fileData is required" });
      }

      const matches = fileData.match(/^data:(.+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = "bin";

      if (matches && matches.length === 3) {
        const mime = matches[1];
        buffer = Buffer.from(matches[2], "base64");
        if (mime.includes("video/mp4")) ext = "mp4";
        else if (mime.includes("video/webm")) ext = "webm";
        else if (mime.includes("video/ogg")) ext = "ogg";
        else if (mime.includes("video/quicktime") || mime.includes("video/mov")) ext = "mov";
        else if (mime.includes("image/png")) ext = "png";
        else if (mime.includes("image/jpeg")) ext = "jpg";
        else if (mime.includes("image/webp")) ext = "webp";
        else if (mime.includes("image/gif")) ext = "gif";
      } else {
        buffer = Buffer.from(fileData, "base64");
      }

      if (fileName && fileName.includes(".")) {
        const parts = fileName.split(".");
        ext = parts[parts.length - 1].toLowerCase();
      }

      const safeName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(uploadsDir, safeName);

      // Save local file copy
      await fs.promises.writeFile(filePath, buffer);

      // Upload to Litterbox CDN for persistent multi-device access across serverless instances
      let cdnUrl = "";
      try {
        const mimeType = ext === 'mp4' ? 'video/mp4' : (ext === 'webm' ? 'video/webm' : 'application/octet-stream');
        const blob = new Blob([buffer], { type: mimeType });
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("time", "72h");
        form.append("fileToUpload", blob, safeName);

        const uploadRes = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
          method: "POST",
          body: form
        });

        if (uploadRes.ok) {
          const resText = await uploadRes.text();
          if (resText && resText.startsWith("http")) {
            cdnUrl = resText.trim();
          }
        }
      } catch (cloudErr) {
        console.warn("Litterbox upload error:", cloudErr);
      }

      if (!cdnUrl) {
        try {
          const blob = new Blob([buffer]);
          const form = new FormData();
          form.append("file", blob, safeName);
          const tmpRes = await fetch("https://tmpfiles.org/api/v1/upload", {
            method: "POST",
            body: form
          });
          if (tmpRes.ok) {
            const tmpJson: any = await tmpRes.json();
            if (tmpJson?.data?.url) {
              cdnUrl = tmpJson.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
            }
          }
        } catch (tmpErr) {
          console.warn("Tmpfiles upload error:", tmpErr);
        }
      }

      const mediaUrl = cdnUrl || `/uploads/${safeName}`;
      res.json({ success: true, url: mediaUrl });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
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
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];
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

      if (!responseText) {
        // Fallback to Pollinations AI text endpoint if Gemini models are experiencing high demand (503)
        try {
          console.log("Gemini models unavailable, attempting Pollinations AI fallback...");
          const pollinationsPrompt = encodeURIComponent(`${systemInstruction ? systemInstruction + '\n' : ''}${prompt}`);
          const pollRes = await fetch(`https://text.pollinations.ai/${pollinationsPrompt}`);
          if (pollRes.ok) {
            responseText = await pollRes.text();
          }
        } catch (pollErr) {
          console.warn("Pollinations fallback failed:", pollErr);
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

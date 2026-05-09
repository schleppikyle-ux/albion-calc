import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing
  app.use(express.json());

  // Albion API Proxy
  app.get("/api/kills", async (req, res) => {
    const { server, limit, offset } = req.query;
    
    const GAMEINFO_BASE_URLS = {
      West: 'https://gameinfo.albiononline.com/api/gameinfo',
      East: 'https://gameinfo-sgp.albiononline.com/api/gameinfo',
      Europe: 'https://gameinfo-ams.albiononline.com/api/gameinfo',
    };

    const targetServer = (server as string) || 'West';
    const baseUrl = GAMEINFO_BASE_URLS[targetServer as keyof typeof GAMEINFO_BASE_URLS] || GAMEINFO_BASE_URLS.West;
    const url = `${baseUrl}/events?limit=${limit || 50}&offset=${offset || 0}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: `Albion API returned ${response.status}` });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Proxy Error:', error);
      res.status(500).json({ error: "Failed to reach Albion API" });
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

import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, 'dist');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8080;

// Serve static files from the Vite build output
app.use(express.static(distPath, { maxAge: '1y' }));

// SPA fallback — all routes serve index.html
app.get('/{*path}', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Last-Minute Life Saver running on port ${PORT}`);
});

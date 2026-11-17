import express from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3000;
const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');

app.disable('x-powered-by');

app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok', service: 'blocksmith-web' });
});

// The desktop application is distributed separately from the Railway web app.
// Serve the release metadata only; never execute Electron or expose local MCP.
app.get('/api/desktop/release', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const manifest = await readFile(join(dist, 'blocksmith-desktop-release.json'), 'utf8');
    res.type('application/json').send(manifest);
  } catch (error) {
    console.error('Desktop release manifest unavailable:', error?.message ?? error);
    res.status(503).json({ error: 'Desktop release metadata unavailable' });
  }
});

app.use(express.static(dist));
app.listen(port, '0.0.0.0', () => {
  console.log(`Blocksmith listening on port ${port}`);
});

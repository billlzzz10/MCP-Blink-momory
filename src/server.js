import express from 'express';
import { config } from './config.js';

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT ? Number(process.env.PORT) : (config.server?.port || 7070);
app.listen(port, () => {
  console.log(`[mcp-memory] server listening on http://localhost:${port}`);
});

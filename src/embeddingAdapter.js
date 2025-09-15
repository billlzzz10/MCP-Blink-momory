import { config } from './config.js';
import { L2 } from './utils.js';

export async function warmup(model) {
  if (config.embedding.provider === 'mistral') {
    const key = process.env.MISTRAL_API_KEY || config.mistral?.apiKey;
    const body = { inputs: ['warmup'], model: config.embedding.model || model };
    const res = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Mistral error: ${res.status} ${await res.text()}`);
    const json = await res.json();
    const vecs = json.data.map(d => d.embedding);
    return vecs.map(v => (config.embedding.normalize ? L2(v) : v));
  } else if (config.embedding.provider === 'mock') {
    return [L2([1, 0, 0])];
  } else {
    throw new Error(`Unknown embedding provider: ${config.embedding.provider}`);
  }
}

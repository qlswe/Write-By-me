import { createClient } from '@vercel/kv';

let kvClient: ReturnType<typeof createClient> | null = null;

try {
  const kvUrl = import.meta.env.VITE_KV_REST_API_URL || import.meta.env.WBM_STATIC_KV_REST_API_URL;
  const kvToken = import.meta.env.VITE_KV_REST_API_TOKEN || import.meta.env.WBM_STATIC_KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    kvClient = createClient({
      url: kvUrl,
      token: kvToken,
    });
  }
} catch (e) {
  console.error("Failed to initialize Vercel KV fallback", e);
}

export const vercelFallback = {
  isAvailable: () => !!kvClient && !!localStorage.getItem('aha_quota_fallback'),
  isConfigured: () => !!kvClient,
  
  async get(key: string) {
    if (!kvClient) return null;
    return await kvClient.get(key);
  },
  
  async set(key: string, value: any) {
    if (!kvClient) return;
    return await kvClient.set(key, value);
  },

  async lpush(key: string, value: any) {
    if (!kvClient) return;
    return await kvClient.lpush(key, value);
  },

  async lrange(key: string, start: number, stop: number) {
    if (!kvClient) return [];
    return await kvClient.lrange(key, start, stop);
  }
};

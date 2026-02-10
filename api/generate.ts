import type { VercelRequest, VercelResponse } from '@vercel/node';

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const DEFAULT_MODEL = 'moonshot-v1-8k';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.KIMI_API_KEY;

  if (!apiKey) {
    console.error('[API] KIMI_API_KEY not configured');
    return res.status(500).json({ 
      error: 'API not configured',
      message: 'KIMI_API_KEY environment variable is missing'
    });
  }

  try {
    const { messages, temperature = 0.7, max_tokens = 1024 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages array required' });
    }

    console.log('[API] Proxying request to Kimi API...');

    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.KIMI_MODEL || DEFAULT_MODEL,
        messages,
        temperature,
        max_tokens,
      }),
    });

    // Handle rate limiting
    if (response.status === 429) {
      console.log('[API] Rate limited by Kimi API');
      return res.status(429).json({
        error: 'Rate limited',
        message: 'Too many requests. Please wait a moment and try again.',
        retryAfter: 3,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Kimi API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Kimi API error',
        message: `API returned ${response.status}: ${errorText}`,
      });
    }

    const data = await response.json();
    
    // Extract the response content
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('[API] Successfully received response from Kimi');
    
    return res.status(200).json({
      response: content,
      usage: data.usage,
    });

  } catch (error) {
    console.error('[API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

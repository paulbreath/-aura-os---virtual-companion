import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://aurabot.zeabur.app',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '1mb' }));

// Allowed image domains for SSRF protection
const ALLOWED_IMAGE_DOMAINS = new Set([
  'api.x.ai',
  'queue.fal.run',
  'image.pollinations.ai',
  'v3b.fal.media',
]);

const isAllowedUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return ALLOWED_IMAGE_DOMAINS.has(urlObj.hostname);
  } catch {
    return false;
  }
};

const fetchImageAsBase64 = async (url) => {
  if (!isAllowedUrl(url)) {
    throw new Error(`Domain not allowed: ${new URL(url).hostname}`);
  }
  const response = await fetch(url, { timeout: 30000 });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.buffer();
  return buffer.toString('base64');
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Valid prompt is required' });
  }

  if (prompt.length > 1000) {
    return res.status(400).json({ error: 'Prompt too long (max 1000 characters)' });
  }

  const xaiKey = process.env.XAI_API_KEY;
  const falKey = process.env.FAL_API_KEY;

  console.log(`[${new Date().toISOString()}] Generating image, prompt length: ${prompt.length}`);
  console.log(`X.AI key available: ${!!xaiKey}`);
  console.log(`FAL.AI key available: ${!!falKey}`);

  try {
    // Try X.AI Grok Imagine first
    if (xaiKey) {
      console.log('Attempting X.AI Grok Imagine...');
      try {
        const xaiRes = await fetch('https://api.x.ai/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${xaiKey}`,
          },
          body: JSON.stringify({
            model: 'grok-2-image',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            response_format: 'url',
          }),
        });

        console.log('X.AI response status:', xaiRes.status);

        if (xaiRes.ok) {
          const data = await xaiRes.json();
          console.log('X.AI response data:', JSON.stringify(data).substring(0, 200));
          if (data.data && data.data[0]?.url && isAllowedUrl(data.data[0].url)) {
            const base64 = await fetchImageAsBase64(data.data[0].url);
            return res.json({ image: `data:image/png;base64,${base64}` });
          } else {
            console.log('X.AI response missing data or url:', data);
          }
        } else {
          const errorText = await xaiRes.text();
          console.log('X.AI error:', errorText);
        }
      } catch (e) {
        console.log('X.AI request failed:', e.message);
      }
    }

    // Try FAL.AI Flux
    if (falKey) {
      console.log('Attempting FAL.AI Flux...');
      try {
        const falRes = await fetch('https://queue.fal.run/fal-ai/flux-dev', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${falKey}`,
          },
          body: JSON.stringify({
            prompt: prompt,
            image_size: 'square_hd',
            num_images: 1,
          }),
        });

        console.log('FAL response status:', falRes.status);

        if (falRes.ok) {
          const data = await falRes.json();
          console.log('FAL response:', JSON.stringify(data).substring(0, 200));
          
          if (data.images?.[0]?.url) {
            const base64 = await fetchImageAsBase64(data.images[0].url);
            return res.json({ image: `data:image/png;base64,${base64}` });
          }
          
          if (data.request_id) {
            const startTime = Date.now();
            const timeout = 60000;
            while (Date.now() - startTime < timeout) {
              await new Promise(r => setTimeout(r, 2000));
              const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux-dev/requests/${data.request_id}/status`, {
                headers: { 'Authorization': `Bearer ${falKey}` },
              });
              const statusData = await statusRes.json();
              console.log('FAL status:', statusData.status);
              
              if (statusData.status === 'COMPLETED') {
                if (statusData.images?.[0]?.url) {
                  const base64 = await fetchImageAsBase64(statusData.images[0].url);
                  return res.json({ image: `data:image/png;base64,${base64}` });
                }
                break;
              } else if (statusData.status === 'FAILED') {
                console.error('FAL.AI generation failed');
                break;
              }
            }
          }
        } else {
          const errorText = await falRes.text();
          console.log('FAL error:', errorText);
        }
      } catch (e) {
        console.log('FAL request failed:', e.message);
      }
    }

    res.status(503).json({ 
      error: 'Image generation unavailable. Please try again later.' 
    });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Explicit route for test page
  app.get('/test-xai.html', (req, res) => {
    res.sendFile(path.join(distPath, 'test-xai.html'));
  });
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('dist directory not found, skipping static file serving');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`X.AI API: ${xaiKey ? 'Configured' : 'Not configured'}`);
  console.log(`FAL.AI API: ${falKey ? 'Configured' : 'Not configured'}`);
});

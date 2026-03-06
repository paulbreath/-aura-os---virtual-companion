import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const fetchImageAsBase64 = async (url) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
};

app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;
  const xaiKey = process.env.VITE_XAI_API_KEY;
  const falKey = process.env.VITE_FAL_API_KEY;

  try {
    // Try X.AI Grok Imagine first
    if (xaiKey) {
      const xaiRes = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-imagine-image',
          prompt: prompt,
        }),
      });

      if (xaiRes.ok) {
        const data = await xaiRes.json();
        if (data.data && data.data[0]?.url) {
          const base64 = await fetchImageAsBase64(data.data[0].url);
          return res.json({ image: `data:image/png;base64,${base64}` });
        }
      }
    }

    // Try FAL.AI Flux
    if (falKey) {
      const falRes = await fetch('https://queue.fal.run/fal-ai/flux-dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${falKey}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          image_size: 'square_hd',
        }),
      });

      if (falRes.ok) {
        const data = await falRes.json();
        if (data.images?.[0]?.url) {
          const base64 = await fetchImageAsBase64(data.images[0].url);
          return res.json({ image: `data:image/png;base64,${base64}` });
        }
        if (data.request_id) {
          // Poll for result
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux-dev/requests/${data.request_id}/status`, {
              headers: { 'Authorization': `Key ${falKey}` },
            });
            const statusData = await statusRes.json();
            if (statusData.status === 'COMPLETED' && statusData.images?.[0]?.url) {
              const base64 = await fetchImageAsBase64(statusData.images[0].url);
              return res.json({ image: `data:image/png;base64,${base64}` });
            }
          }
        }
      }
    }

    // Try Pollinations.ai as fallback
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
    const base64 = await fetchImageAsBase64(pollinationsUrl);
    return res.json({ image: `data:image/png;base64,${base64}` });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

app.use(express.static(path.join(process.cwd(), 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

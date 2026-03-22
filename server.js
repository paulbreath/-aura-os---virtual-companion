import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

dotenv.config();
dotenv.config({ path: '.env.local', override: true }); // 读取 .env.local 并覆盖

const app = express();
const PORT = process.env.PORT || 5174;

// Rate limiting
const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'https://aurabot.zeabur.app'],
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

// ModelsLab API代理 - 解决CORS问题
app.post('/api/modelslab', async (req, res) => {
  const { model_id, prompt, negative_prompt, width, height, ...otherParams } = req.body;
  const apiKey = process.env.MODELSLAB_API_KEY || process.env.VITE_MODELSLAB_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ status: 'error', message: 'ModelsLab API key not configured' });
  }
  
  if (!prompt || !model_id) {
    return res.status(400).json({ status: 'error', message: 'model_id and prompt are required' });
  }
  
  console.log(`[${new Date().toISOString()}] ModelsLab request: model=${model_id}, prompt length=${prompt.length}`);
  
  try {
    const response = await fetch('https://modelslab.com/api/v6/images/text2img', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: apiKey,
        model_id,
        prompt,
        negative_prompt: negative_prompt || 'child, underage, ugly, deformed, blurry, low quality',
        width: width || 512,
        height: height || 768,
        safety_checker: 'no',
        samples: 1,
        num_inference_steps: 30,
        safety_checker_type: 'blacklist',
        enhance_prompt: 'yes',
        guidance_scale: 7,
        base64: 'no',
        ...otherParams,
      }),
    });
    
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] ModelsLab response: status=${data.status}`);
    
    // 如果是异步处理，需要轮询
    if (data.status === 'processing' && data.fetch_result) {
      console.log(`[${new Date().toISOString()}] ModelsLab async processing, polling...`);
      
      const maxAttempts = 20;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
        
        const pollRes = await fetch(data.fetch_result, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: apiKey }),
        });
        
        const pollData = await pollRes.json();
        console.log(`[${new Date().toISOString()}] ModelsLab poll ${i + 1}/${maxAttempts}: status=${pollData.status}`);
        
        if (pollData.status === 'success') {
          return res.json(pollData);
        } else if (pollData.status === 'failed') {
          return res.status(500).json({ status: 'error', message: 'Image generation failed' });
        }
      }
      
      return res.status(504).json({ status: 'error', message: 'Image generation timeout' });
    }
    
    // 直接返回结果
    res.json(data);
    
  } catch (error) {
    console.error('ModelsLab proxy error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ModelsLab 轮询端点
app.post('/api/modelslab/poll', async (req, res) => {
  const { fetch_url } = req.body;
  const apiKey = process.env.MODELSLAB_API_KEY || process.env.VITE_MODELSLAB_API_KEY;
  
  if (!apiKey || !fetch_url) {
    return res.status(400).json({ status: 'error', message: 'Missing required parameters' });
  }
  
  try {
    const pollRes = await fetch(fetch_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: apiKey }),
    });
    
    const data = await pollRes.json();
    res.json(data);
  } catch (error) {
    console.error('ModelsLab poll error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ModelsLab Video API代理 - 用于视频生成
app.post('/api/modelslab/video', async (req, res) => {
  const { model_id, prompt, negative_prompt, init_image, width, height, num_frames, fps, ...otherParams } = req.body;
  const apiKey = process.env.MODELSLAB_API_KEY || process.env.VITE_MODELSLAB_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ status: 'error', message: 'ModelsLab API key not configured' });
  }
  
  if (!prompt || !model_id) {
    return res.status(400).json({ status: 'error', message: 'model_id and prompt are required' });
  }
  
  const isImg2Video = !!init_image;
  const endpoint = isImg2Video 
    ? 'https://modelslab.com/api/v6/video/img2video'
    : 'https://modelslab.com/api/v6/video/text2video';
  
  console.log(`[${new Date().toISOString()}] ModelsLab Video request: model=${model_id}, type=${isImg2Video ? 'img2video' : 'text2video'}, prompt length=${prompt.length}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: apiKey,
        model_id,
        prompt,
        negative_prompt: negative_prompt || 'low quality, distorted, ugly, deformed, static, frozen',
        width: width || 480,
        height: height || 480,
        num_frames: num_frames || 81,
        fps: fps || 16,
        instant_response: true,
        ...(init_image && { init_image }),
        ...otherParams,
      }),
    });
    
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] ModelsLab Video response: status=${data.status}`);
    
    // 如果是异步处理，需要轮询
    if (data.status === 'processing' && data.fetch_result) {
      console.log(`[${new Date().toISOString()}] ModelsLab Video async processing, polling...`);
      
      const maxAttempts = 60;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
        
        const pollRes = await fetch(data.fetch_result, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: apiKey }),
        });
        
        const pollData = await pollRes.json();
        console.log(`[${new Date().toISOString()}] ModelsLab Video poll ${i + 1}/${maxAttempts}: status=${pollData.status}`);
        
        if (pollData.status === 'success') {
          return res.json(pollData);
        } else if (pollData.status === 'failed') {
          return res.status(500).json({ status: 'error', message: 'Video generation failed' });
        }
      }
      
      return res.status(504).json({ status: 'error', message: 'Video generation timeout' });
    }
    
    // 直接返回结果
    res.json(data);
    
  } catch (error) {
    console.error('ModelsLab Video proxy error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// X.AI Grok Imagine API代理
app.post('/api/xai/image', async (req, res) => {
  const { prompt, model = 'grok-imagine-image' } = req.body;  // 正确的模型名称
  const apiKey = process.env.XAI_API_KEY || process.env.VITE_XAI_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ status: 'error', message: 'X.AI API key not configured. Add XAI_API_KEY or VITE_XAI_API_KEY to .env file.' });
  }
  
  if (!prompt) {
    return res.status(400).json({ status: 'error', message: 'Prompt is required' });
  }
  
  console.log(`[${new Date().toISOString()}] X.AI Grok Imagine: model=${model}, prompt length=${prompt.length}`);
  
  try {
    const response = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        n: 1,
        response_format: 'url',
      }),
    });
    
    console.log(`[${new Date().toISOString()}] X.AI response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${new Date().toISOString()}] X.AI error: ${errorText}`);
      return res.status(response.status).json({ status: 'error', message: errorText });
    }
    
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] X.AI response:`, JSON.stringify(data).substring(0, 200));
    
    if (data.data && data.data[0]?.url) {
      res.json({ 
        status: 'success', 
        output: [data.data[0].url],
        model: model
      });
    } else {
      res.status(500).json({ status: 'error', message: 'No image URL returned from X.AI' });
    }
    
  } catch (error) {
    console.error('X.AI API error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Valid prompt is required' });
  }

  if (prompt.length > 1000) {
    return res.status(400).json({ error: 'Prompt too long (max 1000 characters)' });
  }

  const xaiKey = process.env.XAI_API_KEY || process.env.VITE_XAI_API_KEY;
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

const xaiKey = process.env.XAI_API_KEY || process.env.VITE_XAI_API_KEY;
const falKey = process.env.FAL_API_KEY;
const modelsLabKey = process.env.MODELSLAB_API_KEY || process.env.VITE_MODELSLAB_API_KEY;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`X.AI API: ${xaiKey ? 'Configured' : 'Not configured'}`);
  console.log(`FAL.AI API: ${falKey ? 'Configured' : 'Not configured'}`);
  console.log(`ModelsLab API: ${modelsLabKey ? 'Configured' : 'Not configured'}`);
});

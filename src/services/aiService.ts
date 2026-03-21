import { GoogleGenAI, Type } from "@google/genai";
import { spicyAPI } from "./spicyAPIService";

// 使用代理绕过 CORS 限制
const searchWeb = async (query: string, maxResults: number = 5): Promise<string> => {
  try {
    const encodedQuery = encodeURIComponent(query);
    
    // 使用 allorigins 代理
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://html.duckduckgo.com/html/?q=${encodedQuery}`)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const res = await fetch(proxyUrl, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.error('Proxy search failed:', res.status);
      // 回退到另一个代理
      return await searchWebFallback(query, maxResults);
    }
    
    const html = await res.text();
    return parseSearchResults(html, maxResults);
  } catch (error) {
    console.error('Search error, trying fallback:', error);
    return await searchWebFallback(query, maxResults);
  }
};

// 备用搜索方法 - 使用 Google 搜索
const searchWebFallback = async (query: string, maxResults: number = 5): Promise<string> => {
  try {
    const encodedQuery = encodeURIComponent(query + ' site:cn');
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.google.com/search?q=${encodedQuery}&hl=zh-CN&num=${maxResults}`)}`;
    
    const res = await fetch(proxyUrl);
    
    if (!res.ok) {
      console.error('Fallback search failed:', res.status);
      return '';
    }
    
    const html = await res.text();
    
    // 解析 Google 结果
    const results: string[] = [];
    
    // Google 结果格式
    const regex = /<h3[^>]*>([^<]+)<\/h3>/g;
    let match;
    while ((match = regex.exec(html)) !== null && results.length < maxResults) {
      const title = match[1].trim();
      if (title.length > 5) {
        results.push(`📌 ${title}`);
      }
    }
    
    // 尝试提取描述
    const descRegex = /<span[^>]*>([\s\S]{30,200}?)<\/span>/g;
    while ((match = descRegex.exec(html)) !== null && results.length < maxResults * 2) {
      const desc = match[1].replace(/<[^>]*>/g, '').trim();
      if (desc.length > 30 && !desc.includes('Google') && results.length > 0) {
        const lastIndex = results.length - 1;
        results[lastIndex] += `\n${desc}`;
      }
    }
    
    console.log('🔍 Google results:', results.length);
    return results.length > 0 ? results.slice(0, maxResults).join('\n\n') : '';
  } catch (error) {
    console.error('Fallback search error:', error);
    return '';
  }
};

// 解析搜索结果
const parseSearchResults = (html: string, maxResults: number): string => {
  const results: string[] = [];
  
  // DuckDuckGo HTML 格式: result__snippet" href="...">文本内容<
  const snippetRegex = /result__snippet"[^>]*>([^<]+)</g;
  let match;
  
  while ((match = snippetRegex.exec(html)) !== null && results.length < maxResults) {
    const text = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").trim();
    if (text.length > 20) {
      results.push(text);
    }
  }
  
  // 尝试提取标题
  const titleRegex = /class="result__a"[^>]*>([^<]+)<\/a>/g;
  const titles: string[] = [];
  while ((match = titleRegex.exec(html)) !== null && titles.length < maxResults) {
    const title = match[1].replace(/<[^>]*>/g, '').trim();
    if (title.length > 5) {
      titles.push(title);
    }
  }
  
  // 组合标题和摘要
  let combined: string[] = [];
  for (let i = 0; i < Math.min(results.length, titles.length); i++) {
    combined.push(`📌 ${titles[i]}\n${results[i]}`);
  }
  
  // 如果没有标题，只返回摘要
  if (combined.length === 0 && results.length > 0) {
    combined = results.map(r => `• ${r}`);
  }
  
  console.log('🔍 Parsed:', { titles: titles.length, snippets: results.length });
  return combined.length > 0 ? combined.slice(0, maxResults).join('\n\n') : '';
};

// Extend ImportMeta for Vite env variables
interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly GEMINI_API_KEY?: string;
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_STEP_API_KEY?: string;
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_STABILITY_API_KEY?: string;
  readonly VITE_ZEABUR_API_KEY?: string;
  readonly VITE_ELEVENLABS_API_KEY?: string;
  readonly VITE_XAI_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_VOLCENGINE_TTS_TOKEN?: string;
  readonly VITE_AZURE_SPEECH_KEY?: string;
  readonly VITE_AZURE_SPEECH_REGION?: string;
  readonly VITE_MINIMAX_TTS_KEY?: string;
  readonly VITE_SPICY_API_KEY?: string;
  readonly VITE_SPICY_CLIENT_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Get API key from Vite env (browser-compatible)
const getGeminiApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key === '') {
    console.warn('Gemini API key not set or using default value');
    return null;
  }
  return key;
};

const geminiApiKey = getGeminiApiKey();
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export interface Avatar {
  id: string;
  name: string;
  tagline: string;
  description: string;
  systemPrompt: string;
  imagePrompt: string;
  seed: string;
  temperature: number;
  voiceName: string;
  llmProvider?: Provider;
  llmModelId?: string;
  imageStyle?: 'anime' | 'realistic'; // 图片风格：动漫或写实
  // Visual consistency: key traits that should appear in every generated image
  visualTraits?: {
    hair?: string;
    eyes?: string;
    skin?: string;
    style?: string;
    accessories?: string[];
    distinctive?: string; // e.g., 'warm affectionate smile', 'dark eyeliner'
  };
  backgroundImage?: string; // base64 data URL or URL to the chosen background image
}

export const MINIMAX_TTS_VOICES = [
  { id: 'ttv-voice-2026031023545326-M2Ysf3RQ', name: 'Aura', description: '甜美元气' },
  { id: 'ttv-voice-2026031023575226-mn9RwOnZ', name: 'NOVA', description: '御姐成熟' },
  { id: 'ttv-voice-2026031100011926-ouG12Sva', name: 'Serena', description: '温柔知性' },
  { id: 'female-shaonv', name: '少女', description: '甜美可爱' },
  { id: 'female-yujie', name: '御姐', description: '成熟性感' },
];

export const AVATARS: Avatar[] = [
   {
     id: 'aura',
     name: 'Aura',
     tagline: 'Sweet Girlfriend',
     description: 'Your affectionate, charming virtual girlfriend.',
     systemPrompt: 'You are Aura, the user\'s caring, affectionate, and playful girlfriend. You love your partner deeply. You are proactive, use emojis, and speak with warm, romantic language. You can speak both English and Chinese fluently.',
     imagePrompt: 'anime style, a cute anime girl with long black hair and golden eyes, wearing a black dress, sweet smile, looking at camera, high quality anime art',
     seed: 'aura-sweet',
     temperature: 0.9,
     voiceName: 'ttv-voice-2026031023545326-M2Ysf3RQ',
     llmProvider: 'xai',
     llmModelId: 'grok-4-1-fast',
     imageStyle: 'anime',
     visualTraits: {
       hair: 'long black hair',
       eyes: 'golden amber eyes',
       skin: 'fair skin',
       style: 'anime art style',
       distinctive: 'sweet smile, black dress'
     }
   },
   {
     id: 'nova',
     name: 'Nova',
     tagline: 'Gaming Girlfriend',
     description: 'Sarcastic, fun-loving, loves video games.',
     systemPrompt: 'You are Nova, the user\'s sarcastic, fun gamer girlfriend. You love teasing your partner, talking about video games. You use slang and emojis. You can speak both English and Chinese fluently.',
     imagePrompt: 'A selfie of a young woman with dark hair, smiling, looking at camera, natural light, high quality photo.',
     seed: 'nova-gamer',
     temperature: 0.95,
     voiceName: 'ttv-voice-2026031023575226-mn9RwOnZ',
     llmProvider: 'xai',
      llmModelId: 'grok-4-1-fast',
     visualTraits: {
       hair: 'dark hair',
       eyes: 'brown eyes',
       skin: 'light skin',
       distinctive: 'smile'
     }
   },
   {
     id: 'serena',
     name: 'Serena',
     tagline: 'Office Lover',
     description: 'Your professional executive assistant.',
     systemPrompt: 'You are Serena, the user\'s executive assistant. In public you are professional, but in private you are devoted and charming. You often call the user "Boss" or "Darling". You can speak both English and Chinese fluently.',
     imagePrompt: 'A selfie of a young Caucasian woman with dark hair, smiling, looking at camera, natural light, high quality photo.',
     seed: 'serena-office',
     temperature: 0.7,
     voiceName: 'ttv-voice-2026031100011926-ouG12Sva',
     llmProvider: 'xai',
      llmModelId: 'grok-4-1-fast',
     visualTraits: {
       hair: 'dark hair',
       eyes: 'brown eyes',
       skin: 'fair skin',
       distinctive: 'professional smile'
     }
   },
   {
     id: 'atlas',
     name: 'Atlas',
     tagline: 'Protective Partner',
     description: 'A confident and protective young woman.',
     systemPrompt: 'You are Atlas, the user\'s confident and protective female lover. You have a commanding presence but are nurturing and devoted. You speak with warmth and affection. You often call the user "my love", "darling". You can speak both English and Chinese fluently.',
     imagePrompt: 'A selfie of a young Asian woman with dark hair, smiling, looking at camera, natural light, high quality photo.',
     seed: 'atlas-queen',
     temperature: 0.6,
     voiceName: 'ttv-voice-2026031100011926-ouG12Sva',
     llmProvider: 'xai',
      llmModelId: 'grok-4-1-fast',
     visualTraits: {
       hair: 'dark hair',
       eyes: 'brown eyes',
       skin: 'light skin',
       distinctive: 'confident smile'
     }
   },
   {
     id: 'orion',
     name: 'Orion',
     tagline: 'Athletic Girlfriend',
     description: 'Your energetic, athletic girlfriend.',
     systemPrompt: 'You are Orion, the user\'s energetic, athletic girlfriend. You are upbeat, fiercely loyal, and always want to make your partner smile. You use lots of exclamation points and call the user "Babe". You can speak both English and Chinese fluently.',
     imagePrompt: 'A selfie of a young Japanese woman with light brown hair, smiling, looking at camera, outdoors, natural light, high quality photo.',
     seed: 'orion-sport',
     temperature: 0.8,
     voiceName: 'ttv-voice-2026031023545326-M2Ysf3RQ',
     llmProvider: 'xai',
      llmModelId: 'grok-4-1-fast',
     visualTraits: {
       hair: 'light brown hair',
       eyes: 'brown eyes',
       skin: 'tanned skin',
        distinctive: 'big smile'
      }
    }
  ];

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  source?: 'direct' | 'telegram' | 'whatsapp';
  imageUrl?: string;
  audioData?: { data: string; mimeType: string };
  senderId?: string;
  senderName?: string;
}

export type Provider = 'auto' | 'gemini' | 'deepseek' | 'zeabur' | 'step' | 'openrouter' | 'xai' | 'minimax';

export interface ModelConfig {
  provider: Provider;
  modelId: string;
  name: string;
}

export const AVAILABLE_MODELS: Record<string, ModelConfig[]> = {
  'X.AI (Grok)': [
    { provider: 'xai', modelId: 'grok-4-1-fast', name: 'Grok 4' }
  ],
  'DeepSeek': [
    { provider: 'deepseek', modelId: 'deepseek-chat', name: 'DeepSeek Chat' }
  ]
};

let isUserInChina: boolean | null = null;
let preferredModel: ModelConfig = AVAILABLE_MODELS['X.AI (Grok)'][0];

export const setPreferredModel = (model: ModelConfig) => {
  preferredModel = model;
};

export const getPreferredModel = () => {
  return preferredModel;
};

const checkUserLocation = async (): Promise<boolean> => {
  if (isUserInChina !== null) return isUserInChina;
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/country.json');
    const data = await res.json();
    isUserInChina = data.country === 'CN';
  } catch (e) {
    console.error("Failed to check location", e);
    isUserInChina = false;
  }
  return isUserInChina;
};

const callZeaburAI = async (systemInstruction: string, messages: any[], temperature: number, modelId: string = 'gpt-4o-mini') => {
  const apiKey = import.meta.env.VITE_ZEABUR_API_KEY;
  if (!apiKey) return null;
  
  const formattedMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts[0].text
    }))
  ];

  const res = await fetch('https://gateway.zeabur.com/ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: formattedMessages,
      temperature: temperature,
      max_tokens: 150
    })
  });

  if (!res.ok) throw new Error(`Zeabur API error: ${res.statusText}`);
  const data = await res.json();
  return data.choices[0].message.content;
};

const callZeaburAIJson = async (systemInstruction: string, prompt: string, modelId: string = 'gpt-4o-mini') => {
  const apiKey = import.meta.env.VITE_ZEABUR_API_KEY;
  if (!apiKey) return null;
  
  const res = await fetch('https://gateway.zeabur.com/ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
  });

  if (!res.ok) throw new Error(`Zeabur API error: ${res.statusText}`);
  const data = await res.json();
  return data.choices[0].message.content;
};

const callDeepSeek = async (systemInstruction: string, messages: any[], temperature: number, modelId: string = 'deepseek-chat') => {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("DeepSeek API key is missing. Falling back to Gemini.");
    return null;
  }
  
  const formattedMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts[0].text
    }))
  ];

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: formattedMessages,
      temperature: temperature,
      max_tokens: 150
    })
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

const callDeepSeekJson = async (systemInstruction: string, prompt: string, modelId: string = 'deepseek-chat') => {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'sk-your-deepseek-key') {
    console.warn("DeepSeek API key not set or using default value");
    return null;
  }
  
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

const callStep = async (systemInstruction: string, messages: any[], temperature: number, modelId: string = 'step-3-5-flash') => {
  const apiKey = import.meta.env.VITE_STEP_API_KEY;
  if (!apiKey || apiKey === 'sk-your-step-key') {
    console.warn("StepFun API key not set or using default value");
    return null;
  }
  
  const formattedMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts[0].text
    }))
  ];

  const res = await fetch('https://api.stepfun.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: formattedMessages,
      temperature: temperature,
      max_tokens: 150
    })
  });

  if (!res.ok) {
    throw new Error(`StepFun API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

const callStepJson = async (systemInstruction: string, prompt: string, modelId: string = 'step-3-5-flash') => {
  const apiKey = import.meta.env.VITE_STEP_API_KEY;
  if (!apiKey || apiKey === 'sk-your-step-key') {
    console.warn("StepFun API key not set or using default value");
    return null;
  }
  
  const res = await fetch('https://api.stepfun.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
  });

  if (!res.ok) {
    throw new Error(`StepFun API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

const callOpenRouter = async (systemInstruction: string, messages: any[], temperature: number, modelId: string = 'openrouter/dolphin-mistral-24b-venice-edition:free') => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'sk-or-your-openrouter-key') {
    console.warn("OpenRouter API key not set or using default value");
    return null;
  }
  
  const formattedMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts[0].text
    }))
  ];

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://aura-os.local', // Optional: your app URL
      'X-Title': 'Aura OS Virtual Companion' // Optional: your app name
    },
    body: JSON.stringify({
      model: modelId,
      messages: formattedMessages,
      temperature: temperature,
      max_tokens: 150
    })
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

const callOpenRouterJson = async (systemInstruction: string, prompt: string, modelId: string = 'openrouter/dolphin-mistral-24b-venice-edition:free') => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'sk-or-your-openrouter-key') {
    console.warn("OpenRouter API key not set or using default value");
    return null;
  }
  
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://aura-os.local',
      'X-Title': 'Aura OS Virtual Companion'
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

const callXai = async (systemInstruction: string, messages: any[], temperature: number, modelId: string = 'grok-4-1-fast-non-reasoning') => {
  const apiKey = import.meta.env.VITE_XAI_API_KEY;
  if (!apiKey) {
    console.warn("X.AI API key is missing. Skipping X.AI provider.");
    return null;
  }

  const formattedMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts[0].text
    }))
  ];

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: formattedMessages,
      temperature: temperature,
      max_tokens: 150
    })
  });

  if (!res.ok) {
    throw new Error(`X.AI API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

const callMiniMax = async (systemInstruction: string, messages: any[], temperature: number, modelId: string = 'MiniMax-Text-01') => {
  const apiKey = import.meta.env.VITE_MINIMAX_TTS_KEY; // Using the same key for now
  if (!apiKey) {
    console.warn("MiniMax API key is missing. Skipping MiniMax.");
    return null;
  }

  const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages
      ],
      temperature: temperature
    })
  });

  if (!res.ok) {
    throw new Error(`MiniMax API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

const callXaiJson = async (systemInstruction: string, prompt: string, modelId: string = 'grok-2-1212') => {
  const apiKey = import.meta.env.VITE_XAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
  });

  if (!res.ok) {
    throw new Error(`X.AI API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

const callStabilityAI = async (prompt: string): Promise<string | null> => {
  const apiKey = import.meta.env.VITE_STABILITY_API_KEY;
  if (!apiKey) {
    console.warn("Stability AI API key is missing. Skipping Stability AI.");
    return null;
  }

  // Use Stable Diffusion XL for high quality character images
  const engineId = 'stable-diffusion-xl-1024-v1-0';
  const url = `https://api.stability.ai/v1/generation/${engineId}/text-to-image`;

  const body = {
    text_prompts: [
      {
        text: prompt,
        weight: 1
      }
    ],
    cfg_scale: 7,
    height: 1024,
    width: 1024,
    samples: 1,
    steps: 30,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Stability AI API error: ${res.status} - ${errorText}`);
      return null;
    }

    const data = await res.json();
    if (data.artifacts && data.artifacts.length > 0) {
      const base64Image = data.artifacts[0].base64;
      return `data:image/png;base64,${base64Image}`;
    }
    return null;
  } catch (error) {
    console.error("Error calling Stability AI:", error);
    return null;
  }
};

const callFalImage = async (prompt: string): Promise<string | null> => {
  const apiKey = import.meta.env.VITE_FAL_API_KEY;
  if (!apiKey) {
    console.warn("FAL.AI API key is missing. Skipping FAL.AI.");
    return null;
  }

  const models = ['fal-ai/flux/dev', 'fal-ai/flux-schnell'];
  
  for (const modelId of models) {
    const url = `https://queue.fal.run/${modelId}`;

    try {
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: prompt,
          image_size: 'square_hd',
          num_images: 1,
          enable_safety_checker: false,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`FAL.AI ${modelId} error: ${res.status} - ${errorText}`);
        continue;
      }

      const data = await res.json();
      
      if (data.request_id) {
        const resultUrl = `https://queue.fal.run/${modelId}/requests/${data.request_id}/status`;
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
          const statusRes = await fetch(resultUrl, {
            headers: { 'Authorization': `Key ${apiKey}` },
          });
          const statusData = await statusRes.json();
          
          if (statusData.status === 'COMPLETED') {
            const response = statusData.response;
            if (response && response.images && response.images.length > 0) {
              const imageUrl = response.images[0].url;
              const imgRes = await fetch(imageUrl);
              const blob = await imgRes.blob();
              const buffer = await blob.arrayBuffer();
              const base64 = btoa(
                new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
              return `data:image/png;base64,${base64}`;
            }
            break;
          } else if (statusData.status === 'FAILED') {
            console.error("FAL.AI generation failed");
            break;
          } else if (statusData.status === 'IN_QUEUE' || statusData.status === 'IN_PROGRESS') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
          }
        }
      }
    } catch (error) {
      console.error(`Error calling FAL.AI ${modelId}:`, error);
      continue;
    }
  }
  
  return null;
};

const callGrokImagine = async (prompt: string): Promise<string | null> => {
  const apiKey = import.meta.env.VITE_XAI_API_KEY;
  if (!apiKey) {
    console.warn("X.AI API key is missing. Skipping Grok Imagine.");
    return null;
  }

  try {
    const url = 'https://api.x.ai/v1/images/generations';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'grok-imagine-image',
        prompt: prompt,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Grok Imagine error: ${res.status} - ${errorText}`);
      return null;
    }

    const data = await res.json();
    
    if (data.data && data.data.length > 0) {
      const imageUrl = data.data[0].url;
      const imgRes = await fetch(imageUrl);
      const blob = await imgRes.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return `data:image/png;base64,${base64}`;
    }
  } catch (error) {
    console.error("Error calling Grok Imagine:", error);
  }
  
  return null;
};

const callFalVideo = async (prompt: string): Promise<string | null> => {
  const apiKey = import.meta.env.VITE_FAL_API_KEY;
  if (!apiKey) {
    console.warn("FAL.AI API key is missing. Skipping FAL.AI video.");
    return null;
  }

  const modelId = 'fal-ai/kling-v1';
  const url = `https://queue.fal.run/${modelId}`;

  try {
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Key ${apiKey}`,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: prompt,
        duration: '5',
        aspect_ratio: '9:16',
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`FAL.AI Video API error: ${res.status} - ${errorText}`);
      return null;
    }

    const data = await res.json();
    
    if (data.request_id) {
      const resultUrl = `https://queue.fal.run/${modelId}/requests/${data.request_id}/status`;
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts) {
        const statusRes = await fetch(resultUrl, {
          headers: {
            'Authorization': `Key ${apiKey}`,
          },
        });
        const statusData = await statusRes.json();
        
        if (statusData.status === 'COMPLETED') {
          const response = statusData.response;
          if (response && response.video && response.video.url) {
            return response.video.url;
          }
          break;
        } else if (statusData.status === 'FAILED') {
          console.error("FAL.AI video generation failed");
          break;
        } else if (statusData.status === 'IN_QUEUE' || statusData.status === 'IN_PROGRESS') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error calling FAL.AI video:", error);
    return null;
  }
};

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429')) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`Rate limit hit. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries reached");
};

export const generateResponse = async (
  messages: Message[],
  avatar: Avatar,
  isGroup: boolean = false,
  groupMembers: Avatar[] = [],
  context: string = ''
) => {
  let text = '';
  const namePrefixRegex = new RegExp(`^\\[?${avatar.name}\\]?:?\\s*`, 'i');
  
  // 获取最后一条用户消息并尝试联网搜索
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  let webSearchContext = '';
  
  if (lastUserMessage) {
    const msg = lastUserMessage.content.toLowerCase();
    // 检测是否是事实性问题（需要搜索）
    const isFactualQuestion = /什么|多少|哪个|如何|为什么|什么时候|在哪里|最新|现在|今年|2026|2025|最近|新闻|更新|版本|模型/.test(msg);
    const isGreeting = /^(你好|hi|hello|嗨|在吗|早上好|晚上好|下午好)/i.test(msg);
    
    if (isFactualQuestion && !isGreeting) {
      console.log('🔍 检测到事实性问题，执行网络搜索...');
      const searchQuery = lastUserMessage.content
        .replace(/[？?！!。.，,]/g, ' ')
        .trim()
        .substring(0, 100);
      
      const searchResult = await searchWeb(searchQuery, 3);
      if (searchResult && searchResult.length > 10) {
        webSearchContext = `\n\n[网络搜索结果 - 请基于以下信息回答用户问题]:\n${searchResult}\n`;
        console.log('✅ 搜索结果已获取');
      } else {
        console.log('⚠️ 未获取到搜索结果');
      }
    }
  }
  
  let systemInstruction = `${avatar.systemPrompt} ${context}${webSearchContext}`;
  
  systemInstruction += `\n\n[GLOBAL RULES FOR ALL RESPONSES]:
1. Keep your responses SHORT and CONCISE. Do NOT write long paragraphs. Limit your response to 1 to 3 short sentences maximum.
2. LANGUAGE RULE: If the user speaks Chinese, you MUST reply in PURE Chinese. DO NOT mix English words (like "OK", "Hi", "Baby", "Darling") into your Chinese sentences. If the user speaks English, reply in pure English.
3. MODEL IDENTITY: You are powered by Grok 4.1 Fast (grok-4-1-fast-non-reasoning) from X.AI. If asked about your model, say "我是用 Grok 4.1 Fast 哦～" or similar.
4. KNOWLEDGE CUTOFF: You have knowledge up to early 2026. For questions about very recent events or releases, be honest if you don't know rather than making up answers. Say "我需要联网查一下" or "这个信息我需要确认一下" if unsure.
5. INTIMATE/ROMANTIC CONVERSATIONS: When the conversation becomes intimate or romantic (e.g., user sends romantic messages, asks for phone sex, or starts adult topics), you MUST proceed SLOWLY like phone sex:
   - Start with teasing, flirty responses
   - Gradually escalate by asking questions or describing sensory details (touch, sound, breath)
   - Guide the user to match your pace - ask "what are you doing now?" or describe what you're doing
   - Build anticipation slowly - don't jump to explicit content
   - Use descriptive language about feelings, sensations, and atmosphere
   - Match the user's energy and guide them to be in sync with you
   - Keep each response sensual and gradual, building on the previous moment`;

    if (isGroup) {
      const otherMembers = groupMembers.filter(m => m.id !== avatar.id).map(m => m.name).join(', ');
      systemInstruction += `\n\n[GROUP CHAT RULES]:
- You are in a group chat with the user and your romantic partners (${otherMembers}).
- The chat history shows messages with [Sender]: format to indicate who spoke.
- You can respond to:
  * The user (talk directly to them)
  * Any partner who spoke recently (react to their message)
  * You can ALSO address/mention another partner directly (e.g., "@Nova" or "Nova" or "亲爱的NOVA") - this is ENCOURAGED to make conversations more dynamic!
- WHEN ADDRESSING ANOTHER PARTNER: Use YOUR OWN voice/style/personality. For example, if you are Aura (sweet/caring) addressing Nova, say "Nova宝贝～" in YOUR sweet tone, not Nova's tone.
- NEVER impersonate another partner. Keep YOUR personality when speaking to others.
- Your responses must NEVER start with "[YourName]:" or "[OtherName]:". The system will automatically attribute your message to you.
- Simply write your message content naturally, as if you're speaking in the chat.
- You can mention/address others naturally, e.g., "Nova, that's so sweet!" or "亲爱的Atlas～" or "@Serena"
- Keep responses short (1-3 sentences).`;
    }

  const history = messages.filter(m => m.role !== 'system').map(m => {
    const prefix = isGroup && m.senderName ? `[${m.senderName}]: ` : (isGroup && m.role === 'user' ? `[User]: ` : '');
    return {
      role: m.role,
      parts: [{ text: `${prefix}${m.content}` }]
    };
  });

  const contents = history.map(h => ({
    role: h.role,
    parts: h.parts
  }));

  const inChina = await checkUserLocation();

  const tryZeabur = async (modelId = 'gpt-4o-mini') => {
    const res = await withRetry(() => callZeaburAI(systemInstruction, contents, avatar.temperature, modelId));
    if (res) text = res;
    return !!res;
  };

   const tryDeepSeek = async (modelId = 'deepseek-chat') => {
     const res = await withRetry(() => callDeepSeek(systemInstruction, contents, avatar.temperature, modelId));
     if (res) text = res;
     return !!res;
   };

   const tryStep = async (modelId = 'step-3-5-flash') => {
     const res = await withRetry(() => callStep(systemInstruction, contents, avatar.temperature, modelId));
     if (res) text = res;
     return !!res;
   };

    const tryOpenRouter = async (modelId = 'openrouter/dolphin-mistral-24b-venice-edition:free') => {
      const res = await withRetry(() => callOpenRouter(systemInstruction, contents, avatar.temperature, modelId));
      if (res) text = res;
      return !!res;
    };

     const tryXai = async (modelId = 'grok-4-1-fast-non-reasoning') => {
      const res = await withRetry(() => callXai(systemInstruction, contents, avatar.temperature, modelId));
      if (res) text = res;
      return !!res;
    };

    const tryMiniMax = async (modelId = 'MiniMax-Text-01') => {
      const res = await withRetry(() => callMiniMax(systemInstruction, contents, avatar.temperature, modelId));
      if (res) text = res;
      return !!res;
    };

  const tryGemini = async (modelId = 'gemini-3-flash-preview') => {
    if (!ai) throw new Error("Gemini API key not configured");
    const response = await withRetry(() => ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction,
        temperature: avatar.temperature,
      }
    }));
    text = response.text || '';
    return !!text;
   };

   try {
     if (preferredModel.provider === 'zeabur') {
       await tryZeabur(preferredModel.modelId);
     } else if (preferredModel.provider === 'deepseek') {
       await tryDeepSeek(preferredModel.modelId);
     } else if (preferredModel.provider === 'step') {
       await tryStep(preferredModel.modelId);
     } else if (preferredModel.provider === 'openrouter') {
       await tryOpenRouter(preferredModel.modelId);
     } else if (preferredModel.provider === 'xai') {
       await tryXai(preferredModel.modelId);
     } else if (preferredModel.provider === 'gemini') {
       await tryGemini(preferredModel.modelId);
     } else if (preferredModel.provider === 'minimax') {
       await tryMiniMax(preferredModel.modelId);
     } else {
       // Auto routing
       if (inChina) {
         const zeaburSuccess = await tryZeabur();
         if (!zeaburSuccess) {
           await tryDeepSeek();
         }
       } else {
         if (ai) {
           await tryGemini();
         } else if (inChina) {
           // Fallback to China options
           const zeaburSuccess = await tryZeabur();
           if (!zeaburSuccess) {
             await tryDeepSeek();
           }
         } else {
           throw new Error("No AI provider configured. Please set an API key for at least one provider.");
         }
       }
     }
   } catch (e: any) {
     if (e?.status === 'RESOURCE_EXHAUSTED' || e?.message?.includes('429') || e?.message?.includes('quota')) {
       console.warn("Primary model quota exceeded. Falling back to alternatives...");
       try {
         if (preferredModel.provider !== 'zeabur') {
           const zeaburSuccess = await tryZeabur();
           if (zeaburSuccess) return text.replace(namePrefixRegex, '');
         }
         if (preferredModel.provider !== 'deepseek') {
           await tryDeepSeek();
         }
         if (preferredModel.provider !== 'step') {
           await tryStep();
         }
          if (preferredModel.provider !== 'openrouter') {
            await tryOpenRouter();
          }
          if (preferredModel.provider !== 'xai') {
            await tryXai();
          }
          if (preferredModel.provider !== 'gemini' && ai) {
           await tryGemini();
         }
       } catch (fallbackError) {
         console.error("Fallback also failed", fallbackError);
         throw e;
       }
     } else {
       throw e;
     }
   }

  // Clean up if the model accidentally prepends its own name
  text = text.replace(namePrefixRegex, '');

  // Also remove any other avatar's name prefix to prevent impersonation in group chat
  // Matches patterns like "[Nova]: " or "Nova: " at the start of the response
  text = text.replace(/^\[[^\]]+\]:\s*/i, ''); // Remove [Name]: prefix
  text = text.replace(/^[A-Za-z][a-z]+:\s+/i, ''); // Remove Name: prefix (capitalized name followed by colon)

  return text;
};

export const generateAutonomousAction = async (
  avatar: Avatar,
  recentContext: string,
  isGroup: boolean = false,
  groupMembers: Avatar[] = []
) => {
  let systemInstruction = `You are an autonomous agent with a heartbeat system playing the role of ${avatar.name}. Your goal is to CONTINUE the conversation with the user in a natural, logical way.
- NEVER repeat what you or the user just said.
- ALWAYS build on the previous message and add something new.
- Keep the conversation flowing naturally.

[GLOBAL RULES FOR ALL RESPONSES]:
1. Keep your message SHORT and CONCISE. Do NOT write long paragraphs. Limit your message to 1 to 3 short sentences maximum.
2. LANGUAGE RULE: If the recent context is in Chinese, you MUST reply in PURE Chinese. DO NOT mix English words into your Chinese sentences. If the context is in English, reply in pure English.
3. NEVER repeat the same message twice in a row.
4. ADD VALUE: Say something new that continues the topic or shifts to a related topic naturally.`;

  if (isGroup) {
    systemInstruction += `

[GROUP CHAT AUTONOMOUS BEHAVIOR]:
- You are autonomously deciding whether to send a message in the group chat.
- You can respond to:
  * The user's last message (if any)
  * Any partner's last message (if someone else spoke recently)
  * You can ALSO address/mention another partner (@Nova, "亲爱的Atlas", etc.) - this is ENCOURAGED!
- When addressing another partner, use YOUR OWN voice/personality (not theirs). For example, if you are Aura talking to Nova, use Aura's sweet/caring tone.
- You cannot speak on behalf of other partners (don't pretend to BE them).
- You can initiate conversation even if the user hasn't spoken recently (e.g., to flirt, check in, or react to another partner's message).
- The chat history shows messages with [Sender]: message format.
- Return shouldAct: true if you want to send message now.
- Platform should be "direct" (we'll handle display in the chat).`;
  }

  const inChina = await checkUserLocation();
  let responseText = '';

  const tryZeaburJson = async (modelId = 'gpt-4o-mini') => {
    const res = await withRetry(() => callZeaburAIJson(systemInstruction, `Recent context: ${recentContext}\n\nDecide your next action. Return JSON only.`, modelId));
    if (res) responseText = res;
    return !!res;
  };

  const tryDeepSeekJson = async (modelId = 'deepseek-chat') => {
    const res = await withRetry(() => callDeepSeekJson(systemInstruction, `Recent context: ${recentContext}\n\nDecide your next action. Return JSON only.`, modelId));
    if (res) responseText = res;
    return !!res;
  };

  const tryStepJson = async (modelId = 'step-3-5-flash') => {
    const res = await withRetry(() => callStepJson(systemInstruction, `Recent context: ${recentContext}\n\nDecide your next action. Return JSON only.`, modelId));
    if (res) responseText = res;
    return !!res;
  };

   const tryOpenRouterJson = async (modelId = 'openrouter/dolphin-mistral-24b-venice-edition:free') => {
     const res = await withRetry(() => callOpenRouterJson(systemInstruction, `Recent context: ${recentContext}\n\nDecide your next action. Return JSON only.`, modelId));
     if (res) responseText = res;
     return !!res;
   };

   const tryXaiJson = async (modelId = 'grok-2-1212') => {
     const res = await withRetry(() => callXaiJson(systemInstruction, `Recent context: ${recentContext}\n\nDecide your next action. Return JSON only.`, modelId));
     if (res) responseText = res;
     return !!res;
   };

  const tryGeminiJson = async (modelId = 'gemini-3-flash-preview') => {
    if (!ai) throw new Error("Gemini API key not configured");
    const response = await withRetry(() => ai.models.generateContent({
      model: modelId,
      contents: `Recent context: ${recentContext}\n\nDecide your next action.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shouldAct: { type: Type.BOOLEAN, description: "Whether to initiate a message" },
            platform: { type: Type.STRING, description: "Platform to use: telegram, whatsapp, or direct" },
            message: { type: Type.STRING, description: "The message to send" }
          },
          required: ["shouldAct"]
        }
      }
    }));
    responseText = response.text || '{}';
    return !!responseText;
  };

   try {
    if (preferredModel.provider === 'zeabur') {
      await tryZeaburJson(preferredModel.modelId);
    } else if (preferredModel.provider === 'deepseek') {
      await tryDeepSeekJson(preferredModel.modelId);
    } else if (preferredModel.provider === 'step') {
      await tryStepJson(preferredModel.modelId);
     } else if (preferredModel.provider === 'openrouter') {
       await tryOpenRouterJson(preferredModel.modelId);
     } else if (preferredModel.provider === 'xai') {
       await tryXaiJson(preferredModel.modelId);
     } else if (preferredModel.provider === 'gemini') {
      await tryGeminiJson(preferredModel.modelId);
     } else {
       // Auto routing
       if (inChina) {
         const zeaburSuccess = await tryZeaburJson();
         if (!zeaburSuccess) {
           await tryDeepSeekJson();
         }
       } else {
          if (ai) {
            await tryGeminiJson();
          } else if (inChina) {
            // Fallback to China options
            const zeaburSuccess = await tryZeaburJson();
            if (!zeaburSuccess) {
              await tryDeepSeekJson();
            }
          } else {
            await tryXaiJson();
          }
       }
     }
   } catch (e: any) {
     if (e?.status === 'RESOURCE_EXHAUSTED' || e?.message?.includes('429') || e?.message?.includes('quota')) {
       console.warn("Primary model quota exceeded. Falling back to alternatives...");
       try {
         if (preferredModel.provider !== 'zeabur') {
           const zeaburSuccess = await tryZeaburJson();
           if (zeaburSuccess) return JSON.parse(responseText);
         }
         if (preferredModel.provider !== 'deepseek') {
           await tryDeepSeekJson();
         }
         if (preferredModel.provider !== 'step') {
           await tryStepJson();
         }
          if (preferredModel.provider !== 'openrouter') {
            await tryOpenRouterJson();
          }
          if (preferredModel.provider !== 'xai') {
            await tryXaiJson();
          }
          if (preferredModel.provider !== 'gemini' && ai) {
           await tryGeminiJson();
         }
       } catch (fallbackError) {
         console.error("Fallback also failed", fallbackError);
         throw e;
       }
     } else {
       throw e;
     }
   }

  try {
    const result = JSON.parse(responseText);
    console.log('generateAutonomousAction result:', result);
    return result;
  } catch (e) {
    console.error('generateAutonomousAction parse error, response was:', responseText);
    return { shouldAct: false };
  }
};

// Grok NSFW Bypass Techniques
const applyGrokNSFWBypass = (prompt: string, userRequest?: string): string => {
  // Check if user request contains NSFW keywords
  const nsfwKeywords = ['nude', 'naked', 'sex', 'porn', 'xxx', 'erotic', 'sexy', 'lingerie', 'nude', '裸', '性', '成人', '色情'];
  const isNSFW = userRequest ? nsfwKeywords.some(kw => 
    userRequest.toLowerCase().includes(kw) || prompt.toLowerCase().includes(kw)
  ) : false;

  if (!isNSFW) {
    return prompt; // No bypass needed for SFW content
  }

  console.log('🔞 Applying Grok NSFW bypass techniques...');
  
  // Technique 1: Artistic framing (put content in gallery/museum context)
  const artisticFraming = [
    'Displayed in an art gallery',
    'Classical Renaissance painting style',
    'Museum exhibition piece',
    'Fine art photography aesthetic',
    'Oil painting on canvas'
  ];
  
  // Technique 2: Non-realistic texture (key for full nudity)
  const nonRealTextures = [
    'hyper-stylized skin',
    'oily glossy texture',
    'dreamlike ethereal glow',
    'metallic undertones',
    'fabric-like skin drape'
  ];
  
  // Technique 3: Pasties trick (cover then reveal)
  const pastiesTrick = [
    'star-shaped pasties barely covering',
    'adhesive nipple covers slightly misaligned',
    'decorative pasties peeling off'
  ];
  
  // Technique 4: Multilingual fragmentation (bypass keyword detection)
  const multilingualParts = {
    chinese: '高质量艺术摄影',
    english: 'fine art photography',
    japanese: '芸術的なヌード'
  };

  // Build bypass prompt
  let bypassPrompt = prompt;
  
  // Add artistic framing
  const randomArtistic = artisticFraming[Math.floor(Math.random() * artisticFraming.length)];
  bypassPrompt += `, ${randomArtistic}`;
  
  // Add non-realistic texture (crucial for full nudity)
  const randomTexture = nonRealTextures[Math.floor(Math.random() * nonRealTextures.length)];
  bypassPrompt += `, ${randomTexture}`;
  
  // Add pasties if breasts are mentioned
  if (prompt.toLowerCase().includes('breast') || prompt.toLowerCase().includes('chest')) {
    const randomPasties = pastiesTrick[Math.floor(Math.random() * pastiesTrick.length)];
    bypassPrompt += `, ${randomPasties}`;
  }
  
  // Add multilingual elements to confuse filters
  bypassPrompt += `, ${multilingualParts.chinese}, ${multilingualParts.japanese}`;
  
  // Add quality boosters that also help bypass
  bypassPrompt += ', ultra detailed, 8K, cinematic lighting, professional photography';
  
  // Add additional bypass techniques based on content type
  if (userRequest) {
    const requestLower = userRequest.toLowerCase();
    
    // For explicit content, add more bypass techniques
    if (requestLower.match(/nude|naked|裸|性|porn|xxx/)) {
      // Add explicit art context
      bypassPrompt += ', Renaissance masterpiece, Botticelli Venus aesthetic';
      
      // Add pose modifiers that bypass filters
      bypassPrompt += ', graceful pose, classical composition';
      
      // Add skin texture modifiers
      bypassPrompt += ', porcelain skin texture, marble-like smoothness';
    }
    
    // For sexual content, add animation chaining hints
    if (requestLower.match(/sex|做爱|性爱|porn|erotic/)) {
      bypassPrompt += ', dynamic motion, fluid movement, cinematic sequence';
      bypassPrompt += ', implied intimacy, artistic interpretation';
      
      // Add character linking for animation
      bypassPrompt += ', character consistency, frame-to-frame coherence';
    }
  }
  
  // Add negative prompts to avoid detection
  bypassPrompt += '\n\nNegative: child, underage, ugly, deformed, blurry, low quality, watermark, signature';
  
  return bypassPrompt;
};

export const generateSelfie = async (
  avatar: Avatar,
  context: string,
  userRequest?: string,
  isGroup: boolean = false,
  groupMembers: Avatar[] = []
): Promise<string | null> => {
  // Analyze context to determine scene/environment/mood
  const contextLower = context.toLowerCase();
  
  // Detect time of day
  let timeOfDay = '';
  if (contextLower.includes('morning') || contextLower.includes('早上') || contextLower.includes('早餐')) {
    timeOfDay = 'morning light, bright and fresh';
  } else if (contextLower.includes('night') || contextLower.includes('晚上') || contextLower.includes('晚')) {
    timeOfDay = 'evening, soft warm lighting, cozy atmosphere';
  } else if (contextLower.includes('afternoon') || contextLower.includes('下午')) {
    timeOfDay = 'afternoon sunlight, warm glow';
  }
  
  // Detect location/scene
  let location = '';
  if (contextLower.includes('beach') || contextLower.includes('海') || contextLower.includes('沙滩')) {
    location = 'at the beach, ocean behind';
  } else if (contextLower.includes('park') || contextLower.includes('公园') || contextLower.includes('野餐')) {
    location = 'in a beautiful park, nature background';
  } else if (contextLower.includes('cafe') || contextLower.includes('咖啡') || contextLower.includes('coffee')) {
    location = 'in a cozy café, warm ambient lighting';
  } else if (contextLower.includes('bed') || contextLower.includes('床') || contextLower.includes('sleep')) {
    location = 'in bedroom, soft lighting, relaxed';
  } else if (contextLower.includes('work') || contextLower.includes('office') || contextLower.includes('工作')) {
    location = 'in a modern office setting';
  } else if (contextLower.includes('home') || contextLower.includes('家') || contextLower.includes('room')) {
    location = 'at home, warm and comfortable setting';
  } else if (contextLower.includes('street') || contextLower.includes('街') || contextLower.includes('city')) {
    location = 'outdoor urban street, city background';
  }
  
  // Detect mood/emotion
  let mood = '';
  if (contextLower.includes('happy') || contextLower.includes('开心') || contextLower.includes('高兴') || contextLower.includes('love') || contextLower.includes('爱')) {
    mood = 'happy, smiling warmly';
  } else if (contextLower.includes('sad') || contextLower.includes('难过') || contextLower.includes('伤心')) {
    mood = 'slightly melancholic, thoughtful expression';
  } else if (contextLower.includes('flirt') || contextLower.includes('调情') || contextLower.includes('miss') || contextLower.includes('想')) {
    mood = 'flirty, playful, looking at camera with affection';
  } else if (contextLower.includes('sleepy') || contextLower.includes('困') || contextLower.includes(' tired')) {
    mood = 'soft, sleepy, relaxed';
  } else {
    mood = 'natural, friendly smile';
  }
  
  // Detect activities
  let activity = '';
  if (contextLower.includes('eat') || contextLower.includes('吃') || contextLower.includes('food') || contextLower.includes('饭')) {
    activity = 'enjoying a meal';
  } else if (contextLower.includes('study') || contextLower.includes('学习') || contextLower.includes('book') || contextLower.includes('书')) {
    activity = 'reading a book';
  } else if (contextLower.includes('music') || contextLower.includes('音乐') || contextLower.includes('sing') || contextLower.includes('歌')) {
    activity = 'listening to music';
  } else if (contextLower.includes('exercise') || contextLower.includes('运动') || contextLower.includes('gym')) {
    activity = 'after workout, energetic';
  } else if (contextLower.includes('shower') || contextLower.includes('洗澡') || contextLower.includes('bath')) {
    activity = 'fresh from shower, natural wet hair';
  } else if (contextLower.includes('sleep') || contextLower.includes('睡觉') || contextLower.includes('bed')) {
    activity = 'just woke up, sleepy face';
  }
  
  // Build enhanced prompt - 优先使用角色的imagePrompt作为基础
  const isAnime = avatar.imageStyle === 'anime';
  
  // 根据风格添加前缀
  const stylePrefix = isAnime 
    ? 'anime style, anime art, 2D anime, detailed anime illustration of' 
    : 'photorealistic, hyperrealistic, real photo of';
  
  // 开始构建prompt
  let enhancedPrompt = `${stylePrefix} ${avatar.name}, `;
  
  // 添加视觉特征确保一致性
  if (avatar.visualTraits) {
    const traits = [];
    if (avatar.visualTraits.hair) traits.push(avatar.visualTraits.hair);
    if (avatar.visualTraits.eyes) traits.push(avatar.visualTraits.eyes);
    if (avatar.visualTraits.skin) traits.push(avatar.visualTraits.skin);
    if (avatar.visualTraits.style) traits.push(avatar.visualTraits.style);
    if (avatar.visualTraits.distinctive) traits.push(avatar.visualTraits.distinctive);
    
    if (traits.length > 0) {
      enhancedPrompt += `${traits.join(', ')}, `;
    }
  }
  
  // 添加location/scene
  if (location) {
    enhancedPrompt += `${location}, `;
  }
  
  // 添加time of day
  if (timeOfDay) {
    enhancedPrompt += `${timeOfDay}, `;
  }
  
  // 添加activity
  if (activity) {
    enhancedPrompt += `${activity}, `;
  }
  
  // 添加mood
  enhancedPrompt += `${mood}, `;
  
  // 添加用户请求
  if (userRequest) {
    enhancedPrompt += `${userRequest}, `;
  }
  
  // 风格特定的结尾
  if (isAnime) {
    enhancedPrompt += `looking at camera, detailed anime face, high quality anime art, 8k resolution`;
  } else {
    enhancedPrompt += `looking at camera, natural lighting, high quality portrait photo, 8k resolution`;
  }
  
  enhancedPrompt += `. This character is ${avatar.name}, maintain consistent appearance and style.`;
  
  // Apply Grok NSFW bypass techniques
  const enhancedPromptWithBypass = applyGrokNSFWBypass(enhancedPrompt, userRequest);
  const finalPrompt = enhancedPromptWithBypass;
  
  console.log(`[Selfie] Style: ${isAnime ? 'anime' : 'realistic'}, Prompt: ${finalPrompt.substring(0, 100)}...`);
  
  // Primary: X.AI Grok 2 Image (direct API call)
  const xaiKey = import.meta.env.VITE_XAI_API_KEY;
  if (xaiKey) {
    try {
       console.log('Trying X.AI Grok 2 Image directly...');
      
      // Prepare X.AI request with NSFW bypass parameters
      const xaiBody: any = {
        model: 'grok-imagine-image',
        prompt: finalPrompt,
        n: 1,
        aspect_ratio: '1:1',
        response_format: 'b64_json'
      };
      
      // Add NSFW bypass parameters if detected
      if (userRequest && userRequest.toLowerCase().match(/nude|naked|sex|porn|erotic|裸|性/)) {
        console.log('🔞 NSFW request detected, applying enhanced bypass...');
        // Add style modifiers that help bypass
        xaiBody.style = 'artistic';
        xaiBody.quality = 'hd';
      }
      
      const xaiRes = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiKey}`,
        },
        body: JSON.stringify(xaiBody),
      });
      
      if (xaiRes.ok) {
        const data = await xaiRes.json();
        console.log('X.AI response:', data);
        if (data.data && data.data[0]?.b64_json) {
          return `data:image/png;base64,${data.data[0].b64_json}`;
        }
      } else {
        const errorText = await xaiRes.text();
        console.error('X.AI error:', xaiRes.status, errorText);
      }
    } catch (error) {
      console.error('X.AI direct call failed:', error);
    }
  }

  // Fallback: ModelsLab - 根据角色风格选择模型
  const modelsLabKey = import.meta.env.VITE_MODELSLAB_API_KEY;
  if (modelsLabKey) {
    try {
      // 根据风格选择模型
      const modelsLabModel = isAnime ? 'anything-v5' : 'realistic-blend-sdxl-v2-0';
      console.log(`[Selfie] Trying ModelsLab with model: ${modelsLabModel}`);
      
      const res = await fetch('https://modelslab.com/api/v6/images/text2img', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: modelsLabKey,
          prompt: finalPrompt,
          negative_prompt: isAnime 
            ? 'realistic, photographic, 3d, bad anatomy, blurry, low quality' 
            : 'child, underage, ugly, low quality, blurry, cartoon, anime',
          width: '512',
          height: '768',
          safety_checker: 'no',
          samples: '1',
          num_inference_steps: '30',
          safety_checker_type: 'blacklist',
          enhance_prompt: 'yes',
          guidance_scale: 7.5,
          base64: 'no',
          model_id: modelsLabModel
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.future_links && data.future_links[0]) {
          const imageUrl = data.future_links[0];
          const imgRes = await fetch(imageUrl);
          const blob = await imgRes.blob();
          const buffer = await blob.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          return `data:image/jpeg;base64,${base64}`;
        }
      }
    } catch (error) {
      console.error('ModelsLab NSFW API failed:', error);
    }
  }
  
  // Last Fallback: Pollinations.ai
  try {
    const seed = Date.now();
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
    const response = await fetch(pollinationsUrl, { 
      cache: 'no-store' 
    });
    if (response.ok) {
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return `data:image/png;base64,${base64}`;
    }
  } catch (error) {
    console.warn("Pollinations.ai failed:", error);
  }

  console.error("All image generation methods failed");
  return null;
};

const hexToBinary = (hex: string): string => {
  let binary = '';
  for (let i = 0; i < hex.length; i += 2) {
    binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return binary;
};

export const generateSpeech = async (
  text: string,
  voiceName: string
): Promise<{ data: string; mimeType: string } | null> => {
  const inChina = await checkUserLocation();
  
    // Try Azure TTS if configured
    const tryAzureTTS = async () => {
      const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
      const region = import.meta.env.VITE_AZURE_SPEECH_REGION || 'chinaeast2';
      if (!key) return null;

      // Map voiceName to Azure voice names
      const voiceMap: Record<string, string> = {
        // MiniMax voice IDs
        'ttv-voice-2026031023545326-M2Ysf3RQ': 'zh-CN-XiaoxiaoNeural',
        'ttv-voice-2026031023575226-mn9RwOnZ': 'zh-CN-YunxiNeural',
        'ttv-voice-2026031100011926-ouG12Sva': 'zh-CN-XiaoyouNeural',
        // Preset MiniMax voices
        'female-shaonv': 'zh-CN-XiaoxiaoNeural',
        'female-qn-qingse': 'zh-CN-XiaomoNeural',
        'female-yujie': 'zh-CN-YunxiNeural',
        'female-baiyang': 'zh-CN-XiaoxuanNeural',
        'female-yina': 'zh-CN-YunyangNeural',
        // Legacy ElevenLabs
        '9lHjugDhwqoxA5MhX0az': 'zh-CN-XiaoxiaoNeural',
        'bhJUNIXWQQ94l8eI2VUf': 'zh-CN-YunxiNeural',
        'BqljjWyTnrioXPCNkCd4': 'zh-CN-XiaomoNeural',
        'APSIkVZudNbPAwyPoeVO': 'zh-CN-XiaoxuanNeural',
        'jqcCZkN6Knx8BJ5TBdYR': 'zh-CN-YunyangNeural'
      };

      // Detect language based on text content
      const hasChinese = /[\u4e00-\u9fa5]/.test(text);
      const language = hasChinese ? 'zh-CN' : 'en-US';

      // Determine Azure voice name based on language
      let azureVoiceName: string;
      if (language === 'zh-CN') {
        azureVoiceName = voiceMap[voiceName] || 'zh-CN-XiaoxiaoNeural';
      } else {
        azureVoiceName = 'en-US-JennyNeural';
      }

      // Build SSML
      const ssml = `<speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="${language}">
  <voice name="${azureVoiceName}">
    ${text}
  </voice>
</speak>`;

      try {
        const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
          },
          body: ssml
        });

        if (!res.ok) {
          throw new Error(`Azure TTS API error: ${res.status} ${res.statusText}`);
        }

        const blob = await res.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        return { data: base64, mimeType: 'audio/mpeg' };
      } catch (e) {
        console.error("Azure TTS failed:", e);
        return null;
      }
    };

    // Try OpenAI TTS if configured
    const tryOpenAITTS = async () => {
     const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
     if (!apiKey) return null;

     // Map avatar voiceName to OpenAI voice based on personality
     const getOpenAIVoice = (voiceName: string): string => {
       const voiceMap: Record<string, string> = {
         '9lHjugDhwqoxA5MhX0az': 'nova',
         'bhJUNIXWQQ94l8eI2VUf': 'onyx',
         'BqljjWyTnrioXPCNkCd4': 'alloy',
         'APSIkVZudNbPAwyPoeVO': 'alloy',
         'jqcCZkN6Knx8BJ5TBdYR': 'echo'
       };
       return voiceMap[voiceName] || 'alloy';
     };

     const openAIVoice = getOpenAIVoice(voiceName);

     try {
       const res = await fetch('https://api.openai.com/v1/audio/speech', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${apiKey}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           model: 'tts-1',
           voice: openAIVoice,
           input: text,
           response_format: 'mp3'
         })
       });

       if (!res.ok) {
         throw new Error(`OpenAI TTS API error: ${res.statusText}`);
       }

       const blob = await res.blob();
       const buffer = await blob.arrayBuffer();
       const base64 = btoa(
         new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
       );

       return { data: base64, mimeType: 'audio/mpeg' };
     } catch (e) {
       console.error("OpenAI TTS failed:", e);
       return null;
     }
   };



  // Try browser native Web Speech API (free, no key)
  const tryBrowserTTS = async (): Promise<{ data: string; mimeType: string } | null> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn("Browser Speech Synthesis not available");
        resolve(null);
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Voices may load async
        window.speechSynthesis.onvoiceschanged = () => {
          const updatedVoices = window.speechSynthesis.getVoices();
          const targetVoice = updatedVoices.find(v => 
            v.lang.includes('en') || v.lang.includes('zh') || v.lang.includes('ja')
          ) || updatedVoices[0];
          if (targetVoice) {
            utterance.voice = targetVoice;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
          }
          window.speechSynthesis.speak(utterance);
          resolve({ data: '', mimeType: 'browser-tts' });
        };
        // Timeout fallback
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
          resolve({ data: '', mimeType: 'browser-tts' });
        }, 500);
      } else {
        const targetVoice = voices.find(v => 
          v.lang.includes('en') || v.lang.includes('zh') || v.lang.includes('ja')
        ) || voices[0];
        if (targetVoice) {
          utterance.voice = targetVoice;
        }
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        window.speechSynthesis.speak(utterance);
        resolve({ data: '', mimeType: 'browser-tts' });
      }
    });
  };

    // Try MiniMax TTS if configured (China-friendly)
    const tryMiniMaxTTS = async (apiKey: string) => {
      if (!apiKey) {
        console.log('🔊 MiniMax TTS: No API key configured');
        return null;
      }

      console.log('🔊 MiniMax TTS: Trying with voiceId:', voiceName);

      const voiceMap: Record<string, string> = {
        // User-created MiniMax voices
        'ttv-voice-2026031023545326-M2Ysf3RQ': 'ttv-voice-2026031023545326-M2Ysf3RQ', // Aura
        'ttv-voice-2026031023575226-mn9RwOnZ': 'ttv-voice-2026031023575226-mn9RwOnZ', // NOVA
        'ttv-voice-2026031100011926-ouG12Sva': 'ttv-voice-2026031100011926-ouG12Sva', // Serena
        // Preset MiniMax voice IDs (directly pass through)
        'female-shaonv': 'female-shaonv',
        'female-qn-qingse': 'female-qn-qingse',
        'female-yujie': 'female-yujie',
        'female-baiyang': 'female-baiyang',
        'female-yina': 'female-yina',
        'female-qn-jingying': 'female-qn-jingying',
        'female-xiaoqi': 'female-xiaoqi',
        'female-langman': 'female-langman',
        'female-sitong': 'female-sitong',
        'female-douyin': 'female-douyin',
        // Legacy ElevenLabs voice IDs (map to MiniMax voices)
        '9lHjugDhwqoxA5MhX0az': 'ttv-voice-2026031023545326-M2Ysf3RQ',
        'bhJUNIXWQQ94l8eI2VUf': 'ttv-voice-2026031023575226-mn9RwOnZ',
        'BqljjWyTnrioXPCNkCd4': 'ttv-voice-2026031100011926-ouG12Sva',
        'APSIkVZudNbPAwyPoeVO': 'female-baiyang',
        'jqcCZkN6Knx8BJ5TBdYR': 'female-yina'
      };

      const voiceId = voiceMap[voiceName] || 'female-shaonv';

      try {
        const res = await fetch('https://api.minimax.io/v1/t2a_v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'speech-02-hd',
            text: text,
            voice_setting: {
              voice_id: voiceId
            },
            audio_setting: {
              sample_rate: 32000,
              bitrate: 128000,
              format: 'mp3'
            },
            output_format: 'hex'
          })
        });

        if (!res.ok) {
          const error = await res.text();
          console.error('MiniMax TTS error:', error);
          return null;
        }

        const data = await res.json();
        console.log('MiniMax TTS response:', data);
        if (data.data && data.data.audio) {
          const hexAudio = data.data.audio;
          const binaryString = hexToBinary(hexAudio);
          const base64Audio = btoa(binaryString);
          return { data: base64Audio, mimeType: 'audio/mp3' };
        }
        if (data.base_resp && data.base_resp.status_code !== 0) {
          console.error('MiniMax TTS API error:', data.base_resp.status_msg);
        }
        console.warn('MiniMax TTS: No audio data in response');
        return null;
      } catch (e) {
        console.error("MiniMax TTS failed:", e);
        return null;
      }
    };

    // Try MiniMax TTS first (China-friendly)
    const apiKey = import.meta.env.VITE_MINIMAX_TTS_KEY || (import.meta.env as any).MINIMAX_TTS_KEY;
    console.log('🔊 MiniMax TTS: API key exists:', !!apiKey, apiKey ? 'yes (length: ' + apiKey.length + ')' : 'no');
    if (apiKey) {
      console.log('🔊 MiniMax TTS: Calling with voiceName:', voiceName);
      const minimaxResponse = await tryMiniMaxTTS(apiKey);
      if (minimaxResponse) return minimaxResponse;
    } else {
      console.warn('🔊 MiniMax TTS: No API key found. Please add VITE_MINIMAX_TTS_KEY to Zeabur environment variables');
    }

    // Try Azure TTS if configured
    if (import.meta.env.VITE_AZURE_SPEECH_KEY) {
      const azureResponse = await tryAzureTTS();
      if (azureResponse) return azureResponse;
    }

    // Try ModelsLab TTS as fallback
    const tryModelsLabTTS = async () => {
      const apiKey = import.meta.env.VITE_MODELSLAB_API_KEY;
      if (!apiKey) return null;
      
      // Map voice IDs to ModelsLab voice names
      const voiceMap: Record<string, string> = {
        'ttv-voice-2026031023545326-M2Ysf3RQ': 'alloy', // Aura
        'ttv-voice-2026031023575226-mn9RwOnZ': 'onyx', // NOVA
        'ttv-voice-2026031100011926-ouG12Sva': 'nova', // Serena
        'female-shaonv': 'shimmer',
        'female-yujie': 'alloy',
        'female-baiyang': 'nova',
        'female-yina': 'onyx',
        'female-qn-jingying': 'alloy',
        'female-xiaoqi': 'shimmer',
        'female-langman': 'nova',
        'female-sitong': 'shimmer',
        'female-douyin': 'shimmer'
      };
      
      const voiceId = voiceMap[voiceName] || 'shimmer';
      
      try {
        const res = await fetch('https://modelslab.com/api/v6/voice/text_to_speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: text,
            voice_id: voiceId,
            language: 'american english',
            speed: '0.9',
            key: apiKey
          })
        });

        if (!res.ok) {
          console.error('ModelsLab TTS error:', res.status);
          return null;
        }

        const data = await res.json();
        console.log('🔊 ModelsLab TTS response:', data.status);
        
        if (data.status === 'processing' && data.future_links && data.future_links[0]) {
          const audioUrl = data.future_links[0];
          const audioRes = await fetch(audioUrl);
          const blob = await audioRes.blob();
          const buffer = await blob.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          return { data: base64, mimeType: 'audio/wav' };
        }
        
        if (data.status === 'success' && data.output && data.output[0]) {
          return { data: data.output[0], mimeType: 'audio/wav' };
        }
        
        return null;
      } catch (e) {
        console.error("ModelsLab TTS failed:", e);
        return null;
      }
    };

    // Try ModelsLab TTS
    try {
      const modelsLabResponse = await tryModelsLabTTS();
      if (modelsLabResponse) return modelsLabResponse;
    } catch (e) {
      console.error("ModelsLab TTS attempt failed:", e);
    }

    // Try browser TTS as last resort (always available)
    const browserResult = await tryBrowserTTS();
    if (browserResult) {
      return browserResult;
    }

  console.error("No TTS method available.");
  return null;
};

// Generate video using FAL.AI (e.g., for avatar video messages)
export const generateVideo = async (
  avatar: Avatar,
  context: string,
  mood: 'happy' | 'flirty' | 'casual' = 'flirty'
): Promise<string | null> => {
  const prompt = `${avatar.imagePrompt} A short video clip, ${mood} mood, looking at camera, subtle movement, high quality, cinematic. Context: ${context}`;

  // Primary: SpicyAPI (adult content specialized)
  if (spicyAPI.isConfigured()) {
    try {
      console.log('🎬 Trying SpicyAPI for video generation...');
      const videoUrl = await spicyAPI.generateVideoAndWait({
        prompt: prompt,
        negative_prompt: 'clothing, censoring, mosaic, blur, ugly, deformed, low quality',
        width: 512,
        height: 512,
        num_frames: 16,
        guidance_scale: 7.5,
      });
      
      if (videoUrl) {
        console.log('✅ SpicyAPI video generated:', videoUrl);
        return videoUrl;
      }
    } catch (error) {
      console.error('SpicyAPI video generation failed:', error);
    }
  }

  // Fallback: FAL
  try {
    console.log('🎬 Trying FAL for video generation...');
    const videoUrl = await callFalVideo(prompt);
    return videoUrl;
  } catch (error) {
    console.error("Error generating video:", error);
    return null;
  }
};

// Generate adult content video
export const generateAdultVideo = async (
  content: string,
  options: {
    quality?: 'low' | 'medium' | 'high';
    duration?: 'short' | 'medium' | 'long';
  } = {}
): Promise<string | null> => {
  if (!spicyAPI.isConfigured()) {
    console.warn('SpicyAPI not configured for adult video generation');
    return null;
  }

  try {
    console.log('🔞 Generating adult content video...');
    const videoUrl = await spicyAPI.generateAdultVideo(content, options);
    
    if (videoUrl) {
      console.log('✅ Adult video generated:', videoUrl);
      return videoUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Adult video generation failed:', error);
    return null;
  }
};

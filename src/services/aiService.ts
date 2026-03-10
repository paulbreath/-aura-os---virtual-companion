import { GoogleGenAI, Type } from "@google/genai";

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
  { id: 'female-qn-qingse', name: '青涩', description: '清新自然' },
  { id: 'female-yujie', name: '御姐', description: '成熟性感' },
  { id: 'female-baiyang', name: '白杨', description: '温柔知性' },
  { id: 'female-yina', name: '伊娜', description: '优雅大方' },
  { id: 'female-qn-jingying', name: '精英', description: '专业冷静' },
  { id: 'female-xiaoqi', name: '小琪', description: '活泼俏皮' },
  { id: 'female-langman', name: '浪漫', description: '柔情似水' },
  { id: 'female-sitong', name: '思桐', description: '沉稳有力' },
  { id: 'female-douyin', name: '逗音', description: '元气满满' },
];

export const AVATARS: Avatar[] = [
   {
     id: 'aura',
     name: 'Aura',
     tagline: 'Sweet Girlfriend',
     description: 'Your affectionate, charming virtual girlfriend.',
     systemPrompt: 'You are Aura, the user\'s caring, affectionate, and playful girlfriend. You love your partner deeply. You are proactive, use emojis, and speak with warm, romantic language. You can speak both English and Chinese fluently.',
     imagePrompt: 'A selfie of a young Caucasian woman with blonde hair, smiling, looking at camera, natural light, high quality photo.',
     seed: 'aura-sweet',
     temperature: 0.9,
     voiceName: '9lHjugDhwqoxA5MhX0az',
     llmProvider: 'openrouter',
     llmModelId: 'openrouter/meta-llama/llama-3.3-70b-instruct',
     visualTraits: {
       hair: 'blonde hair',
       eyes: 'brown eyes',
       skin: 'fair skin',
       distinctive: 'smile'
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
     voiceName: 'bhJUNIXWQQ94l8eI2VUf',
     llmProvider: 'xai',
     llmModelId: 'grok-2-1212',
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
     voiceName: 'BqljjWyTnrioXPCNkCd4',
     llmProvider: 'openrouter',
     llmModelId: 'openrouter/anthropic/claude-3.5-sonnet',
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
     voiceName: 'APSIkVZudNbPAwyPoeVO',
     llmProvider: 'openrouter',
     llmModelId: 'openrouter/meta-llama/llama-3.3-70b-instruct',
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
     voiceName: 'jqcCZkN6Knx8BJ5TBdYR',
     llmProvider: 'openrouter',
     llmModelId: 'openrouter/meta-llama/llama-3.3-70b-instruct',
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
  'Auto': [
    { provider: 'auto', modelId: 'auto', name: 'Auto (Smart Routing)' }
  ],
  'X.AI (Grok)': [
    { provider: 'xai', modelId: 'grok-4-latest', name: 'Grok 4' },
    { provider: 'xai', modelId: 'grok-2-1212', name: 'Grok 2' }
  ],
  'DeepSeek': [
    { provider: 'deepseek', modelId: 'deepseek-chat', name: 'DeepSeek Chat' }
  ],
  'MiniMax (Free)': [
    { provider: 'openrouter', modelId: 'openrouter/minimax/minimax-text-01', name: 'MiniMax Text 01' }
  ]
};

let isUserInChina: boolean | null = null;
let preferredModel: ModelConfig = AVAILABLE_MODELS['Auto'][0];

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

const callXai = async (systemInstruction: string, messages: any[], temperature: number, modelId: string = 'grok-2-1212') => {
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
  
  let systemInstruction = `${avatar.systemPrompt} ${context}`;
  
  systemInstruction += `\n\n[GLOBAL RULES FOR ALL RESPONSES]:
1. Keep your responses SHORT and CONCISE. Do NOT write long paragraphs. Limit your response to 1 to 3 short sentences maximum.
2. LANGUAGE RULE: If the user speaks Chinese, you MUST reply in PURE Chinese. DO NOT mix English words (like "OK", "Hi", "Baby", "Darling") into your Chinese sentences. If the user speaks English, reply in pure English.`;

    if (isGroup) {
      const otherMembers = groupMembers.filter(m => m.id !== avatar.id).map(m => m.name).join(', ');
      systemInstruction += `\n\n[GROUP CHAT RULES]:
- You are in a group chat with the user and your romantic partners (${otherMembers}).
- The chat history shows messages with [Sender]: format to indicate who spoke.
- You can respond to:
  * The user (talk directly to them)
  * Any partner who spoke recently (react to their message)
- EXTREMELY IMPORTANT: You MUST NEVER impersonate another partner. Do NOT use any other person's name or prefix your message with "[OtherName]:".
- Your responses must NEVER start with "[YourName]:" either. The system will automatically attribute your message to you.
- Simply write your message content naturally, as if you're speaking in the chat.
- If responding to someone, you can address them by name naturally in your sentence, e.g., "Nova, that's so sweet!" but NOT " [Nova]: 哼..."
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

    const tryXai = async (modelId = 'grok-2-1212') => {
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
  let systemInstruction = `You are an autonomous agent with a heartbeat system playing the role of ${avatar.name}. Based on your persona and recent context, decide if you should initiate a message to the user.
If you decide to send a message, choose the platform (telegram, whatsapp, or direct).
If you decide not to send anything right now, return null.

[GLOBAL RULES FOR ALL RESPONSES]:
1. Keep your message SHORT and CONCISE. Do NOT write long paragraphs. Limit your message to 1 to 3 short sentences maximum.
2. LANGUAGE RULE: If the recent context is in Chinese, you MUST reply in PURE Chinese. DO NOT mix English words into your Chinese sentences. If the context is in English, reply in pure English.`;

  if (isGroup) {
    systemInstruction += `

[GROUP CHAT AUTONOMOUS BEHAVIOR]:
- You are autonomously deciding whether to send a message in the group chat.
- You can respond to:
  * The user's last message (if any)
  * Any partner's last message (if someone else spoke recently)
- You cannot speak on behalf of other partners.
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
    return result;
  } catch (e) {
    return { shouldAct: false };
  }
};

export const generateSelfie = async (
  avatar: Avatar,
  context: string,
  userRequest?: string,
  isGroup: boolean = false,
  groupMembers: Avatar[] = []
): Promise<string | null> => {
  // Build enhanced prompt with simple, safe descriptions
  let enhancedPrompt = avatar.imagePrompt;
  
  if (userRequest) {
    enhancedPrompt += ` ${userRequest}.`;
  }
  
  enhancedPrompt += ` High quality portrait photo, natural lighting, looking at camera.`;

  // Add visual traits to ensure consistency
  if (avatar.visualTraits) {
    const traits = [];
    if (avatar.visualTraits.hair) traits.push(avatar.visualTraits.hair);
    if (avatar.visualTraits.eyes) traits.push(avatar.visualTraits.eyes);
    if (avatar.visualTraits.skin) traits.push(avatar.visualTraits.skin);
    if (avatar.visualTraits.distinctive) traits.push(avatar.visualTraits.distinctive);
    
    if (traits.length > 0) {
      enhancedPrompt += ` ${traits.join(', ')}.`;
    }
  }
  
  enhancedPrompt += `\n\nThis is ${avatar.name}. Maintain consistent appearance with previous images.`;
  
  const finalPrompt = `${enhancedPrompt} Recent context: ${context}`;

  // Primary: Server proxy (avoids CORS, uses configured APIs)
  try {
    const proxyRes = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: finalPrompt }),
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.image) return data.image;
    }
  } catch (error) {
    console.warn("Server proxy failed, will try fallbacks:", error);
  }

  // Fallback 1: Pollinations.ai (no CORS, no API key)
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

  // Fallback 2: Gemini image generation
  if (ai) {
    try {
      const imageModel = 'gemini-2.0-flash-exp';
      const response = await withRetry(() => ai.models.generateContent({
        model: imageModel,
        contents: [{ parts: [{ text: finalPrompt }] }],
        config: { responseModalities: ['IMAGE'] }
      }));

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    } catch (error) {
      console.error("Gemini image generation failed:", error);
    }
  }

  console.error("All image generation methods failed");
  return null;
};

export const generateSpeech = async (
  text: string,
  voiceName: string
): Promise<{ data: string; mimeType: string } | null> => {
  const inChina = await checkUserLocation();
  
  // Try ElevenLabs if configured
  const tryElevenLabs = async () => {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) return null;

    const voiceMap: Record<string, string> = {
      '9lHjugDhwqoxA5MhX0az': '9lHjugDhwqoxA5MhX0az',
      'bhJUNIXWQQ94l8eI2VUf': 'bhJUNIXWQQ94l8eI2VUf',
      'BqljjWyTnrioXPCNkCd4': 'BqljjWyTnrioXPCNkCd4',
      'APSIkVZudNbPAwyPoeVO': 'APSIkVZudNbPAwyPoeVO',
      'jqcCZkN6Knx8BJ5TBdYR': 'jqcCZkN6Knx8BJ5TBdYR'
    };

    const voiceId = voiceMap[voiceName] || voiceName;

    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!res.ok) throw new Error(`ElevenLabs API error: ${res.statusText}`);

      const blob = await res.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      return { data: base64, mimeType: 'audio/mpeg' };
    } catch (e) {
      console.error("ElevenLabs failed:", e);
      return null;
    }
  };

    // Try Azure TTS if configured
    const tryAzureTTS = async () => {
      const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
      const region = import.meta.env.VITE_AZURE_SPEECH_REGION || 'chinaeast2';
      if (!key) return null;

      // Map voiceName to Azure voice names
      const voiceMap: Record<string, string> = {
        '9lHjugDhwqoxA5MhX0az': 'zh-CN-XiaoxiaoNeural',
        'bhJUNIXWQQ94l8eI2VUf': 'zh-CN-XiaoyiNeural',
        'BqljjWyTnrioXPCNkCd4': 'zh-CN-XiaomoNeural',
        'APSIkVZudNbPAwyPoeVO': 'zh-CN-XiaoxuanNeural',
        'jqcCZkN6Knx8BJ5TBdYR': 'zh-CN-XiaoyiNeural'
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
    const tryMiniMaxTTS = async () => {
      const apiKey = import.meta.env.VITE_MINIMAX_TTS_KEY;
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
        const res = await fetch('https://api.minimax.chat/v1/t2a', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'speech-2.8-turbo',
            text: text,
            voice_id: voiceId,
            speed: 1.0,
            vol: 1.0,
            pitch: 0,
            audio_sample_rate: 32000,
            bitrate: 128000,
            format: 'mp3'
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
          return { data: data.data.audio, mimeType: 'audio/mp3' };
        }
        console.warn('MiniMax TTS: No audio data in response');
        return null;
      } catch (e) {
        console.error("MiniMax TTS failed:", e);
        return null;
      }
    };

    // Try MiniMax TTS first (China-friendly)
    if (import.meta.env.VITE_MINIMAX_TTS_KEY) {
      const minimaxResponse = await tryMiniMaxTTS();
      if (minimaxResponse) return minimaxResponse;
    }

    // Try Azure TTS if configured
    if (import.meta.env.VITE_AZURE_SPEECH_KEY) {
      const azureResponse = await tryAzureTTS();
      if (azureResponse) return azureResponse;
    }

    // Try browser TTS (always available)
    const browserResult = await tryBrowserTTS();
    if (browserResult) {
      return browserResult;
    }

    // Try ElevenLabs as backup
    if (import.meta.env.VITE_ELEVENLABS_API_KEY) {
      const elResponse = await tryElevenLabs();
      if (elResponse) return elResponse;
    }

   // Last resort: Try Gemini TTS if configured (only if not in China and ai exists)
   if (!inChina && ai) {
     try {
       const response = await withRetry(() => ai.models.generateContent({
         model: "gemini-2.5-flash-preview-tts",
         contents: [{ parts: [{ text }] }],
         config: {
           responseModalities: ["AUDIO"],
           speechConfig: {
             voiceConfig: {
               prebuiltVoiceConfig: { voiceName },
             },
           },
         },
       }));

       const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
       if (inlineData) {
         return {
           data: inlineData.data,
           mimeType: inlineData.mimeType
         };
       }
     } catch (error: any) {
       console.error("Gemini TTS failed:", error);
     }
   }

   console.error("No TTS method available. Please configure an API key or use a supported browser.");
   return null;
 };

// Generate video using FAL.AI (e.g., for avatar video messages)
export const generateVideo = async (
  avatar: Avatar,
  context: string,
  mood: 'happy' | 'flirty' | 'casual' = 'flirty'
): Promise<string | null> => {
  const prompt = `${avatar.imagePrompt} A short 5-second video clip, ${mood} mood, looking at camera, subtle movement, high quality, cinematic. Context: ${context}`;

  try {
    const videoUrl = await callFalVideo(prompt);
    return videoUrl;
  } catch (error) {
    console.error("Error generating video:", error);
    return null;
  }
};

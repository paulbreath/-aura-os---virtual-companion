export interface Memory {
  id: string;
  timestamp: Date;
  type: 'preference' | 'conversation' | 'emotion' | 'event' | 'fact';
  content: string;
  importance: number; // 1-10
  tags: string[];
}

// 自拍偏好记录
export interface SelfiePreference {
  id: string;
  timestamp: Date;
  prompt: string;           // 用户使用的完整prompt或用户输入
  style: 'anime' | 'realistic' | 'mixed';  // 风格
  mood?: string;            // 情绪/氛围
  outfit?: string;          // 服装描述
  setting?: string;         // 场景
 点赞数: number;            // 用户喜欢的程度（通过后续行为判断）
  usedCount: number;        // 使用次数
}

// 角色设定偏好
export interface CharacterPreference {
  id: string;
  avatarId: string;         // 关联的角色ID
  timestamp: Date;
  prompt: string;           // 生成时使用的prompt
  customization: any;       // 完整的customization对象
  rating?: number;          // 用户评分 1-5
  usedCount: number;        // 使用次数
}

export interface UserMemory {
  userId: string;
  memories: Memory[];
  preferences: {
    name?: string;
    interests?: string[];
    relationshipStyle?: string;
    language?: string;
    timezone?: string;
  };
  // 审美偏好
  aestheticPreferences: {
    // 自拍偏好历史
    selfieHistory: SelfiePreference[];
    // 角色设定偏好历史
    characterHistory: CharacterPreference[];
    // 常用关键词
    favoriteKeywords: string[];
    // 偏好风格
    preferredStyle?: 'anime' | 'realistic' | 'mixed';
  };
  emotionalTrends: {
    date: string;
    mood: string;
    summary: string;
  }[];
}

const STORAGE_KEY = 'aura-user-memory';

export const loadUserMemory = (): UserMemory => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load memory:', e);
  }
  
  return {
    userId: 'default',
    memories: [],
    preferences: {},
    aestheticPreferences: {
      selfieHistory: [],
      characterHistory: [],
      favoriteKeywords: [],
    },
    emotionalTrends: []
  };
};

export const saveUserMemory = (memory: UserMemory): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error('Failed to save memory:', e);
  }
};

export const addMemory = (
  memory: UserMemory,
  content: string,
  type: Memory['type'],
  importance: number = 5,
  tags: string[] = []
): UserMemory => {
  const newMemory: Memory = {
    id: Date.now().toString(),
    timestamp: new Date(),
    type,
    content,
    importance,
    tags
  };
  
  const updated = {
    ...memory,
    memories: [...memory.memories, newMemory].slice(-500) // Keep last 500 memories
  };
  
  saveUserMemory(updated);
  return updated;
};

export const getRelevantMemories = (
  memory: UserMemory,
  currentContext: string,
  maxItems: number = 5
): Memory[] => {
  // Simple relevance scoring based on tags and recency
  const scored = memory.memories.map(m => {
    let score = 0;
    
    // Recency boost (last 7 days get bonus)
    const daysAgo = (Date.now() - new Date(m.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 7) score += 10;
    else if (daysAgo < 30) score += 5;
    
    // Importance
    score += m.importance;
    
    // Tag matching
    const contextLower = currentContext.toLowerCase();
    m.tags.forEach(tag => {
      if (contextLower.includes(tag.toLowerCase())) {
        score += 3;
      }
    });
    
    // Type boost (preferences are important)
    if (m.type === 'preference') score += 5;
    if (m.type === 'emotion') score += 3;
    
    return { memory: m, score };
  });
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map(s => s.memory);
};

export const extractMemoryFromConversation = async (
  messages: { role: string; content: string }[]
): Promise<Partial<Memory>[]> => {
  // Simple memory extraction - in production, use an LLM
  const memories: Partial<Memory>[] = [];
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      
      // Detect preferences
      if (content.includes('我喜欢') || content.includes('我喜欢')) {
        memories.push({
          type: 'preference',
          content: msg.content,
          importance: 6,
          tags: ['preference']
        });
      }
      
      // Detect emotions
      if (content.includes('开心') || content.includes('难过') || content.includes('生气')) {
        memories.push({
          type: 'emotion',
          content: msg.content,
          importance: 7,
          tags: ['emotion', 'feeling']
        });
      }
      
      // Detect events
      if (content.includes('今天') || content.includes('昨天') || content.includes('明天')) {
        memories.push({
          type: 'event',
          content: msg.content,
          importance: 5,
          tags: ['event', 'schedule']
        });
      }
    }
  }
  
  return memories;
};

// 保存自拍偏好
export const saveSelfiePreference = (
  memory: UserMemory,
  prompt: string,
  style: 'anime' | 'realistic' | 'mixed',
  options?: { mood?: string; outfit?: string; setting?: string }
): UserMemory => {
  const newPref: SelfiePreference = {
    id: Date.now().toString(),
    timestamp: new Date(),
    prompt,
    style,
    mood: options?.mood,
    outfit: options?.outfit,
    setting: options?.setting,
    点赞数: 0,
    usedCount: 1
  };
  
  const updated = {
    ...memory,
    aestheticPreferences: {
      ...memory.aestheticPreferences,
      selfieHistory: [...(memory.aestheticPreferences?.selfieHistory || []), newPref].slice(-100) // 保留最近100条
    }
  };
  
  saveUserMemory(updated);
  console.log('[Memory] Saved selfie preference:', prompt.substring(0, 50));
  return updated;
};

// 获取最相关的自拍提示词
export const getBestSelfiePrompt = (
  memory: UserMemory,
  style?: 'anime' | 'realistic',
  userRequest?: string
): string | null => {
  const history = memory.aestheticPreferences?.selfieHistory || [];
  if (history.length === 0) return null;
  
  // 过滤匹配风格的历史
  let filtered = history;
  if (style) {
    filtered = history.filter(h => h.style === style || h.style === 'mixed');
  }
  
  if (filtered.length === 0) return null;
  
  // 按使用次数和最近使用排序
  const sorted = filtered.sort((a, b) => {
    const scoreA = a.点赞数 * 2 + a.usedCount + (Date.now() - new Date(a.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 ? 10 : 0);
    const scoreB = b.点赞数 * 2 + b.usedCount + (Date.now() - new Date(b.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 ? 10 : 0);
    return scoreB - scoreA;
  });
  
  // 取前3个最相关的prompt
  const topPrompts = sorted.slice(0, 3).map(h => h.prompt);
  
  // 融合prompt - 提取共同关键词
  const keywords = extractKeywords(topPrompts.join(' '));
  
  // 如果有用户当前请求，结合历史偏好
  if (userRequest) {
    return `${userRequest}, ${keywords.join(', ')}`;
  }
  
  // 否则使用历史中最常用的基础描述
  return sorted[0].prompt;
};

// 从提示词中提取关键词
const extractKeywords = (text: string): string[] => {
  // 常见的审美关键词
  const aestheticKeywords = [
    'beautiful', 'cute', 'sexy', 'elegant', 'natural', 'glamorous',
    'smile', 'smiling', 'looking at camera', 'portrait', 'selfie',
    'long hair', 'short hair', 'blonde', 'brunette', 'black hair',
    'blue eyes', 'green eyes', 'brown eyes',
    'sunny', 'golden hour', 'soft lighting', 'natural light',
    'beach', 'bedroom', 'outdoor', 'indoor',
    'casual', 'formal', 'sexy', 'elegant',
    'smiling', 'serious', 'playful', 'flirty'
  ];
  
  const textLower = text.toLowerCase();
  const found = aestheticKeywords.filter(kw => textLower.includes(kw.toLowerCase()));
  
  // 如果没有找到预设关键词，提取形容词
  if (found.length === 0) {
    const words = text.split(/[\s,.\-]+/).filter(w => w.length > 3);
    return words.slice(0, 5);
  }
  
  return found.slice(0, 5);
};

// 保存角色设定偏好
export const saveCharacterPreference = (
  memory: UserMemory,
  avatarId: string,
  prompt: string,
  customization: any
): UserMemory => {
  const existing = memory.aestheticPreferences?.characterHistory?.find(c => c.avatarId === avatarId);
  
  let updatedHistory: CharacterPreference[];
  
  if (existing) {
    // 更新现有记录
    updatedHistory = memory.aestheticPreferences.characterHistory.map(c => 
      c.avatarId === avatarId 
        ? { ...c, usedCount: c.usedCount + 1, prompt, customization, timestamp: new Date() }
        : c
    );
  } else {
    // 创建新记录
    const newPref: CharacterPreference = {
      id: Date.now().toString(),
      avatarId,
      timestamp: new Date(),
      prompt,
      customization,
      usedCount: 1
    };
    updatedHistory = [...(memory.aestheticPreferences?.characterHistory || []), newPref];
  }
  
  const updated = {
    ...memory,
    aestheticPreferences: {
      ...memory.aestheticPreferences,
      characterHistory: updatedHistory.slice(-50) // 保留最近50个角色设定
    }
  };
  
  saveUserMemory(updated);
  console.log('[Memory] Saved character preference for:', avatarId);
  return updated;
};

// 获取角色的历史设定
export const getCharacterPreference = (
  memory: UserMemory,
  avatarId: string
): CharacterPreference | null => {
  return memory.aestheticPreferences?.characterHistory?.find(c => c.avatarId === avatarId) || null;
};

export const generateMemoryContext = (memory: UserMemory): string => {
  if (memory.memories.length === 0 && !memory.aestheticPreferences) return '';
  
  const recentMemories = memory.memories.slice(-20);
  const importantMemories = memory.memories.filter(m => m.importance >= 7);
  
  let context = '\n\n[USER MEMORY CONTEXT]:\n';
  
  if (memory.preferences.name) {
    context += `User's name: ${memory.preferences.name}\n`;
  }
  
  if (memory.preferences.interests && memory.preferences.interests.length > 0) {
    context += `Interests: ${memory.preferences.interests.join(', ')}\n`;
  }
  
  if (memory.preferences.language) {
    context += `Preferred language: ${memory.preferences.language}\n`;
  }
  
  // 审美偏好上下文
  const aestheticPrefs = memory.aestheticPreferences;
  if (aestheticPrefs) {
    if (aestheticPrefs.preferredStyle) {
      context += `\nPreferred image style: ${aestheticPrefs.preferredStyle}\n`;
    }
    
    if (aestheticPrefs.favoriteKeywords && aestheticPrefs.favoriteKeywords.length > 0) {
      context += `Favorite keywords: ${aestheticPrefs.favoriteKeywords.join(', ')}\n`;
    }
    
    if (aestheticPrefs.selfieHistory && aestheticPrefs.selfieHistory.length > 0) {
      const recentSelfies = aestheticPrefs.selfieHistory.slice(-5);
      context += '\nRecent selfie preferences:\n';
      recentSelfies.forEach(s => {
        context += `- [${s.style}] ${s.prompt.substring(0, 80)}${s.prompt.length > 80 ? '...' : ''}\n`;
      });
    }
  }
  
  if (importantMemories.length > 0) {
    context += '\nImportant memories:\n';
    importantMemories.slice(-5).forEach(m => {
      context += `- ${m.content}\n`;
    });
  }
  
  if (recentMemories.length > 0) {
    context += '\nRecent memories:\n';
    recentMemories.slice(-3).forEach(m => {
      context += `- ${m.content}\n`;
    });
  }
  
  context += '\nUse these memories to personalize your responses and remember user preferences.\n';
  
  return context;
};

export interface Memory {
  id: string;
  timestamp: Date;
  type: 'preference' | 'conversation' | 'emotion' | 'event' | 'fact';
  content: string;
  importance: number; // 1-10
  tags: string[];
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

export const generateMemoryContext = (memory: UserMemory): string => {
  if (memory.memories.length === 0) return '';
  
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

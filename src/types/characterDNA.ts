/**
 * Character Visual DNA System
 * 
 * 保存角色的视觉"基因"，确保所有生成的图片/视频都基于同一个角色
 */

export interface CharacterDNA {
  // 角色ID
  characterId: string;
  
  // 基准脸 - 创建时生成的高质量正面照
  baseFaceUrl: string;
  
  // 脸部特征描述 (用于prompt拼接)
  faceDescription: string;
  
  // 身体特征描述
  bodyDescription: string;
  
  // 风格偏好
  style: 'anime' | 'realistic';
  
  // 生成参数 (用于保持一致性)
  generationParams: {
    seed?: number;
    modelId: string;
    cfgScale: number;
  };
  
  // 创建时间
  createdAt: Date;
  
  // 更新时间
  updatedAt: Date;
}

/**
 * 预设场景模板
 */
export interface SceneTemplate {
  id: string;
  name: string;
  emoji: string;
  category: 'casual' | 'intimate' | 'sensual' | 'romantic';
  
  // 场景描述 (会与角色DNA融合)
  scenePrompt: string;
  
  // 额外参数
  params?: {
    pose?: string;
    clothing?: string;
    expression?: string;
    lighting?: string;
  };
}

/**
 * 10个预设场景
 */
export const SCENE_TEMPLATES: SceneTemplate[] = [
  // Casual - 日常
  {
    id: 'selfie-morning',
    name: '早安自拍',
    emoji: '🌅',
    category: 'casual',
    scenePrompt: 'waking up in bed, messy hair, soft morning light, sleepy eyes, wearing pajamas',
    params: { expression: 'sleepy, gentle smile' }
  },
  {
    id: 'selfie-mirror',
    name: '镜子自拍',
    emoji: '🪞',
    category: 'casual',
    scenePrompt: 'taking a mirror selfie, confident pose, bedroom background',
    params: { pose: 'standing, one hand holding phone' }
  },
  {
    id: 'outfit-check',
    name: '穿搭展示',
    emoji: '👗',
    category: 'casual',
    scenePrompt: 'outfit of the day, full body shot, stylish clothing, fashion pose',
    params: { clothing: 'trendy outfit' }
  },
  
  // Intimate - 亲密
  {
    id: 'bath-time',
    name: '沐浴时光',
    emoji: '🛁',
    category: 'intimate',
    scenePrompt: 'in the bathtub, bubbles, steam, relaxed expression, wet hair, shoulders visible',
    params: { lighting: 'soft, warm' }
  },
  {
    id: 'bedtime',
    name: '睡衣诱惑',
    emoji: '🌙',
    category: 'intimate',
    scenePrompt: 'in bedroom, silky nightwear, lying on bed, seductive look, dim lighting',
    params: { clothing: 'silk nightwear' }
  },
  
  // Sensual - 性感
  {
    id: 'lingerie',
    name: '内衣写真',
    emoji: '💋',
    category: 'sensual',
    scenePrompt: 'lingerie photoshoot, confident pose, professional lighting, alluring expression',
    params: { clothing: 'lace lingerie', pose: 'seductive' }
  },
  {
    id: 'shower',
    name: '浴室水雾',
    emoji: '🚿',
    category: 'sensual',
    scenePrompt: 'in the shower, water droplets, wet skin, sensual expression, steamy atmosphere',
    params: { lighting: 'dramatic, backlit' }
  },
  {
    id: 'dance',
    name: '私人舞蹈',
    emoji: '💃',
    category: 'sensual',
    scenePrompt: 'dancing sensually, dynamic pose, stage lighting, confident expression',
    params: { pose: 'dynamic, movement' }
  },
  
  // Romantic - 浪漫
  {
    id: 'date-night',
    name: '约会之夜',
    emoji: '🍷',
    category: 'romantic',
    scenePrompt: 'elegant dinner date, candlelight, wearing dress, romantic atmosphere, wine glass',
    params: { clothing: 'elegant dress', lighting: 'candlelight' }
  },
  {
    id: 'love-letter',
    name: '写情书',
    emoji: '💌',
    category: 'romantic',
    scenePrompt: 'writing a love letter, intimate moment, soft expression, holding pen, paper',
    params: { expression: 'loving, thoughtful' }
  }
];

/**
 * 场景分类颜色
 */
export const CATEGORY_COLORS: Record<SceneTemplate['category'], string> = {
  casual: 'from-blue-500 to-cyan-500',
  intimate: 'from-purple-500 to-pink-500',
  sensual: 'from-red-500 to-orange-500',
  romantic: 'from-pink-500 to-rose-500'
};

/**
 * 场景分类名称
 */
export const CATEGORY_NAMES: Record<SceneTemplate['category'], string> = {
  casual: '日常',
  intimate: '亲密',
  sensual: '性感',
  romantic: '浪漫'
};

/**
 * 从 AvatarCustomization 创建 CharacterDNA
 */
export function createDNAFromAvatar(
  characterId: string,
  baseFaceUrl: string,
  faceDescription: string,
  bodyDescription: string,
  style: 'anime' | 'realistic',
  modelId: string = 'anything-v5'
): CharacterDNA {
  return {
    characterId,
    baseFaceUrl,
    faceDescription,
    bodyDescription,
    style,
    generationParams: {
      modelId,
      cfgScale: 7.5
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * 生成基于DNA的prompt
 */
export function generateDNAPrompt(dna: CharacterDNA, scene: SceneTemplate): string {
  // 基础角色描述
  const characterBase = dna.baseFaceUrl 
    ? `same person as in the reference image, identical face, ` 
    : '';
  
  // 完整prompt
  const prompt = [
    characterBase + dna.faceDescription,
    dna.bodyDescription,
    scene.scenePrompt,
    scene.params?.pose ? scene.params.pose : '',
    scene.params?.clothing ? scene.params.clothing : '',
    scene.params?.expression ? scene.params.expression : '',
    scene.params?.lighting ? scene.params.lighting : '',
    'high quality, detailed, professional photography'
  ].filter(Boolean).join(', ');
  
  return prompt;
}

/**
 * 存储和获取DNA
 */
const DNA_STORAGE_KEY = 'aura-character-dna';

export function saveCharacterDNA(dna: CharacterDNA): void {
  try {
    const stored = localStorage.getItem(DNA_STORAGE_KEY);
    const dnaMap: Record<string, CharacterDNA> = stored ? JSON.parse(stored) : {};
    dnaMap[dna.characterId] = dna;
    localStorage.setItem(DNA_STORAGE_KEY, JSON.stringify(dnaMap));
  } catch (e) {
    console.error('Failed to save CharacterDNA:', e);
  }
}

export function getCharacterDNA(characterId: string): CharacterDNA | null {
  try {
    const stored = localStorage.getItem(DNA_STORAGE_KEY);
    if (!stored) return null;
    const dnaMap: Record<string, CharacterDNA> = JSON.parse(stored);
    return dnaMap[characterId] || null;
  } catch (e) {
    console.error('Failed to get CharacterDNA:', e);
    return null;
  }
}

export function getAllCharacterDNAs(): CharacterDNA[] {
  try {
    const stored = localStorage.getItem(DNA_STORAGE_KEY);
    if (!stored) return [];
    const dnaMap: Record<string, CharacterDNA> = JSON.parse(stored);
    return Object.values(dnaMap);
  } catch (e) {
    console.error('Failed to get all CharacterDNAs:', e);
    return [];
  }
}

export interface AvatarCustomization {
  // 基本信息
  name: string;
  gender: 'female' | 'male';
  
  // 面容特征
  face: {
    shape: 'oval' | 'round' | 'square' | 'heart' | 'diamond';
    skinTone: 'fair' | 'light' | 'medium' | 'tan' | 'dark';
    eyeColor: 'brown' | 'blue' | 'green' | 'hazel' | 'amber' | 'gray';
    eyeShape: 'almond' | 'round' | 'hooded' | 'monolid' | 'upturned' | 'downturned';
    noseShape: 'button' | 'straight' | 'roman' | 'snub' | 'hawk';
    lipShape: 'full' | 'thin' | 'heart' | 'bow' | 'wide';
    lipColor: 'natural' | 'pink' | 'red' | 'nude' | 'berry';
    hairColor: 'black' | 'brown' | 'blonde' | 'red' | 'auburn' | 'gray' | 'white' | 'pink' | 'blue' | 'purple';
    hairStyle: 'long' | 'short' | 'medium' | 'ponytail' | 'bun' | 'braids' | 'curly' | 'wavy' | 'straight' | 'pixie' | 'bob';
    hairLength: 'very-short' | 'short' | 'medium' | 'long' | 'very-long';
    eyebrowStyle: 'thin' | 'thick' | 'arched' | 'straight' | 'rounded';
    makeup: 'none' | 'natural' | 'glam' | 'smoky' | 'bold' | 'gothic';
  };
  
  // 身材特征
  body: {
    height: 'petite' | 'short' | 'average' | 'tall' | 'very-tall';
    bodyType: 'slim' | 'athletic' | 'average' | 'curvy' | 'voluptuous' | 'muscular';
    breastSize: 'flat' | 'small' | 'medium' | 'large' | 'very-large';
    waistSize: 'very-small' | 'small' | 'medium' | 'large';
    hipSize: 'narrow' | 'medium' | 'wide' | 'very-wide';
    buttSize: 'flat' | 'small' | 'medium' | 'large' | 'very-large';
    skinTexture: 'smooth' | 'freckled' | 'tanned' | 'glowing';
    tattoos: boolean;
    piercings: boolean;
  };
  
  // 性格特征
  personality: {
    type: 'shy' | 'confident' | 'playful' | 'dominant' | 'submissive' | 'mysterious' | 'caring' | 'wild';
    traits: string[];
    voice: 'soft' | 'sweet' | 'sultry' | 'deep' | 'playful' | 'mature';
  };
  
  // 服装偏好 (初始状态)
  clothing: {
    style: 'lingerie' | 'nude' | 'casual' | 'elegant' | 'sporty' | 'none';
    color: string;
  };
  
  // 恋物癖/偏好
  preferences: {
    kinks: string[];
    limits: string[];
    favoritePositions: string[];
  };
}

export const DEFAULT_AVATAR_CUSTOMIZATION: AvatarCustomization = {
  name: '',
  gender: 'female',
  face: {
    shape: 'oval',
    skinTone: 'fair',
    eyeColor: 'brown',
    eyeShape: 'almond',
    noseShape: 'button',
    lipShape: 'full',
    lipColor: 'natural',
    hairColor: 'black',
    hairStyle: 'long',
    hairLength: 'long',
    eyebrowStyle: 'thin',
    makeup: 'natural',
  },
  body: {
    height: 'average',
    bodyType: 'curvy',
    breastSize: 'medium',
    waistSize: 'small',
    hipSize: 'medium',
    buttSize: 'medium',
    skinTexture: 'smooth',
    tattoos: false,
    piercings: false,
  },
  personality: {
    type: 'confident',
    traits: ['flirty', 'affectionate', 'playful'],
    voice: 'sweet',
  },
  clothing: {
    style: 'nude',
    color: 'black',
  },
  preferences: {
    kinks: [],
    limits: [],
    favoritePositions: [],
  },
};

// 面容选项
export const FACE_OPTIONS = {
  shape: [
    { value: 'oval', label: '椭圆脸', description: '优雅经典' },
    { value: 'round', label: '圆脸', description: '可爱甜美' },
    { value: 'square', label: '方脸', description: '坚强自信' },
    { value: 'heart', label: '心形脸', description: '精致迷人' },
    { value: 'diamond', label: '钻石脸', description: '独特时尚' },
  ],
  skinTone: [
    { value: 'fair', label: '白皙', color: '#FDEBD3' },
    { value: 'light', label: '浅色', color: '#F5D5C8' },
    { value: 'medium', label: '中等', color: '#D2A679' },
    { value: 'tan', label: '小麦色', color: '#C68642' },
    { value: 'dark', label: '深色', color: '#8D5524' },
  ],
  eyeColor: [
    { value: 'brown', label: '棕色', color: '#5C4033' },
    { value: 'blue', label: '蓝色', color: '#4A90D9' },
    { value: 'green', label: '绿色', color: '#4CAF50' },
    { value: 'hazel', label: '淡褐色', color: '#8E7618' },
    { value: 'amber', label: '琥珀色', color: '#FFBF00' },
    { value: 'gray', label: '灰色', color: '#808080' },
  ],
  hairColor: [
    { value: 'black', label: '黑色', color: '#0D0D0D' },
    { value: 'brown', label: '棕色', color: '#5C4033' },
    { value: 'blonde', label: '金色', color: '#E3BC66' },
    { value: 'red', label: '红色', color: '#B5473B' },
    { value: 'auburn', label: '赤褐色', color: '#922724' },
    { value: 'pink', label: '粉色', color: '#FF69B4' },
    { value: 'blue', label: '蓝色', color: '#4169E1' },
    { value: 'purple', label: '紫色', color: '#9370DB' },
  ],
  hairStyle: [
    { value: 'long', label: '长发' },
    { value: 'short', label: '短发' },
    { value: 'medium', label: '中长发' },
    { value: 'ponytail', label: '马尾' },
    { value: 'bun', label: '发髻' },
    { value: 'braids', label: '辫子' },
    { value: 'curly', label: '卷发' },
    { value: 'wavy', label: '波浪发' },
    { value: 'straight', label: '直发' },
    { value: 'pixie', label: '精灵短发' },
    { value: 'bob', label: '波波头' },
  ],
  makeup: [
    { value: 'none', label: '素颜' },
    { value: 'natural', label: '自然妆' },
    { value: 'glam', label: '华丽妆' },
    { value: 'smoky', label: '烟熏妆' },
    { value: 'bold', label: '大胆妆' },
    { value: 'gothic', label: '哥特妆' },
  ],
};

// 身材选项
export const BODY_OPTIONS = {
  bodyType: [
    { value: 'slim', label: '苗条', icon: '🧘' },
    { value: 'athletic', label: '运动型', icon: '💪' },
    { value: 'average', label: '匀称', icon: '👤' },
    { value: 'curvy', label: '曲线型', icon: '💃' },
    { value: 'voluptuous', label: '丰满', icon: '🔥' },
    { value: 'muscular', label: '健美', icon: '🏋️' },
  ],
  breastSize: [
    { value: 'flat', label: '平坦' },
    { value: 'small', label: '小巧' },
    { value: 'medium', label: '适中' },
    { value: 'large', label: '丰满' },
    { value: 'very-large', label: '非常丰满' },
  ],
  hipSize: [
    { value: 'narrow', label: '窄' },
    { value: 'medium', label: '适中' },
    { value: 'wide', label: '宽' },
    { value: 'very-wide', label: '非常宽' },
  ],
  buttSize: [
    { value: 'flat', label: '平坦' },
    { value: 'small', label: '小巧' },
    { value: 'medium', label: '适中' },
    { value: 'large', label: '丰满' },
    { value: 'very-large', label: '非常丰满' },
  ],
  skinTexture: [
    { value: 'smooth', label: '光滑' },
    { value: 'freckled', label: '雀斑' },
    { value: 'tanned', label: '古铜色' },
    { value: 'glowing', label: '光泽' },
  ],
};

// 性格选项
export const PERSONALITY_OPTIONS = {
  type: [
    { value: 'shy', label: '害羞', description: '温柔内向' },
    { value: 'confident', label: '自信', description: '大方迷人' },
    { value: 'playful', label: '活泼', description: '调皮可爱' },
    { value: 'dominant', label: '强势', description: '掌控一切' },
    { value: 'submissive', label: '顺从', description: '温柔服从' },
    { value: 'mysterious', label: '神秘', description: '高冷优雅' },
    { value: 'caring', label: '体贴', description: '温暖关怀' },
    { value: 'wild', label: '狂野', description: '热情奔放' },
  ],
  voice: [
    { value: 'soft', label: '温柔' },
    { value: 'sweet', label: '甜美' },
    { value: 'sultry', label: '性感' },
    { value: 'deep', label: '低沉' },
    { value: 'playful', label: '活泼' },
    { value: 'mature', label: '成熟' },
  ],
};

// 恋物癖选项
export const KINK_OPTIONS = [
  '温柔做爱', '粗暴性爱', '口交', '乳交', '肛交',
  '角色扮演', '制服诱惑', 'BDSM', '束缚', '支配',
  '被支配', '足恋', '丝袜', '高跟鞋', '内衣',
  '裸体', '自慰', '高潮控制', '潮吹', '群交',
  '双飞', '三P', '换妻', '野外', '公开场合',
];

// 生成角色描述prompt
export function generateAvatarPrompt(customization: AvatarCustomization): string {
  const { face, body, personality, clothing } = customization;
  
  const faceDesc = [
    `${face.shape} face`,
    `${face.skinTone} skin`,
    `${face.eyeColor} ${face.eyeShape} eyes`,
    `${face.noseShape} nose`,
    `${face.lipShape} lips`,
    `${face.hairColor} ${face.hairStyle} ${face.hairLength} hair`,
    face.makeup !== 'none' ? `${face.makeup} makeup` : '',
  ].filter(Boolean).join(', ');
  
  const bodyDesc = [
    `${body.height} height`,
    `${body.bodyType} body`,
    `${body.breastSize} breasts`,
    `${body.waistSize} waist`,
    `${body.hipSize} hips`,
    `${body.buttSize} butt`,
    body.skinTexture !== 'smooth' ? `${body.skinTexture} skin` : '',
    body.tattoos ? 'with tattoos' : '',
    body.piercings ? 'with piercings' : '',
  ].filter(Boolean).join(', ');
  
  const clothingDesc = clothing.style === 'nude' 
    ? 'completely naked, nude' 
    : `wearing ${clothing.style} ${clothing.color}`;
  
  return `A beautiful ${customization.gender} named ${customization.name}, ${faceDesc}, ${bodyDesc}, ${clothingDesc}, ${personality.type} personality, looking at camera, high quality portrait`;
}

// 生成NSFW角色描述prompt
export function generateNSFWAvatarPrompt(customization: AvatarCustomization): string {
  const { face, body, personality } = customization;
  
  const faceDesc = [
    `${face.shape} face`,
    `${face.skinTone} skin`,
    `${face.eyeColor} ${face.eyeShape} eyes`,
    `${face.lipShape} lips`,
    `${face.hairColor} ${face.hairStyle} hair`,
    face.makeup !== 'none' ? `${face.makeup} makeup` : '',
  ].filter(Boolean).join(', ');
  
  const bodyDesc = [
    `${body.bodyType} body`,
    `${body.breastSize} breasts`,
    `${body.waistSize} waist`,
    `${body.hipSize} hips`,
    `${body.buttSize} butt`,
    body.skinTexture !== 'smooth' ? `${body.skinTexture} skin` : '',
  ].filter(Boolean).join(', ');
  
  return `A beautiful naked ${customization.gender} named ${customization.name}, ${faceDesc}, ${bodyDesc}, completely nude, full body shot, showing all details, erotic photography, soft lighting, intimate atmosphere, ${personality.type} personality, looking at camera, high quality, 8K`;
}

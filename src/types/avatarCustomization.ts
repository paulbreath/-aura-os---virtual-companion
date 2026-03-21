export interface AvatarCustomization {
  // 基本信息
  name: string;
  gender: 'female' | 'male';
  style: 'realistic' | 'anime';  // 真人/动漫风格
  customPrompt: string;  // 用户自定义描述
  
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
  
  // 角色动作设定
  actions: {
    pose: string;  // 主要姿势/动作
    intensity: 'gentle' | 'normal' | 'intense' | 'wild';  // 动作强度
    scene: string;  // 场景设定
  };
}

export const DEFAULT_AVATAR_CUSTOMIZATION: AvatarCustomization = {
  name: '',
  gender: 'female',
  style: 'realistic',
  customPrompt: '',
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
  
  actions: {
    pose: 'standing',
    intensity: 'normal',
    scene: 'bedroom',
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

// 角色动作选项
export const ACTION_OPTIONS = {
  pose: [
    { value: 'standing', label: '站立', description: '优雅站立姿势' },
    { value: 'sitting', label: '坐着', description: '坐姿展示' },
    { value: 'lying', label: '躺着', description: '躺卧姿势' },
    { value: 'kneeling', label: '跪着', description: '跪姿' },
    { value: 'doggy_style', label: '后入', description: '后入式姿势' },
    { value: 'missionary', label: '传教士', description: '传统姿势' },
    { value: 'riding', label: '女上位', description: '骑乘姿势' },
    { value: 'blowjob', label: '口交', description: '口交姿势' },
    { value: 'handjob', label: '手交', description: '用手服务' },
    { value: 'self_pleasure', label: '自慰', description: '自我愉悦' },
    { value: 'fucking_machine', label: '自慰机', description: '使用自慰器具' },
    { value: 'bondage', label: '束缚', description: 'BDSM束缚姿势' },
    { value: 'spread_legs', label: '张开双腿', description: '展示姿势' },
    { value: 'bending_over', label: '弯腰', description: '弯腰展示' },
    { value: '69', label: '69式', description: '互相对口' },
    { value: 'facesitting', label: '坐脸', description: '骑脸姿势' },
    { value: 'analingus', label: '舔菊', description: '肛交前戏' },
    { value: 'titfuck', label: '乳交', description: '胸部服务' },
    { value: 'footjob', label: '足交', description: '用脚服务' },
    { value: 'spooning', label: '侧入', description: '勺子姿势' },
  ],
  intensity: [
    { value: 'gentle', label: '温柔', description: '轻柔缓慢' },
    { value: 'normal', label: '正常', description: '中等强度' },
    { value: 'intense', label: '激烈', description: '强烈快速' },
    { value: 'wild', label: '狂野', description: '狂野奔放' },
  ],
  scene: [
    { value: 'bedroom', label: '卧室', description: '私密卧室' },
    { value: 'living_room', label: '客厅', description: '家庭客厅' },
    { value: 'bathroom', label: '浴室', description: '浴室场景' },
    { value: 'office', label: '办公室', description: '工作场所' },
    { value: 'outdoor', label: '户外', description: '户外场景' },
    { value: 'hotel', label: '酒店', description: '酒店房间' },
    { value: 'dungeon', label: '调教室', description: 'BDSM场景' },
    { value: 'strip_club', label: '脱衣舞俱乐部', description: '娱乐场所' },
    { value: 'jacuzzi', label: '按摩浴缸', description: '水疗场景' },
    { value: 'beach', label: '海滩', description: '海边场景' },
    { value: 'car', label: '车内', description: '车震场景' },
    { value: 'classroom', label: '教室', description: '校园场景' },
    { value: 'changing_room', label: '更衣室', description: '更衣场景' },
    { value: 'public_toilet', label: '公共厕所', description: '偷情场景' },
    { value: 'rooftop', label: '天台', description: '屋顶场景' },
  ],
};

// 生成动作描述
export function generateActionPrompt(actions: AvatarCustomization['actions']): string {
  const poseOption = ACTION_OPTIONS.pose.find(p => p.value === actions.pose);
  const intensityOption = ACTION_OPTIONS.intensity.find(i => i.value === actions.intensity);
  const sceneOption = ACTION_OPTIONS.scene.find(s => s.value === actions.scene);
  
  const poseDesc = poseOption ? `${poseOption.label}姿势 (${poseOption.description})` : '';
  const intensityDesc = intensityOption ? `${intensityOption.label}强度` : '';
  const sceneDesc = sceneOption ? `${sceneOption.label}场景` : '';
  
  // 将动作值转换为英文描述用于提示词
  const poseEnglishMap: Record<string, string> = {
    'standing': 'standing pose',
    'sitting': 'sitting pose',
    'lying': 'lying down',
    'kneeling': 'kneeling pose',
    'doggy_style': 'doggy style position',
    'missionary': 'missionary position',
    'riding': 'riding on top',
    'blowjob': 'performing oral sex',
    'handjob': 'giving handjob',
    'self_pleasure': 'masturbating',
    'fucking_machine': 'using a fucking machine',
    'bondage': 'in bondage restraints',
    'spread_legs': 'spreading legs wide',
    'bending_over': 'bending over',
    '69': 'in 69 position',
    'facesitting': 'sitting on face',
    'analingus': 'receiving anilingus',
    'titfuck': 'titjob',
    'footjob': 'footjob',
    'spooning': 'spooning position',
  };
  
  const intensityEnglishMap: Record<string, string> = {
    'gentle': 'gentle, slow movements',
    'normal': 'normal pace',
    'intense': 'intense, passionate',
    'wild': 'wild, aggressive',
  };
  
  const sceneEnglishMap: Record<string, string> = {
    'bedroom': 'in a bedroom',
    'living_room': 'in a living room',
    'bathroom': 'in a bathroom',
    'office': 'in an office',
    'outdoor': 'outdoors',
    'hotel': 'in a hotel room',
    'dungeon': 'in a BDSM dungeon',
    'strip_club': 'in a strip club',
    'jacuzzi': 'in a jacuzzi',
    'beach': 'on a beach',
    'car': 'inside a car',
    'classroom': 'in a classroom',
    'changing_room': 'in a changing room',
    'public_toilet': 'in a public restroom',
    'rooftop': 'on a rooftop',
  };
  
  const poseEnglish = poseEnglishMap[actions.pose] || '';
  const intensityEnglish = intensityEnglishMap[actions.intensity] || '';
  const sceneEnglish = sceneEnglishMap[actions.scene] || '';
  
  return `${poseEnglish}, ${intensityEnglish}, ${sceneEnglish}`;
}

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
  const { face, body, personality, style, customPrompt, actions } = customization;
  
  // 风格前缀
  const stylePrefix = style === 'anime' 
    ? 'anime style, anime art, 2D anime, detailed anime illustration' 
    : 'photorealistic, hyperrealistic, real photo, professional photography';
  
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
  ].filter(Boolean).join(', ');
  
  // 生成动作描述
  const actionDesc = generateActionPrompt(actions);
  
  const basePrompt = `A beautiful naked ${customization.gender} named ${customization.name}, ${faceDesc}, ${bodyDesc}, completely nude, full body shot, showing all details, ${actionDesc}, erotic photography, soft lighting, intimate atmosphere, ${personality.type} personality, high quality, 8K`;
  
  // 添加自定义描述
  const customDesc = customPrompt ? `, ${customPrompt}` : '';
  
  return `${stylePrefix}, ${basePrompt}${customDesc}`;
}

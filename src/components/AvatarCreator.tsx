import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Palette, 
  Sparkles, 
  Heart, 
  Camera,
  ChevronRight,
  ChevronLeft,
  Check,
  RefreshCw,
  Wand2,
  Star,
  Zap
} from 'lucide-react';
import {
  AvatarCustomization,
  DEFAULT_AVATAR_CUSTOMIZATION,
  FACE_OPTIONS,
  BODY_OPTIONS,
  PERSONALITY_OPTIONS,
  KINK_OPTIONS,
  ACTION_OPTIONS,
  generateAvatarPrompt,
  generateNSFWAvatarPrompt,
} from '../types/avatarCustomization';

interface AvatarCreatorProps {
  onComplete: (customization: AvatarCustomization, avatarUrl: string, backgroundUrl: string) => void;
  onCancel: () => void;
}

// 图像生成模型配置
const IMAGE_MODELS = [
  // ModelsLab 模型
  { id: 'realistic-blend-sdxl-v2-0', name: '⭐ Realistic Blend (推荐)', desc: '写实风格，即时生成', provider: 'modelslab', nsfw: true },
  { id: 'anime-diffusion', name: '⭐ Anime Diffusion', desc: '动漫风格，即时生成', provider: 'modelslab', nsfw: true },
  { id: 'anything-v3', name: 'Anything V3', desc: '动漫风格，即时生成', provider: 'modelslab', nsfw: true },
  { id: 'waifu-diffusion', name: 'Waifu Diffusion', desc: '动漫风格，异步生成', provider: 'modelslab', nsfw: true },
  { id: 'anything-v5', name: 'Anything V5', desc: '动漫风格，异步生成', provider: 'modelslab', nsfw: true },
  { id: 'nsfw', name: 'NSFW', desc: '写实成人模型，异步生成', provider: 'modelslab', nsfw: true },
  // X.AI Grok Imagine
  { id: 'grok-imagine-image', name: '🌟 Grok Imagine', desc: 'X.AI 生成，高质量写实', provider: 'xai', nsfw: false },
];

export default function AvatarCreator({ onComplete, onCancel }: AvatarCreatorProps) {
  const [step, setStep] = useState(0);
  const [customization, setCustomization] = useState<AvatarCustomization>(DEFAULT_AVATAR_CUSTOMIZATION);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('realistic-blend-sdxl-v2-0');

  const steps = [
    { title: '基本信息', subtitle: '给她取个名字', icon: User, color: 'from-pink-500 to-rose-500' },
    { title: '面容特征', subtitle: '定义她的外貌', icon: Palette, color: 'from-purple-500 to-pink-500' },
    { title: '身材特征', subtitle: '选择她的身材', icon: Sparkles, color: 'from-violet-500 to-purple-500' },
    { title: '性格设定', subtitle: '设定她的性格', icon: Heart, color: 'from-rose-500 to-orange-500' },
    { title: '动作设定', subtitle: '选择她的动作', icon: Zap, color: 'from-red-500 to-pink-500' },
    { title: '生成角色', subtitle: 'AI 生成形象', icon: Camera, color: 'from-amber-500 to-pink-500' },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const prompt = generateNSFWAvatarPrompt(customization);
      console.log('Generating avatar with prompt:', prompt);
      
      // 获取选中的模型配置
      const modelConfig = IMAGE_MODELS.find(m => m.id === selectedModel);
      if (!modelConfig) {
        alert('请选择一个模型');
        setIsGenerating(false);
        return;
      }
      
      let response: Response;
      let data: any;
      
      if (modelConfig.provider === 'xai') {
        // 使用 X.AI Grok Imagine API
        console.log('[X.AI] Using Grok Imagine...');
        response = await fetch('/api/xai/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            prompt: prompt,
          }),
        });
        data = await response.json();
        console.log('[X.AI] API Response:', data);
        
        if (data.status === 'success' && data.output?.[0]) {
          console.log('[X.AI] ✅ Got image:', data.output[0]);
          setGeneratedImage(data.output[0]);
          return; // 成功，直接返回
        } else {
          // X.AI 失败，自动回退到 ModelsLab
          console.log('[X.AI] ❌ Failed:', data.message, '- Falling back to ModelsLab...');
        }
      } 
      
      // ModelsLab (X.AI失败时的回退，或者直接选择ModelsLab)
      {
        // 根据角色风格选择合适的ModelsLab模型
        const fallbackModel = customization.style === 'anime' ? 'anything-v5' : 'realistic-blend-sdxl-v2-0';
        const modelsLabModel = modelConfig.provider === 'xai' ? fallbackModel : selectedModel;
        
        console.log(`[ModelsLab] Falling back to model: ${modelsLabModel} (style: ${customization.style})`);
        response = await fetch('/api/modelslab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_id: modelsLabModel,
            prompt: prompt,
            negative_prompt: 'child, underage, ugly, deformed, blurry, low quality, cartoon, 3d, painting, drawing, worst quality, low quality, watermark, text',
            width: 512,
            height: 768,
          }),
        });
        data = await response.json();
        console.log('[ModelsLab] API Response:', data);
        
        if (data.status === 'success') {
          const imageUrl = data.output?.[0] || data.future_links?.[0] || data.web_links?.[0];
          if (imageUrl) {
            console.log('[ModelsLab] ✅ Got image:', imageUrl);
            setGeneratedImage(imageUrl);
          } else if (data.images?.[0]) {
            console.log('[ModelsLab] ✅ Got base64 image');
            setGeneratedImage(`data:image/png;base64,${data.images[0]}`);
          } else {
            console.error('[ModelsLab] ❌ Success but no image:', data);
            alert('生成失败: 服务器返回成功但未提供图片');
          }
        } else if (data.status === 'error') {
          const errorMsg = data.message || data.messege || '未知错误';
          console.error('[ModelsLab] ❌ API Error:', errorMsg);
          alert('生成失败: ' + errorMsg);
        } else {
          console.error('[ModelsLab] ❌ Unknown response:', data);
          alert('未知响应: ' + JSON.stringify(data).substring(0, 200));
        }
      }
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      alert('生成失败: ' + (error instanceof Error ? error.message : '网络错误，请确保服务器正在运行'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (generatedImage) {
      // 使用同一个图片作为头像和背景
      // 背景可以用图片本身，头像也用同一个
      onComplete(customization, generatedImage, generatedImage);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: // 基本信息
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* 风格选择 */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">图片风格</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'realistic', label: '真人写实', emoji: '📷', desc: '照片级真实感' },
                  { value: 'anime', label: '动漫风格', emoji: '🎨', desc: '二次元动漫' }
                ].map((style) => (
                  <motion.button
                    key={style.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCustomization({ ...customization, style: style.value as any })}
                    className={`p-5 rounded-2xl border-2 transition-all ${
                      customization.style === style.value
                        ? 'border-pink-500 bg-gradient-to-br from-pink-500/20 to-purple-500/20'
                        : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-4xl block mb-2">{style.emoji}</span>
                    <p className="font-medium text-white">{style.label}</p>
                    <p className="text-xs text-zinc-400 mt-1">{style.desc}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">角色名称</label>
              <input
                type="text"
                value={customization.name}
                onChange={(e) => setCustomization({
                  ...customization,
                  name: e.target.value
                })}
                placeholder="给她取个名字..."
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">性别</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'female', label: '女性', emoji: '👩', desc: '温柔体贴' },
                  { value: 'male', label: '男性', emoji: '👨', desc: '阳光帅气' }
                ].map((gender) => (
                  <motion.button
                    key={gender.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCustomization({ ...customization, gender: gender.value as any })}
                    className={`p-5 rounded-2xl border-2 transition-all ${
                      customization.gender === gender.value
                        ? 'border-pink-500 bg-gradient-to-br from-pink-500/20 to-purple-500/20'
                        : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-4xl block mb-2">{gender.emoji}</span>
                    <p className="font-medium text-white">{gender.label}</p>
                    <p className="text-xs text-zinc-400 mt-1">{gender.desc}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 自定义描述 */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                自定义描述 <span className="text-zinc-500">(可选)</span>
              </label>
              <textarea
                value={customization.customPrompt}
                onChange={(e) => setCustomization({
                  ...customization,
                  customPrompt: e.target.value
                })}
                placeholder="描述你想要的特征，例如：戴眼镜、双马尾、猫耳、特定服装..."
                rows={3}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all resize-none"
              />
              <p className="text-xs text-zinc-500 mt-1">AI 会尽量根据你的描述生成角色</p>
            </div>
          </motion.div>
        );

      case 1: // 面容特征
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">脸型</label>
              <div className="grid grid-cols-4 gap-2">
                {FACE_OPTIONS.shape.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, shape: option.value as any }
                    })}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      customization.face.shape === option.value
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">肤色</label>
              <div className="flex gap-3 justify-center">
                {FACE_OPTIONS.skinTone.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, skinTone: option.value as any }
                    })}
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      customization.face.skinTone === option.value
                        ? 'border-pink-500 scale-110 shadow-lg shadow-pink-500/30'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: option.color }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">眼睛颜色</label>
              <div className="flex gap-3 justify-center">
                {FACE_OPTIONS.eyeColor.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, eyeColor: option.value as any }
                    })}
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      customization.face.eyeColor === option.value
                        ? 'border-pink-500 scale-110 shadow-lg shadow-pink-500/30'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: option.color }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">发色</label>
              <div className="flex gap-3 justify-center flex-wrap">
                {FACE_OPTIONS.hairColor.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, hairColor: option.value as any }
                    })}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${
                      customization.face.hairColor === option.value
                        ? 'border-pink-500 scale-110 shadow-lg shadow-pink-500/30'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: option.color }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">发型</label>
              <div className="grid grid-cols-4 gap-2">
                {FACE_OPTIONS.hairStyle.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, hairStyle: option.value as any }
                    })}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      customization.face.hairStyle === option.value
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">妆容风格</label>
              <div className="grid grid-cols-3 gap-2">
                {FACE_OPTIONS.makeup.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, makeup: option.value as any }
                    })}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      customization.face.makeup === option.value
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2: // 身材特征
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">体型</label>
              <div className="grid grid-cols-3 gap-3">
                {BODY_OPTIONS.bodyType.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCustomization({
                      ...customization,
                      body: { ...customization.body, bodyType: option.value as any }
                    })}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      customization.body.bodyType === option.value
                        ? 'border-pink-500 bg-gradient-to-br from-pink-500/20 to-purple-500/20'
                        : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-3xl block mb-2">{option.icon}</span>
                    <p className="text-sm font-medium text-white">{option.label}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">胸部大小</label>
              <div className="flex gap-2">
                {BODY_OPTIONS.breastSize.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      body: { ...customization.body, breastSize: option.value as any }
                    })}
                    className={`flex-1 py-3 rounded-xl border text-sm transition-all ${
                      customization.body.breastSize === option.value
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">臀部大小</label>
              <div className="flex gap-2">
                {BODY_OPTIONS.buttSize.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      body: { ...customization.body, buttSize: option.value as any }
                    })}
                    className={`flex-1 py-3 rounded-xl border text-sm transition-all ${
                      customization.body.buttSize === option.value
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">皮肤质感</label>
              <div className="grid grid-cols-2 gap-2">
                {BODY_OPTIONS.skinTexture.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      body: { ...customization.body, skinTexture: option.value as any }
                    })}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      customization.body.skinTexture === option.value
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-3 flex-1 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700 cursor-pointer hover:border-zinc-600 transition-all">
                <input
                  type="checkbox"
                  checked={customization.body.tattoos}
                  onChange={(e) => setCustomization({
                    ...customization,
                    body: { ...customization.body, tattoos: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm text-zinc-300">有纹身</span>
              </label>
              <label className="flex items-center gap-3 flex-1 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700 cursor-pointer hover:border-zinc-600 transition-all">
                <input
                  type="checkbox"
                  checked={customization.body.piercings}
                  onChange={(e) => setCustomization({
                    ...customization,
                    body: { ...customization.body, piercings: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm text-zinc-300">有穿孔</span>
              </label>
            </div>
          </motion.div>
        );

      case 3: // 性格设定
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">性格类型</label>
              <div className="grid grid-cols-2 gap-3">
                {PERSONALITY_OPTIONS.type.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCustomization({
                      ...customization,
                      personality: { ...customization.personality, type: option.value as any }
                    })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      customization.personality.type === option.value
                        ? 'border-pink-500 bg-gradient-to-br from-pink-500/20 to-purple-500/20'
                        : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
                    }`}
                  >
                    <p className="font-medium text-white">{option.label}</p>
                    <p className="text-xs text-zinc-400 mt-1">{option.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">声音类型</label>
              <div className="grid grid-cols-3 gap-2">
                {PERSONALITY_OPTIONS.voice.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      personality: { ...customization.personality, voice: option.value as any }
                    })}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      customization.personality.voice === option.value
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">偏好标签 (可多选)</label>
              <div className="flex flex-wrap gap-2">
                {KINK_OPTIONS.map((kink) => (
                  <button
                    key={kink}
                    onClick={() => {
                      const kinks = customization.preferences.kinks.includes(kink)
                        ? customization.preferences.kinks.filter(k => k !== kink)
                        : [...customization.preferences.kinks, kink];
                      setCustomization({
                        ...customization,
                        preferences: { ...customization.preferences, kinks }
                      });
                    }}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      customization.preferences.kinks.includes(kink)
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {kink}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 4: // 动作设定
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* 动作姿势选择 */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">角色动作</label>
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {ACTION_OPTIONS.pose.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCustomization({
                      ...customization,
                      actions: { ...customization.actions, pose: option.value }
                    })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      customization.actions.pose === option.value
                        ? 'border-pink-500 bg-gradient-to-br from-pink-500/20 to-purple-500/20'
                        : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{option.label}</p>
                    <p className="text-xs text-zinc-400 mt-1 truncate">{option.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 动作强度 */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">动作强度</label>
              <div className="grid grid-cols-4 gap-2">
                {ACTION_OPTIONS.intensity.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      actions: { ...customization.actions, intensity: option.value as any }
                    })}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      customization.actions.intensity === option.value
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 场景选择 */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">场景设定</label>
              <div className="grid grid-cols-3 gap-2">
                {ACTION_OPTIONS.scene.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      actions: { ...customization.actions, scene: option.value }
                    })}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      customization.actions.scene === option.value
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 预览当前选择 */}
            <div className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-700">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-pink-500" />
                <h4 className="text-sm font-medium text-zinc-300">动作预览</h4>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-zinc-800/50 rounded-lg p-2">
                  <span className="text-zinc-500">动作</span>
                  <p className="text-white">{ACTION_OPTIONS.pose.find(p => p.value === customization.actions.pose)?.label || '-'}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2">
                  <span className="text-zinc-500">强度</span>
                  <p className="text-white">{ACTION_OPTIONS.intensity.find(i => i.value === customization.actions.intensity)?.label || '-'}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2">
                  <span className="text-zinc-500">场景</span>
                  <p className="text-white">{ACTION_OPTIONS.scene.find(s => s.value === customization.actions.scene)?.label || '-'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 5: // 生成角色
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {!generatedImage && (
              <>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <Wand2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">准备生成你的虚拟伴侣</h3>
                  <p className="text-sm text-zinc-400">
                    AI 将根据你的设定生成一个专属角色
                  </p>
                </div>

                {/* 模型选择 */}
                <div className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-700">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">选择 AI 模型</label>
                  <div className="grid grid-cols-2 gap-2">
                    {IMAGE_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedModel === model.id
                            ? 'border-pink-500 bg-pink-500/20'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        <p className="text-sm font-medium text-white">{model.name}</p>
                        <p className="text-xs text-zinc-400">{model.desc}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {model.provider === 'xai' ? 'X.AI API' : 'ModelsLab'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 角色设定预览 */}
                <div className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-pink-500" />
                    <h4 className="text-sm font-medium text-zinc-300">角色设定</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-500">名称</span>
                      <p className="text-white">{customization.name || '未命名'}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-500">性别</span>
                      <p className="text-white">{customization.gender === 'female' ? '女性' : '男性'}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-500">外貌</span>
                      <p className="text-white">{customization.face.hairColor}{customization.face.hairStyle}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-500">性格</span>
                      <p className="text-white">{customization.personality.type}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-500">动作</span>
                      <p className="text-white">{ACTION_OPTIONS.pose.find(p => p.value === customization.actions.pose)?.label || '-'}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-500">场景</span>
                      <p className="text-white">{ACTION_OPTIONS.scene.find(s => s.value === customization.actions.scene)?.label || '-'}</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-zinc-600 disabled:to-zinc-600 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-pink-500/25"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>AI 生成中...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span>开始生成</span>
                    </>
                  )}
                </motion.button>
              </>
            )}

            {/* 生成结果 */}
            {generatedImage && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">生成成功！</h3>
                </div>
                
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-800 border-4 border-pink-500/30">
                  <img
                    src={generatedImage}
                    alt="Generated avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerate}
                    className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重新生成
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleComplete}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    使用此角色
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-zinc-900/95 backdrop-blur-xl rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-zinc-800"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">创建虚拟伴侣</h2>
            <button
              onClick={onCancel}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <motion.div
                  animate={{
                    scale: i === step ? 1.1 : 1,
                    backgroundColor: i < step ? '#ec4899' : i === step ? 'rgba(236,72,153,0.2)' : 'rgba(39,39,42,0.5)'
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    i === step ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-zinc-900' : ''
                  }`}
                >
                  {i < step ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <s.icon className={`w-5 h-5 ${i === step ? 'text-pink-500' : 'text-zinc-500'}`} />
                  )}
                </motion.div>
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block w-8 h-0.5 mt-2 ${i < step ? 'bg-pink-500' : 'bg-zinc-700'}`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Current Step Title */}
          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold text-white">{steps[step].title}</h3>
            <p className="text-sm text-zinc-400">{steps[step].subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step < steps.length - 1 && (
          <div className="p-5 border-t border-zinc-800 flex gap-3">
            {step > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrev}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

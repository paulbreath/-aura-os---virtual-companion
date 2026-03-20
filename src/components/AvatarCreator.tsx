import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Palette, 
  Sparkles, 
  Heart, 
  Camera,
  ChevronRight,
  ChevronLeft,
  Check,
  RefreshCw
} from 'lucide-react';
import {
  AvatarCustomization,
  DEFAULT_AVATAR_CUSTOMIZATION,
  FACE_OPTIONS,
  BODY_OPTIONS,
  PERSONALITY_OPTIONS,
  KINK_OPTIONS,
  generateAvatarPrompt,
  generateNSFWAvatarPrompt,
} from '../types/avatarCustomization';

interface AvatarCreatorProps {
  onComplete: (customization: AvatarCustomization, imageUrl: string) => void;
  onCancel: () => void;
}

export default function AvatarCreator({ onComplete, onCancel }: AvatarCreatorProps) {
  const [step, setStep] = useState(0);
  const [customization, setCustomization] = useState<AvatarCustomization>(DEFAULT_AVATAR_CUSTOMIZATION);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const steps = [
    { title: '基本信息', icon: User },
    { title: '面容特征', icon: Palette },
    { title: '身材特征', icon: Sparkles },
    { title: '性格设定', icon: Heart },
    { title: '生成角色', icon: Camera },
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
      
      // 调用图片生成API
      const response = await fetch('https://modelslab.com/api/v6/images/text2img', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: import.meta.env.VITE_MODELSLAB_API_KEY,
          prompt: prompt,
          negative_prompt: 'child, underage, ugly, deformed, blurry, low quality, clothing, underwear',
          width: '768',
          height: '1024',
          safety_checker: 'no',
          samples: '1',
          num_inference_steps: '30',
          safety_checker_type: 'blacklist',
          enhance_prompt: 'no',
          guidance_scale: 8.0,
          base64: 'no',
          model_id: 'nsfw',
        }),
      });

      const data = await response.json();
      
      if (data.future_links && data.future_links[0]) {
        setGeneratedImage(data.future_links[0]);
      }
    } catch (error) {
      console.error('Failed to generate avatar:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (generatedImage) {
      onComplete(customization, generatedImage);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: // 基本信息
        return (
          <div className="space-y-6">
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
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">性别</label>
              <div className="grid grid-cols-2 gap-4">
                {['female', 'male'].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setCustomization({ ...customization, gender: gender as any })}
                    className={`p-4 rounded-lg border transition-all ${
                      customization.gender === gender
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-2xl">{gender === 'female' ? '👩' : '👨'}</span>
                    <p className="mt-2 text-sm text-zinc-300">{gender === 'female' ? '女性' : '男性'}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // 面容特征
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">脸型</label>
              <div className="grid grid-cols-3 gap-2">
                {FACE_OPTIONS.shape.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, shape: option.value as any }
                    })}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      customization.face.shape === option.value
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">肤色</label>
              <div className="flex gap-2">
                {FACE_OPTIONS.skinTone.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, skinTone: option.value as any }
                    })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      customization.face.skinTone === option.value
                        ? 'border-pink-500 scale-110'
                        : 'border-zinc-600 hover:border-zinc-500'
                    }`}
                    style={{ backgroundColor: option.color }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">眼睛颜色</label>
              <div className="flex gap-2">
                {FACE_OPTIONS.eyeColor.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, eyeColor: option.value as any }
                    })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      customization.face.eyeColor === option.value
                        ? 'border-pink-500 scale-110'
                        : 'border-zinc-600 hover:border-zinc-500'
                    }`}
                    style={{ backgroundColor: option.color }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">发色</label>
              <div className="flex gap-2 flex-wrap">
                {FACE_OPTIONS.hairColor.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, hairColor: option.value as any }
                    })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      customization.face.hairColor === option.value
                        ? 'border-pink-500 scale-110'
                        : 'border-zinc-600 hover:border-zinc-500'
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
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      customization.face.hairStyle === option.value
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">妆容</label>
              <div className="grid grid-cols-3 gap-2">
                {FACE_OPTIONS.makeup.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      face: { ...customization.face, makeup: option.value as any }
                    })}
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      customization.face.makeup === option.value
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // 身材特征
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">体型</label>
              <div className="grid grid-cols-3 gap-2">
                {BODY_OPTIONS.bodyType.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      body: { ...customization.body, bodyType: option.value as any }
                    })}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      customization.body.bodyType === option.value
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-xl">{option.icon}</span>
                    <p className="mt-1">{option.label}</p>
                  </button>
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
                    className={`flex-1 p-2 rounded-lg border text-xs transition-all ${
                      customization.body.breastSize === option.value
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
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
                    className={`flex-1 p-2 rounded-lg border text-xs transition-all ${
                      customization.body.buttSize === option.value
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
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
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      customization.body.skinTexture === option.value
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customization.body.tattoos}
                  onChange={(e) => setCustomization({
                    ...customization,
                    body: { ...customization.body, tattoos: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm text-zinc-300">纹身</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customization.body.piercings}
                  onChange={(e) => setCustomization({
                    ...customization,
                    body: { ...customization.body, piercings: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm text-zinc-300">穿孔</span>
              </label>
            </div>
          </div>
        );

      case 3: // 性格设定
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">性格类型</label>
              <div className="grid grid-cols-2 gap-2">
                {PERSONALITY_OPTIONS.type.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomization({
                      ...customization,
                      personality: { ...customization.personality, type: option.value as any }
                    })}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      customization.personality.type === option.value
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-zinc-400 mt-1">{option.description}</p>
                  </button>
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
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      customization.personality.voice === option.value
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">恋物癖/偏好 (可多选)</label>
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
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      customization.preferences.kinks.includes(kink)
                        ? 'bg-pink-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {kink}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // 生成角色
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">生成你的虚拟伴侣</h3>
              <p className="text-sm text-zinc-400">
                根据你的设定，AI将生成一个专属的虚拟伴侣角色
              </p>
            </div>

            {/* 角色预览 */}
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">角色设定预览</h4>
              <div className="space-y-2 text-sm text-zinc-400">
                <p>名称: {customization.name || '未命名'}</p>
                <p>面容: {customization.face.shape}脸, {customization.face.skinTone}肤色, {customization.face.eyeColor}眼睛</p>
                <p>发型: {customization.face.hairColor} {customization.face.hairStyle}</p>
                <p>身材: {customization.body.bodyType}, {customization.body.breastSize}胸部, {customization.body.buttSize}臀部</p>
                <p>性格: {customization.personality.type}, {customization.personality.voice}声音</p>
              </div>
            </div>

            {/* 生成按钮 */}
            {!generatedImage && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-zinc-600 disabled:to-zinc-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    生成全裸角色
                  </>
                )}
              </button>
            )}

            {/* 生成结果 */}
            {generatedImage && (
              <div className="space-y-4">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800">
                  <img
                    src={generatedImage}
                    alt="Generated avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重新生成
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    确认使用
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">创建虚拟伴侣</h2>
            <button
              onClick={onCancel}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    i < step
                      ? 'bg-pink-500 text-white'
                      : i === step
                      ? 'bg-pink-500/20 text-pink-500 border border-pink-500'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${i < step ? 'bg-pink-500' : 'bg-zinc-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-lg font-semibold text-white mb-4">{steps[step].title}</h3>
          {renderStep()}
        </div>

        {/* Footer */}
        {step < steps.length - 1 && (
          <div className="p-4 border-t border-zinc-800 flex gap-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

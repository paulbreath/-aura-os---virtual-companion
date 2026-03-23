import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  RefreshCw, 
  Download,
  Heart,
  Filter
} from 'lucide-react';
import { 
  CharacterDNA, 
  SCENE_TEMPLATES, 
  SceneTemplate, 
  CATEGORY_COLORS, 
  CATEGORY_NAMES,
  generateDNAPrompt,
  getCharacterDNA
} from '../types/characterDNA';

interface SceneSelectorProps {
  characterId: string;
  characterName: string;
  onClose: () => void;
}

type Category = 'all' | 'casual' | 'intimate' | 'sensual' | 'romantic';

export default function SceneSelector({ characterId, characterName, onClose }: SceneSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedScene, setSelectedScene] = useState<SceneTemplate | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dna = getCharacterDNA(characterId);

  // Filter scenes by category
  const filteredScenes = selectedCategory === 'all' 
    ? SCENE_TEMPLATES 
    : SCENE_TEMPLATES.filter(s => s.category === selectedCategory);

  const handleGenerate = async (scene: SceneTemplate) => {
    if (!dna) {
      setError('未找到角色DNA，请重新创建角色');
      return;
    }

    setSelectedScene(scene);
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // 生成基于DNA的prompt
      const prompt = generateDNAPrompt(dna, scene);
      console.log('Generating with DNA prompt:', prompt);

      // 选择模型
      const modelId = dna.style === 'anime' ? 'anything-v5' : 'realistic-blend-sdxl-v2-0';

      const response = await fetch('/api/modelslab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: modelId,
          prompt: prompt,
          negative_prompt: 'child, underage, ugly, deformed, blurry, low quality, cartoon, 3d',
          width: 512,
          height: 768,
          // 使用base face作为参考 (如果API支持)
          ...(dna.baseFaceUrl && { init_image: dna.baseFaceUrl }),
        }),
      });

      const data = await response.json();
      console.log('Scene generation response:', data);

      if (data.status === 'success') {
        const imageUrl = data.output?.[0] || data.future_links?.[0] || data.web_links?.[0] || 
                        (data.images?.[0] ? `data:image/png;base64,${data.images[0]}` : null);
        if (imageUrl) {
          setGeneratedImage(imageUrl);
        } else {
          setError('生成成功但未返回图片');
        }
      } else {
        setError(data.message || '生成失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura_${selectedScene?.id}_${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  if (!dna) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div className="bg-zinc-900 rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-xl font-bold text-white mb-2">角色DNA未找到</h3>
          <p className="text-zinc-400 mb-6">
            该角色还没有视觉DNA，请先使用角色创建功能生成角色。
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl"
          >
            关闭
          </button>
        </div>
      </motion.div>
    );
  }

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
        className="bg-zinc-900/95 backdrop-blur-xl rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-800"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">🎭 场景生成</h2>
              <p className="text-sm text-zinc-400">
                为 <span className="text-pink-400">{characterName}</span> 生成场景图片
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'casual', 'intimate', 'sensual', 'romantic'] as Category[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {cat === 'all' ? '全部' : CATEGORY_NAMES[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredScenes.map((scene) => (
              <motion.button
                key={scene.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGenerate(scene)}
                disabled={isGenerating}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedScene?.id === scene.id
                    ? 'border-pink-500 bg-gradient-to-br from-pink-500/20 to-purple-500/20'
                    : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
                } disabled:opacity-50`}
              >
                <span className="text-3xl block mb-2">{scene.emoji}</span>
                <p className="font-medium text-white">{scene.name}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {CATEGORY_NAMES[scene.category]}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Generated Image Preview */}
        <AnimatePresence>
          {(generatedImage || isGenerating || error) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-zinc-800 p-5"
            >
              {isGenerating && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
                  <span className="ml-3 text-zinc-400">正在生成 {selectedScene?.name}...</span>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-center py-4">
                  ❌ {error}
                </div>
              )}

              {generatedImage && (
                <div className="flex gap-4">
                  <div className="w-48 h-72 rounded-xl overflow-hidden border-2 border-pink-500/30 flex-shrink-0">
                    <img
                      src={generatedImage}
                      alt={selectedScene?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-2">
                      {selectedScene?.emoji} {selectedScene?.name}
                    </h4>
                    <p className="text-sm text-zinc-400 mb-4">
                      基于 {characterName} 的角色DNA生成
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleGenerate(selectedScene!)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl"
                      >
                        <RefreshCw className="w-4 h-4" />
                        重新生成
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl"
                      >
                        <Download className="w-4 h-4" />
                        下载
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

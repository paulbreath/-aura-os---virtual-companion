import { useEffect, useRef, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smile, 
  Frown, 
  Heart, 
  Zap, 
  Sparkles,
  Shirt,
  User,
  Settings,
  Play,
  Pause,
  X,
  ChevronDown
} from 'lucide-react';
import { 
  live2dService, 
  EXPRESSIONS,
  MOTIONS,
  ClothingState,
  Live2DExpression 
} from '../services/live2dService';
import AnimeCharacter from './AnimeCharacter';

interface Live2DCharacterProps {
  modelPath?: string;
  onExpressionChange?: (expression: string) => void;
  onClothingChange?: (state: ClothingState) => void;
  onModelChange?: (modelPath: string) => void;
}

// 可用模型列表
const AVAILABLE_MODELS = [
  { path: '/models/epsilon/Epsilon_free/runtime/Epsilon_free.model3.json', name: 'Epsilon' },
];

export default function Live2DCharacter({ 
  modelPath = '/models/epsilon/Epsilon_free/runtime/Epsilon_free.model3.json',
  onExpressionChange,
  onClothingChange,
  onModelChange
}: Live2DCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentExpression, setCurrentExpression] = useState('happy');
  const [clothingState, setClothingState] = useState<ClothingState>('dressed');
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [currentModelPath, setCurrentModelPath] = useState(modelPath);
  const [isTalking, setIsTalking] = useState(false);
  const [useAnimeMode, setUseAnimeMode] = useState(false);

  // 初始化 Live2D
  useEffect(() => {
    if (useAnimeMode) {
      setIsLoaded(true);
      return;
    }

    const initLive2D = async () => {
      if (!containerRef.current) return;

      // 清理旧实例
      live2dService.destroy();
      
      const success = await live2dService.initialize(containerRef.current);
      if (success) {
        const loaded = await live2dService.loadModel(currentModelPath);
        setIsLoaded(loaded);
      }
    };

    initLive2D();

    return () => {
      live2dService.destroy();
    };
  }, [currentModelPath, useAnimeMode]);

  // 模拟说话
  const simulateTalking = () => {
    setIsTalking(true);
    setTimeout(() => setIsTalking(false), 2000);
  };

  // 如果是动漫模式，渲染动漫角色
  if (useAnimeMode) {
    return (
      <div className="relative w-full h-full">
        <AnimeCharacter 
          expression={currentExpression as any} 
          isTalking={isTalking}
        />

        {/* 控制面板切换按钮 */}
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute top-2 right-2 p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-full transition-colors"
        >
          <Settings size={16} className="text-zinc-300" />
        </button>

        {/* 控制面板 */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900/95 to-transparent p-4"
            >
              <div className="max-w-md mx-auto space-y-4">
                {/* 模型选择器 */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-2">选择角色</h4>
                  <div className="relative">
                    <button
                      onClick={() => setShowModelSelector(!showModelSelector)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 flex items-center justify-between"
                    >
                      <span>{AVAILABLE_MODELS.find(m => m.path === currentModelPath)?.name || '选择角色'}</span>
                      <ChevronDown size={16} className="text-zinc-400" />
                    </button>
                    
                    {showModelSelector && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-10">
                        {AVAILABLE_MODELS.map(model => (
                          <button
                            key={model.path}
                            onClick={() => {
                              setCurrentModelPath(model.path);
                              setUseAnimeMode(model.path === 'anime');
                              setShowModelSelector(false);
                              onModelChange?.(model.path);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                              currentModelPath === model.path
                                ? 'bg-pink-500 text-white'
                                : 'text-zinc-200 hover:bg-zinc-700'
                            }`}
                          >
                            {model.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 表情控制 */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-2">表情</h4>
                  <div className="flex flex-wrap gap-2">
                    {['happy', 'shy', 'flirty', 'excited', 'neutral'].map(expr => (
                      <button
                        key={expr}
                        onClick={() => setCurrentExpression(expr)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          currentExpression === expr
                            ? 'bg-pink-500 text-white'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {expr === 'happy' ? '开心' : 
                         expr === 'shy' ? '害羞' : 
                         expr === 'flirty' ? '调情' : 
                         expr === 'excited' ? '兴奋' : '普通'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 说话按钮 */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-2">互动</h4>
                  <button
                    onClick={simulateTalking}
                    className="w-full py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-sm text-white transition-colors"
                  >
                    💬 模拟说话
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 设置表情
  const handleSetExpression = async (expression: Live2DExpression) => {
    if (useAnimeMode) {
      setCurrentExpression(expression.id);
      onExpressionChange?.(expression.id);
      return;
    }
    
    const success = await live2dService.setExpression(expression.id);
    if (success) {
      setCurrentExpression(expression.id);
      onExpressionChange?.(expression.id);
    }
  };

  // 切换部件可见性
  const handleSetClothing = async (state: ClothingState, partsId?: string) => {
    if (useAnimeMode) {
      setClothingState(state);
      return;
    }
    
    if (partsId) {
      // 切换部件可见性
      const success = await live2dService.togglePartsOpacity(partsId);
      if (success) {
        setClothingState(state);
      }
    } else {
      // 恢复所有部件
      await live2dService.restoreAllParts();
      setClothingState(state);
    }
  };

  // 播放/暂停
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // TODO: 实现播放/暂停逻辑
  };

  // 表情和动作分类
  const expressions = EXPRESSIONS;
  const motions = MOTIONS;

  // 部件显示选项 (适用于 Epsilon 等简单模型)
  const clothingOptions: { state: ClothingState; label: string; icon: any; partsId?: string }[] = [
    { state: 'dressed', label: '完整', icon: <Shirt size={16} /> },
    { state: 'lingerie', label: '隐藏头发', icon: <Heart size={16} />, partsId: 'PARTS_01_HAIR_FRONT_002' },
    { state: 'topless', label: '隐藏衣服', icon: <User size={16} />, partsId: 'PARTS_01_CLOTHES' },
    { state: 'nude', label: '隐藏身体', icon: <X size={16} />, partsId: 'PARTS_01_BODY' },
  ];

  // 如果是动漫模式，简化控制
  if (useAnimeMode) {
    return (
      <div className="relative w-full h-full">
        <AnimeCharacter 
          expression={currentExpression as any} 
          isTalking={isTalking}
        />

        {/* 控制面板切换按钮 */}
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute top-2 right-2 p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-full transition-colors"
        >
          <Settings size={16} className="text-zinc-300" />
        </button>

        {/* 控制面板 */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900/95 to-transparent p-4"
            >
              <div className="max-w-md mx-auto space-y-4">
                {/* 模型选择器 */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-2">选择角色</h4>
                  <div className="relative">
                    <button
                      onClick={() => setShowModelSelector(!showModelSelector)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 flex items-center justify-between"
                    >
                      <span>{AVAILABLE_MODELS.find(m => m.path === currentModelPath)?.name || '选择角色'}</span>
                      <ChevronDown size={16} className="text-zinc-400" />
                    </button>
                    
                    {showModelSelector && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-10">
                        {AVAILABLE_MODELS.map(model => (
                          <button
                            key={model.path}
                            onClick={() => {
                              setCurrentModelPath(model.path);
                              setUseAnimeMode(model.path === 'anime');
                              setShowModelSelector(false);
                              onModelChange?.(model.path);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                              currentModelPath === model.path
                                ? 'bg-pink-500 text-white'
                                : 'text-zinc-200 hover:bg-zinc-700'
                            }`}
                          >
                            {model.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 表情控制 */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-2">表情</h4>
                  <div className="flex flex-wrap gap-2">
                    {['happy', 'shy', 'flirty', 'excited', 'neutral'].map(expr => (
                      <button
                        key={expr}
                        onClick={() => setCurrentExpression(expr)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          currentExpression === expr
                            ? 'bg-pink-500 text-white'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {expr === 'happy' ? '开心' : 
                         expr === 'shy' ? '害羞' : 
                         expr === 'flirty' ? '调情' : 
                         expr === 'excited' ? '兴奋' : '普通'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 说话按钮 */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-2">互动</h4>
                  <button
                    onClick={simulateTalking}
                    className="w-full py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-sm text-white transition-colors"
                  >
                    💬 模拟说话
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Live2D 容器 */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* 加载状态 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-zinc-400">加载 Live2D 模型中...</p>
          </div>
        </div>
      )}

      {/* 控制面板切换按钮 */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-2 right-2 p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-full transition-colors"
      >
        <Settings size={16} className="text-zinc-300" />
      </button>

      {/* 播放/暂停按钮 */}
      <button
        onClick={togglePlay}
        className="absolute top-2 left-2 p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-full transition-colors"
      >
        {isPlaying ? (
          <Pause size={16} className="text-zinc-300" />
        ) : (
          <Play size={16} className="text-zinc-300" />
        )}
      </button>

      {/* 控制面板 */}
      <AnimatePresence>
        {showControls && isLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900/95 to-transparent p-4"
          >
            <div className="max-w-md mx-auto space-y-4">
              {/* 模型选择器 */}
              <div>
                <h4 className="text-xs font-medium text-zinc-400 mb-2">选择模型</h4>
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 flex items-center justify-between"
                  >
                    <span>{AVAILABLE_MODELS.find(m => m.path === currentModelPath)?.name || '选择模型'}</span>
                    <ChevronDown size={16} className="text-zinc-400" />
                  </button>
                  
                  {showModelSelector && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                      {AVAILABLE_MODELS.map(model => (
                        <button
                          key={model.path}
                          onClick={() => {
                            setCurrentModelPath(model.path);
                            setUseAnimeMode(model.path === 'anime');
                            setShowModelSelector(false);
                            onModelChange?.(model.path);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            currentModelPath === model.path
                              ? 'bg-pink-500 text-white'
                              : 'text-zinc-200 hover:bg-zinc-700'
                          }`}
                        >
                          {model.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 表情控制 */}
              <div>
                <h4 className="text-xs font-medium text-zinc-400 mb-2">表情</h4>
                <div className="flex flex-wrap gap-2">
                  {expressions.map(expr => (
                    <button
                      key={expr.id}
                      onClick={() => handleSetExpression(expr)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        currentExpression === expr.id
                          ? 'bg-pink-500 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {expr.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 部件控制 */}
              <div>
                <h4 className="text-xs font-medium text-zinc-400 mb-2">显示控制</h4>
                <div className="flex gap-2">
                  {clothingOptions.map(option => (
                    <button
                      key={option.state}
                      onClick={() => handleSetClothing(option.state, option.partsId)}
                      className={`flex-1 py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1 ${
                        clothingState === option.state
                          ? 'bg-pink-500 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 互动动作 */}
              <div>
                <h4 className="text-xs font-medium text-zinc-400 mb-2">互动动作</h4>
                <div className="flex flex-wrap gap-2">
                  {motions.map(expr => (
                    <button
                      key={expr.id}
                      onClick={() => handleSetExpression(expr)}
                      className="px-3 py-1.5 rounded-full text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all"
                    >
                      {expr.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

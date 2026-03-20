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
  X
} from 'lucide-react';
import { 
  live2dService, 
  ADULT_EXPRESSIONS, 
  ClothingState,
  Live2DExpression 
} from '../services/live2dService';

interface Live2DCharacterProps {
  modelPath?: string;
  onExpressionChange?: (expression: string) => void;
  onClothingChange?: (state: ClothingState) => void;
}

export default function Live2DCharacter({ 
  modelPath = '/models/default.model3.json',
  onExpressionChange,
  onClothingChange
}: Live2DCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentExpression, setCurrentExpression] = useState('happy');
  const [clothingState, setClothingState] = useState<ClothingState>('dressed');
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // 初始化 Live2D
  useEffect(() => {
    const initLive2D = async () => {
      if (!containerRef.current) return;

      const success = await live2dService.initialize(containerRef.current);
      if (success) {
        const loaded = await live2dService.loadModel(modelPath);
        setIsLoaded(loaded);
      }
    };

    initLive2D();

    return () => {
      live2dService.destroy();
    };
  }, [modelPath]);

  // 设置表情
  const handleSetExpression = async (expression: Live2DExpression) => {
    const success = await live2dService.setExpression(expression.id);
    if (success) {
      setCurrentExpression(expression.id);
      onExpressionChange?.(expression.id);
    }
  };

  // 设置服装
  const handleSetClothing = async (state: ClothingState) => {
    const success = await live2dService.setClothingState(state);
    if (success) {
      setClothingState(state);
      onClothingChange?.(state);
    }
  };

  // 播放/暂停
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // TODO: 实现播放/暂停逻辑
  };

  // 按类别分组表情
  const expressionCategories = {
    basic: ADULT_EXPRESSIONS.filter(e => ['happy', 'shy', 'flirty', 'excited', 'seductive'].includes(e.id)),
    intimate: ADULT_EXPRESSIONS.filter(e => ['aroused', 'pleasure', 'ecstasy', 'breathless'].includes(e.id)),
    actions: ADULT_EXPRESSIONS.filter(e => ['wave', 'nod', 'shake', 'lean_forward', 'lean_back'].includes(e.id)),
  };

  // 服装选项
  const clothingOptions: { state: ClothingState; label: string; icon: any }[] = [
    { state: 'dressed', label: '穿着', icon: <Shirt size={16} /> },
    { state: 'lingerie', label: '内衣', icon: <Heart size={16} /> },
    { state: 'topless', label: '上身裸', icon: <User size={16} /> },
    { state: 'nude', label: '全裸', icon: <X size={16} /> },
  ];

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
              {/* 表情控制 */}
              <div>
                <h4 className="text-xs font-medium text-zinc-400 mb-2">表情</h4>
                <div className="flex flex-wrap gap-2">
                  {expressionCategories.basic.map(expr => (
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

              {/* 亲密表情 */}
              <div>
                <h4 className="text-xs font-medium text-zinc-400 mb-2">亲密表情</h4>
                <div className="flex flex-wrap gap-2">
                  {expressionCategories.intimate.map(expr => (
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

              {/* 服装控制 */}
              <div>
                <h4 className="text-xs font-medium text-zinc-400 mb-2">服装</h4>
                <div className="flex gap-2">
                  {clothingOptions.map(option => (
                    <button
                      key={option.state}
                      onClick={() => handleSetClothing(option.state)}
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

              {/* 动作控制 */}
              <div>
                <h4 className="text-xs font-medium text-zinc-400 mb-2">动作</h4>
                <div className="flex flex-wrap gap-2">
                  {expressionCategories.actions.map(expr => (
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

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface AnimeCharacterProps {
  expression?: 'happy' | 'shy' | 'flirty' | 'excited' | 'neutral';
  isTalking?: boolean;
}

export default function AnimeCharacter({ expression = 'happy', isTalking = false }: AnimeCharacterProps) {
  const [blink, setBlink] = useState(false);
  const [breathOffset, setBreathOffset] = useState(0);

  // 眨眼动画
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // 呼吸动画
  useEffect(() => {
    const breathInterval = setInterval(() => {
      setBreathOffset(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(breathInterval);
  }, []);

  const getEyeStyle = () => {
    if (blink) return { scaleY: 0.1 };
    switch (expression) {
      case 'happy': return { scaleY: 0.8 };
      case 'shy': return { scaleY: 0.6 };
      case 'flirty': return { scaleY: 0.9, scaleX: 1.1 };
      case 'excited': return { scaleY: 1.1 };
      default: return { scaleY: 1 };
    }
  };

  const getMouthStyle = () => {
    if (isTalking) {
      return { 
        scaleY: 0.5 + Math.random() * 0.5,
        scaleX: 0.8 + Math.random() * 0.4
      };
    }
    switch (expression) {
      case 'happy': return { borderRadius: '0 0 50% 50%' };
      case 'shy': return { borderRadius: '50%', scale: 0.8 };
      case 'flirty': return { borderRadius: '0 0 50% 50%', scaleX: 1.2 };
      case 'excited': return { borderRadius: '0 0 50% 50%', scale: 1.2 };
      default: return { borderRadius: '0 0 30% 30%' };
    }
  };

  const getCheekOpacity = () => {
    return expression === 'shy' || expression === 'flirty' ? 0.6 : 0;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        className="relative"
        animate={{
          y: [0, Math.sin(breathOffset * 0.02) * 3, 0],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* 头部 */}
        <div className="relative w-48 h-56 bg-gradient-to-b from-[#FFE4D6] to-[#FFD4C4] rounded-[45%] shadow-lg">
          {/* 头发背景 */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-56 h-40">
            <div className="absolute top-0 left-4 w-12 h-32 bg-gradient-to-b from-[#4A3728] to-[#3A2718] rounded-full transform -rotate-12" />
            <div className="absolute top-0 right-4 w-12 h-32 bg-gradient-to-b from-[#4A3728] to-[#3A2718] rounded-full transform rotate-12" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-40 h-36 bg-gradient-to-b from-[#4A3728] to-[#3A2718] rounded-full" />
          </div>

          {/* 眼睛 */}
          <div className="absolute top-20 left-8 flex gap-12">
            <motion.div
              className="w-10 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden"
              animate={getEyeStyle()}
            >
              <div className="w-6 h-6 bg-[#6B4C9A] rounded-full" />
              <div className="absolute w-2 h-2 bg-white rounded-full top-2 right-2" />
            </motion.div>
            <motion.div
              className="w-10 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden"
              animate={getEyeStyle()}
            >
              <div className="w-6 h-6 bg-[#6B4C9A] rounded-full" />
              <div className="absolute w-2 h-2 bg-white rounded-full top-2 right-2" />
            </motion.div>
          </div>

          {/* 腮红 */}
          <motion.div
            className="absolute top-28 left-4 w-8 h-4 bg-[#FFB6C1] rounded-full"
            animate={{ opacity: getCheekOpacity() }}
          />
          <motion.div
            className="absolute top-28 right-4 w-8 h-4 bg-[#FFB6C1] rounded-full"
            animate={{ opacity: getCheekOpacity() }}
          />

          {/* 嘴巴 */}
          <motion.div
            className="absolute top-36 left-1/2 -translate-x-1/2 w-6 h-3 bg-[#E57373]"
            animate={getMouthStyle()}
          />

          {/* 头发刘海 */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="w-8 h-20 bg-[#4A3728] rounded-full transform -rotate-12 -ml-4" />
            <div className="w-8 h-24 bg-[#4A3728] rounded-full" />
            <div className="w-8 h-20 bg-[#4A3728] rounded-full transform rotate-12 -mr-4" />
          </div>
        </div>

        {/* 身体 */}
        <div className="relative -mt-4">
          {/* 颈部 */}
          <div className="mx-auto w-8 h-6 bg-[#FFE4D6]" />
          
          {/* 身体 */}
          <div className="w-36 h-40 bg-gradient-to-b from-[#FF6B9D] to-[#E91E63] rounded-t-3xl mx-auto relative">
            {/* 领子 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-8 bg-white rounded-b-full" />
            
            {/* 手臂 */}
            <motion.div
              className="absolute -left-4 top-4 w-8 h-28 bg-[#FF6B9D] rounded-full"
              animate={{
                rotate: isTalking ? [0, -10, 0, 10, 0] : 0,
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute -right-4 top-4 w-8 h-28 bg-[#FF6B9D] rounded-full"
              animate={{
                rotate: isTalking ? [0, 10, 0, -10, 0] : 0,
              }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }}
            />
          </div>
        </div>

        {/* 猫耳 */}
        <div className="absolute -top-6 left-4">
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-[#4A3728] transform -rotate-12" />
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-[#FFB6C1] absolute top-2 left-2 transform -rotate-12" />
        </div>
        <div className="absolute -top-6 right-4">
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-[#4A3728] transform rotate-12" />
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-[#FFB6C1] absolute top-2 right-2 transform rotate-12" />
        </div>

        {/* 尾巴 */}
        <motion.div
          className="absolute -right-12 top-40"
          animate={{
            rotate: [0, 15, 0, -15, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-4 h-32 bg-[#4A3728] rounded-full transform origin-top" />
          <div className="w-6 h-8 bg-[#4A3728] rounded-full -mt-1 -ml-1" />
        </motion.div>
      </motion.div>

      {/* 对话气泡 */}
      {isTalking && (
        <motion.div
          className="absolute -top-8 right-0 bg-white rounded-2xl px-4 py-2 shadow-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-sm text-gray-700">♪</div>
        </motion.div>
      )}
    </div>
  );
}

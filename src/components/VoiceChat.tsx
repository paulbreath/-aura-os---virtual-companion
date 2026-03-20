import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Settings } from 'lucide-react';
import { voiceChatService, VoiceChatCallbacks } from '../services/voiceChatService';

interface VoiceChatProps {
  onTranscript?: (text: string) => void;
  onSpeaking?: (speaking: boolean) => void;
  autoListen?: boolean;
}

export default function VoiceChat({ 
  onTranscript, 
  onSpeaking,
  autoListen = false 
}: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState('zh-CN');
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(1.0);

  // 检查支持情况
  useEffect(() => {
    const recognitionSupported = voiceChatService.isRecognitionSupported();
    const synthesisSupported = voiceChatService.isSynthesisSupported();
    setIsSupported(recognitionSupported && synthesisSupported);

    // 设置回调
    const callbacks: VoiceChatCallbacks = {
      onSpeechStart: () => {
        setIsListening(true);
        onSpeaking?.(true);
      },
      onSpeechEnd: () => {
        setIsListening(false);
        onSpeaking?.(false);
      },
      onResult: (text, isFinal) => {
        if (isFinal) {
          setTranscript(text);
          setInterimTranscript('');
          onTranscript?.(text);
        } else {
          setInterimTranscript(text);
        }
      },
      onError: (error) => {
        console.error('Voice chat error:', error);
        setIsListening(false);
        onSpeaking?.(false);
      },
    };

    voiceChatService.setCallbacks(callbacks);

    // 自动开始监听
    if (autoListen && recognitionSupported) {
      voiceChatService.startListening();
    }

    return () => {
      voiceChatService.destroy();
    };
  }, [autoListen, onTranscript, onSpeaking]);

  // 切换监听状态
  const toggleListening = () => {
    if (isListening) {
      voiceChatService.stopListening();
    } else {
      voiceChatService.startListening();
    }
  };

  // 播放文本
  const speakText = async (text: string) => {
    if (!text) return;

    setIsSpeaking(true);
    try {
      await voiceChatService.speak(text, {
        rate,
        volume,
      });
    } catch (error) {
      console.error('Failed to speak:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  // 停止播放
  const stopSpeaking = () => {
    voiceChatService.stopSpeaking();
    setIsSpeaking(false);
  };

  // 更新语言
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    voiceChatService.setLanguage(newLanguage);
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-zinc-800/50 rounded-lg">
        <p className="text-sm text-zinc-400">
          您的浏览器不支持语音功能。请使用 Chrome 或 Edge 浏览器。
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 语音控制按钮 */}
      <div className="flex items-center gap-2">
        {/* 监听按钮 */}
        <button
          onClick={toggleListening}
          className={`p-3 rounded-full transition-all ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
          title={isListening ? '停止监听' : '开始监听'}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* 播放按钮 */}
        <button
          onClick={isSpeaking ? stopSpeaking : () => speakText(transcript)}
          disabled={!transcript && !isSpeaking}
          className={`p-3 rounded-full transition-all ${
            isSpeaking
              ? 'bg-green-500 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50'
          }`}
          title={isSpeaking ? '停止播放' : '播放文本'}
        >
          {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* 设置按钮 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all"
          title="语音设置"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* 实时转录显示 */}
      <AnimatePresence>
        {(transcript || interimTranscript) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-3 p-3 bg-zinc-800/50 rounded-lg"
          >
            <p className="text-sm text-zinc-300">
              {interimTranscript && (
                <span className="text-zinc-500">{interimTranscript}</span>
              )}
              {transcript && (
                <span className="text-white">{transcript}</span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50"
          >
            <h4 className="text-sm font-medium text-zinc-200 mb-3">语音设置</h4>
            
            {/* 语言选择 */}
            <div className="mb-3">
              <label className="block text-xs text-zinc-400 mb-1">语言</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200"
              >
                <option value="zh-CN">中文（简体）</option>
                <option value="zh-TW">中文（繁体）</option>
                <option value="en-US">English (US)</option>
                <option value="ja-JP">日本語</option>
                <option value="ko-KR">한국어</option>
              </select>
            </div>

            {/* 音量 */}
            <div className="mb-3">
              <label className="block text-xs text-zinc-400 mb-1">
                音量: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* 语速 */}
            <div className="mb-3">
              <label className="block text-xs text-zinc-400 mb-1">
                语速: {rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
            >
              关闭
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Voice Chat Service - Real-time voice interaction
// Supports speech recognition and text-to-speech

interface VoiceChatConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

interface VoiceChatCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

class VoiceChatService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private config: VoiceChatConfig;
  private callbacks: VoiceChatCallbacks = {};

  constructor() {
    this.config = {
      language: 'zh-CN', // 中文
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
    };

    // 初始化语音识别
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    // 初始化语音合成
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }

    this.setupRecognition();
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 Voice recognition started');
      this.callbacks.onSpeechStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🎤 Voice recognition ended');
      this.callbacks.onSpeechEnd?.();
    };

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      
      console.log('🎤 Voice result:', transcript, 'Final:', isFinal);
      this.callbacks.onResult?.(transcript, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      console.error('🎤 Voice recognition error:', event.error);
      this.callbacks.onError?.(event.error);
    };
  }

  // 设置回调
  setCallbacks(callbacks: VoiceChatCallbacks) {
    this.callbacks = callbacks;
  }

  // 开始语音识别
  startListening(): boolean {
    if (!this.recognition) {
      console.error('Speech recognition not supported');
      return false;
    }

    if (this.isListening) {
      console.log('Already listening');
      return true;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      return false;
    }
  }

  // 停止语音识别
  stopListening() {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  }

  // 暂停语音识别
  pauseListening() {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.pause();
    } catch (error) {
      console.error('Failed to pause voice recognition:', error);
    }
  }

  // 恢复语音识别
  resumeListening() {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.resume();
    } catch (error) {
      console.error('Failed to resume voice recognition:', error);
    }
  }

  // 文字转语音
  speak(text: string, options: {
    voice?: SpeechSynthesisVoice;
    rate?: number;
    pitch?: number;
    volume?: number;
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // 停止当前语音
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // 设置语音
      if (options.voice) {
        utterance.voice = options.voice;
      } else {
        // 尝试找到中文语音
        const voices = this.synthesis.getVoices();
        const chineseVoice = voices.find(v => v.lang.includes('zh'));
        if (chineseVoice) {
          utterance.voice = chineseVoice;
        }
      }

      // 设置参数
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onend = () => {
        console.log('🔊 Speech ended');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('🔊 Speech error:', event.error);
        reject(new Error(event.error));
      };

      this.synthesis.speak(utterance);
    });
  }

  // 停止语音
  stopSpeaking() {
    if (!this.synthesis) return;
    this.synthesis.cancel();
  }

  // 获取可用语音列表
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  // 获取中文语音
  getChineseVoices(): SpeechSynthesisVoice[] {
    return this.getVoices().filter(v => v.lang.includes('zh'));
  }

  // 设置语言
  setLanguage(language: string) {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  // 是否正在监听
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // 是否支持语音识别
  isRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  // 是否支持语音合成
  isSynthesisSupported(): boolean {
    return this.synthesis !== null;
  }

  // 销毁
  destroy() {
    this.stopListening();
    this.stopSpeaking();
    this.callbacks = {};
  }
}

// 导出单例
export const voiceChatService = new VoiceChatService();

// 导出类型
export type { VoiceChatConfig, VoiceChatCallbacks };

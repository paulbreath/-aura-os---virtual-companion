import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Message, Avatar, AVATARS, generateResponse, generateAutonomousAction, generateSelfie, generateSpeech, generateVideo, setPreferredModel, getPreferredModel, AVAILABLE_MODELS, ModelConfig, MINIMAX_TTS_VOICES } from './services/aiService';
import { UserMemory, loadUserMemory, saveUserMemory, addMemory, getRelevantMemories, generateMemoryContext, saveSelfiePreference } from './services/memoryService';
import { live2dService } from './services/live2dService';
import { addToAlbum } from './types/album';
import { Heart, Briefcase, MessageCircle, Phone, Settings, Send, Bot, Smartphone, Zap, Camera, Image as ImageIcon, Users, Volume2, VolumeX, PlayCircle, MessageSquare, ChevronDown, X, Mic, Pause, Plus, GalleryHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AvatarCreator from './components/AvatarCreator';
import Live2DCharacter from './components/Live2DCharacter';
import VoiceChat from './components/VoiceChat';
import CharacterAlbum from './components/CharacterAlbum';

export default function App() {
  const [startTime] = useState(Date.now());
  const [chatMode, setChatMode] = useState<'solo' | 'group'>('solo');
  const [currentAvatar, setCurrentAvatar] = useState<Avatar>(AVATARS[0]);
  const [groupMembers, setGroupMembers] = useState<Avatar[]>([AVATARS[0], AVATARS[1]]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: "Hi honey! I'm here for you. What are we doing today? 💕",
      timestamp: new Date(),
      source: 'direct',
      senderId: AVATARS[0].id,
      senderName: AVATARS[0].name
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [heartbeatActive, setHeartbeatActive] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [currentModel, setCurrentModel] = useState<ModelConfig>(getPreferredModel());
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('aura-selected-voice') || 'ttv-voice-2026031023545326-M2Ysf3RQ';
  });
  const [avatarVoices, setAvatarVoices] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('aura-avatar-voices');
    return saved ? JSON.parse(saved) : {};
  });
  const [showAvatarVoiceMenu, setShowAvatarVoiceMenu] = useState<string | null>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [selectedMentionTarget, setSelectedMentionTarget] = useState<'all' | Avatar | null>(null);
  const [selfieMode, setSelfieMode] = useState(false);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [chatBackground, setChatBackground] = useState<string | null>(() => {
    return localStorage.getItem('aura-chat-background') || null;
  });
  const [lastGroupSpeakerTime, setLastGroupSpeakerTime] = useState<number>(0);
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    const model = getPreferredModel();
    return Object.keys(AVAILABLE_MODELS).find(key =>
      AVAILABLE_MODELS[key].some(m => m.provider === model.provider && m.modelId === model.modelId)
    ) || 'X.AI (Grok)';
  });
  const [avatarBackgrounds, setAvatarBackgrounds] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('aura-avatar-backgrounds');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to load saved backgrounds:', e);
      return {};
    }
  });
  // 每个角色独立的头像图片
  const [avatarImages, setAvatarImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('aura-avatar-images');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to load saved avatar images:', e);
      return {};
    }
  });
  // 保留向后兼容：如果之前有全局头像，迁移到第一个角色
  const [customAvatarImage, setCustomAvatarImage] = useState<string | null>(() => {
    try {
      const oldImage = localStorage.getItem('aura-custom-avatar-image');
      if (oldImage) {
        // 迁移到新系统
        localStorage.removeItem('aura-custom-avatar-image');
        return oldImage;
      }
      return null;
    } catch (e) {
      return null;
    }
  });
  const [userMemory, setUserMemory] = useState<UserMemory>(() => loadUserMemory());
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [showLive2D, setShowLive2D] = useState(false);
  const [live2DModelPath, setLive2DModelPath] = useState('/models/epsilon/Epsilon_free/runtime/Epsilon_free.model3.json');
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [live2DSize, setLive2DSize] = useState({ width: 288, height: 384 });
  const [isResizing, setIsResizing] = useState(false);
  const live2DRef = useRef<HTMLDivElement>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Live2D 空闲动画
  useEffect(() => {
    if (!showLive2D) return;
    
    const idleInterval = setInterval(() => {
      live2dService.playRandomMotion();
    }, 8000 + Math.random() * 7000); // 8-15秒随机间隔
    
    return () => clearInterval(idleInterval);
  }, [showLive2D]);

  // Save avatar images to localStorage
  useEffect(() => {
    try {
      const serialized = JSON.stringify(avatarImages);
      const size = new Blob([serialized]).size;
      if (size > 4 * 1024 * 1024) { // 4MB limit
        console.warn('Avatar images data too large for localStorage');
        return;
      }
      localStorage.setItem('aura-avatar-images', serialized);
    } catch (e) {
      console.error('Failed to save avatar images:', e);
    }
  }, [avatarImages]);
  
  // Legacy: Save custom avatar image to localStorage (for migration)
  useEffect(() => {
    if (customAvatarImage) {
      localStorage.setItem('aura-custom-avatar-image', customAvatarImage);
    }
  }, [customAvatarImage]);

  // Save avatar voices to localStorage
  useEffect(() => {
    localStorage.setItem('aura-avatar-voices', JSON.stringify(avatarVoices));
  }, [avatarVoices]);

  // Save user memory to localStorage
  useEffect(() => {
    saveUserMemory(userMemory);
  }, [userMemory]);

  // Save voice selection to localStorage
  useEffect(() => {
    localStorage.setItem('aura-selected-voice', selectedVoice);
  }, [selectedVoice]);

  // Get voice for a specific avatar
  const getAvatarVoice = (avatarId: string) => {
    return avatarVoices[avatarId] || AVATARS.find(a => a.id === avatarId)?.voiceName || 'ttv-voice-2026031023545326-M2Ysf3RQ';
  };

  // 设置特定角色的头像
  const setAvatarImage = (avatarId: string, imageUrl: string) => {
    setAvatarImages(prev => ({
      ...prev,
      [avatarId]: imageUrl
    }));
  };
  
  // 获取特定角色的头像
  const getAvatarImage = (avatarId: string): string | null => {
    return avatarImages[avatarId] || null;
  };
  
  // 删除特定角色的头像
  const removeAvatarImage = (avatarId: string) => {
    setAvatarImages(prev => {
      const newImages = { ...prev };
      delete newImages[avatarId];
      return newImages;
    });
  };

  const handleUploadAvatarImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      // 保存到当前角色
      setAvatarImage(currentAvatar.id, result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearCustomAvatar = () => {
    removeAvatarImage(currentAvatar.id);
  };

  // Save avatar backgrounds to localStorage
  useEffect(() => {
    try {
      const serialized = JSON.stringify(avatarBackgrounds);
      const size = new Blob([serialized]).size;
      if (size > 4 * 1024 * 1024) { // 4MB limit
        console.warn('Backgrounds data too large for localStorage, skipping save');
        return;
      }
      localStorage.setItem('aura-avatar-backgrounds', serialized);
    } catch (e) {
      console.error('Failed to save backgrounds:', e);
    }
  }, [avatarBackgrounds]);

   const messagesEndRef = useRef<HTMLDivElement>(null);

   const scrollToBottom = () => {
     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   };

    const getProviderGroupName = (model: ModelConfig): string => {
      return Object.keys(AVAILABLE_MODELS).find(key => 
        AVAILABLE_MODELS[key].some(m => m.provider === model.provider && m.modelId === model.modelId)
      ) || 'X.AI (Grok)';
    };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Debug: expose test function globally in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).testVolcengineTTS = async () => {
        console.log('Testing Volcano Engine TTS...');
        const testText = `你好，这是${currentAvatar.name}的语音测试。`;
        try {
          const result = await generateSpeech(testText, getAvatarVoice(currentAvatar.id));
          console.log('Volcengine TTS result:', result ? '✅ Success' : '❌ Failed', result);
          if (result && result.data) {
            const audio = new Audio(`data:audio/mpeg;base64,${result.data}`);
            audio.play().then(() => console.log('Playing audio...')).catch(console.error);
          }
        } catch (e) {
          console.error('Test failed:', e);
        }
      };
      console.log('🔧 Dev: window.testVolcengineTTS() is available');
    }
  }, [currentAvatar]);

  // Keyboard shortcut: Escape to toggle heartbeat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHeartbeatActive(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

   // Heartbeat System
  useEffect(() => {
    if (!heartbeatActive) return;

    const interval = setInterval(async () => {
      setLastHeartbeat(new Date());
      
      // Skip if heartbeat is disabled
      
      // For group chat: if no message for a while, a random character should speak
      if (chatMode === 'group' && !isTyping && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const timeSinceLastMsg = Date.now() - new Date(lastMsg.timestamp).getTime();
        const lastMsgIsFromAvatar = lastMsg.role === 'model';
        
        // If the last message was from an avatar, wait 2.5-4 seconds before another avatar responds
        const minDelayBetweenAvatars = lastMsgIsFromAvatar && lastGroupSpeakerTime > 0 
          ? 2500 + Math.random() * 1500 
          : 0;
        
        // Base delay: 3-5 seconds after last message
        const baseDelay = 3000 + Math.random() * 2000;
        
        // Use the longer of the two delays
        const requiredDelay = Math.max(baseDelay, minDelayBetweenAvatars);
        
        if (timeSinceLastMsg > requiredDelay) {
          // Pick a random avatar from group members
          const randomAvatar = groupMembers[Math.floor(Math.random() * groupMembers.length)];
          const recentContext = messages.slice(-5).map(m => `${m.senderName || m.role}: ${m.content}`).join('\n');
          
          setIsTyping(true);
          try {
            const action = await generateAutonomousAction(randomAvatar, recentContext, true, groupMembers);
            console.log('Group auto-reply: action result:', action);
            // Support {shouldAct: true}, {action: 'send'}, and {response: '...'} formats
            const shouldAct = action.shouldAct === true || action.action === 'send' || action.action === 'send_message' || !!action.response;
            const messageText = action.message || action.response;
            console.log('Group auto-reply: shouldAct:', shouldAct, 'message:', messageText);
            if (shouldAct && messageText) {
              let audioData: { data: string; mimeType: string } | undefined;
              if (voiceMode) {
                const speech = await generateSpeech(messageText, getAvatarVoice(randomAvatar.id));
                if (speech) audioData = speech;
              }

              const newMsg: Message = {
                id: Date.now().toString(),
                role: 'model',
                content: messageText,
                timestamp: new Date(),
                source: action.platform as any || 'direct',
                senderId: randomAvatar.id,
                senderName: randomAvatar.name,
                audioData
              };

              setMessages(prev => [...prev, newMsg]);
              setLastGroupSpeakerTime(Date.now());
              if (audioData) playAudio(audioData);
            }
          } catch (e) {
            console.error("Group chat auto-reply error", e);
          } finally {
            setIsTyping(false);
          }
          return; // Skip the solo heartbeat if we just did group chat
        }
      }
      
      // Solo chat: if no user input for 2 seconds, character continues conversation
      if (chatMode === 'solo' && !isTyping && messages.length > 0) {
        // Find the last user message (not model message)
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUserMsg) {
          return;
        }
        
        const timeSinceLastUserMsg = Date.now() - new Date(lastUserMsg.timestamp).getTime();
        
        // If more than 2-5 seconds have passed since user's last message (random)
        const randomDelay = 2000 + Math.random() * 3000;
        if (timeSinceLastUserMsg > randomDelay) {
          console.log('Solo auto-reply: triggering...', currentAvatar.name);
          setIsTyping(true);
          const recentContext = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
          
          try {
            const action = await generateAutonomousAction(currentAvatar, recentContext, false, []);
            console.log('Solo auto-reply: action result:', action);
            // Support {shouldAct: true}, {action: 'send'}, and {response: '...'} formats
            const shouldAct = action.shouldAct === true || action.action === 'send' || action.action === 'send_message' || !!action.response;
            const messageText = action.message || action.response;
            console.log('Solo auto-reply: shouldAct:', shouldAct, 'message:', messageText);
            if (shouldAct && messageText) {
              let audioData: { data: string; mimeType: string } | undefined;
              if (voiceMode) {
                const speech = await generateSpeech(messageText, getAvatarVoice(currentAvatar.id));
                if (speech) audioData = speech;
              }

              const newMsg: Message = {
                id: Date.now().toString(),
                role: 'model',
                content: messageText,
                timestamp: new Date(),
                source: action.platform as any || 'direct',
                senderId: currentAvatar.id,
                senderName: currentAvatar.name,
                audioData
              };

              setMessages(prev => [...prev, newMsg]);
              if (audioData) playAudio(audioData);
            }
          } catch (e) {
            console.error("Solo chat auto-reply error", e);
          } finally {
            setIsTyping(false);
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [heartbeatActive, currentAvatar, messages, isTyping, voiceMode, chatMode, groupMembers, avatarVoices]);

  const playAudio = async (audioData: { data: string; mimeType: string }) => {
    try {
      // Skip if it's browser TTS (already played)
      if (audioData.mimeType === 'browser-tts') {
        return;
      }
      
      if (audioData.mimeType.includes('pcm')) {
        const binaryString = window.atob(audioData.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const dataView = new DataView(bytes.buffer);
        const floatArray = new Float32Array(bytes.buffer.byteLength / 2);
        for (let i = 0; i < floatArray.length; i++) {
          floatArray[i] = dataView.getInt16(i * 2, true) / 32768;
        }
        const audioBuffer = audioCtx.createBuffer(1, floatArray.length, 24000);
        audioBuffer.getChannelData(0).set(floatArray);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
      } else {
        const audio = new Audio(`data:${audioData.mimeType};base64,${audioData.data}`);
        audio.play();
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check if in selfie mode - generate selfie with user's prompt
    if (selfieMode) {
      const userPrompt = input.trim();
      setSelfieMode(false);
      setInput('');
      setIsTyping(true);

      const requestMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userPrompt,
        timestamp: new Date(),
        source: 'direct'
      };
      setMessages(prev => [...prev, requestMsg]);

      try {
        const recentContext = messages.slice(-6).map(m => `${m.senderName || m.role}: ${m.content}`).join('\n');
        const imageUrl = await generateSelfie(currentAvatar, recentContext, userPrompt, chatMode === 'group', chatMode === 'group' ? groupMembers : [], userMemory);

        if (imageUrl) {
          // 保存到角色相册
          addToAlbum(currentAvatar.id, imageUrl, {
            prompt: userPrompt || '自拍',
            type: 'selfie',
            metadata: {
              scene: recentContext.slice(-100)
            }
          });
          
          // 保存到用户审美偏好记忆
          if (userPrompt) {
            const isAnime = currentAvatar.imageStyle === 'anime';
            const updatedMemory = saveSelfiePreference(
              userMemory,
              userPrompt,
              isAnime ? 'anime' : 'realistic'
            );
            setUserMemory(updatedMemory);
          }
          
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: "Here's your selfie! 📸",
            imageUrl: imageUrl,
            timestamp: new Date(),
            source: 'direct',
            senderId: currentAvatar.id,
            senderName: currentAvatar.name
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: "Sorry, I couldn't take a photo right now.",
            timestamp: new Date(),
            source: 'direct',
            senderId: currentAvatar.id,
            senderName: currentAvatar.name
          }]);
        }
      } catch (error) {
        console.error("Error generating selfie:", error);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // 检测命令 (以 / 开头)
    if (input.startsWith('/')) {
      const cmd = input.toLowerCase().split(' ')[0];
      let response = '';
      
      switch (cmd) {
        case '/model':
          response = `📦 **当前模型**: Grok 4.1 Fast\n\`grok-4-1-fast-non-reasoning\`\n\n**提供商**: X.AI\n**API**: 已连接 ✅`;
          break;
        case '/status':
          const uptime = Math.floor((Date.now() - startTime) / 1000);
          const mins = Math.floor(uptime / 60);
          const secs = uptime % 60;
          response = `📊 **系统状态**\n\n- **AI模型**: Grok 4.1 Fast\n- **Live2D**: ${showLive2D ? '已启用 ✅' : '已禁用'}\n- **语音模式**: ${voiceMode ? '已启用 ✅' : '已禁用'}\n- **聊天模式**: ${chatMode === 'solo' ? '单人' : '群聊'}\n- **运行时间**: ${mins}分${secs}秒\n- **消息数量**: ${messages.length}`;
          break;
        case '/help':
          response = `📖 **可用命令**\n\n- \`/model\` - 查看当前AI模型\n- \`/status\` - 查看系统状态\n- \`/clear\` - 清除聊天记录\n- \`/memory\` - 查看用户记忆\n- \`/video\` - 生成角色视频\n- \`/help\` - 显示帮助信息`;
          break;
        case '/clear':
          setMessages([{
            id: Date.now().toString(),
            role: 'model',
            content: '聊天记录已清空～让我们重新开始吧！💕',
            timestamp: new Date(),
            source: 'direct',
            senderId: currentAvatar.id,
            senderName: currentAvatar.name
          }]);
          setInput('');
          return;
        case '/memory':
          const memCount = userMemory.memories.length;
          const prefs = Object.keys(userMemory.preferences || {}).length;
          response = `🧠 **用户记忆**\n\n- **记忆条数**: ${memCount}\n- **偏好设置**: ${prefs}\n\n记忆帮助我更好地了解你～`;
          break;
        case '/video':
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            content: '🎬 正在为你生成视频，请稍候...',
            timestamp: new Date(),
            source: 'direct',
            senderId: currentAvatar.id,
            senderName: currentAvatar.name
          }]);
          
          (async () => {
            try {
              const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
              const context = lastUserMessage?.content || 'beautiful scene';
              const videoUrl = await generateVideo(currentAvatar, context, 'flirty');
              
              if (videoUrl) {
                setGeneratedVideoUrl(videoUrl);
                setShowVideoPlayer(true);
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  content: '✨ 视频生成完成！点击下方播放...',
                  timestamp: new Date(),
                  source: 'direct',
                  senderId: currentAvatar.id,
                  senderName: currentAvatar.name,
                  videoUrl: videoUrl
                }]);
              } else {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  content: '😅 抱歉，视频生成失败了，请稍后再试...',
                  timestamp: new Date(),
                  source: 'direct',
                  senderId: currentAvatar.id,
                  senderName: currentAvatar.name
                }]);
              }
            } catch (error) {
              console.error('Video generation error:', error);
            }
          })();
          
          setInput('');
          return;
        default:
          response = `❓ 未知命令: \`${cmd}\`\n输入 \`/help\` 查看可用命令`;
      }
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: response,
        timestamp: new Date(),
        source: 'direct',
        senderId: 'system',
        senderName: 'System'
      }]);
      setInput('');
      return;
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      source: 'direct'
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);
    
    // Live2D 角色反应 - 用户消息
    if (showLive2D) {
      live2dService.reactToText(input);
    }

    // Extract and save memory from user message
    const content = input.toLowerCase();
    if (content.includes('我喜欢') || content.includes('我叫') || content.includes('我的名字是')) {
      setUserMemory(prev => addMemory(prev, input, 'preference', 8, ['preference']));
    } else if (content.includes('开心') || content.includes('难过') || content.includes('生气')) {
      setUserMemory(prev => addMemory(prev, input, 'emotion', 7, ['emotion']));
    } else if (content.includes('今天') || content.includes('昨天') || content.includes('明天')) {
      setUserMemory(prev => addMemory(prev, input, 'event', 5, ['event']));
    } else {
      setUserMemory(prev => addMemory(prev, input, 'conversation', 3, ['conversation']));
    }

    try {
      if (chatMode === 'solo') {
        const memoryContext = generateMemoryContext(userMemory);
        const aiResponse = await generateResponse([...messages, newUserMsg], currentAvatar, false, [], memoryContext);
        
        let audioData = undefined;
        if (voiceMode) {
          const speech = await generateSpeech(aiResponse, getAvatarVoice(currentAvatar.id));
          if (speech) audioData = speech;
        }

        const newMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: aiResponse,
          timestamp: new Date(),
          source: 'direct',
          audioData,
          senderId: currentAvatar.id,
          senderName: currentAvatar.name
        };

        setMessages(prev => [...prev, newMsg]);
        if (audioData) await playAudio(audioData);
        
        // Live2D 角色反应 - AI 回复
        if (showLive2D) {
          live2dService.reactToText(aiResponse);
        }
      } else {
        // Group Chat Logic
        setLastGroupSpeakerTime(0); // Reset so avatars can respond to user
        let respondingAvatars: Avatar[] = [];
        const lowerInput = input.toLowerCase();
        
        const mentioned = groupMembers.filter(m => lowerInput.includes(`@${m.name.toLowerCase()}`));
        
        if (mentioned.length > 0) {
          respondingAvatars = [...mentioned];
          // 50% chance someone else gets jealous and chimes in after the mentioned person
          if (Math.random() < 0.5 && groupMembers.length > mentioned.length) {
            const unmentioned = groupMembers.filter(m => !mentioned.includes(m));
            const jealousAvatar = unmentioned[Math.floor(Math.random() * unmentioned.length)];
            respondingAvatars.push(jealousAvatar);
          }
        } else {
          // No mentions, pick 1 or 2 random avatars to reply to avoid spam
          const numResponders = Math.random() < 0.6 ? 1 : 2;
          const shuffled = [...groupMembers].sort(() => 0.5 - Math.random());
          respondingAvatars = shuffled.slice(0, numResponders);
        }

        let currentMessages = [...messages, newUserMsg];
        
        for (let index = 0; index < respondingAvatars.length; index++) {
          const avatar = respondingAvatars[index];
          setIsTyping(true);
          const memoryContext = generateMemoryContext(userMemory);
          const aiResponse = await generateResponse(currentMessages, avatar, true, groupMembers, memoryContext);
          
          let audioData = undefined;
          if (voiceMode) {
            const speech = await generateSpeech(aiResponse, getAvatarVoice(avatar.id));
            if (speech) audioData = speech;
          }

          const newMsg: Message = {
            id: Date.now().toString() + Math.random(),
            role: 'model',
            content: aiResponse,
            timestamp: new Date(),
            source: 'direct',
            audioData,
            senderId: avatar.id,
            senderName: avatar.name
          };

          setMessages(prev => [...prev, newMsg]);
          setLastGroupSpeakerTime(Date.now());
          currentMessages = [...currentMessages, newMsg];
          
          // Add delay between different avatars speaking for better rhythm
          const delayBetweenAvatars = audioData ? 500 : 1500;
          if (index < respondingAvatars.length - 1) {
            await new Promise(r => setTimeout(r, delayBetweenAvatars));
          }
          
          if (audioData) {
            await playAudio(audioData);
          } else {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRequestSelfie = () => {
    // Set selfie mode and focus on input for user to type prompt
    setSelfieMode(true);
    setInput('');
    // Focus on the input
    const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputEl) inputEl.focus();
  };

  const switchAvatar = (avatar: Avatar) => {
    if (avatar.id === currentAvatar.id) return;
    setCurrentAvatar(avatar);
    // If avatar has custom LLM config, switch to it
    if (avatar.llmProvider && avatar.llmModelId) {
      const modelConfig: ModelConfig = {
        provider: avatar.llmProvider,
        modelId: avatar.llmModelId,
        name: `${avatar.llmProvider} / ${avatar.llmModelId.split('/').pop() || avatar.llmModelId}`
      };
      setPreferredModel(modelConfig);
      setCurrentModel(modelConfig);
    }
    setMessages([{
      id: Date.now().toString(),
      role: 'system',
      content: `Switched to ${avatar.name} - ${avatar.tagline}`,
      timestamp: new Date()
    }]);
  };

  const toggleGroupMember = (avatar: Avatar) => {
    setGroupMembers(prev => {
      const isMember = prev.some(m => m.id === avatar.id);
      if (isMember) {
        if (prev.length <= 2) return prev; // Minimum 2 members for a group
        return prev.filter(m => m.id !== avatar.id);
      } else {
        return [...prev, avatar];
      }
    });
  };

  const handleModeSwitch = (mode: 'solo' | 'group') => {
    if (mode === chatMode) return;
    setChatMode(mode);
    setMessages([{
      id: Date.now().toString(),
      role: 'system',
      content: mode === 'solo' 
        ? `Switched to private chat with ${currentAvatar.name}` 
        : `Created a group chat with ${groupMembers.map(m => m.name).join(', ')}`,
      timestamp: new Date()
    }]);
  };

  const handleSetBackground = (avatarId: string, imageUrl: string) => {
    setAvatarBackgrounds(prev => ({
      ...prev,
      [avatarId]: imageUrl
    }));
    // 同时设置为聊天背景
    setChatBackground(imageUrl);
    localStorage.setItem('aura-chat-background', imageUrl);
  };

  const handleRemoveBackground = (avatarId: string) => {
    setAvatarBackgrounds(prev => {
      const newBackgrounds = { ...prev };
      delete newBackgrounds[avatarId];
      return newBackgrounds;
    });
  };

  // 获取当前角色的头像图片（优先级：角色独立头像 > 角色背景 > 默认图片）
  const characterImage = getAvatarImage(currentAvatar.id) || avatarBackgrounds[currentAvatar.id] || `https://picsum.photos/seed/${currentAvatar.seed}/800/1200`;



  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      
      {/* Left Pane: Character Portrait & Selection (Immersive) */}
      <div className="hidden md:flex w-1/3 lg:w-2/5 relative border-r border-zinc-800 flex-col">
        {chatMode === 'solo' ? (
          <>
            <img 
              src={characterImage} 
              alt={currentAvatar.name} 
              className="absolute inset-0 w-full h-full object-cover opacity-80 transition-opacity duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
          </>
         ) : (
           <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 bg-zinc-950">
             {groupMembers.slice(0, 4).map(avatar => (
               <div key={avatar.id} className="relative w-full h-full">
                 <img 
                   src={getAvatarImage(avatar.id) || avatarBackgrounds[avatar.id] || `https://picsum.photos/seed/${avatar.seed}/400/600`}
                   alt={avatar.name} 
                   className="w-full h-full object-cover opacity-60"
                   referrerPolicy="no-referrer"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent"></div>
                 <span className="absolute bottom-2 left-2 text-xs font-bold text-white/80">{avatar.name}</span>
               </div>
             ))}
             <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
           </div>
         )}
        
        <div className="absolute bottom-0 left-0 w-full p-8 z-10">
          {chatMode === 'solo' ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight text-white">{currentAvatar.name}</h1>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
              </div>
              <p className="text-lg text-zinc-300 font-medium mb-6">
                {currentAvatar.tagline}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight text-white">Group Chat</h1>
                <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
              </div>
              <p className="text-sm text-zinc-300 font-medium mb-6">
                {groupMembers.length} lovers in the chat
              </p>
            </>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-zinc-900/80 backdrop-blur-md rounded-xl p-1.5 border border-zinc-800/50 max-w-sm mb-6">
            <button
              onClick={() => handleModeSwitch('solo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                chatMode === 'solo' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Heart size={16} />
              Solo
            </button>
            <button
              onClick={() => handleModeSwitch('group')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                chatMode === 'group' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users size={16} />
              Group
            </button>
          </div>

          {/* Avatar Switcher / Group Selector */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users size={14} />
              {chatMode === 'solo' ? 'Select Avatar' : 'Manage Group Members'}
            </h3>
            <div className="flex flex-col gap-2 bg-zinc-900/80 backdrop-blur-md rounded-xl p-2 border border-zinc-800/50 max-w-sm">
              {AVATARS.map((avatar) => {
                const isSelected = chatMode === 'solo' 
                  ? currentAvatar.id === avatar.id 
                  : groupMembers.some(m => m.id === avatar.id);

                 return (
                   <button
                     key={avatar.id}
                     onClick={() => chatMode === 'solo' ? switchAvatar(avatar) : toggleGroupMember(avatar)}
                     className={`flex items-center gap-3 p-2 rounded-lg transition-all text-left ${
                       isSelected 
                         ? 'bg-indigo-500/20 border border-indigo-500/30 shadow-sm' 
                         : 'hover:bg-zinc-800 border border-transparent'
                     }`}
                   >
                     <img 
                       src={getAvatarImage(avatar.id) || avatarBackgrounds[avatar.id] || `https://picsum.photos/seed/${avatar.seed}/100/100`}
                       alt={avatar.name}
                       className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                       referrerPolicy="no-referrer"
                     />
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isSelected ? 'text-indigo-400' : 'text-zinc-200'}`}>
                          {avatar.name}
                        </div>
                        <div className="text-xs text-zinc-500 truncate max-w-[180px] flex items-center gap-1">
                          {MINIMAX_TTS_VOICES.find(v => v.id === getAvatarVoice(avatar.id))?.name || 'Voice'}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAvatarVoiceMenu(showAvatarVoiceMenu === avatar.id ? null : avatar.id);
                            }}
                            className="text-zinc-500 hover:text-pink-400"
                          >
                            <Mic size={10} />
                          </button>
                        </div>
                      </div>
                      {showAvatarVoiceMenu === avatar.id && (
                        <div className="absolute left-12 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                          {MINIMAX_TTS_VOICES.map(voice => (
                            <button
                              key={voice.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAvatarVoices({...avatarVoices, [avatar.id]: voice.id});
                                setShowAvatarVoiceMenu(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
                                getAvatarVoice(avatar.id) === voice.id
                                  ? 'bg-pink-500/20 text-pink-400'
                                  : 'text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              {voice.name}
                            </button>
                          ))}
                        </div>
                      )}
                      {chatMode === 'group' && (
                       <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`}>
                         {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                       </div>
                     )}
                      {(avatarBackgrounds[avatar.id] || avatarImages[avatar.id]) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBackground(avatar.id);
                            removeAvatarImage(avatar.id);
                          }}
                          className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Remove avatar & background"
                        >
                          <X size={12} />
                        </button>
                      )}
                   </button>
                 );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Chat Interface */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800/80 flex items-center px-6 justify-between bg-zinc-900/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="md:hidden relative">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                {chatMode === 'solo' ? <Heart size={18} className="text-pink-400" /> : <Users size={18} className="text-indigo-400" />}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full"></div>
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100 md:hidden">
                {chatMode === 'solo' ? currentAvatar.name : 'Group Chat'}
              </h2>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                {isTyping ? (
                  <span className="text-indigo-400">Typing...</span>
                ) : (
                  <>
                    <Zap size={12} className={heartbeatActive && chatMode === 'solo' ? "text-yellow-400" : "text-zinc-600"} />
                    {chatMode === 'group' ? 'Group Active' : (heartbeatActive ? 'Heartbeat Active' : 'Heartbeat Paused')}
                  </>
                )}
              </p>
            </div>
          </div>
            <div className="flex items-center gap-4">
              {/* Create Avatar Button */}
              <button
                onClick={() => setShowAvatarCreator(true)}
                className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">创建角色</span>
              </button>

              {/* Live2D Toggle Button */}
              <button
                onClick={() => setShowLive2D(!showLive2D)}
                className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  showLive2D 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                    : 'bg-zinc-800/50 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <Zap size={14} />
                <span className="hidden sm:inline">Live2D</span>
              </button>

              {/* Voice Chat Toggle Button */}
              <button
                onClick={() => setShowVoiceChat(!showVoiceChat)}
                className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  showVoiceChat 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-zinc-800/50 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <Mic size={14} />
                <span className="hidden sm:inline">语音</span>
              </button>

              {/* Model Selector - Two Level Dropdown */}
             <div className="relative">
               <button 
                 onClick={() => {
                   setShowModelMenu(!showModelMenu);
                   setSelectedProvider(getProviderGroupName(currentModel));
                 }}
                 className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-800/50 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
               >
                 <Bot size={14} className="text-indigo-400" />
                 <span className="hidden sm:inline">
                   {getProviderGroupName(currentModel)}
                 </span>
                 <ChevronDown size={14} className="text-zinc-500" />
               </button>
               
               {showModelMenu && (
                 <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 flex flex-col">
                   {/* Provider Tabs - Horizontal Scroll */}
                   <div className="flex overflow-x-auto border-b border-zinc-800 bg-zinc-950/50 p-2 gap-1.5 custom-scrollbar">
                     {Object.keys(AVAILABLE_MODELS).map(provider => (
                       <button
                         key={provider}
                         onClick={() => setSelectedProvider(provider)}
                         className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                           selectedProvider === provider
                             ? 'bg-indigo-500 text-white'
                             : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                         }`}
                       >
                         {provider}
                       </button>
                     ))}
                   </div>
                   
                   {/* Model List for Selected Provider */}
                   <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-72">
                     {AVAILABLE_MODELS[selectedProvider]?.map(model => (
                       <button
                         key={model.modelId}
                         onClick={() => {
                           setPreferredModel(model);
                           setCurrentModel(model);
                           setShowModelMenu(false);
                         }}
                         className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                           currentModel.modelId === model.modelId && currentModel.provider === model.provider
                             ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                             : 'text-zinc-300 hover:bg-zinc-800'
                         }`}
                       >
                         <div className="font-medium">{model.name}</div>
                         <div className="text-[10px] text-zinc-500 mt-0.5 font-mono truncate">{model.modelId}</div>
                       </button>
                     ))}
                   </div>
                 </div>
               )}
              </div>

            <button
              onClick={() => setVoiceMode(!voiceMode)}
              className={`transition-colors flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${
                voiceMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title="Toggle Voice Mode"
            >
              {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="hidden sm:inline">{voiceMode ? 'Voice ON' : 'Voice OFF'}</span>
            </button>
             {/* Memory Button */}
             <button 
               onClick={() => setShowMemoryPanel(!showMemoryPanel)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                 showMemoryPanel 
                   ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                   : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700'
               }`}
               title="View Memory"
             >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
               </svg>
               <span className="hidden sm:inline">Memory</span>
             </button>
             {chatMode === 'solo' || chatMode === 'group' ? (
              <button 
                onClick={() => setHeartbeatActive(!heartbeatActive)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  heartbeatActive 
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                }`}
                title={heartbeatActive ? 'Click to pause auto-reply' : 'Click to resume auto-reply'}
              >
                <Zap size={14} className={heartbeatActive ? "text-yellow-400" : ""} />
                <span className="hidden sm:inline">{heartbeatActive ? 'Auto' : 'Paused'}</span>
              </button>
            ) : null}
          </div>
        </header>

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 transition-all duration-300"
          style={chatBackground ? {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${chatBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : {}}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
              >
                {msg.role === 'system' ? (
                  <div className="text-xs font-medium text-zinc-500 bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800">
                    {msg.content}
                  </div>
                ) : (
                  <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                        {msg.role === 'user' ? 'You' : msg.senderName || 'Aura'}
                      </span>
                      {msg.source && msg.source !== 'direct' && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          via {msg.source}
                        </span>
                      )}
                    </div>
                    
                    <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                     {msg.imageUrl && (
                       <div className="rounded-2xl overflow-hidden border border-zinc-700/50 shadow-lg max-w-sm">
                         <img src={msg.imageUrl} alt="Selfie" className="w-full h-auto object-cover" />
                         {msg.senderId && (
                           <div className="p-2 bg-zinc-900/80 flex justify-center">
                             <button
                               onClick={() => handleSetBackground(msg.senderId!, msg.imageUrl!)}
                               className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200 px-2 py-1.5 rounded-md hover:bg-indigo-500/10 transition-colors"
                             >
                               <ImageIcon size={12} />
                               Set as Background
                             </button>
                           </div>
                         )}
                       </div>
                       )}

                      {msg.videoUrl && (
                        <div 
                          className="rounded-2xl overflow-hidden border border-zinc-700/50 shadow-lg max-w-sm cursor-pointer"
                          onClick={() => {
                            setGeneratedVideoUrl(msg.videoUrl!);
                            setShowVideoPlayer(true);
                          }}
                        >
                          <video
                            src={msg.videoUrl}
                            className="w-full h-auto object-cover"
                            muted
                            playsInline
                          />
                          <div className="p-2 bg-zinc-900/80 flex justify-center items-center gap-2">
                            <PlayCircle size={16} className="text-indigo-400" />
                            <span className="text-xs font-medium text-indigo-300">点击播放</span>
                          </div>
                        </div>
                      )}
                      
                      {msg.content && (
                        <div className={`px-4 py-3 rounded-2xl shadow-sm relative group ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-sm' 
                            : 'bg-zinc-900 text-zinc-100 rounded-tl-sm border border-zinc-700/50'
                        }`}>
                          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                          
                          {msg.audioData && (
                            <button 
                              onClick={() => playAudio(msg.audioData!)}
                              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1.5 rounded-md w-fit border border-indigo-500/20"
                            >
                              <PlayCircle size={14} />
                              Play Audio
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[10px] text-zinc-600 mt-1.5 font-medium">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Memory Panel */}
        <AnimatePresence>
          {showMemoryPanel && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="absolute right-0 top-16 bottom-0 w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 z-40 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-200">Memory & Preferences</h3>
                <button 
                  onClick={() => setShowMemoryPanel(false)}
                  className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={16} className="text-zinc-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* User Preferences */}
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Preferences</h4>
                  {userMemory.preferences.name && (
                    <div className="text-sm text-zinc-200 mb-1">Name: {userMemory.preferences.name}</div>
                  )}
                  {userMemory.preferences.interests && userMemory.preferences.interests.length > 0 && (
                    <div className="text-sm text-zinc-200 mb-1">
                      Interests: {userMemory.preferences.interests.join(', ')}
                    </div>
                  )}
                  {!userMemory.preferences.name && (!userMemory.preferences.interests || userMemory.preferences.interests.length === 0) && (
                    <div className="text-xs text-zinc-500">No preferences set yet</div>
                  )}
                </div>
                
                {/* Recent Memories */}
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Recent Memories</h4>
                  {userMemory.memories.slice(-5).reverse().map(memory => (
                    <div key={memory.id} className="text-sm text-zinc-300 mb-2 pb-2 border-b border-zinc-700/50 last:border-0">
                      <div className="text-xs text-zinc-500 mb-1">
                        {new Date(memory.timestamp).toLocaleString()} • {memory.type}
                      </div>
                      <div className="line-clamp-2">{memory.content}</div>
                    </div>
                  ))}
                  {userMemory.memories.length === 0 && (
                    <div className="text-xs text-zinc-500">No memories yet</div>
                  )}
                </div>

                {/* Clear Memory */}
                <button
                  onClick={() => {
                    if (confirm('Clear all memories?')) {
                      setUserMemory({
                        userId: 'default',
                        memories: [],
                        preferences: {},
                        emotionalTrends: []
                      });
                    }
                  }}
                  className="w-full mt-4 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                >
                  Clear All Memories
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live2D Floating Window - Resizable */}
        <AnimatePresence>
          {showLive2D && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              style={{
                width: live2DSize.width,
                height: live2DSize.height,
              }}
              className="fixed right-4 bottom-24 bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-700/50 z-50 overflow-hidden flex flex-col"
              ref={live2DRef}
            >
              {/* 拖动标题栏 */}
              <div 
                className="p-2 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center justify-between flex-shrink-0 cursor-move select-none"
                onMouseDown={(e) => {
                  if (!live2DRef.current || (e.target as HTMLElement).closest('button')) return;
                  e.preventDefault();
                  
                  const el = live2DRef.current;
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const rect = el.getBoundingClientRect();
                  const startRight = window.innerWidth - rect.right;
                  const startBottom = window.innerHeight - rect.bottom;
                  
                  const onMouseMove = (e: MouseEvent) => {
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;
                    el.style.right = `${Math.max(0, startRight - dx)}px`;
                    el.style.bottom = `${Math.max(0, startBottom - dy)}px`;
                  };
                  
                  const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                  };
                  
                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-xs font-medium text-zinc-300">Epsilon</span>
                </div>
                <div className="flex items-center gap-1">
                  {/* 最小化按钮 */}
                  <button 
                    onClick={() => setLive2DSize({ width: 200, height: 280 })}
                    className="p-1 hover:bg-zinc-700 rounded-full transition-colors"
                    title="最小化"
                  >
                    <span className="text-zinc-400 text-xs">−</span>
                  </button>
                  {/* 默认大小按钮 */}
                  <button 
                    onClick={() => setLive2DSize({ width: 288, height: 384 })}
                    className="p-1 hover:bg-zinc-700 rounded-full transition-colors"
                    title="默认大小"
                  >
                    <span className="text-zinc-400 text-xs">◻</span>
                  </button>
                  {/* 最大化按钮 */}
                  <button 
                    onClick={() => setLive2DSize({ width: 450, height: 600 })}
                    className="p-1 hover:bg-zinc-700 rounded-full transition-colors"
                    title="最大化"
                  >
                    <span className="text-zinc-400 text-xs">□</span>
                  </button>
                  {/* 关闭按钮 */}
                  <button 
                    onClick={() => setShowLive2D(false)}
                    className="p-1 hover:bg-zinc-700 rounded-full transition-colors"
                  >
                    <X size={12} className="text-zinc-400" />
                  </button>
                </div>
              </div>
              
              {/* Live2D 内容 */}
              <div className="flex-1 overflow-hidden">
                <Live2DCharacter 
                  modelPath={live2DModelPath}
                  onExpressionChange={(expression) => {
                    console.log('Expression changed:', expression);
                  }}
                  onClothingChange={(state) => {
                    console.log('Clothing changed:', state);
                  }}
                />
              </div>
              
              {/* 右下角缩放手柄 */}
              <div
                className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startWidth = live2DSize.width;
                  const startHeight = live2DSize.height;
                  
                  const onMouseMove = (e: MouseEvent) => {
                    const newWidth = Math.max(200, Math.min(600, startWidth + (e.clientX - startX)));
                    const newHeight = Math.max(280, Math.min(800, startHeight + (e.clientY - startY)));
                    setLive2DSize({ width: newWidth, height: newHeight });
                  };
                  
                  const onMouseUp = () => {
                    setIsResizing(false);
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                  };
                  
                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }}
              >
                <svg 
                  className="absolute bottom-1 right-1 w-3 h-3 text-zinc-500" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Chat Panel */}
        <AnimatePresence>
          {showVoiceChat && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="absolute right-0 top-16 bottom-0 w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 z-40 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-200">语音聊天</h3>
                <button 
                  onClick={() => setShowVoiceChat(false)}
                  className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={16} className="text-zinc-400" />
                </button>
              </div>
              <div className="flex-1 p-4">
                <VoiceChat 
                  onTranscript={async (text) => {
                    console.log('Voice transcript:', text);
                    if (!text.trim()) return;
                    
                    // 创建用户消息
                    const requestMsg: Message = {
                      id: Date.now().toString(),
                      role: 'user',
                      content: text,
                      timestamp: new Date(),
                      source: 'direct'
                    };
                    
                    // 添加到消息列表
                    const newMessages = [...messages, requestMsg];
                    setMessages(newMessages);
                    setIsTyping(true);
                    
                    try {
                      // 生成AI回复
                      const memoryContext = generateMemoryContext(userMemory);
                      const aiResponse = await generateResponse(newMessages, currentAvatar, chatMode === 'group', chatMode === 'group' ? groupMembers : [], memoryContext);
                      
                      const modelMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        role: 'model',
                        content: aiResponse,
                        timestamp: new Date(),
                        source: 'direct',
                        senderId: currentAvatar.id,
                        senderName: currentAvatar.name
                      };
                      setMessages(prev => [...prev, modelMessage]);
                      
                      // 语音播放回复
                      if (aiResponse) {
                        const speech = await generateSpeech(aiResponse, getAvatarVoice(currentAvatar.id));
                        if (speech) {
                          const audio = new Audio(`data:${speech.mimeType};base64,${speech.data}`);
                          audio.play();
                        }
                      }
                    } catch (error) {
                      console.error('Error generating response:', error);
                    } finally {
                      setIsTyping(false);
                    }
                  }}
                  onSpeaking={(speaking) => {
                    setIsVoiceSpeaking(speaking);
                  }}
                />
                
                {/* 语音提示 */}
                <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-400">
                    💡 点击麦克风按钮开始语音对话
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    支持中文、英文、日文等多种语言
                  </p>
                </div>

                {/* 语音状态 */}
                {isVoiceSpeaking && (
                  <div className="mt-4 flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs">正在听取语音...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 bg-zinc-900/50 backdrop-blur-md border-t border-zinc-800/80">
          <div className="max-w-4xl mx-auto relative flex items-center gap-2">
            {chatMode === 'solo' && (
              <>
                <label
                  className="p-3 text-zinc-400 hover:text-green-400 hover:bg-zinc-800 rounded-full transition-all cursor-pointer"
                  title="Upload Custom Avatar"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadAvatarImage}
                    className="hidden"
                  />
                  <ImageIcon size={20} />
                </label>
                <button
                  onClick={handleRequestSelfie}
                  disabled={isTyping}
                  className="p-3 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-full transition-all disabled:opacity-50"
                  title="Request Selfie"
                >
                  <Camera size={20} />
                </button>
                <button
                  onClick={() => setShowAlbum(true)}
                  className="p-3 text-zinc-400 hover:text-pink-400 hover:bg-zinc-800 rounded-full transition-all"
                  title="View Album"
                >
                  <GalleryHorizontal size={20} />
                </button>
                {getAvatarImage(currentAvatar.id) && (
                  <button
                    onClick={handleClearCustomAvatar}
                    className="p-3 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-full transition-all"
                    title="Remove Avatar"
                  >
                    <X size={20} />
                  </button>
                )}
              </>
            )}
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  const val = e.target.value;
                  setInput(val);
                  // Show mention picker when @ is typed in group chat
                  if (chatMode === 'group' && val.endsWith('@')) {
                    setShowMentionPicker(true);
                    setSelectedMentionTarget(null);
                  } else if (chatMode === 'group' && val.includes('@')) {
                    // Keep picker open while typing @name
                  } else {
                    setShowMentionPicker(false);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={selfieMode ? '描述你想要的自拍（如：穿着丝袜）...' : (chatMode === 'solo' ? `Message ${currentAvatar.name}...` : `Message the group (@ for options)...`)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-full pl-5 pr-12 py-3.5 text-[15px] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
              />
              {showMentionPicker && chatMode === 'group' && (
                <div className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setSelectedMentionTarget('all');
                      setInput(input.replace(/@$/, '@ALL '));
                      setShowMentionPicker(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Users size={14} className="text-indigo-400" />
                    <span className="font-medium">ALL</span>
                    <span className="text-zinc-500 text-xs">- 所有角色回复</span>
                  </button>
                  {groupMembers.map(avatar => (
                    <button
                      key={avatar.id}
                      onClick={() => {
                        setSelectedMentionTarget(avatar);
                        setInput(input.replace(/@$/, `@${avatar.name} `));
                        setShowMentionPicker(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <img src={`https://picsum.photos/seed/${avatar.seed}/30/30`} alt={avatar.name} className="w-5 h-5 rounded-full" />
                      <span className="font-medium">{avatar.name}</span>
                      <span className="text-zinc-500 text-xs">- {avatar.tagline}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="absolute right-1.5 top-1.5 flex gap-1">
                <button
                  onClick={() => setHeartbeatActive(!heartbeatActive)}
                  className={`p-2 rounded-full transition-colors ${
                    heartbeatActive 
                      ? 'text-yellow-400 hover:bg-yellow-500/20' 
                      : 'text-zinc-500 hover:bg-zinc-700'
                  }`}
                  title={heartbeatActive ? 'Pause auto-reply (ESC)' : 'Resume auto-reply (ESC)'}
                >
                  <Pause size={18} />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full transition-colors shadow-sm"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Creator Modal */}
      <AnimatePresence>
        {showAvatarCreator && (
          <AvatarCreator
            onComplete={(customization, avatarUrl, backgroundUrl) => {
              console.log('Avatar created:', customization, avatarUrl, backgroundUrl);
              
              // 保存头像图片到当前角色
              if (avatarUrl) {
                setAvatarImage(currentAvatar.id, avatarUrl);
              }
              
              // 保存背景图片到当前角色
              if (backgroundUrl) {
                handleSetBackground(currentAvatar.id, backgroundUrl);
              }
              
              // 更新当前角色名称
              if (customization.name) {
                setCurrentAvatar(prev => ({
                  ...prev,
                  name: customization.name
                }));
              }
              
              setShowAvatarCreator(false);
            }}
            onCancel={() => setShowAvatarCreator(false)}
          />
        )}
      </AnimatePresence>

      {/* Character Album */}
      <CharacterAlbum
        avatarId={currentAvatar.id}
        avatarName={currentAvatar.name}
        isOpen={showAlbum}
        onClose={() => setShowAlbum(false)}
      />

      {/* Video Player Modal */}
      <AnimatePresence>
        {showVideoPlayer && generatedVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVideoPlayer(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowVideoPlayer(false)}
                className="absolute -top-10 right-0 text-white hover:text-zinc-300 text-xl"
              >
                ✕ 关闭
              </button>
              <video
                src={generatedVideoUrl}
                controls
                autoPlay
                loop
                className="w-full rounded-2xl shadow-2xl"
              />
              <div className="mt-4 flex gap-3 justify-center">
                <a
                  href={generatedVideoUrl}
                  download="aura-video.mp4"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
                >
                  下载视频
                </a>
                <button
                  onClick={() => setShowVideoPlayer(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

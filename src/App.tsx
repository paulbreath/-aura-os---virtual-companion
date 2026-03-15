import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Message, Avatar, AVATARS, generateResponse, generateAutonomousAction, generateSelfie, generateSpeech, setPreferredModel, getPreferredModel, AVAILABLE_MODELS, ModelConfig, MINIMAX_TTS_VOICES } from './services/aiService';
import { Heart, Briefcase, MessageCircle, Phone, Settings, Send, Bot, Smartphone, Zap, Camera, Image as ImageIcon, Users, Volume2, VolumeX, PlayCircle, MessageSquare, ChevronDown, X, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
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
  const [customAvatarImage, setCustomAvatarImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('aura-custom-avatar-image') || null;
    } catch (e) {
      return null;
    }
  });

  // Save custom avatar image to localStorage
  useEffect(() => {
    if (customAvatarImage) {
      localStorage.setItem('aura-custom-avatar-image', customAvatarImage);
    }
  }, [customAvatarImage]);

  // Save voice selection to localStorage
  useEffect(() => {
    localStorage.setItem('aura-selected-voice', selectedVoice);
  }, [selectedVoice]);

  const handleUploadAvatarImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomAvatarImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearCustomAvatar = () => {
    setCustomAvatarImage(null);
    localStorage.removeItem('aura-custom-avatar-image');
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
          const result = await generateSpeech(testText, selectedVoice);
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

   // Heartbeat System
  useEffect(() => {
    if (!heartbeatActive) return;

    const interval = setInterval(async () => {
      setLastHeartbeat(new Date());
      
      if (Math.random() > 0.9 && !isTyping) {
        const recentContext = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
        
         try {
           const action = await generateAutonomousAction(currentAvatar, recentContext, chatMode === 'group', chatMode === 'group' ? groupMembers : []);
           if (action.shouldAct && action.message) {
            let audioData = undefined;
            if (voiceMode) {
              const speech = await generateSpeech(action.message, selectedVoice);
              if (speech) audioData = speech;
            }

            const newMsg: Message = {
              id: Date.now().toString(),
              role: 'model',
              content: action.message,
              timestamp: new Date(),
              source: action.platform as any || 'direct',
              audioData
            };

            setMessages(prev => [...prev, newMsg]);
            if (audioData) playAudio(audioData);
          }
        } catch (e) {
          console.error("Heartbeat error", e);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [heartbeatActive, currentAvatar, messages, isTyping, voiceMode]);

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

    try {
      if (chatMode === 'solo') {
        const aiResponse = await generateResponse([...messages, newUserMsg], currentAvatar);
        
        let audioData = undefined;
        if (voiceMode) {
          const speech = await generateSpeech(aiResponse, selectedVoice);
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
      } else {
        // Group Chat Logic
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
        
        for (const avatar of respondingAvatars) {
          setIsTyping(true);
          const aiResponse = await generateResponse(currentMessages, avatar, true, groupMembers);
          
          let audioData = undefined;
          if (voiceMode) {
            const speech = await generateSpeech(aiResponse, selectedVoice);
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
          currentMessages = [...currentMessages, newMsg];
          
          if (audioData) {
            await playAudio(audioData);
          } else {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRequestSelfie = async () => {
    setIsTyping(true);
    
    const requestMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: "Can you send me a selfie? 📸",
      timestamp: new Date(),
      source: 'direct'
    };
    setMessages(prev => [...prev, requestMsg]);

     try {
        // Get more context for better scene generation
        const recentContext = messages.slice(-6).map(m => `${m.senderName || m.role}: ${m.content}`).join('\n');
        const imageUrl = await generateSelfie(currentAvatar, recentContext, requestMsg.content, chatMode === 'group', chatMode === 'group' ? groupMembers : []);
      
      if (imageUrl) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: "Here's a picture for you!",
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
  };

  const handleRemoveBackground = (avatarId: string) => {
    setAvatarBackgrounds(prev => {
      const newBackgrounds = { ...prev };
      delete newBackgrounds[avatarId];
      return newBackgrounds;
    });
  };

  const characterImage = customAvatarImage || avatarBackgrounds[currentAvatar.id] || `https://picsum.photos/seed/${currentAvatar.seed}/800/1200`;



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
                   src={avatarBackgrounds[avatar.id] || `https://picsum.photos/seed/${avatar.seed}/400/600`}
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
                       src={avatarBackgrounds[avatar.id] || `https://picsum.photos/seed/${avatar.seed}/100/100`}
                       alt={avatar.name}
                       className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                       referrerPolicy="no-referrer"
                     />
                     <div className="flex-1">
                       <div className={`text-sm font-medium ${isSelected ? 'text-indigo-400' : 'text-zinc-200'}`}>
                         {avatar.name}
                       </div>
                       <div className="text-xs text-zinc-500 truncate max-w-[180px]">{avatar.tagline}</div>
                     </div>
                     {chatMode === 'group' && (
                       <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`}>
                         {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                       </div>
                     )}
                     {avatarBackgrounds[avatar.id] && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleRemoveBackground(avatar.id);
                         }}
                         className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                         title="Remove background"
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

              {/* Voice Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                  className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-800/50 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                >
                  <Mic size={14} className="text-pink-400" />
                  <span className="hidden sm:inline">
                    {MINIMAX_TTS_VOICES.find(v => v.id === selectedVoice)?.name || '语音'}
                  </span>
                  <ChevronDown size={14} className="text-zinc-500" />
                </button>
                
                {showVoiceMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {MINIMAX_TTS_VOICES.map(voice => (
                        <button
                          key={voice.id}
                          onClick={() => {
                            setSelectedVoice(voice.id);
                            setShowVoiceMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedVoice === voice.id
                              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                              : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <div className="font-medium">{voice.name}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{voice.description}</div>
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
            {chatMode === 'solo' && (
              <button 
                onClick={() => setHeartbeatActive(!heartbeatActive)}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Toggle Heartbeat"
              >
                <Zap size={18} className={heartbeatActive ? "text-yellow-400" : ""} />
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
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
                {customAvatarImage && (
                  <button
                    onClick={handleClearCustomAvatar}
                    className="p-3 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-full transition-all"
                    title="Remove Custom Avatar"
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={chatMode === 'solo' ? `Message ${currentAvatar.name}...` : `Message the group (use @Name)...`}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-full pl-5 pr-12 py-3.5 text-[15px] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-1.5 top-1.5 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full transition-colors shadow-sm"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

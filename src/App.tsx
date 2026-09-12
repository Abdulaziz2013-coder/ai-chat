import React, { useState, useEffect, useRef } from 'react';
import { ThreeAvatar } from './components/ThreeAvatar';
import { ChatView } from './components/ChatView';
import { CreatorModal } from './components/CreatorModal';
import { AvatarMood, ChatMessage, ModelStyle, ServerInfo } from './types';
import { speechService } from './services/speechService';
import confetti from 'canvas-confetti';
import {
  Bot,
  Award,
  Radio,
  Sparkles,
  Volume2,
  VolumeX,
  Cpu,
  Layers,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        "Salom! Men — **Abdulaziz Ai**man. ChatGPT va Gemini'dan ancha chaqqon, do'stona va ilg'or 3D sun'iy intellekt tizimiman. \n\nMeni **78-maktab 7-B sinfidagi Abdulaziz Xo'janazarov** yaratgan! 👑\n\nSiz men bilan yozma yoki mikrofondan foydalanib ovozli tarzda gaplasha olasiz. Savolingiz bormi?",
      timestamp: Date.now(),
      isCreatorMentioned: true,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState<AvatarMood>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [modelStyle, setModelStyle] = useState<ModelStyle>('cyber_robot');
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'both' | 'avatar' | 'chat'>('both');

  const [serverInfo] = useState<ServerInfo>({
    serverName: 'Abdulaziz Ai',
    creator: "78-maktab 7-B sinfidagi Abdulaziz Xo'janazarov",
    status: 'online',
    pingMs: 24,
  });

  // Handle sending a new message
  const handleSendMessage = async (text: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);
    setMood('thinking');
    speechService.playBeep('send');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Server javob bermadi');
      }

      const data = await res.json();
      const replyContent = data.text || 'Kechirasiz, javob olishda xatolik yuz berdi.';
      const isCreatorMentioned =
        data.isCreatorMentioned ||
        /abdulaziz|78-maktab|7-b/i.test(replyContent) ||
        /(kim yaratgan|kim yasagan)/i.test(text);

      const botMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: Date.now(),
        isCreatorMentioned: isCreatorMentioned,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Trigger celebratory effects if creator is mentioned
      if (isCreatorMentioned) {
        setMood('proud');
        speechService.playBeep('pride');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#fbbf24', '#34d399', '#a855f7'],
        });
      } else {
        setMood('idle');
        speechService.playBeep('receive');
      }

      // Auto-speak voice if enabled
      if (autoSpeak) {
        handleSpeakMessage(replyContent, isCreatorMentioned);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      // Fallback response guaranteed
      let fallbackText = "Kechirasiz, vaqtincha tarmoq xatoligi yuz berdi.";
      if (/(kim yaratgan|kim yasagan|muallif)/i.test(text)) {
        fallbackText = "Meni 78-maktab 7-B sinfdagi Abdulaziz Xo'janazarov yaratgan! U meni eng zamonaviy texnologiyalar asosida yaratgan daho dasturchidir.";
        setMood('proud');
        speechService.playBeep('pride');
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
      }

      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: fallbackText,
        timestamp: Date.now(),
        isCreatorMentioned: /(abdulaziz|78-maktab)/i.test(fallbackText),
      };

      setMessages((prev) => [...prev, errorMessage]);
      if (autoSpeak) {
        handleSpeakMessage(fallbackText);
      }
      setMood('idle');
    } finally {
      setIsLoading(false);
    }
  };

  // Speak message out loud via Web Speech API
  const handleSpeakMessage = (text: string, isPride = false) => {
    speechService.stop();
    setIsSpeaking(true);
    setMood(isPride ? 'proud' : 'speaking');

    speechService.speak(text, {
      rate: 1.0,
      pitch: 1.05,
      onStart: () => {
        setIsSpeaking(true);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setMood('idle');
      },
    });
  };

  const handleClearChat = () => {
    speechService.stop();
    setIsSpeaking(false);
    setMood('idle');
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b13] text-slate-100 overflow-hidden font-sans">
      {/* Top Main Navigation Header */}
      <header className="h-16 px-4 md:px-6 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between shrink-0 z-30">
        {/* Brand & Server Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/25">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                Abdulaziz Ai
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Server: {serverInfo.serverName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs md:max-w-none">
              Gemini & ChatGPT'dan ustun 3D ovozli sun'iy intellekt
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Creator Honor Button */}
          <button
            id="btn-creator-honor-main"
            onClick={() => setIsCreatorModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-sm transition-all"
            title="Yaratuvchi: 78-maktab 7-B Abdulaziz Xo'janazarov"
          >
            <Award className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="hidden md:inline">
              Yaratuvchi: 78-maktab 7-B Abdulaziz Xo'janazarov
            </span>
            <span className="md:hidden">Abdulaziz</span>
          </button>

          {/* Quick Voice Auto-Speak status */}
          <button
            id="btn-global-voice-toggle"
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
              autoSpeak
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
            }`}
            title={autoSpeak ? "Ovozli o'qish yoqilgan" : "Ovozli o'qish o'chirilgan"}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden lg:inline">{autoSpeak ? 'Ovoz: ON' : 'Ovoz: OFF'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex items-center justify-around border-b border-slate-800 bg-slate-950/60 py-1.5 px-3">
        <button
          id="btn-tab-both"
          onClick={() => setActiveMobileTab('both')}
          className={`px-3 py-1 rounded-lg text-xs font-medium ${
            activeMobileTab === 'both' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
          }`}
        >
          Umumiy ko'rinish
        </button>
        <button
          id="btn-tab-avatar"
          onClick={() => setActiveMobileTab('avatar')}
          className={`px-3 py-1 rounded-lg text-xs font-medium ${
            activeMobileTab === 'avatar' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
          }`}
        >
          3D Model
        </button>
        <button
          id="btn-tab-chat"
          onClick={() => setActiveMobileTab('chat')}
          className={`px-3 py-1 rounded-lg text-xs font-medium ${
            activeMobileTab === 'chat' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
          }`}
        >
          Chat muloqot
        </button>
      </div>

      {/* Main App Body */}
      <main className="flex-1 flex flex-col md:flex-row p-3 md:p-5 gap-4 overflow-hidden relative">
        {/* Left Side: 3D Model Stage */}
        <section
          className={`relative flex flex-col rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-slate-800/90 shadow-2xl overflow-hidden transition-all duration-300 ${
            activeMobileTab === 'chat' ? 'hidden md:flex md:w-5/12 lg:w-1/2' : ''
          } ${activeMobileTab === 'avatar' ? 'flex-1 w-full' : ''} ${
            activeMobileTab === 'both' ? 'h-64 md:h-auto md:w-5/12 lg:w-1/2' : ''
          }`}
        >
          {/* 3D Model Viewport Component */}
          <div className="flex-1 relative w-full h-full min-h-[220px]">
            <ThreeAvatar
              mood={mood}
              isSpeaking={isSpeaking}
              modelStyle={modelStyle}
              onModelStyleChange={setModelStyle}
            />
          </div>

          {/* 3D Model Meta Info Card at Bottom */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="font-semibold text-white">Abdulaziz AI Core v2.5</span>
                <p className="text-[10px] text-slate-400">
                  Interaktiv 3D boshqaruv &bull; Sichqoncha bilan aylantiring
                </p>
              </div>
            </div>

            {/* Speaking audio wave indicator */}
            {isSpeaking && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono">
                <span className="w-1.5 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-4 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-2 bg-cyan-400 rounded-full animate-bounce" />
                <span className="ml-1">Ovoz berilmoqda</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Chat & Interaction Interface */}
        <section
          className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${
            activeMobileTab === 'avatar' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ChatView
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onSpeakMessage={(text) => handleSpeakMessage(text)}
            isSpeaking={isSpeaking}
            autoSpeak={autoSpeak}
            onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
            onOpenCreatorModal={() => setIsCreatorModalOpen(true)}
            serverInfo={serverInfo}
          />
        </section>
      </main>

      {/* Creator Modal (Abdulaziz Xo'janazarov 78-maktab 7-B) */}
      <CreatorModal
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)}
        onAskCreator={() => handleSendMessage("Seni kim yaratgan?")}
      />
    </div>
  );
}

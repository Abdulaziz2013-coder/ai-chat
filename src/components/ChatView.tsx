import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Award,
  Radio,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { ChatMessage, ServerInfo } from '../types';

interface ChatViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onSpeakMessage: (text: string) => void;
  isSpeaking: boolean;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onOpenCreatorModal: () => void;
  serverInfo: ServerInfo;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  onSpeakMessage,
  isSpeaking,
  autoSpeak,
  onToggleAutoSpeak,
  onOpenCreatorModal,
  serverInfo,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'uz-UZ'; // Fallback handles other languages automatically

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition', err);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    {
      title: "Seni kim yaratgan?",
      prompt: "Seni kim yaratgan?",
      badge: "Eng muhim",
      highlight: true,
    },
    {
      title: "ChatGPT va Geminidan farqing?",
      prompt: "Sening ChatGPT va Gemini dan afzalliging va qanday kuchli tomonlaring bor?",
      badge: "Taqqoslash",
    },
    {
      title: "O'zbek tilida gaplashish",
      prompt: "Menga o'zing haqingda gapirib ber, qanday ishlarni bajara olasan?",
      badge: "Tanishuv",
    },
    {
      title: "Dasturlash / Kod yozish",
      prompt: "Menga Python yoki JavaScript tilida bitta qiziqarli mini o'yin kodi yozib ber.",
      badge: "Kod",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
      {/* Chat Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-900" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">
                Abdulaziz AI
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Server: {serverInfo.serverName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              3D Ovozli intellekt &bull; 78-maktab 7-B
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Creator Profile Badge Trigger */}
          <button
            id="btn-creator-badge-header"
            onClick={onOpenCreatorModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm"
            title="Yaratuvchi Abdulaziz Xo'janazarov haqida"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Muallif: Abdulaziz</span>
          </button>

          {/* Voice Auto-Speak Toggle */}
          <button
            id="btn-toggle-auto-speak"
            onClick={onToggleAutoSpeak}
            className={`p-2 rounded-lg transition-all border ${
              autoSpeak
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
            title={autoSpeak ? "Ovozli o'qish: Yoqilgan" : "Ovozli o'qish: O'chirilgan"}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Clear Chat */}
          {messages.length > 0 && (
            <button
              id="btn-clear-chat"
              onClick={onClearChat}
              className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors"
              title="Suhbatni tozalash"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-md mx-auto">
            <div className="relative mb-4 flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-xl shadow-cyan-500/10">
              <Zap className="w-8 h-8" />
              <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-md -z-10" />
            </div>

            <h2 className="text-lg font-bold text-white mb-1">
              Abdulaziz AI tizimiga xush kelibsiz!
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Gemini va ChatGPT'dan ancha tezkor va qobiliyatli o'zbekcha 3D sun'iy intellekt. 
              Siz u bilan ovozli yoki yozma ravishda gaplasha olasiz!
            </p>

            {/* Quick Prompt Cards */}
            <div className="w-full space-y-2 text-left">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                Tezkor savollar:
              </p>
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  id={`btn-prompt-${idx}`}
                  onClick={() => onSendMessage(item.prompt)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all text-left ${
                    item.highlight
                      ? 'bg-cyan-950/40 hover:bg-cyan-900/50 border-cyan-500/40 text-cyan-200 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <span className="font-medium">{item.title}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                      item.highlight
                        ? 'bg-cyan-400/20 text-cyan-300 font-bold'
                        : 'bg-slate-700/60 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isCopied = copiedId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 p-0.5 mt-1 shadow-sm">
                    <div className="w-full h-full rounded-[6px] bg-slate-950 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-600/20'
                      : msg.isCreatorMentioned
                      ? 'bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-400/50 text-slate-100 rounded-tl-none shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800/70 border border-slate-700/60 text-slate-100 rounded-tl-none shadow-sm'
                  }`}
                >
                  {/* Creator Special Ribbon */}
                  {msg.isCreatorMentioned && !isUser && (
                    <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-amber-500/30 text-amber-300 text-xs font-semibold">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>78-maktab 7-B &bull; Abdulaziz Xo'janazarov</span>
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="whitespace-pre-wrap font-sans text-[13.5px]">
                    {msg.content}
                  </div>

                  {/* Message Footer Controls */}
                  <div
                    className={`mt-2.5 pt-2 flex items-center justify-between text-[11px] ${
                      isUser
                        ? 'border-t border-sky-400/30 text-sky-100'
                        : 'border-t border-slate-700/40 text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {!isUser && (
                      <div className="flex items-center gap-1">
                        <button
                          id={`btn-copy-${msg.id}`}
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Nusxalash"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          id={`btn-speak-${msg.id}`}
                          onClick={() => onSpeakMessage(msg.content)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                          title="Ovozli eshitish"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-700 p-0.5 mt-1 flex items-center justify-center text-slate-300 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-500/40 p-0.5 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl rounded-tl-none bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
              </span>
              <span className="text-slate-400">Abdulaziz AI o'ylamoqda...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Listening Waveform Bar (when speech-to-text is active) */}
      {isListening && (
        <div className="px-4 py-2 bg-cyan-950/80 border-t border-cyan-500/40 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-semibold text-cyan-300">
              Sizni tinglamoqdaman... Gapiring!
            </span>
          </div>
          <button
            id="btn-stop-listening"
            onClick={handleToggleListening}
            className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
          >
            To'xtatish
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/70">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          {/* Microphone button for STT */}
          {speechSupported && (
            <button
              id="btn-mic-toggle"
              type="button"
              onClick={handleToggleListening}
              className={`p-3 rounded-xl border transition-all shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/30 animate-pulse'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-cyan-300 hover:border-cyan-500/40'
              }`}
              title={isListening ? "Tinglashni to'xtatish" : "Ovoz bilan gapirish (Mikrofon)"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Text Input Area */}
          <div className="flex-1 relative">
            <textarea
              id="input-chat-prompt"
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Abdulaziz AI'dan so'rang (masalan: 'Seni kim yaratgan?')..."
              rows={1}
              className="w-full resize-none py-3 px-3.5 pr-10 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 max-h-32 transition-colors"
            />
          </div>

          {/* Send Button */}
          <button
            id="btn-send-message"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-500/20 shrink-0"
            title="Xabar yuborish (Enter)"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
          <span>Shift+Enter - yangi qator</span>
          <span className="flex items-center gap-1 text-cyan-500/80 font-mono">
            <span>●</span> Server: Abdulaziz Ai
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Download, RefreshCw, Layers, Info, Type, Image as ImageIcon, UserPlus, X, Plus, Settings, MessageCircle, BookOpen, Menu, ChevronLeft, LogOut, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiKeyGuard } from './components/ApiKeyGuard';
import { ImageUploader } from './components/ImageUploader';
import { ReferenceManager } from './components/ReferenceManager';
import { TitleGenerator } from './components/TitleGenerator';
import { generateThumbnail } from './lib/gemini';
import { useCredits } from './contexts/CreditsContext';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { API_URL } from './lib/config';
import CreditsBadge from './components/CreditsBadge';
import Paywall from './components/Paywall';
import SettingsModal from './components/SettingsModal';

interface ReferenceImage {
  id: string;
  data: string;
  tag: string;
}

interface ChatMessage {
  id: string;
  type: 'user-prompt' | 'result' | 'error' | 'loading' | 'base-image';
  prompt?: string;
  image?: string;
  baseImage?: string;
  error?: string;
  source?: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

type Tab = 'thumbnails' | 'titles';

/* Inline SVG logo for avatar */
const AppLogo = () => (
  <div className="w-7 h-7 rounded-full app-logo-avatar flex items-center justify-center shrink-0">
    IA
  </div>
);

const UserAvatar = () => (
  <div className="w-7 h-7 rounded-full bg-[#27272a] border border-[#3a3a3a] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#999]">
    U
  </div>
);

export default function App() {
  const { credits, useCredits: spendCredits, hasEnoughCredits, loading: creditsLoading, plan } = useCredits();
  const { user, signOut } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('thumbnails');
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [downloadCount, setDownloadCount] = useState(1);
  const [showReferences, setShowReferences] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close sidebar on mobile by default and handle resize
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      // Only set status if we crossed the 768px breakpoint
      // This prevents the menu from closing when the mobile browser hides/shows the address bar
      if (window.innerWidth < 768 && lastWidth >= 768) {
        setSidebarOpen(false);
      } else if (window.innerWidth >= 768 && lastWidth < 768) {
        setSidebarOpen(true);
      }
      lastWidth = window.innerWidth;
    };

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== SUPABASE: Sanitize messages for storage (strip base64, skip loading) =====
  const sanitizeMessages = (msgs: ChatMessage[]): ChatMessage[] => {
    return msgs
      .filter(m => m.type !== 'loading')
      .map(m => ({
        ...m,
        // Keep URL images, strip base64 (too large for DB)
        image: m.image?.startsWith('data:') ? undefined : m.image,
        baseImage: m.baseImage?.startsWith('data:') ? undefined : m.baseImage,
      }));
  };

  // ===== SUPABASE: Load chat sessions on mount =====
  useEffect(() => {
    if (!user) {
      setChatSessions([]);
      setSessionsLoading(false);
      return;
    }

    const loadSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('id, title, messages, created_at, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error loading chat sessions:', error);
          return;
        }

        if (data) {
          setChatSessions(data.map(row => ({
            id: row.id,
            title: row.title,
            messages: (row.messages as ChatMessage[]) || [],
            timestamp: new Date(row.updated_at).getTime(),
          })));
        }
      } catch (err) {
        console.error('Error loading sessions:', err);
      } finally {
        setSessionsLoading(false);
      }
    };

    loadSessions();
  }, [user]);

  // ===== SUPABASE: Save/update a session =====

  const saveSessionToSupabase = useCallback(async (
    sessionId: string,
    title: string,
    msgs: ChatMessage[]
  ) => {
    if (!user) return;
    const sanitized = sanitizeMessages(msgs);
    if (sanitized.length === 0) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .upsert({
          id: sessionId,
          user_id: user.id,
          title: title.substring(0, 100),
          messages: sanitized as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) console.error('Error saving session:', error);
    } catch (err) {
      console.error('Error saving session:', err);
    }
  }, [user]);

  // ===== SUPABASE: Delete a session =====
  const handleDeleteChat = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from('chat_sessions').delete().eq('id', sessionId);
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeChatId === sessionId) {
        setActiveChatId(null);
        setMessages([]);
        setBaseImage(null);
        setReferences([]);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [prompt]);

  const handleNewChat = async () => {
    // Save current chat to Supabase if it has messages
    if (messages.length > 0 && activeChatId) {
      const firstPrompt = messages.find(m => m.type === 'user-prompt');
      const title = firstPrompt?.prompt?.substring(0, 40) || 'Nuevo chat';
      await saveSessionToSupabase(activeChatId, title, messages);

      // Update local state
      setChatSessions(prev => {
        const existing = prev.find(s => s.id === activeChatId);
        if (existing) {
          return prev.map(s => s.id === activeChatId
            ? { ...s, title, messages: [...messages], timestamp: Date.now() }
            : s
          );
        }
        return [{ id: activeChatId, title, messages: [...messages], timestamp: Date.now() }, ...prev];
      });
    }
    // Reset state
    const newId = crypto.randomUUID();
    setActiveChatId(newId);
    setMessages([]);
    setBaseImage(null);
    setReferences([]);
    setPrompt('');
    setShowReferences(false);
  };

  const handleLoadChat = async (session: ChatSession) => {
    // Save current chat first
    if (messages.length > 0 && activeChatId && activeChatId !== session.id) {
      const firstPrompt = messages.find(m => m.type === 'user-prompt');
      const title = firstPrompt?.prompt?.substring(0, 40) || 'Nuevo chat';
      await saveSessionToSupabase(activeChatId, title, messages);
    }
    setActiveChatId(session.id);
    setMessages(session.messages);
    setBaseImage(null);
    setReferences([]);
  };

  const handleAddReference = (data: string) => {
    if (references.length < 6) {
      const isObject = references.length >= 3;
      const typeIndex = isObject ? references.length - 2 : references.length + 1;
      const prefix = isObject ? '@obj' : '@img';
      const newRef: ReferenceImage = {
        id: Math.random().toString(36).substr(2, 9),
        data,
        tag: `${prefix}${typeIndex}`
      };
      setReferences([...references, newRef]);
    }
  };

  const handleRemoveReference = (id: string) => {
    const updated = references
      .filter(ref => ref.id !== id)
      .map((ref, index) => {
        const isObject = index >= 3;
        const typeIndex = isObject ? index - 2 : index + 1;
        const prefix = isObject ? '@obj' : '@img';
        return { ...ref, tag: `${prefix}${typeIndex}` };
      });
    setReferences(updated);
  };

  const handleGenerate = async () => {
    if (!baseImage || !prompt) return;

    // Check credits before generating
    if (!hasEnoughCredits(10)) {
      setShowPaywall(true);
      return;
    }

    let currentChatId = activeChatId;
    if (!currentChatId) {
      currentChatId = crypto.randomUUID();
      setActiveChatId(currentChatId);
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user-prompt',
      prompt,
      baseImage,
      timestamp: Date.now(),
    };

    const loadingMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'loading',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsGenerating(true);
    const currentPrompt = prompt;
    setPrompt('');

    try {
      const refData = references.map(r => ({
        data: r.data,
        tag: r.tag,
        mimeType: r.data.split(',')[0].split(':')[1].split(';')[0]
      }));

      const result = await generateThumbnail(baseImage, currentPrompt, refData);

      // Deduct credits on successful generation
      await spendCredits(10);

      setMessages(prev => {
        const updated = prev.map(m =>
          m.id === loadingMsg.id
            ? { ...m, type: 'result' as const, image: result }
            : m
        );
        // Auto-save to Supabase after successful generation
        const firstPrompt = updated.find(m => m.type === 'user-prompt');
        const title = firstPrompt?.prompt?.substring(0, 40) || 'Nuevo chat';

        // This guarantees the first chat saves instantly from the start
        saveSessionToSupabase(currentChatId, title, updated);

        // Update sidebar
        setChatSessions(prev2 => {
          const exists = prev2.find(s => s.id === currentChatId);
          if (exists) {
            return prev2.map(s => s.id === currentChatId
              ? { ...s, title, messages: updated, timestamp: Date.now() }
              : s
            );
          }
          return [{ id: currentChatId, title, messages: updated, timestamp: Date.now() }, ...prev2];
        });
        return updated;
      });
    } catch (err: any) {
      console.error(err);
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { ...m, type: 'error' as const, error: err.message || 'Error al generar la imagen.' }
          : m
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    const fileName = `miniatura${downloadCount}.png`;
    try {
      let blob: Blob;
      if (imageUrl.startsWith('http')) {
        const res = await fetch(`${API_URL}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        blob = await res.blob();
      } else {
        const parts = imageUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
        const raw = atob(parts[1]);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        blob = new Blob([arr], { type: mime });
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloadCount(prev => prev + 1);
    } catch (err) {
      console.error('Error al descargar:', err);
    }
  };

  const addBaseImagePreview = (image: string, source: string = 'upload') => {
    const previewMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'base-image',
      image,
      source,
      timestamp: Date.now(),
    };
    setMessages(prev => {
      const lastPromptIdx = prev.map(m => m.type).lastIndexOf('user-prompt');
      const filtered = prev.filter((m, i) => {
        if (m.type === 'base-image' && i > lastPromptIdx) return false;
        return true;
      });
      return [...filtered, previewMsg];
    });
  };

  const handleUseAsBase = (image: string) => {
    if (baseImage) {
      setHistory(prev => [...prev, baseImage]);
    }
    setBaseImage(image);
    addBaseImagePreview(image, 'iteración');
  };

  const handleClearBase = () => {
    if (baseImage) {
      setHistory(prev => [...prev, baseImage]);
    }
    setBaseImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const isForcePaywall = !creditsLoading && credits <= 0 && plan === 'free';

  return (
    <ApiKeyGuard>
      <div className="h-[100dvh] relative text-[#e4e4e7] font-sans flex overflow-hidden bg-[#0a0a0a]">
        {/* Paywall modal */}
        {(showPaywall || isForcePaywall) && (
          <Paywall onClose={isForcePaywall ? undefined : () => setShowPaywall(false)} />
        )}

        {/* Settings modal */}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

        {/* ===== SIDEBAR ===== */}
        <aside className={`sidebar shrink-0 h-full bg-[#111111] border-r border-[#1e1e1e] flex flex-col z-[60] absolute md:relative transition-all duration-300 ${sidebarOpen ? 'w-[280px] left-0' : 'w-0 -left-[280px] md:left-0 md:w-0 overflow-hidden'}`}>
          {/* Sidebar top */}
          <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[#1e1e1e]">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-lg bg-[#ff0000] flex items-center justify-center">
                <span className="text-[10px] font-black text-white tracking-tight">IA</span>
              </div>
              <span className="text-sm font-bold text-white">MiniaturIA</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="text-[#666] hover:text-white transition-colors p-1">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>


          {/* New chat button */}
          <div className="px-3 py-3">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#ff0000]/10 border border-[#ff0000]/20 hover:bg-[#ff0000]/20 text-[#ff0000] text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Nuevo Chat
            </button>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1e1e #111' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#555] px-1 mb-2">Historial</p>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[#ff0000] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : chatSessions.length === 0 ? (
              <p className="text-[11px] text-[#444] px-2 py-4">No hay chats anteriores</p>
            ) : (
              <div className="space-y-1">
                {chatSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => handleLoadChat(session)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate cursor-pointer flex items-center justify-between group ${activeChatId === session.id
                      ? 'bg-[#1e1e1e] text-white'
                      : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'
                      }`}
                  >
                    <span className="truncate flex-1">{session.title}</span>
                    <button
                      onClick={(e) => handleDeleteChat(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-red-400 transition-all p-0.5 shrink-0 ml-1"
                      title="Eliminar chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar bottom links */}
          <div className="border-t border-[#1e1e1e] px-3 py-3 space-y-1">
            <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-[#777] hover:text-white hover:bg-[#1a1a1a] transition-colors">
              <BookOpen className="w-3.5 h-3.5" /> Tutoriales
            </a>
            <a href="https://chat.whatsapp.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-[#777] hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" /> Comunidad WhatsApp
            </a>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-[#777] hover:text-white hover:bg-[#1a1a1a] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" /> Ajustes
            </button>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-[#777] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* ===== HEADER ===== */}
          <header className="shrink-0 z-40 pt-3 pb-2.5 border-b border-[#1a1a1a]/80">
            <div className="max-w-5xl mx-auto px-3 sm:px-5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {!sidebarOpen && (
                  <button onClick={() => setSidebarOpen(true)} className="text-[#666] hover:text-white transition-colors p-1 -ml-1">
                    <Menu className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex bg-[#141414] border border-[#1e1e1e] rounded-full p-1 gap-1 shadow-lg">
                <button
                  onClick={() => setActiveTab('thumbnails')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === 'thumbnails'
                    ? 'bg-[#ff0000] text-white'
                    : 'text-[#888] hover:text-white hover:bg-[#1e1e1e]'
                    }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Miniaturas
                </button>
                <button
                  onClick={() => setActiveTab('titles')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === 'titles'
                    ? 'bg-[#ff0000] text-white'
                    : 'text-[#888] hover:text-white hover:bg-[#1e1e1e]'
                    }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Títulos
                </button>
              </div>

              <CreditsBadge onClick={() => setShowPaywall(true)} />
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'thumbnails' ? (
              <motion.div
                key="thumbnails-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* ===== CHAT / RESULTS AREA (scrollable) ===== */}
                <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1e1e #0a0a0a' }}>
                  <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 pb-16">
                    {/* Empty state when no messages */}
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#1e1e1e] flex items-center justify-center mb-6">
                          <Sparkles className="w-7 h-7 text-[#ff0000]" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Crea tu miniatura perfecta</h2>
                        <p className="text-[#555] text-sm max-w-md leading-relaxed">
                          Sube una imagen base, añade referencias opcionales y describe los cambios que quieres.
                        </p>
                      </div>
                    )}

                    {/* Chat messages */}
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        {/* Base image preview (user side) */}
                        {msg.type === 'base-image' && msg.image && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-end items-end gap-2.5"
                          >
                            <div className="max-w-md w-full">
                              <div className="bg-[#141414] border border-[#1e1e1e] rounded-2xl rounded-br-md overflow-hidden">
                                <div className="relative">
                                  <img
                                    src={msg.image}
                                    alt="Imagen base"
                                    className="w-full aspect-video object-contain bg-black/50"
                                  />
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2.5 border-t border-[#1e1e1e]">
                                  <ImageIcon className="w-3.5 h-3.5 text-[#ff0000]" />
                                  <span className="text-[11px] font-medium text-[#777]">
                                    Imagen base · {msg.source === 'url' ? 'desde URL' : msg.source === 'search' ? 'desde YouTube' : msg.source === 'iteración' ? 'desde iteración' : 'subida'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <UserAvatar />
                          </motion.div>
                        )}

                        {/* User prompt message */}
                        {msg.type === 'user-prompt' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-end items-end gap-2.5"
                          >
                            <div className="max-w-lg bg-[#ff0000]/10 border border-[#ff0000]/20 rounded-2xl rounded-br-md px-4 py-3">
                              <p className="text-sm text-[#e4e4e7]">{msg.prompt}</p>
                            </div>
                            <UserAvatar />
                          </motion.div>
                        )}

                        {/* Loading state */}
                        {msg.type === 'loading' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start items-end gap-2.5"
                          >
                            <AppLogo />
                            <div className="bg-[#141414] border border-[#1e1e1e] rounded-2xl rounded-bl-md p-5 max-w-md">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 border-[3px] border-[#ff0000] border-t-transparent rounded-full animate-spin" />
                                <div>
                                  <p className="text-sm font-medium text-[#e4e4e7]">Generando miniatura...</p>
                                  <p className="text-[11px] text-[#555] mt-0.5">Esto puede tardar unos segundos</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Result message */}
                        {msg.type === 'result' && msg.image && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start items-end gap-2.5"
                          >
                            <AppLogo />
                            <div className="max-w-2xl w-full">
                              <div className="bg-[#141414] border border-[#1e1e1e] rounded-2xl rounded-bl-md overflow-hidden">
                                <div className="relative">
                                  <img
                                    src={`${API_URL}/api/proxy-image?url=${encodeURIComponent(msg.image!)}`}
                                    alt="Resultado"
                                    className="w-full aspect-video object-contain bg-black"
                                  />
                                </div>
                                <div className="flex items-center gap-2 px-4 py-3 border-t border-[#1e1e1e]">
                                  <button
                                    onClick={() => handleUseAsBase(msg.image!)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[#ccc] text-xs font-medium transition-colors"
                                  >
                                    <Layers className="w-3.5 h-3.5" /> Usar como base
                                  </button>
                                  <button
                                    onClick={() => handleDownload(msg.image!)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff0000] hover:bg-[#dc2626] text-white text-xs font-bold transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Descargar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Error message */}
                        {msg.type === 'error' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start items-end gap-2.5"
                          >
                            <AppLogo />
                            <div className="max-w-md bg-red-500/10 border border-red-500/20 rounded-2xl rounded-bl-md px-4 py-3 flex items-start gap-2">
                              <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-red-400 leading-relaxed">{msg.error}</p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                {/* ===== BOTTOM INPUT BAR (fixed) ===== */}
                <div className="shrink-0 chat-bottom-glow border-t border-[#1a1a1a]/60 bg-[#0a0a0a]/90 backdrop-blur-xl">
                  <div className="max-w-3xl mx-auto px-4 pt-5 pb-5">
                    {/* Action chips row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {/* Base image indicator */}
                      {baseImage && (
                        <div className="flex items-center gap-2 bg-[#141414] border border-[#1e1e1e] rounded-full pl-1 pr-3 py-1">
                          <img src={baseImage?.startsWith('http') ? `${API_URL}/api/proxy-image?url=${encodeURIComponent(baseImage)}` : baseImage} alt="Base" className="w-6 h-6 rounded-full object-cover" />
                          <span className="text-[11px] font-medium text-[#888]">Base</span>
                          <button onClick={handleClearBase} className="text-[#555] hover:text-red-400 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* References toggle */}
                      <button
                        onClick={() => setShowReferences(!showReferences)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border ${showReferences || references.length > 0
                          ? 'bg-[#ff0000]/10 border-[#ff0000]/30 text-[#ff0000]'
                          : 'bg-[#141414] border-[#1e1e1e] hover:border-[#2a2a2a] text-[#888]'
                          }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Personas {references.length > 0 && <span className="bg-[#ff0000] text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">{references.length}</span>}
                      </button>
                    </div>

                    {/* Image uploader panel (shown when no base image) */}
                    <AnimatePresence>
                      {!baseImage && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mb-3"
                        >
                          <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
                            <ImageUploader
                              onImageSelected={(img) => {
                                if (img === '') {
                                  handleClearBase();
                                } else {
                                  if (baseImage) setHistory(prev => [...prev, baseImage]);
                                  setBaseImage(img);
                                }
                              }}
                              onImageSelectedWithSource={(img, source) => {
                                if (img !== '') {
                                  addBaseImagePreview(img, source);
                                }
                              }}
                              currentImage={baseImage}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expandable references panel */}
                    <AnimatePresence>
                      {showReferences && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mb-3"
                        >
                          <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
                            <ReferenceManager
                              references={references}
                              onAdd={handleAddReference}
                              onRemove={handleRemoveReference}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Prompt input + Generate button */}
                    <div className="relative flex items-end gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          ref={textareaRef}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={baseImage ? "Describe los cambios que quieres hacer..." : "Primero sube una imagen base ↑"}
                          disabled={!baseImage}
                          rows={1}
                          className="w-full bg-[#141414] border border-[#1e1e1e] focus:border-[#ff0000]/50 rounded-xl py-3 px-4 pr-4 text-sm text-[#e4e4e7] placeholder:text-[#444] focus:outline-none transition-colors resize-none disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ minHeight: '44px' }}
                        />
                      </div>
                      <button
                        onClick={handleGenerate}
                        disabled={!baseImage || !prompt || isGenerating}
                        className="glow-btn h-[44px] px-5 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0"
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline">Generate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="titles-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto"
              >
                <div className="max-w-3xl mx-auto px-4 py-8">
                  <div className="bg-[#141414] border border-[#1e1e1e] rounded-[24px] p-8 shadow-2xl">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold mb-2 text-white">Títulos <span className="text-[#ff0000]">Virales</span></h2>
                      <p className="text-[#888] text-sm max-w-lg mx-auto">
                        Genera títulos optimizados para el algoritmo de YouTube basados en principios psicológicos de retención y CTR.
                      </p>
                    </div>
                    <TitleGenerator />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
            />
          )}
        </AnimatePresence>
      </div>
    </ApiKeyGuard>
  );
}

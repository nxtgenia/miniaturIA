import React, { useState } from 'react';
import { Type, Sparkles, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateViralTitles } from '../lib/gemini';

export const TitleGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [titles, setTitles] = useState<{ title: string; explanation: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateViralTitles(topic);
      setTitles(result);
    } catch (err: any) {
      setError('Error al generar títulos. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Tema del Vídeo</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ej: Cómo dejé de comer azúcar por 30 días..."
          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-base focus:outline-none focus:border-red-600/50 transition-colors placeholder:text-zinc-700"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!topic || isGenerating}
        className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Analizando Patrones Virales...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generar Títulos Virales
          </>
        )}
      </button>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-xs text-red-200/70">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {titles.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-red-600/30 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="text-xs font-mono text-zinc-600 mt-1">0{index + 1}</span>
                  <p className="text-base font-semibold text-zinc-100 leading-tight">{item.title}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(item.title, index)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-500 hover:text-white shrink-0"
                >
                  {copiedIndex === index ? <Check className="w-4 h-4 text-red-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="pl-9">
                <p className="text-xs text-zinc-500 leading-relaxed italic border-l-2 border-red-600/20 pl-3">
                  {item.explanation}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {titles.length === 0 && !isGenerating && (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-white/5 rounded-3xl">
          <Type className="w-12 h-12 mb-4 opacity-10" />
          <p className="text-sm">Ingresa un tema para ver la magia</p>
        </div>
      )}
    </div>
  );
};

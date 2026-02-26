import React, { useState } from 'react';
import { Type, Sparkles, Copy, Check, RefreshCw, AlertCircle, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateViralTitles } from '../lib/gemini';

export const TitleGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [fixedWord, setFixedWord] = useState('');
  const [wordPosition, setWordPosition] = useState<'start' | 'end'>('end');
  const [titles, setTitles] = useState<{ title: string; technique: string; explanation: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateViralTitles(topic, channelUrl, fixedWord, wordPosition);
      setTitles(result.titles || []);
    } catch (err: any) {
      console.error(err);
      setError('Error al generar títulos: ' + (err.message || 'Inténtalo de nuevo.'));
      setTitles([]);
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
    <div className="space-y-6">
      {/* Topic Input */}
      <div className="yt-card rounded-xl p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#aaa] uppercase tracking-wider">Tema del Vídeo</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej: Cómo dejé de comer azúcar por 30 días..."
            className="yt-input w-full rounded-lg py-3 px-4 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#aaa] uppercase tracking-wider flex items-center gap-2">
            <Youtube className="w-3.5 h-3.5 text-[#ff0000]" />
            Canal de YouTube (Opcional)
          </label>
          <input
            type="text"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="Ej: https://youtube.com/@tucanal"
            className="yt-input w-full rounded-lg py-2.5 px-4 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#aaa] uppercase tracking-wider flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-[#ff0000]" />
              Palabra Fija (Opcional)
            </label>
            <input
              type="text"
              value={fixedWord}
              onChange={(e) => setFixedWord(e.target.value)}
              placeholder="Ej: (EXPLICADO), VLOG, 2024..."
              className="yt-input w-full rounded-lg py-2.5 px-4 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#aaa] uppercase tracking-wider">Posición</label>
            <div className="flex bg-[#121212] p-1 rounded-lg border border-[#3f3f3f] h-[42px]">
              <button
                onClick={() => setWordPosition('start')}
                className={`flex-1 rounded-md text-xs font-semibold transition-all ${wordPosition === 'start' ? 'yt-chip-active' : 'text-[#aaa] hover:text-white'}`}
              >
                Al principio
              </button>
              <button
                onClick={() => setWordPosition('end')}
                className={`flex-1 rounded-md text-xs font-semibold transition-all ${wordPosition === 'end' ? 'yt-chip-active' : 'text-[#aaa] hover:text-white'}`}
              >
                Al final
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!topic || isGenerating}
        className="yt-btn-red w-full py-4 rounded-lg text-base flex items-center justify-center gap-2.5"
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
        <div className="p-4 bg-[#ff0000]/10 border border-[#ff0000]/20 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-[#ff0000] shrink-0" />
          <p className="text-xs text-[#aaa]">{error}</p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {titles.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="yt-card rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ff0000] flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm font-semibold text-[#f1f1f1] leading-snug">{item.title}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(item.title, index)}
                  className="p-2 hover:bg-[#272727] rounded-full transition-colors text-[#717171] hover:text-white shrink-0"
                >
                  {copiedIndex === index ? <Check className="w-4 h-4 text-[#ff0000]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="pl-9 space-y-2">
                {item.technique && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ff0000]/10 text-[#ff0000]">
                    {item.technique}
                  </span>
                )}
                <p className="text-xs text-[#aaa] leading-relaxed border-l-2 border-[#ff0000]/20 pl-3 italic">
                  {item.explanation}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {titles.length === 0 && !isGenerating && (
        <div className="py-16 flex flex-col items-center justify-center text-[#3f3f3f] border border-dashed border-[#272727] rounded-xl">
          <Type className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm text-[#717171]">Ingresa un tema para ver la magia</p>
        </div>
      )}
    </div>
  );
};

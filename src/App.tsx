import React, { useState } from 'react';
import { Sparkles, Wand2, Download, RefreshCw, Layers, Zap, Info, Type, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiKeyGuard } from './components/ApiKeyGuard';
import { ImageUploader } from './components/ImageUploader';
import { ReferenceManager } from './components/ReferenceManager';
import { TitleGenerator } from './components/TitleGenerator';
import { generateThumbnail } from './lib/gemini';

interface ReferenceImage {
  id: string;
  data: string;
  tag: string;
}

type Tab = 'thumbnails' | 'titles';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('thumbnails');
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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

    setIsGenerating(true);
    setError(null);
    try {
      const refData = references.map(r => ({
        data: r.data,
        mimeType: r.data.split(',')[0].split(':')[1].split(';')[0]
      }));
      
      const result = await generateThumbnail(baseImage, prompt, refData);
      setResultImage(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al generar la imagen. Verifica tu clave de API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `miniatura-${Date.now()}.png`;
    link.click();
  };

  const handleUseAsBase = () => {
    if (!resultImage) return;
    if (baseImage) {
      setHistory(prev => [...prev, baseImage]);
    }
    setBaseImage(resultImage);
    setResultImage(null);
    setPrompt('');
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const previousImage = newHistory.pop();
    setHistory(newHistory);
    setBaseImage(previousImage || null);
    setResultImage(null);
  };

  const handleClearBase = () => {
    if (baseImage) {
      setHistory(prev => [...prev, baseImage]);
    }
    setBaseImage(null);
  };

  return (
    <ApiKeyGuard>
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-600/30">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 md:py-0 md:h-16 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-1">
              <span className="text-xl font-display font-black tracking-tighter text-white">Miniatur</span>
              <div className="bg-[#FF0000] px-1.5 py-0.5 rounded-lg">
                <span className="text-xl font-display font-black tracking-tighter text-white">IA</span>
              </div>
            </div>

            <nav className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('thumbnails')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === 'thumbnails' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Miniaturas
              </button>
              <button
                onClick={() => setActiveTab('titles')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === 'titles' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                <Type className="w-3.5 h-3.5" />
                Títulos Virales
              </button>
            </nav>

            <div className="hidden md:block">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">v2.0 Beta</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          <AnimatePresence mode="wait">
            {activeTab === 'thumbnails' ? (
              <motion.div
                key="thumbnails-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12"
              >
                {/* Left Column: Controls */}
                <div className="lg:col-span-5 space-y-10">
                  <section className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-red-600" />
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Paso 1: Imagen Base</h2>
                      </div>
                      {history.length > 0 && (
                        <button
                          onClick={handleUndo}
                          className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10"
                        >
                          <RefreshCw className="w-3 h-3" />
                          DESHACER
                        </button>
                      )}
                    </div>
                    <ImageUploader 
                      onImageSelected={(img) => {
                        if (img === '') {
                          handleClearBase();
                        } else {
                          if (baseImage) setHistory(prev => [...prev, baseImage]);
                          setBaseImage(img);
                        }
                      }} 
                      currentImage={baseImage} 
                    />
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-red-600" />
                      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Paso 2: Referencias</h2>
                    </div>
                    <ReferenceManager 
                      references={references} 
                      onAdd={handleAddReference} 
                      onRemove={handleRemoveReference} 
                    />
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Wand2 className="w-4 h-4 text-red-600" />
                      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Paso 3: Instrucciones</h2>
                    </div>
                    <div className="space-y-4">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe los cambios... Ej: Añade a @img1 saltando en el centro con un fondo de explosiones épicas."
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-red-600/50 transition-colors resize-none placeholder:text-zinc-600"
                      />
                      
                      <button
                        onClick={handleGenerate}
                        disabled={!baseImage || !prompt || isGenerating}
                        className="w-full py-4 bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold rounded-2xl hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.2)] active:scale-[0.98]"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Generando Miniatura...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            Generar con IA
                          </>
                        )}
                      </button>

                      {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
                          <Info className="w-5 h-5 text-red-500 shrink-0" />
                          <p className="text-xs text-red-200/70 leading-relaxed">{error}</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Right Column: Preview */}
                <div className="lg:col-span-7">
                  <div className="sticky top-28 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Resultado</h2>
                      <div className="flex items-center gap-4">
                        {resultImage && (
                          <>
                            <button
                              onClick={handleUseAsBase}
                              className="flex items-center gap-2 text-xs font-medium text-white hover:text-red-400 transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
                            >
                              <Layers className="w-4 h-4" />
                              Usar como base
                            </button>
                            <button
                              onClick={handleDownload}
                              className="flex items-center gap-2 text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Descargar PNG
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="relative aspect-video rounded-3xl border border-white/10 bg-zinc-900/50 overflow-hidden shadow-2xl group">
                      <AnimatePresence mode="wait">
                        {resultImage ? (
                          <motion.img
                            key="result"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={resultImage}
                            alt="Resultado"
                            className="w-full h-full object-contain"
                          />
                        ) : isGenerating ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
                          >
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-red-600/20 rounded-full animate-ping absolute inset-0" />
                              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="text-zinc-400 text-sm font-medium animate-pulse">Esculpiendo tu miniatura...</p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600"
                          >
                            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">Tu creación aparecerá aquí</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="titles-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl mx-auto"
              >
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-display font-bold mb-4">Títulos Virales</h2>
                  <p className="text-zinc-500 text-sm max-w-lg mx-auto">
                    Genera títulos optimizados para el algoritmo de YouTube basados en principios psicológicos de retención y CTR.
                  </p>
                </div>
                <TitleGenerator />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="border-t border-white/5 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-zinc-600 text-xs">
              MiniaturIA &copy; 2024 &bull; Herramienta creativa para creadores de contenido
            </p>
          </div>
        </footer>
      </div>
    </ApiKeyGuard>
  );
}

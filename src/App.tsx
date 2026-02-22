import React, { useState } from 'react';
import { Sparkles, Wand2, Download, RefreshCw, Layers, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiKeyGuard } from './components/ApiKeyGuard';
import { ImageUploader } from './components/ImageUploader';
import { ReferenceManager } from './components/ReferenceManager';
import { generateThumbnail } from './lib/gemini';

interface ReferenceImage {
  id: string;
  data: string;
  tag: string;
}

export default function App() {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
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

  return (
    <ApiKeyGuard>
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
        {/* Header */}
        <header className="border-bottom border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <Zap className="w-5 h-5 text-black fill-current" />
              </div>
              <h1 className="text-xl font-display font-bold tracking-tight">MiniaturIA</h1>
            </div>
            <div className="flex items-center gap-4">
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Controls */}
            <div className="lg:col-span-5 space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Paso 1: Imagen Base</h2>
                </div>
                <ImageUploader 
                  onImageSelected={setBaseImage} 
                  currentImage={baseImage} 
                />
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Paso 2: Personajes</h2>
                </div>
                <ReferenceManager 
                  references={references} 
                  onAdd={handleAddReference} 
                  onRemove={handleRemoveReference} 
                />
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Paso 3: Instrucciones</h2>
                </div>
                <div className="space-y-4">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe los cambios... Ej: Añade a @img1 saltando en el centro con un fondo de explosiones épicas."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors resize-none placeholder:text-zinc-600"
                  />
                  
                  <button
                    onClick={handleGenerate}
                    disabled={!baseImage || !prompt || isGenerating}
                    className="w-full py-4 bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-[0.98]"
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
                  {resultImage && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Descargar PNG
                    </button>
                  )}
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
                          <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full animate-ping absolute inset-0" />
                          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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

                <div className="grid grid-cols-2 gap-4">
                </div>
              </div>
            </div>

          </div>
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

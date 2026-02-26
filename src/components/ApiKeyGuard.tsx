import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApiKeyGuardProps {
  children: React.ReactNode;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const checkKey = async () => {
    // When running locally (outside AI Studio), skip the guard
    if (!window.aistudio) {
      setHasKey(true);
      return;
    }
    try {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } catch (e) {
      console.error("Error checking API key", e);
      setHasKey(false);
    }
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleOpenSelector = async () => {
    await window.aistudio.openSelectKey();
    // Assume success as per guidelines to avoid race conditions
    setHasKey(true);
  };

  if (hasKey === null) return null;

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6 font-sans text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#272727]/30 border border-white/10 rounded-xl p-8 shadow-2xl"
        >
          <div className="w-16 h-16 bg-[#FF0000]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Key className="w-8 h-8 text-[#FF0000]" />
          </div>

          <h1 className="text-2xl font-semibold text-center mb-2">Configuración Requerida</h1>
          <p className="text-zinc-400 text-center mb-8 text-sm leading-relaxed">
            Para usar <span className="text-white font-medium">MiniaturIA</span> con Gemini 3 Pro, necesitas seleccionar una clave de API de un proyecto de Google Cloud con facturación activa.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleOpenSelector}
              className="w-full py-4 bg-[#F1F1F1] text-[#0F0F0F] font-semibold rounded-xl hover:bg-zinc-300 transition-colors flex items-center justify-center gap-2"
            >
              Seleccionar Clave de API
            </button>

            <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 border border-white/10 text-zinc-400 font-medium rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              Documentación de Facturación
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-200/70 leading-relaxed">
              Nota: Gemini 3 Pro Image requiere una clave de API de pago. Asegúrate de tener configurada la facturación en tu consola de Google Cloud.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

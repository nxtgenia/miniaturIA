import React from 'react';
import { BookOpen, X, Sparkles, Youtube, PlayCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface TutorialsModalProps {
    onClose: () => void;
}

export const TutorialsModal: React.FC<TutorialsModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#141414] border border-[#1e1e1e] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#1e1e1e] relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#ff0000]/10 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-[#ff0000]" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Tutoriales MiniaturIA</h2>
                            <p className="text-sm text-[#888]">Domina la plataforma</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] flex items-center justify-center text-[#888] hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 relative flex flex-col items-center text-center">
                    {/* Glowing background effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#ff0000]/10 blur-[80px] rounded-full pointer-events-none" />

                    <div className="w-24 h-24 relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#ff0000] to-orange-500 rounded-2xl animate-spin-slow opacity-20 blur-xl" />
                        <div className="relative w-full h-full bg-[#111] border border-[#2a2a2a] rounded-2xl flex items-center justify-center shadow-inner">
                            <PlayCircle className="w-10 h-10 text-[#ff0000]" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-3">
                        Grabando tutoriales... <Sparkles className="inline-block w-5 h-5 text-yellow-400 -mt-1" />
                    </h3>
                    <p className="text-[#a1a1aa] mb-8 max-w-sm mx-auto leading-relaxed">
                        Estamos preparando una biblioteca con vídeos exclusivos para enseñarte a crear miniaturas virales y dominar cada herramienta.
                        <br /><br />
                        <span className="text-[#e4e4e7] font-semibold">¡Disponible muy pronto!</span>
                    </p>

                    <button
                        onClick={onClose}
                        className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                    >
                        Entendido
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

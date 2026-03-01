import React from 'react';
import { Zap } from 'lucide-react';
import { useCredits } from '../contexts/CreditsContext';
import { motion, AnimatePresence } from 'motion/react';

interface CreditsBadgeProps {
    onClick?: () => void;
}

const CreditsBadge: React.FC<CreditsBadgeProps> = ({ onClick }) => {
    const { credits, loading } = useCredits();

    if (loading) return null;

    const isLow = credits <= 30; // 3 imágenes o menos
    const isEmpty = credits <= 0;

    return (
        <motion.button
            layout
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isEmpty
                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : isLow
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                    : 'bg-[#1e1e1e] text-[#a1a1aa] border border-[#2a2a2a] hover:bg-[#2a2a2a] hover:text-white'
                }`}
        >
            <motion.div
                animate={isLow || isEmpty ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
            >
                <Zap className={`w-3.5 h-3.5 ${isEmpty ? 'text-white' : isLow ? 'text-amber-400' : 'text-[#ff0000]'}`} />
            </motion.div>
            <AnimatePresence mode="wait">
                <motion.span
                    key={credits}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                >
                    {credits} créditos
                </motion.span>
            </AnimatePresence>
        </motion.button>
    );
};

export default CreditsBadge;

import React from 'react';
import { Zap } from 'lucide-react';
import { useCredits } from '../contexts/CreditsContext';

interface CreditsBadgeProps {
    onClick?: () => void;
}

const CreditsBadge: React.FC<CreditsBadgeProps> = ({ onClick }) => {
    const { credits, loading } = useCredits();

    if (loading) return null;

    const isLow = credits <= 30; // 3 imágenes o menos
    const isEmpty = credits <= 0;

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 ${isEmpty
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : isLow
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                    : 'bg-[#1e1e1e] text-[#a1a1aa] border border-[#2a2a2a] hover:bg-[#2a2a2a] hover:text-white'
                }`}
        >
            <Zap className={`w-3.5 h-3.5 ${isEmpty ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-[#ff0000]'}`} />
            <span>{credits} créditos</span>
        </button>
    );
};

export default CreditsBadge;

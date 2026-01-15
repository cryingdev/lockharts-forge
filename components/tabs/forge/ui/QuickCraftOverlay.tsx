
import React from 'react';
import { Hammer, Sparkles } from 'lucide-react';

interface QuickCraftOverlayProps {
    progress: number;
}

const QuickCraftOverlay: React.FC<QuickCraftOverlayProps> = ({ progress }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-72 md:w-96 bg-stone-900 border-2 border-amber-600/50 rounded-2xl p-6 md:p-10 shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95">
                <div className="relative">
                    <Hammer className="w-12 h-12 text-amber-500 animate-bounce" />
                    <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div className="w-full">
                    <div className="flex justify-between text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
                        <span>Processing Craft...</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800 shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <p className="text-stone-500 text-[9px] md:text-[11px] font-bold uppercase tracking-widest animate-pulse italic">Applying Master Techniques...</p>
            </div>
        </div>
    );
};

export default QuickCraftOverlay;

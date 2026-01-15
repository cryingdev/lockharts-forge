import React from 'react';
import { Store, ZapOff, ArrowLeft } from 'lucide-react';

interface ShopClosedOverlayProps {
    isOpen: boolean;
    canAffordOpen: boolean;
    onNavigate: (tab: any) => void;
}

export const ShopClosedOverlay: React.FC<ShopClosedOverlayProps> = ({ isOpen, canAffordOpen, onNavigate }) => {
    if (isOpen) return null;

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-1000 animate-in fade-in"></div>
            <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
                {!canAffordOpen ? (
                    <div className="bg-stone-950/90 border-2 border-red-900/50 p-6 md:p-10 rounded-[2rem] shadow-2xl flex flex-col items-center text-center max-w-xs ring-4 ring-black/50 backdrop-blur-2xl">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-red-950/30 rounded-full flex items-center justify-center mb-4 border border-red-800/30">
                            <ZapOff className="w-8 h-8 md:w-10 md:h-10 text-red-50 animate-pulse" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-red-100 font-serif uppercase tracking-tight">Exhausted</h3>
                        <p className="text-stone-500 text-xs md:text-base mt-2 mb-6 leading-relaxed">You lack the energy to manage the counter. Take a rest to recover.</p>
                        <button onClick={() => onNavigate('FORGE')} className="w-full py-3 md:py-4 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-xl font-black text-xs md:text-sm transition-all border border-stone-700 pointer-events-auto flex items-center justify-center gap-2 uppercase tracking-widest"><ArrowLeft className="w-4 h-4" />Back to Forge</button>
                    </div>
                ) : (
                    <div className="text-center group">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-stone-900/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-700/50 backdrop-blur-xl shadow-2xl transition-transform group-hover:scale-110 duration-700 ring-1 ring-white/5">
                            <Store className="w-8 h-8 md:w-10 md:h-10 text-stone-500" />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-black text-stone-300 font-serif tracking-tighter drop-shadow-2xl uppercase">Shop is Closed</h3>
                        <p className="text-stone-500 text-sm md:text-lg mt-2 font-black uppercase tracking-widest opacity-60">Flip the sign to welcome travelers</p>
                    </div>
                )}
            </div>
        </div>
    );
};
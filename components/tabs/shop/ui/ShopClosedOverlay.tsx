
import React from 'react';
import { Store, ArrowLeft } from 'lucide-react';

interface ShopClosedOverlayProps {
    isOpen: boolean;
    onNavigate: (tab: any) => void;
}

export const ShopClosedOverlay: React.FC<ShopClosedOverlayProps> = ({ isOpen, onNavigate }) => {
    if (isOpen) return null;

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-1000 animate-in fade-in"></div>
            <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
                <div className="text-center group">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-stone-900/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-700/50 backdrop-blur-xl shadow-2xl transition-transform group-hover:scale-110 duration-700 ring-1 ring-white/5">
                        <Store className="w-8 h-8 md:w-10 md:h-10 text-stone-500" />
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black text-stone-300 font-serif tracking-tighter drop-shadow-2xl uppercase">Shop is Closed</h3>
                    <p className="text-stone-500 text-sm md:text-lg mt-2 font-black uppercase tracking-widest opacity-60">Flip the sign to welcome travelers</p>
                </div>
            </div>
        </div>
    );
};

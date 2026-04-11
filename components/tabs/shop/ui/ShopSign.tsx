import React from 'react';
import { useGame } from '../../../../context/GameContext';
import { t } from '../../../../utils/i18n';

interface ShopSignProps {
    isOpen: boolean;
    onToggle: () => void;
    disabled: boolean;
    isPulsing?: boolean;
}

export const ShopSign: React.FC<ShopSignProps> = ({ isOpen, onToggle, disabled, isPulsing }) => {
    const { state } = useGame();
    const language = state.settings.language;

    return (
        <div className="absolute top-20 md:top-24 right-2 md:right-4 z-50 flex flex-col items-center">
            <div className="flex justify-around w-20 md:w-28 h-5 md:h-7 px-4">
                <div className="w-0.5 md:w-1 bg-stone-600 rounded-full"></div>
                <div className="w-0.5 md:w-1 bg-stone-600 rounded-full"></div>
            </div>
            
            <button 
                onClick={onToggle}
                disabled={disabled}
                data-tutorial-id="SHOP_SIGN"
                className={`group relative w-32 md:w-40 h-14 md:h-20 perspective-1000 cursor-pointer disabled:cursor-not-allowed ${isPulsing ? 'animate-bounce' : ''}`}
            >
                {isPulsing && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 md:w-6 md:h-6 bg-red-500 rounded-full animate-ping z-50"></div>
                )}
                <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isOpen ? '' : 'rotate-y-180'} ${isPulsing ? 'ring-4 ring-amber-500/50 rounded-lg' : ''}`}>
                    <div className="absolute inset-0 backface-hidden bg-[#5d4037] border md:border-2 border-[#3e2723] rounded-lg shadow-lg flex flex-col items-center justify-center p-1 md:p-1.5">
                        <div className="w-full h-full border border-[#795548]/30 rounded-md flex flex-col items-center justify-center gap-0.5">
                             <span className="text-[9px] md:text-[11px] text-[#8d6e63] font-bold uppercase tracking-[0.22em] leading-none">
                                 {t(language, 'shop.sign_prefix')}
                             </span>
                             <span className="text-[18px] md:text-[24px] font-black text-emerald-400 font-serif tracking-tight leading-none drop-shadow-sm">
                                 {t(language, 'shop.sign_open')}
                             </span>
                        </div>
                    </div>
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#3e2723] border md:border-2 border-[#1b0000] rounded-lg shadow-lg flex flex-col items-center justify-center p-1 md:p-1.5">
                        <div className="w-full h-full border border-[#5d4037]/30 rounded-md flex flex-col items-center justify-center gap-0.5">
                             <span className="text-[9px] md:text-[11px] text-[#5d4037] font-bold uppercase tracking-[0.22em] font-none leading-none">
                                 {t(language, 'shop.sign_prefix')}
                             </span>
                             <span className="text-[18px] md:text-[24px] font-black text-stone-500 font-serif tracking-tight leading-none drop-shadow-sm">
                                 {t(language, 'shop.sign_closed')}
                             </span>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
};

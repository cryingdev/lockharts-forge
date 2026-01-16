import React from 'react';

interface ShopSignProps {
    isOpen: boolean;
    onToggle: () => void;
    disabled: boolean;
}

export const ShopSign: React.FC<ShopSignProps> = ({ isOpen, onToggle, disabled }) => {
    return (
        <div className="absolute top-2 md:top-4 right-2 md:right-4 z-50 flex flex-col items-center">
            <div className="flex justify-around w-16 md:w-24 h-4 md:h-6 px-4">
                <div className="w-0.5 md:w-1 bg-stone-600 rounded-full"></div>
                <div className="w-0.5 md:w-1 bg-stone-600 rounded-full"></div>
            </div>
            
            <button 
                onClick={onToggle}
                disabled={disabled}
                data-tutorial-id="SHOP_SIGN"
                className={`group relative w-24 md:w-36 h-10 md:h-16 perspective-1000 cursor-pointer disabled:cursor-not-allowed`}
            >
                <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isOpen ? '' : 'rotate-y-180'}`}>
                    <div className="absolute inset-0 backface-hidden bg-[#5d4037] border md:border-2 border-[#3e2723] rounded shadow-lg flex flex-col items-center justify-center p-0.5 md:p-1">
                        <div className="w-full h-full border border-[#795548]/30 rounded flex flex-col items-center justify-center">
                             <span className="text-[8px] md:text-[10px] text-[#8d6e63] font-bold uppercase tracking-widest leading-none">The Shop is</span>
                             <span className="text-sm md:text-xl font-black text-emerald-400 font-serif tracking-tighter drop-shadow-sm">OPEN</span>
                        </div>
                    </div>
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#3e2723] border md:border-2 border-[#1b0000] rounded shadow-lg flex flex-col items-center justify-center p-0.5 md:p-1">
                        <div className="w-full h-full border border-[#5d4037]/30 rounded flex flex-col items-center justify-center">
                             <span className="text-[8px] md:text-[10px] text-[#5d4037] font-bold uppercase tracking-widest font-none">The Shop is</span>
                             <span className="text-sm md:text-xl font-black text-stone-500 font-serif tracking-tighter drop-shadow-sm">CLOSED</span>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
};
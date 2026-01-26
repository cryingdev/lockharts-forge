import React from 'react';
import { InventoryItem } from '../../../../types/inventory';
import { getAssetUrl } from '../../../../utils';
import { Plus, X, Search, Lock } from 'lucide-react';

interface ResearchSlotsProps {
    slots: (InventoryItem | null)[];
    onOpenInventory: () => void;
    disabled?: boolean;
}

export const ResearchSlots: React.FC<ResearchSlotsProps> = ({ slots, onOpenInventory, disabled }) => {
    return (
        <div className="grid grid-cols-2 gap-6 md:gap-12 relative z-10 p-4">
            {slots.map((item, idx) => (
                <div key={idx} className="relative group">
                    <button 
                        onClick={onOpenInventory}
                        disabled={disabled}
                        className={`w-28 h-28 md:w-44 md:h-44 rounded-3xl border-2 transition-all flex items-center justify-center relative overflow-hidden shadow-2xl ${
                            disabled 
                            ? 'bg-stone-900 border-indigo-900/50 cursor-not-allowed'
                            : item 
                                ? 'bg-stone-800/80 border-indigo-500/50 hover:border-indigo-400' 
                                : 'bg-stone-900/40 border-stone-800 border-dashed hover:bg-stone-800/60'
                        }`}
                    >
                        {item ? (
                            <>
                                <img 
                                    src={getAssetUrl(`${item.id}.png`)} 
                                    className={`w-16 h-16 md:w-28 md:h-28 object-contain transition-all duration-300 ${disabled ? 'scale-75 opacity-50 blur-[1px]' : 'drop-shadow-lg'}`} 
                                    alt={item.name} 
                                />
                                <div className={`absolute bottom-1 right-1 md:bottom-3 md:right-3 bg-indigo-950/90 px-2 md:px-3 py-0.5 md:py-1 rounded-lg border border-indigo-500/30 text-[10px] md:text-xs font-mono font-black text-indigo-400 shadow-lg ${disabled ? 'opacity-30' : ''}`}>
                                    x{item.quantity}
                                </div>
                                {!disabled && (
                                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Search className="w-8 h-8 text-indigo-300" />
                                    </div>
                                )}
                                {disabled && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Lock className="w-6 h-6 md:w-8 md:h-8 text-indigo-500 opacity-40 animate-pulse" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <Plus className={`w-6 h-6 md:w-8 md:h-8 ${disabled ? 'text-stone-800' : 'text-stone-700'}`} />
                                <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest ${disabled ? 'text-stone-800' : 'text-stone-700'}`}>Select Item</span>
                            </div>
                        )}
                    </button>
                    {/* Stylistic connector shadow */}
                    <div className="absolute -z-10 w-full h-px bg-indigo-500/5 top-1/2 left-1/2 -translate-x-1/2" />
                </div>
            ))}
        </div>
    );
};
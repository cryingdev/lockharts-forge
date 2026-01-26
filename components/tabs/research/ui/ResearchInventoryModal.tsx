import React from 'react';
import { X, Trash2, Plus, Minus, Package, Beaker, Sparkles, Check } from 'lucide-react';
import { InventoryItem } from '../../../../types/inventory';
import { ItemSelectorList } from '../../../ItemSelectorList';
import { getAssetUrl } from '../../../../utils';

interface ResearchInventoryModalProps {
    items: InventoryItem[];
    selectedSlots: (InventoryItem | null)[];
    onClose: () => void;
    onSelect: (item: InventoryItem) => void;
    onIncrement: (idx: number) => void;
    onDecrement: (idx: number) => void;
    onRemove: (idx: number) => void;
    onResearch: () => void;
}

export const ResearchInventoryModal: React.FC<ResearchInventoryModalProps> = ({
    items, selectedSlots, onClose, onSelect, onIncrement, onDecrement, onRemove, onResearch
}) => {
    const isAnySelected = selectedSlots.some(s => s !== null);

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 md:p-6 animate-in fade-in duration-300">
            <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-full max-w-3xl h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
                
                {/* Modal Header */}
                <div className="bg-stone-850 p-4 border-b border-stone-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-indigo-400" />
                        <div>
                            <h3 className="text-lg font-black text-stone-100 font-serif uppercase tracking-tighter">Alchemy Storage</h3>
                            <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest leading-none">Select items for extraction</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full text-stone-500 transition-colors"><X className="w-6 h-6" /></button>
                </div>

                {/* Fixed Top Section: Mini Slots */}
                <div className="bg-stone-950 p-3 md:p-5 border-b border-indigo-900/20 shrink-0">
                    <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-2xl mx-auto">
                        {selectedSlots.map((item, idx) => (
                            <div key={idx} className={`relative aspect-square rounded-xl border-2 transition-all flex items-center justify-center overflow-hidden ${
                                item ? 'bg-stone-900 border-indigo-600/50' : 'bg-stone-900/30 border-stone-800 border-dashed'
                            }`}>
                                {item ? (
                                    <>
                                        <img src={getAssetUrl(`${item.id}.png`)} className="w-10 h-10 md:w-16 md:h-16 object-contain p-1" />
                                        
                                        {/* Quick Controls */}
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 flex items-center justify-between p-1">
                                            <button onClick={() => onDecrement(idx)} className="p-0.5 hover:bg-stone-800 rounded text-stone-300"><Minus className="w-3 h-3" /></button>
                                            <span className="text-[10px] font-mono font-black text-white">x{item.quantity}</span>
                                            <button onClick={() => onIncrement(idx)} className="p-0.5 hover:bg-stone-800 rounded text-indigo-400"><Plus className="w-3 h-3" /></button>
                                        </div>

                                        <button 
                                            onClick={() => onRemove(idx)}
                                            className="absolute top-1 right-1 p-1 bg-red-950/60 hover:bg-red-800 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-[10px] font-black text-stone-800 uppercase tracking-tighter">Empty</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main List Area - Added flex-col and min-h-0 */}
                <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
                    <ItemSelectorList 
                        items={items.map(item => ({
                            ...item,
                            // Custom rendering logic: highlight if in slots
                            isSelected: selectedSlots.some(s => s?.id === item.id)
                        }))}
                        onSelect={onSelect}
                        onToggleLock={(id) => {}} // Research items logic simplified
                        emptyMessage="No alchemical materials available."
                    />
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-stone-850 border-t border-stone-800 shrink-0 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-black text-stone-500 hover:text-stone-300 uppercase text-xs"
                    >
                        Back to Table
                    </button>
                    <button 
                        onClick={onResearch}
                        disabled={!isAnySelected}
                        className={`px-8 py-3 rounded-xl font-black uppercase text-xs transition-all flex items-center gap-2 border-b-4 ${
                            !isAnySelected 
                            ? 'bg-stone-800 text-stone-700 border-stone-950 grayscale' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-900 shadow-xl active:scale-95'
                        }`}
                    >
                        <Beaker className="w-4 h-4" /> Start Research
                    </button>
                </div>
            </div>

            <style>{`
                /* Overriding ItemSelectorList internal cell styles for highlighting */
                .AlchemyHighlight {
                    border-color: #4f46e5 !important;
                    background-color: rgba(79, 70, 229, 0.1) !important;
                    box-shadow: inset 0 0 15px rgba(79, 70, 229, 0.2) !important;
                }
            `}</style>
        </div>
    );
};
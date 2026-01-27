
import React from 'react';
import { X, Check, Search, Sword, Shield, Zap, Brain, Sparkles, Lock, Info } from 'lucide-react';
import { InventoryItem } from '../../../../types/inventory';
import { ItemSelectorList } from '../../../ItemSelectorList';
import { getAssetUrl } from '../../../../utils';

interface InstanceSelectorPopupProps {
    show: boolean;
    onClose: () => void;
    matchingItems: InventoryItem[];
    selectedInstance: InventoryItem | null;
    onSelect: (item: InventoryItem) => void;
    onSell: (item: InventoryItem) => void;
    onToggleLock: (id: string) => void;
    customerMarkup: number;
}

export const InstanceSelectorPopup: React.FC<InstanceSelectorPopupProps> = ({
    show, onClose, matchingItems, selectedInstance, onSelect, onSell, onToggleLock, customerMarkup
}) => {
    if (!show) return null;

    const getQualityLabel = (q: number): string => {
        if (q >= 110) return 'MASTERWORK';
        if (q >= 100) return 'PRISTINE';
        if (q >= 90) return 'SUPERIOR';
        if (q >= 80) return 'FINE';
        if (q >= 70) return 'STANDARD';
        if (q >= 60) return 'RUSTIC';
        return 'CRUDE';
    };

    const getRarityColor = (rarity?: string) => {
        switch (rarity) {
            case 'Legendary': return 'text-amber-100 border-amber-400 bg-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.4)]';
            case 'Epic': return 'text-purple-100 border-purple-400 bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]';
            case 'Rare': return 'text-blue-100 border-blue-400 bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.4)]';
            case 'Uncommon': return 'text-emerald-100 border-emerald-400 bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
            default: return 'text-stone-300 border-stone-600 bg-stone-700';
        }
    };

    const getInventoryItemImageUrl = (item: InventoryItem) => {
        const isEquip = item.type === 'EQUIPMENT';
        const folder = isEquip ? 'equipments' : 'materials';
        if (isEquip && item.equipmentData) {
            if (item.equipmentData.image) return getAssetUrl(item.equipmentData.image, folder);
            return item.equipmentData.recipeId ? getAssetUrl(`${item.equipmentData.recipeId}.png`, folder) : getAssetUrl(`${item.id.split('_')[0]}.png`, folder);
        }
        return getAssetUrl(`${item.id}.png`, folder);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300 pointer-events-auto">
            <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-row shadow-2xl animate-in zoom-in-95 duration-300 relative">
                <div className="flex-1 flex flex-col border-r border-stone-800 bg-stone-925/50 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-stone-800 flex justify-between items-center bg-stone-900 shrink-0">
                        <div>
                            <h3 className="font-serif font-black text-xl text-stone-100 uppercase tracking-tighter">Select Instance</h3>
                            <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest mt-0.5">Which one will you part with?</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full text-stone-500 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <ItemSelectorList 
                        items={matchingItems}
                        onSelect={onSelect}
                        onToggleLock={onToggleLock}
                        customerMarkup={customerMarkup}
                    />
                    
                    <div className="p-4 border-t border-stone-800 bg-stone-900/80 flex justify-end gap-3 shrink-0">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 font-black uppercase text-xs transition-all flex items-center gap-2"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button 
                            onClick={() => selectedInstance && onSell(selectedInstance)}
                            disabled={!selectedInstance || selectedInstance.isLocked}
                            className={`px-10 py-3 rounded-xl font-black uppercase text-xs transition-all flex items-center gap-2 border-b-4 ${(!selectedInstance || selectedInstance.isLocked) ? 'bg-stone-800 text-stone-600 border-stone-950 grayscale cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 shadow-xl active:scale-95'}`}
                        >
                            <Check className="w-4 h-4" /> Select & Sell
                        </button>
                    </div>
                </div>
                
                <div className="hidden md:flex w-72 lg:w-96 flex-col bg-stone-900 overflow-hidden">
                    <div className="p-6 border-b border-stone-800 flex items-center gap-3 shrink-0">
                        <div className="text-stone-500"><Info className="w-5 h-5" /></div>
                        <h3 className="font-bold text-stone-400 uppercase tracking-widest text-sm">Item Inspection</h3>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                        {selectedInstance ? (
                            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-24 h-24 bg-stone-950 rounded-full border-2 flex items-center justify-center mb-3 shadow-2xl relative ${getRarityColor(selectedInstance.equipmentData?.rarity)}`}>
                                        <img src={getInventoryItemImageUrl(selectedInstance)} className={`w-16 h-16 object-contain ${selectedInstance.isLocked ? 'opacity-50 grayscale' : ''}`} />
                                        {selectedInstance.isLocked && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-600 p-2 rounded-full border-2 border-stone-900 shadow-xl">
                                                <Lock className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-xl font-bold text-amber-500 font-serif leading-none">{selectedInstance.name}</h4>
                                    <div className="flex flex-col items-center gap-1.5 mt-2.5">
                                        <div className={`px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm ${getRarityColor(selectedInstance.equipmentData?.rarity)}`}>
                                            {selectedInstance.equipmentData?.rarity}
                                        </div>
                                        <div className={`px-2 py-0.5 rounded border border-stone-800 bg-stone-950 text-[8px] font-bold uppercase flex items-center gap-1 ${selectedInstance.equipmentData?.quality && selectedInstance.equipmentData.quality >= 100 ? 'text-amber-400' : 'text-stone-500'}`}>
                                            <Sparkles className="w-2.5 h-2.5 fill-current" /> {getQualityLabel(selectedInstance.equipmentData?.quality || 100)} Grade
                                        </div>
                                    </div>
                                </div>

                                {selectedInstance.equipmentData && (
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black text-stone-600 uppercase tracking-widest border-b border-stone-800 pb-1 flex items-center gap-2"><Sword className="w-3 h-3" /> Performance</h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: 'P.ATK', value: selectedInstance.equipmentData.stats.physicalAttack, icon: <Sword className="w-3 h-3 text-orange-500" /> },
                                                { label: 'P.DEF', value: selectedInstance.equipmentData.stats.physicalDefense, icon: <Shield className="w-3 h-3 text-blue-500" /> },
                                                { label: 'M.ATK', value: selectedInstance.equipmentData.stats.magicalAttack, icon: <Zap className="w-3 h-3 text-blue-400" /> },
                                                { label: 'M.DEF', value: selectedInstance.equipmentData.stats.magicalDefense, icon: <Brain className="w-3 h-3 text-purple-400" /> }
                                            ].map(s => (
                                                <div key={s.label} className="bg-stone-950/50 p-2 rounded-lg border border-stone-800 flex justify-between items-center">
                                                    <span className="text-[9px] font-bold text-stone-500 flex items-center gap-1">{s.icon} {s.label}</span>
                                                    <span className="font-mono text-xs font-black text-stone-200">{s.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto pt-6">
                                    <div className="flex justify-between items-center px-1 mb-2">
                                        <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Offered Price</span>
                                        <span className={`text-2xl font-mono font-black ${selectedInstance.isLocked ? 'text-stone-600' : 'text-emerald-400'}`}>{Math.ceil(selectedInstance.baseValue * customerMarkup)} G</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-stone-700 italic text-center p-8 gap-4 opacity-50">
                                <Search className="w-12 h-12" />
                                <p className="text-sm">Select an item to inspect its quality and stats before finalizing the contract.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

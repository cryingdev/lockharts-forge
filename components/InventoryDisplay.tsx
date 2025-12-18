import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Package, Sword, Shield, Coins, Info, Zap } from 'lucide-react';
import { InventoryItem } from '../types/index';
import { getAssetUrl } from '../utils';

export const InventoryDisplay = () => {
    const { state, actions } = useGame();
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const handleSelect = (item: InventoryItem) => {
        setSelectedItem(item);
    };

    const handleQuickSell = () => {
        if (!selectedItem) return;
        const sellPrice = Math.floor(selectedItem.baseValue * 0.5);
        if (sellPrice <= 0) return;
        actions.sellItem(selectedItem.id, 1, sellPrice, selectedItem.type === 'EQUIPMENT' ? selectedItem.id : undefined);
        if (selectedItem.quantity <= 1) setSelectedItem(null);
    };

    const handleConsume = () => {
        if (!selectedItem) return;
        actions.useItem(selectedItem.id);
        if (selectedItem.quantity <= 1) setSelectedItem(null);
    };

    const currentSelectedItem = state.inventory.find(i => i.id === selectedItem?.id) || null;
    if (selectedItem && !currentSelectedItem) setSelectedItem(null);

    const getItemImageUrl = (item: InventoryItem) => {
        if (item.type === 'EQUIPMENT' && item.equipmentData) {
            return item.equipmentData.recipeId ? getAssetUrl(`${item.equipmentData.recipeId}.png`) : getAssetUrl(`${item.id.split('_')[0]}.png`);
        }
        return getAssetUrl(`${item.id}.png`);
    };

    return (
        <div className="flex h-full w-full max-w-6xl mx-auto p-4 gap-4 overflow-hidden">
            <div className="flex-[2] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
                <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Package className="w-4 h-4 text-amber-500" /><h3 className="text-slate-200 text-sm uppercase tracking-wider font-bold">Inventory</h3></div>
                    <span className="text-xs text-slate-500 font-mono">{state.inventory.length} Items</span>
                </div>
                <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
                    {state.inventory.length === 0 ? (
                        <div className="text-slate-500 text-center py-12 italic flex flex-col items-center"><Package className="w-12 h-12 mb-2 opacity-20" />Empty</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {state.inventory.map(item => {
                                const isSelected = currentSelectedItem?.id === item.id;
                                return (
                                    <button
                                        key={item.id} onClick={() => handleSelect(item)}
                                        className={`relative flex flex-col items-center p-3 rounded-lg border transition-all h-28 justify-between ${isSelected ? 'bg-amber-900/20 border-amber-500 shadow-md ring-1 ring-amber-500/50' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'}`}
                                    >
                                        <div className="absolute top-1.5 right-1.5 bg-slate-950/80 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-mono">x{item.quantity}</div>
                                        <div className="flex-1 flex items-center justify-center">
                                             <img src={getItemImageUrl(item)} className="w-10 h-10 object-contain drop-shadow-md" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                             <span className="hidden text-3xl">{item.icon || '📦'}</span>
                                        </div>
                                        <div className="text-xs text-center font-medium text-slate-300 w-full truncate px-1">{item.name}</div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 bg-black rounded-xl border border-stone-800 overflow-hidden flex flex-col min-w-[300px]">
                <div className="bg-stone-900/50 p-3 border-b border-stone-800 flex items-center gap-2"><Info className="w-4 h-4 text-stone-500" /><h3 className="text-stone-400 text-sm uppercase tracking-wider font-bold">Item Details</h3></div>
                {currentSelectedItem ? (
                    <div className="flex-1 p-6 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-24 h-24 bg-stone-900 rounded-full border-2 border-stone-700 flex items-center justify-center mb-4 shadow-lg">
                                <img src={getItemImageUrl(currentSelectedItem)} className="w-14 h-14 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                <span className="hidden text-5xl">{currentSelectedItem.icon || '📦'}</span>
                            </div>
                            <h2 className="text-xl font-bold text-amber-500 font-serif">{currentSelectedItem.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-stone-400 font-mono uppercase">{currentSelectedItem.type}</span>
                                {currentSelectedItem.type === 'EQUIPMENT' && currentSelectedItem.equipmentData && <span className="text-[10px] bg-amber-900/30 border border-amber-800 text-amber-500 px-2 py-0.5 rounded font-mono uppercase">Quality: {currentSelectedItem.equipmentData.quality}</span>}
                            </div>
                        </div>
                        <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-800 mb-6"><p className="text-stone-400 text-sm italic leading-relaxed">"{currentSelectedItem.description}"</p></div>
                        {currentSelectedItem.equipmentData?.stats && (
                            <div className="mb-6 space-y-2">
                                <h4 className="text-xs text-stone-500 uppercase font-bold tracking-widest mb-2 border-b border-stone-800 pb-1">Stats</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex justify-between bg-stone-900 p-2 rounded border border-stone-800"><span className="text-xs text-stone-400 flex items-center gap-1"><Sword className="w-3 h-3" /> Phys Atk</span><span className="text-xs font-mono text-stone-200">{currentSelectedItem.equipmentData.stats.physicalAttack}</span></div>
                                    <div className="flex justify-between bg-stone-900 p-2 rounded border border-stone-800"><span className="text-xs text-stone-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Phys Def</span><span className="text-xs font-mono text-stone-200">{currentSelectedItem.equipmentData.stats.physicalDefense}</span></div>
                                    <div className="flex justify-between bg-stone-900 p-2 rounded border border-stone-800"><span className="text-xs text-stone-400 flex items-center gap-1">✨ Mag Atk</span><span className="text-xs font-mono text-stone-200">{currentSelectedItem.equipmentData.stats.magicalAttack}</span></div>
                                     <div className="flex justify-between bg-stone-900 p-2 rounded border border-stone-800"><span className="text-xs text-stone-400 flex items-center gap-1">🛡️ Mag Def</span><span className="text-xs font-mono text-stone-200">{currentSelectedItem.equipmentData.stats.magicalDefense}</span></div>
                                </div>
                            </div>
                        )}
                        <div className="mt-auto space-y-3">
                            {currentSelectedItem.type === 'CONSUMABLE' && <button onClick={handleConsume} className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 text-emerald-100 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-lg"><Zap className="w-4 h-4 text-emerald-300 group-hover:scale-110" /><span className="font-bold">Consume Item</span></button>}
                            {currentSelectedItem.baseValue > 0 && currentSelectedItem.type !== 'KEY_ITEM' && currentSelectedItem.type !== 'TOOL' ? (
                                <div className="bg-stone-900 p-4 rounded-lg border border-stone-800">
                                    <div className="flex justify-between items-center mb-3"><span className="text-stone-400 text-xs font-bold uppercase">Market Value</span><span className="text-amber-500 font-mono">{currentSelectedItem.baseValue} G</span></div>
                                    <button onClick={handleQuickSell} className="w-full py-3 bg-stone-800 hover:bg-red-900/30 border border-stone-700 hover:border-red-800 text-stone-300 hover:text-red-400 rounded-lg transition-all flex items-center justify-center gap-2"><Coins className="w-4 h-4 text-amber-500" /><span className="font-bold">Quick Sell ({Math.floor(currentSelectedItem.baseValue * 0.5)} G)</span></button>
                                </div>
                            ) : <div className="p-4 text-center text-stone-600 text-sm border border-dashed border-stone-800 rounded-lg">This item cannot be sold.</div>}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-600 p-6 text-center"><div className="w-20 h-20 bg-stone-900/50 rounded-full flex items-center justify-center mb-4"><Info className="w-8 h-8 opacity-30" /></div><p className="text-lg font-medium text-stone-500">Select an item</p></div>
                )}
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Package, Sword, Shield, Coins, Info, Zap, Wrench, ShieldAlert, AlertCircle, Brain } from 'lucide-react';
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
            if (item.equipmentData.image) return getAssetUrl(item.equipmentData.image);
            return item.equipmentData.recipeId ? getAssetUrl(`${item.equipmentData.recipeId}.png`) : getAssetUrl(`${item.id.split('_')[0]}.png`);
        }
        return getAssetUrl(`${item.id}.png`);
    };

    const renderEquipmentStats = (item: InventoryItem) => {
        if (!item.equipmentData?.stats) return null;
        const s = item.equipmentData.stats;
        
        // 스테프나 마법 무기의 경우 마법 수치가 더 높으면 마법 스탯을 우선 표시
        const isMagical = s.magicalAttack > s.physicalAttack || s.magicalDefense > s.physicalDefense;
        const atkLabel = isMagical ? "M.ATK" : "P.ATK";
        const defLabel = isMagical ? "M.DEF" : "P.DEF";
        const atkValue = isMagical ? s.magicalAttack : s.physicalAttack;
        const defValue = isMagical ? s.magicalDefense : s.physicalDefense;

        return (
            <div className="mb-4 space-y-1 shrink-0">
                <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex justify-between bg-stone-900 p-1.5 rounded border border-stone-800 text-[9px] md:text-[10px]">
                        <span className="text-stone-500 uppercase flex items-center gap-1">
                            {isMagical ? <Zap className="w-2 h-2 text-blue-400" /> : <Sword className="w-2 h-2 text-stone-500" />}
                            {atkLabel}
                        </span>
                        <span className="font-mono text-stone-200 font-bold">{atkValue}</span>
                    </div>
                    <div className="flex justify-between bg-stone-900 p-1.5 rounded border border-stone-800 text-[9px] md:text-[10px]">
                        <span className="text-stone-500 uppercase flex items-center gap-1">
                            {isMagical ? <Brain className="w-2 h-2 text-purple-400" /> : <Shield className="w-2 h-2 text-stone-500" />}
                            {defLabel}
                        </span>
                        <span className="font-mono text-stone-200 font-bold">{defValue}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-row h-full w-full max-w-7xl mx-auto p-2 md:p-4 gap-2 md:gap-4 overflow-hidden">
            
            {/* Grid Area */}
            <div className="flex-[1.5] md:flex-[2.5] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col min-w-0">
                <div className="bg-slate-800/50 p-2 md:p-3 border-b border-slate-700 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                        <h3 className="text-slate-200 text-xs md:text-sm uppercase tracking-wider font-bold">Inventory</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{state.inventory.length}</span>
                </div>
                <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                    {state.inventory.length === 0 ? (
                        <div className="text-slate-500 text-center py-12 italic text-xs">Empty</div>
                    ) : (
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                            {state.inventory.map(item => {
                                const isSelected = currentSelectedItem?.id === item.id;
                                return (
                                    <button
                                        key={item.id} onClick={() => handleSelect(item)}
                                        className={`relative flex flex-col items-center p-2 rounded-lg border transition-all h-20 md:h-28 justify-between ${isSelected ? 'bg-amber-900/20 border-amber-500 shadow-md ring-1 ring-amber-500/50' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'}`}
                                    >
                                        <div className="absolute top-1 right-1 bg-slate-950/80 px-1 rounded text-[8px] md:text-[10px] text-slate-400 font-mono">x{item.quantity}</div>
                                        <div className="flex-1 flex items-center justify-center">
                                             <img src={getItemImageUrl(item)} className="w-6 h-6 md:w-10 md:h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                             <span className="hidden text-xl">📦</span>
                                        </div>
                                        <div className="text-[9px] md:text-xs text-center font-medium text-slate-300 w-full truncate">{item.name}</div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Details Area */}
            <div className="flex-1 md:w-96 bg-black rounded-xl border border-stone-800 overflow-hidden flex flex-col min-w-0">
                <div className="bg-stone-900/50 p-2 md:p-3 border-b border-stone-800 flex items-center gap-2 shrink-0">
                    <Info className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-500" />
                    <h3 className="text-stone-400 text-[10px] md:text-xs uppercase tracking-wider font-bold">Details</h3>
                </div>
                {currentSelectedItem ? (
                    <div className="flex-1 p-3 md:p-5 flex flex-col animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col items-center text-center mb-4 shrink-0">
                            <div className="w-12 h-12 md:w-20 md:h-20 bg-stone-900 rounded-full border-2 border-stone-700 flex items-center justify-center mb-2 shadow-lg">
                                <img src={getItemImageUrl(currentSelectedItem)} className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                            </div>
                            <h2 className="text-sm md:text-lg font-bold text-amber-500 font-serif leading-tight">{currentSelectedItem.name}</h2>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[8px] md:text-[10px] bg-stone-800 px-1.5 py-0.5 rounded text-stone-400 font-mono uppercase">{currentSelectedItem.type}</span>
                            </div>
                        </div>

                        <p className="text-stone-400 text-[10px] md:text-xs italic leading-tight text-center mb-4 px-1">"{currentSelectedItem.description}"</p>
                        
                        {renderEquipmentStats(currentSelectedItem)}

                        <div className="mt-auto space-y-2 pt-2">
                            {(currentSelectedItem.type === 'CONSUMABLE' || currentSelectedItem.type === 'SCROLL') && (
                                <button onClick={handleConsume} className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded text-[10px] md:text-sm font-bold transition-all">
                                    {currentSelectedItem.type === 'SCROLL' ? 'Study Scroll' : 'Use Item'}
                                </button>
                            )}
                            {currentSelectedItem.baseValue > 0 && currentSelectedItem.type !== 'KEY_ITEM' && (
                                <button onClick={handleQuickSell} className="w-full py-2 bg-stone-800 hover:bg-red-900/30 text-stone-300 rounded text-[10px] md:text-sm font-bold border border-stone-700 transition-all">
                                    Sell ({Math.floor(currentSelectedItem.baseValue * 0.5)}G)
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-600 p-4 text-center">
                        <Package className="w-6 h-6 md:w-8 md:h-8 opacity-20 mb-2" />
                        <p className="text-[10px] md:text-xs">Select an item</p>
                    </div>
                )}
            </div>
        </div>
    );
};

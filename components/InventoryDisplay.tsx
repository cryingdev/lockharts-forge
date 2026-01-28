
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { 
    Package, Sword, Shield, Coins, Info, Zap, Wrench, ShieldAlert, AlertCircle, 
    Brain, Lock, Unlock, Star, Sparkles, X, Minus, Plus, ChevronRight 
} from 'lucide-react';
import { InventoryItem } from '../types/index';
import { getAssetUrl } from '../utils';

const RomanTierOverlay = ({ id }: { id: string }) => {
    if (id === 'scroll_t2') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-xs md:text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] translate-y-1">II</span></div>;
    if (id === 'scroll_t3') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-xs md:text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] translate-y-1">III</span></div>;
    if (id === 'scroll_t4') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-xs md:text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] translate-y-1">IV</span></div>;
    return null;
};

const AdaptiveInventoryImage = ({ item, className }: { item: InventoryItem, className?: string }) => {
    const isEquip = item.type === 'EQUIPMENT';
    const folder = isEquip ? 'equipments' : 'materials';
    
    const baseId = (isEquip && item.equipmentData?.recipeId) 
        ? item.equipmentData.recipeId 
        : item.id;
    
    const [imgSrc, setImgSrc] = useState(getAssetUrl(`${baseId}.png`, folder));

    // 아이템 데이터가 변경될 때 이미지 경로 상태를 동기화합니다.
    useEffect(() => {
        setImgSrc(getAssetUrl(`${baseId}.png`, folder));
    }, [baseId, folder]);

    const handleImgError = () => {
        const fallbackPath = item.image || item.equipmentData?.image;
        if (fallbackPath && imgSrc !== getAssetUrl(fallbackPath, folder)) {
            setImgSrc(getAssetUrl(fallbackPath, folder));
        }
    };

    return <img src={imgSrc} onError={handleImgError} className={className} />;
};

export const InventoryDisplay = () => {
    const { state, actions } = useGame();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [sellQuantity, setSellQuantity] = useState(1);

    const currentSelectedItem = useMemo(() => 
        state.inventory.find(i => i.id === selectedItemId) || null
    , [state.inventory, selectedItemId]);

    const handleSelect = (item: InventoryItem) => {
        setSelectedItemId(item.id);
    };

    const handleOpenSellModal = () => {
        if (!currentSelectedItem || currentSelectedItem.isLocked) return;
        setSellQuantity(1);
        setIsSellModalOpen(true);
    };

    const handleConfirmBulkSell = () => {
        if (!currentSelectedItem) return;
        const sellPricePerItem = Math.floor(currentSelectedItem.baseValue * 0.5);
        const totalPrice = sellPricePerItem * sellQuantity;
        
        actions.sellItem(
            currentSelectedItem.id, 
            sellQuantity, 
            totalPrice, 
            currentSelectedItem.type === 'EQUIPMENT' ? currentSelectedItem.id : undefined
        );
        
        setIsSellModalOpen(false);
        // If we sold all items, deselect
        if (currentSelectedItem.quantity <= sellQuantity) {
            setSelectedItemId(null);
        }
    };

    const handleConsume = () => {
        if (!currentSelectedItem) return;
        actions.useItem(currentSelectedItem.id);
        if (currentSelectedItem.quantity <= 1) setSelectedItemId(null);
    };

    const getQualityLabel = (q: number): string => {
        if (q >= 110) return 'MASTERWORK';
        if (q >= 100) return 'PRISTINE';
        if (q >= 90) return 'SUPERIOR';
        if (q >= 80) return 'FINE';
        if (q >= 70) return 'STANDARD';
        if (q >= 60) return 'RUSTIC';
        return 'CRUDE';
    };

    const getRarityClasses = (rarity?: string) => {
        switch (rarity) {
            case 'Legendary': return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
            case 'Epic': return 'text-purple-400 border-purple-500/50 bg-purple-950/40';
            case 'Rare': return 'text-blue-400 border-blue-500/50 bg-blue-950/40';
            case 'Uncommon': return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
            default: return 'text-stone-400 border-stone-700/50 bg-stone-900/40';
        }
    };

    const renderEquipmentStats = (item: InventoryItem) => {
        if (!item.equipmentData?.stats) return null;
        const s = item.equipmentData.stats;
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
                {item.equipmentData.quality && (
                     <div className="flex justify-between bg-stone-900 p-1.5 rounded border border-stone-800 text-[9px] md:text-[10px]">
                        <span className="text-stone-500 uppercase flex items-center gap-1">
                            <Sparkles className="w-2 h-2 text-amber-500" /> Quality
                        </span>
                        <span className="font-black text-amber-500 uppercase tracking-tighter">{getQualityLabel(item.equipmentData.quality)}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-row h-full w-full max-w-7xl mx-auto p-2 md:p-4 gap-2 md:gap-4 overflow-hidden relative">
            
            {/* Storage List Section */}
            <div className="flex-[1.5] md:flex-[2.5] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col min-w-0">
                <div className="bg-slate-800/50 p-2 md:p-3 border-b border-slate-700 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-50" />
                        <h3 className="text-slate-200 text-xs md:text-sm uppercase tracking-wider font-bold">Storage</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{state.inventory.length}</span>
                </div>
                <div className="p-2 overflow-y-auto flex-1 custom-scrollbar min-h-0 bg-stone-950/20">
                    {state.inventory.length === 0 ? (
                        <div className="text-slate-500 text-center py-12 italic text-xs">Empty</div>
                    ) : (
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 pb-8">
                            {state.inventory.map(item => {
                                const isSelected = selectedItemId === item.id;
                                return (
                                    <button
                                        key={item.id} onClick={() => handleSelect(item)}
                                        className={`relative flex flex-col items-center p-2 rounded-lg border transition-all h-20 md:h-28 justify-between ${isSelected ? 'bg-amber-900/20 border-amber-500 shadow-md ring-1 ring-amber-500/50' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'}`}
                                    >
                                        <div className="absolute top-1 right-1 bg-slate-950/80 px-1 rounded text-[8px] md:text-[10px] text-slate-400 font-mono flex items-center gap-1 z-20">
                                            {item.isLocked && <Lock className="w-2 h-2 md:w-2.5 md:h-2.5 text-amber-500" />}
                                            x{item.quantity}
                                        </div>
                                        <div className="flex-1 flex items-center justify-center relative">
                                             <AdaptiveInventoryImage item={item} className="w-6 h-6 md:w-10 md:h-10 object-contain" />
                                             <RomanTierOverlay id={item.id} />
                                        </div>
                                        <div className="text-[9px] md:text-xs text-center font-medium text-slate-300 w-full truncate">{item.name}</div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Details Section */}
            <div className="flex-1 md:w-96 bg-black rounded-xl border border-stone-800 overflow-hidden flex flex-col min-w-0">
                <div className="bg-stone-900/50 p-2 md:p-3 border-b border-stone-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-500" />
                        <h3 className="text-stone-400 text-[10px] md:text-xs uppercase tracking-wider font-bold">Details</h3>
                    </div>
                    {currentSelectedItem && (
                         <button 
                            onClick={() => actions.toggleLockItem(currentSelectedItem.id)}
                            className={`p-1.5 rounded-lg border transition-all ${currentSelectedItem.isLocked ? 'bg-amber-950/40 border-amber-600/50 text-amber-500' : 'bg-stone-900 border-stone-800 text-stone-600 hover:text-stone-300'}`}
                            title={currentSelectedItem.isLocked ? 'Unlock Item' : 'Lock Item'}
                         >
                            {currentSelectedItem.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                         </button>
                    )}
                </div>
                {currentSelectedItem ? (
                    <div className="flex-1 p-3 md:p-5 flex flex-col animate-in fade-in duration-300 overflow-y-auto custom-scrollbar min-h-0">
                        <div className="flex flex-col items-center text-center mb-4 shrink-0">
                            <div className={`w-12 h-12 md:w-20 md:h-20 bg-stone-900 rounded-full border-2 flex items-center justify-center mb-2 shadow-lg relative ${currentSelectedItem.equipmentData ? getRarityClasses(currentSelectedItem.equipmentData.rarity) : 'border-stone-700'}`}>
                                <AdaptiveInventoryImage item={currentSelectedItem} className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                                <RomanTierOverlay id={currentSelectedItem.id} />
                                {currentSelectedItem.isLocked && (
                                    <div className="absolute -top-1 -right-1 bg-amber-600 text-white p-1 rounded-full border border-stone-900 shadow-lg z-30">
                                        <Lock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                                    </div>
                                )}
                            </div>
                            <h2 className="text-sm md:text-lg font-bold text-amber-500 font-serif leading-tight">{currentSelectedItem.name}</h2>
                            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5">
                                <span className="text-[7px] md:text-[9px] bg-stone-800 px-1.5 py-0.5 rounded text-stone-400 font-mono uppercase border border-white/5">{currentSelectedItem.type}</span>
                                {currentSelectedItem.equipmentData && (
                                    <span className={`text-[7px] md:text-[9px] px-1.5 py-0.5 rounded font-black uppercase border leading-none shadow-sm ${getRarityClasses(currentSelectedItem.equipmentData.rarity)}`}>
                                        {currentSelectedItem.equipmentData.rarity}
                                    </span>
                                )}
                            </div>
                        </div>

                        <p className="text-stone-400 text-[10px] md:text-xs italic leading-tight text-center mb-4 px-1 shrink-0">"{currentSelectedItem.description}"</p>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1">
                            {renderEquipmentStats(currentSelectedItem)}
                        </div>

                        <div className="mt-4 space-y-2 pt-2 shrink-0">
                            {(currentSelectedItem.type === 'CONSUMABLE' || currentSelectedItem.type === 'SCROLL') && (
                                <button onClick={handleConsume} className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded text-[10px] md:text-sm font-bold transition-all">
                                    {currentSelectedItem.type === 'SCROLL' ? 'Study Scroll' : 'Use Item'}
                                </button>
                            )}
                            {currentSelectedItem.baseValue > 0 && currentSelectedItem.type !== 'KEY_ITEM' && (
                                <button 
                                    onClick={handleOpenSellModal} 
                                    disabled={currentSelectedItem.isLocked}
                                    className={`w-full py-2 rounded text-[10px] md:text-sm font-bold border transition-all ${currentSelectedItem.isLocked ? 'bg-stone-900 border-stone-800 text-stone-700 cursor-not-allowed' : 'bg-stone-800 hover:bg-red-900/30 text-stone-300 border-stone-700'}`}
                                >
                                    {currentSelectedItem.isLocked ? <span className="flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Item Locked</span> : `Sell (${Math.floor(currentSelectedItem.baseValue * 0.5)}G)`}
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

            {/* Bulk Sell Modal */}
            {isSellModalOpen && currentSelectedItem && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
                        <div className="p-4 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-stone-200 font-serif uppercase tracking-widest text-sm">Sell Inventory</h3>
                            <button onClick={() => setIsSellModalOpen(false)} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="p-6 flex flex-col items-center gap-6">
                            <div className="flex items-center gap-4 w-full">
                                <div className="w-16 h-16 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-center shrink-0">
                                    <AdaptiveInventoryImage item={currentSelectedItem} className="w-10 h-10 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-stone-100 font-black text-sm truncate uppercase">{currentSelectedItem.name}</h4>
                                    <p className="text-stone-500 text-[10px] font-bold">Price per unit: <span className="text-amber-500">{Math.floor(currentSelectedItem.baseValue * 0.5)}G</span></p>
                                </div>
                            </div>

                            <div className="w-full bg-stone-950/50 p-4 rounded-2xl border border-stone-800 flex flex-col items-center gap-3">
                                <span className="text-[8px] font-black text-stone-600 uppercase tracking-[0.2em]">Select Quantity</span>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                                        className="w-10 h-10 bg-stone-800 hover:bg-stone-700 rounded-full flex items-center justify-center text-stone-400 transition-colors border border-stone-700"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <div className="flex flex-col items-center min-w-[80px]">
                                        <span className="text-3xl font-mono font-black text-stone-100 leading-none">{sellQuantity}</span>
                                        <span className="text-[10px] font-bold text-stone-600 uppercase mt-1">/ {currentSelectedItem.quantity}</span>
                                    </div>
                                    <button 
                                        onClick={() => setSellQuantity(Math.min(currentSelectedItem.quantity, sellQuantity + 1))}
                                        className="w-10 h-10 bg-stone-800 hover:bg-stone-700 rounded-full flex items-center justify-center text-stone-400 transition-colors border border-stone-700"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex gap-2 w-full mt-2">
                                    <button 
                                        onClick={() => setSellQuantity(1)}
                                        className="flex-1 py-1.5 bg-stone-900 hover:bg-stone-800 rounded-lg text-[9px] font-black text-stone-500 uppercase border border-stone-800 transition-all"
                                    >
                                        Min
                                    </button>
                                    <button 
                                        onClick={() => setSellQuantity(currentSelectedItem.quantity)}
                                        className="flex-1 py-1.5 bg-stone-900 hover:bg-stone-800 rounded-lg text-[9px] font-black text-amber-500/80 uppercase border border-stone-800 transition-all"
                                    >
                                        Max
                                    </button>
                                </div>
                            </div>

                            <div className="w-full flex justify-between items-center px-2 py-3 border-t border-stone-800">
                                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Total Payout</span>
                                <div className="flex items-center gap-1.5">
                                    <Coins className="w-5 h-5 text-amber-500" />
                                    <span className="text-2xl font-mono font-black text-emerald-400">
                                        {(sellQuantity * Math.floor(currentSelectedItem.baseValue * 0.5)).toLocaleString()} G
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-stone-850 border-t border-stone-800 flex gap-3">
                            <button 
                                onClick={() => setIsSellModalOpen(false)}
                                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-400 font-black rounded-xl text-xs uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmBulkSell}
                                className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 border-b-4 border-emerald-800 active:translate-y-0.5"
                            >
                                Confirm Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Lock, Unlock, Star, Sword, Shield, Coins, Package, Sparkles, Check } from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { getAssetUrl } from '../utils';
import { useGame } from '../context/GameContext';

const RomanTierOverlay = ({ id, isList = false }: { id: string, isList?: boolean }) => {
    const sizeClasses = isList ? "text-[10px] md:text-lg" : "text-xs md:text-2xl";
    const translateClasses = isList ? "translate-y-0.5" : "translate-y-1 md:translate-y-2";
    
    if (id === 'scroll_t2') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className={`text-amber-500 font-serif font-black ${sizeClasses} drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${translateClasses}`}>II</span></div>;
    if (id === 'scroll_t3') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className={`text-amber-500 font-serif font-black ${sizeClasses} drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${translateClasses}`}>III</span></div>;
    if (id === 'scroll_t4') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className={`text-amber-500 font-serif font-black ${sizeClasses} drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${translateClasses}`}>IV</span></div>;
    return null;
};

const AdaptiveItemImage = ({ item, className }: { item: InventoryItem, className?: string }) => {
    const baseId = (item.type === 'EQUIPMENT' && item.equipmentData?.recipeId) 
        ? item.equipmentData.recipeId 
        : item.id;
    
    const [imgSrc, setImgSrc] = useState(getAssetUrl(`${baseId}.png`));

    // 아이템이 변경되면 이미지 소스 초기화
    useEffect(() => {
        setImgSrc(getAssetUrl(`${baseId}.png`));
    }, [baseId]);

    const handleImgError = () => {
        const fallbackPath = item.image || item.equipmentData?.image;
        if (fallbackPath && imgSrc !== getAssetUrl(fallbackPath)) {
            setImgSrc(getAssetUrl(fallbackPath));
        }
    };

    return <img src={imgSrc} onError={handleImgError} className={className} />;
};

interface ItemSelectorListProps {
    items: (InventoryItem & { isSelected?: boolean })[];
    onSelect: (item: InventoryItem) => void;
    onToggleLock: (itemId: string) => void;
    selectedItemId?: string | null;
    customerMarkup?: number;
    emptyMessage?: string;
}

export const ItemSelectorList: React.FC<ItemSelectorListProps> = ({ 
    items, 
    onSelect, 
    onToggleLock, 
    selectedItemId,
    customerMarkup = 1.0,
    emptyMessage = "No items available."
}) => {
    const { state, actions } = useGame();
    const viewMode = state.settings.inventoryViewMode || 'LIST';

    const setViewMode = (mode: 'GRID' | 'LIST') => {
        actions.updateSettings({ inventoryViewMode: mode });
    };

    const getQualityLabel = (q: number): string => {
        if (q >= 110) return 'Masterwork';
        if (q >= 100) return 'Pristine';
        if (q >= 90) return 'Superior';
        if (q >= 80) return 'Fine';
        if (q >= 70) return 'Standard';
        if (q >= 60) return 'Rustic';
        return 'Crude';
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

    if (items.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-700 italic p-12 text-center bg-stone-950/40 rounded-2xl border border-stone-900 border-dashed m-4">
                <Package className="w-12 h-12 opacity-10 mb-2" />
                <p className="text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-stone-900/50 w-full overflow-hidden">
            {/* View Mode Toggle */}
            <div className="flex justify-end p-2 px-4 gap-2 bg-stone-900 border-b border-white/5 shrink-0">
                <button 
                    onClick={() => setViewMode('GRID')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-amber-600 text-white shadow-lg scale-110' : 'bg-stone-800 text-stone-500 hover:text-stone-300'}`}
                    title="Grid View"
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setViewMode('LIST')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-amber-600 text-white shadow-lg scale-110' : 'bg-stone-800 text-stone-500 hover:text-stone-300'}`}
                    title="List View"
                >
                    <List className="w-4 h-4" />
                </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-hidden relative">
                <div className={`absolute inset-0 overflow-y-auto custom-scrollbar p-3 md:p-4 bg-stone-950 shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] ${viewMode === 'GRID' ? 'grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3' : 'flex flex-col gap-2'}`}>
                    {items.map(item => {
                        const isLocked = item.isLocked;
                        const isSelected = selectedItemId === item.id || item.isSelected;
                        const isEquip = item.type === 'EQUIPMENT' && item.equipmentData;
                        const finalPrice = Math.ceil(item.baseValue * customerMarkup);
                        
                        if (viewMode === 'GRID') {
                            const rarityClasses = getRarityColor(item.equipmentData?.rarity);
                            const stats = item.equipmentData?.stats;
                            const mainAtk = stats ? Math.max(stats.physicalAttack, stats.magicalAttack) : 0;
                            const mainDef = stats ? Math.max(stats.physicalDefense, stats.magicalDefense) : 0;
                            const qualityLabel = isEquip ? getQualityLabel(item.equipmentData!.quality) : '';

                            return (
                                <div key={item.id} className="relative group aspect-square">
                                    <button
                                        onClick={() => !isLocked && onSelect(item)}
                                        disabled={isLocked}
                                        className={`w-full h-full rounded-xl border-2 transition-all flex flex-col items-center justify-center p-1 relative overflow-hidden shadow-2xl ${
                                            isSelected ? 'border-indigo-400 bg-indigo-900/20 ring-2 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 
                                            isLocked ? 'bg-stone-950 border-stone-900 opacity-40 grayscale' : 'bg-stone-800 border-stone-700 hover:border-amber-500 active:scale-95'
                                        }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                                        
                                        <div className="relative">
                                            <AdaptiveItemImage item={item} className="w-16 h-16 md:w-20 md:h-20 object-contain p-1 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                                            <RomanTierOverlay id={item.id} />
                                        </div>
                                        
                                        {/* Grid Top Info: Rarity Badge & Quantity */}
                                        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none items-start max-w-[85%] z-20">
                                            {isEquip && (
                                                <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border shadow-md leading-none ${rarityClasses}`}>
                                                    {item.equipmentData!.rarity}
                                                </div>
                                            )}
                                            {item.quantity > 1 && (
                                                <div className="bg-stone-950/90 rounded px-1.5 py-0.5 text-[8px] font-mono font-black text-stone-400 border border-stone-800 shadow-md">
                                                    x{item.quantity}
                                                </div>
                                            )}
                                        </div>

                                        {/* Selection/Alchemy Indicator */}
                                        {isSelected && (
                                            <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5 shadow-lg z-30 animate-pulse">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}

                                        {/* Quality Label Sparkle Overlay */}
                                        {isEquip && (
                                            <div className="absolute top-[60%] left-1/2 -translate-x-1/2 pointer-events-none z-20">
                                                <div className="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 shadow-lg">
                                                    <Sparkles className="w-2 h-2 text-amber-400" />
                                                    <span className="text-[7px] font-black text-amber-200 uppercase whitespace-nowrap tracking-tight">{qualityLabel}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Grid Bottom Info: Stats & Price */}
                                        <div className="absolute bottom-1 inset-x-1.5 flex justify-between items-end pointer-events-none z-20">
                                            {isEquip ? (
                                                <div className="flex flex-col gap-0.5">
                                                    {mainAtk > 0 && (
                                                        <div className="bg-stone-900/90 px-1.5 rounded flex items-center gap-1 border border-orange-900/50 shadow-md">
                                                            <Sword className="w-2 h-2 text-orange-500" />
                                                            <span className="text-[8px] font-mono font-black text-stone-200">{mainAtk}</span>
                                                        </div>
                                                    )}
                                                    {mainDef > 0 && (
                                                        <div className="bg-stone-900/90 px-1.5 rounded flex items-center gap-1 border border-blue-900/50 shadow-md">
                                                            <Shield className="w-2 h-2 text-blue-400" />
                                                            <span className="text-[8px] font-mono font-black text-stone-200">{mainDef}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : <div />}

                                            <div className="bg-stone-900/95 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-amber-900/40 shadow-xl">
                                                <span className="text-[9px] font-mono font-black text-amber-500">{finalPrice}</span>
                                                <Coins className="w-2.5 h-2.5 text-amber-600" />
                                            </div>
                                        </div>
                                    </button>

                                    {/* Floating Lock for Grid */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onToggleLock(item.id); }}
                                        className={`absolute top-1.5 right-1.5 p-1.5 rounded-lg border transition-all z-30 shadow-xl ${isLocked ? 'bg-amber-600 border-amber-400 text-white' : 'bg-stone-900/80 border-stone-700 text-stone-500 opacity-0 group-hover:opacity-100 hover:text-stone-200 hover:bg-stone-800'}`}
                                    >
                                        {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            );
                        }

                        // --- LIST MODE ---
                        return (
                            <div key={item.id} className="relative group shrink-0">
                                <button
                                    onClick={() => !isLocked && onSelect(item)}
                                    disabled={isLocked}
                                    className={`w-full flex items-center gap-3 p-2 md:p-3 rounded-xl border-2 transition-all text-left shadow-lg relative overflow-hidden ${
                                        isSelected ? 'border-indigo-400 bg-indigo-900/20 ring-2 ring-indigo-500/10 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]' : 
                                        isLocked ? 'bg-stone-950 border-stone-900 opacity-50 grayscale cursor-not-allowed' : 'bg-stone-800 border-stone-700 hover:border-amber-500'
                                    }`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>

                                    <div className="w-10 h-10 md:w-16 md:h-16 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-center shrink-0 overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)]">
                                        <AdaptiveItemImage item={item} className="w-8 h-8 md:w-12 md:h-12 object-contain drop-shadow-md" />
                                        <RomanTierOverlay id={item.id} isList />
                                        {isLocked && <Lock className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-amber-500 z-30" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[11px] md:text-sm font-black truncate ${isSelected ? 'text-indigo-200' : isLocked ? 'text-stone-500' : 'text-stone-100'}`}>{item.name}</span>
                                            {isEquip && (
                                                <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border shadow-sm leading-none ${getRarityColor(item.equipmentData!.rarity)}`}>
                                                    {item.equipmentData!.rarity}
                                                </div>
                                            )}
                                            {isSelected && (
                                                <div className="bg-indigo-600 px-1.5 py-0.5 rounded text-[7px] font-black text-white uppercase animate-pulse">In Use</div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mt-1">
                                            {isEquip ? (
                                                <>
                                                    <div className="flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                                        <span className="text-[9px] font-black text-amber-500 uppercase italic tracking-tight">{getQualityLabel(item.equipmentData!.quality)} Grade</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[8px] font-mono font-bold text-stone-500 border-l border-stone-700 pl-2">
                                                        {(item.equipmentData!.stats.physicalAttack > 0 || item.equipmentData!.stats.magicalAttack > 0) && (
                                                            <span className="flex items-center gap-1"><Sword className="w-2.5 h-2.5" /> {item.equipmentData!.stats.physicalAttack || item.equipmentData!.stats.magicalAttack}</span>
                                                        )}
                                                        {(item.equipmentData!.stats.physicalDefense > 0 || item.equipmentData!.stats.magicalDefense > 0) && (
                                                            <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> {item.equipmentData!.stats.physicalDefense || item.equipmentData!.stats.magicalDefense}</span>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-[9px] text-stone-500 font-mono font-bold uppercase tracking-wider">Inventory x{item.quantity}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0 bg-stone-950/50 p-2 rounded-lg border border-white/5">
                                        <div className={`flex items-center gap-1 font-mono font-black text-[10px] md:text-sm ${isSelected ? 'text-indigo-400' : isLocked ? 'text-stone-600' : 'text-emerald-400'}`}>
                                            <Coins className="w-3.5 h-3.5" /> {finalPrice}G
                                        </div>
                                    </div>
                                </button>

                                {/* Lock Toggle Button for List */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleLock(item.id); }}
                                    className={`absolute top-3 right-3 p-1.5 rounded-lg border transition-all z-30 ${isLocked ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-stone-900 border-stone-700 text-stone-500 opacity-0 group-hover:opacity-100 hover:text-stone-200'}`}
                                >
                                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { 
    Package, Sword, Shield, Coins, Info, Zap, Wrench, ShieldAlert, AlertCircle, 
    Brain, Lock, Unlock, Star, Sparkles, X, Minus, Plus, ChevronDown, Wand2, ArrowLeft,
    ChevronUp
} from 'lucide-react';
import { InventoryItem } from '../types/index';
import { getAssetUrl } from '../utils';
import ConfirmationModal from './modals/ConfirmationModal';
import { SKILLS } from '../data/skills';
import { UI_MODAL_LAYOUT } from '../config/ui-config';
import { SfxButton } from './common/ui/SfxButton';

const RomanTierOverlay = ({ id, isSmall = false }: { id: string, isSmall?: boolean }) => {
    const size = isSmall ? "text-[10px]" : "text-xs md:text-xl";
    if (id === 'scroll_t2') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className={`${size} text-amber-500 font-serif font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] translate-y-1`}>II</span></div>;
    if (id === 'scroll_t3') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className={`${size} text-amber-500 font-serif font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] translate-y-1`}>III</span></div>;
    if (id === 'scroll_t4') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className={`${size} text-amber-500 font-serif font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] translate-y-1`}>IV</span></div>;
    return null;
};

const AdaptiveInventoryImage = ({ item, className }: { item: InventoryItem, className?: string }) => {
    const isEquip = item.type === 'EQUIPMENT';
    const isSkill = item.type === 'SKILL_BOOK' || item.type === 'SKILL_SCROLL';
    const folder = isSkill ? 'skills' : (isEquip ? 'equipments' : 'materials');
    
    const baseId = (isEquip && item.equipmentData?.recipeId) 
        ? item.equipmentData.recipeId 
        : item.id;
    
    const [imgSrc, setImgSrc] = useState(getAssetUrl(`${baseId}.png`, folder));

    useEffect(() => {
        const targetFolder = (item.type === 'SKILL_BOOK' || item.type === 'SKILL_SCROLL') ? 'skills' : (item.type === 'EQUIPMENT' ? 'equipments' : 'materials');
        const targetFile = item.image || (isEquip && item.equipmentData?.recipeId ? `${item.equipmentData.recipeId}.png` : `${item.id}.png`);
        setImgSrc(getAssetUrl(targetFile, targetFolder));
    }, [item.id, item.image, item.type, isEquip, item.equipmentData?.recipeId]);

    const handleImgError = () => {
        const fallbackPath = item.image || item.equipmentData?.image;
        if (fallbackPath && imgSrc !== getAssetUrl(fallbackPath, folder)) {
            setImgSrc(getAssetUrl(fallbackPath, folder));
        }
    };

    return <img src={imgSrc} onError={handleImgError} className={className} alt={item.name} />;
};

interface InventoryDisplayProps {
    onClose: () => void;
}

export const InventoryDisplay: React.FC<InventoryDisplayProps> = ({ onClose }) => {
    const { state, actions } = useGame();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [sellQuantity, setSellQuantity] = useState(1);
    
    const [enchantingScroll, setEnchantingScroll] = useState<InventoryItem | null>(null);
    const [confirmEnchantTarget, setConfirmEnchantTarget] = useState<InventoryItem | null>(null);

    const currentSelectedItem = useMemo(() => 
        state.inventory.find(i => i.id === selectedItemId) || null
    , [state.inventory, selectedItemId]);

    const handleSelect = (item: InventoryItem) => {
        if (enchantingScroll) {
            if (item.type === 'EQUIPMENT') {
                if (item.isLocked) {
                    actions.showToast("Cannot enchant a locked item.");
                    return;
                }
                setConfirmEnchantTarget(item);
            }
            return;
        }
        // If clicking the same item, toggle it off
        setSelectedItemId(prev => prev === item.id ? null : item.id);
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
        if (currentSelectedItem.quantity <= sellQuantity) {
            setSelectedItemId(null);
        }
    };

    const handleUseScroll = () => {
        if (!currentSelectedItem || currentSelectedItem.type !== 'SKILL_SCROLL') return;
        setEnchantingScroll(currentSelectedItem);
    };

    const handleConfirmEnchant = () => {
        if (enchantingScroll && confirmEnchantTarget) {
            actions.applySkillScroll(enchantingScroll.id, confirmEnchantTarget.id);
            setEnchantingScroll(null);
            setConfirmEnchantTarget(null);
            actions.showToast("Equipment enchanted successfully!");
        }
    };

    const handleConsume = () => {
        if (!currentSelectedItem) return;
        if (currentSelectedItem.type === 'SKILL_SCROLL') {
            handleUseScroll();
            return;
        }
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

        const socketedSkill = item.equipmentData.socketedSkillId ? SKILLS[item.equipmentData.socketedSkillId] : null;

        return (
            <div className="space-y-2 shrink-0">
                <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex justify-between bg-stone-900/50 p-1.5 rounded border border-white/5 text-[9px] md:text-[10px]">
                        <span className="text-stone-500 uppercase flex items-center gap-1">
                            {isMagical ? <Zap className="w-2.5 h-2.5 text-blue-400" /> : <Sword className="w-2.5 h-2.5 text-stone-500" />}
                            {atkLabel}
                        </span>
                        <span className="font-mono text-stone-200 font-bold">{atkValue}</span>
                    </div>
                    <div className="flex justify-between bg-stone-900/50 p-1.5 rounded border border-white/5 text-[9px] md:text-[10px]">
                        <span className="text-stone-500 uppercase flex items-center gap-1">
                            {isMagical ? <Brain className="w-2.5 h-2.5 text-purple-400" /> : <Shield className="w-2.5 h-2.5 text-stone-500" />}
                            {defLabel}
                        </span>
                        <span className="font-mono text-stone-200 font-bold">{defValue}</span>
                    </div>
                </div>
                {item.equipmentData.quality && (
                     <div className="flex justify-between bg-stone-900/50 p-1.5 rounded border border-white/5 text-[9px] md:text-[10px]">
                        <span className="text-stone-500 uppercase flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Quality
                        </span>
                        <span className="font-black text-amber-500 uppercase tracking-tighter">{getQualityLabel(item.equipmentData.quality)}</span>
                    </div>
                )}
                {socketedSkill && (
                    <div className="bg-indigo-900/20 border border-indigo-500/20 p-2 rounded-lg mt-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <Wand2 className="w-3 h-3 text-indigo-400" />
                            <span className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">Imbued</span>
                        </div>
                        <div className="text-[10px] font-bold text-white">{socketedSkill.name}</div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`${UI_MODAL_LAYOUT.OVERLAY} z-[2000] animate-in fade-in duration-300`}>
            <div className="relative w-full h-full md:w-[96%] md:h-[92%] md:max-w-7xl bg-stone-950 md:border-2 border-stone-700 md:rounded-[3rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,1)] flex flex-col overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-300">
                
                {/* Main Header - Consolidate Exit Action */}
                <div className="px-4 py-3 md:p-6 border-b border-stone-800 bg-stone-900 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-amber-500" />
                            <h2 className="text-lg md:text-3xl font-black text-stone-100 font-serif uppercase tracking-tight leading-none">Vault</h2>
                            <span className="bg-stone-950 px-2 py-0.5 rounded border border-white/10 text-[9px] font-mono text-stone-500 ml-2 hidden xs:inline">{state.inventory.length} Manifests</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-lg border border-white/5">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs md:text-xl font-mono font-black text-amber-400">{state.stats.gold.toLocaleString()}</span>
                        </div>
                        <SfxButton onClick={onClose} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500 transition-colors">
                            <X className="w-6 h-6" />
                        </SfxButton>
                    </div>
                </div>

                <div className="flex-1 relative flex flex-col overflow-hidden">
                    
                    {/* Item Grid - Gray Tones & Blueprint Grid Background */}
                    <div 
                        className="flex-1 overflow-hidden flex flex-col min-w-0 relative"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
                            `,
                            backgroundSize: '24px 24px',
                            backgroundColor: '#151311'
                        }}
                    >
                        {enchantingScroll && (
                            <div className="bg-amber-600 px-4 py-1.5 text-[9px] text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-300 z-30 shadow-lg">
                                <Sparkles className="w-3 h-3 animate-spin-slow" /> Imbuing: {enchantingScroll.name}
                                <button onClick={() => setEnchantingScroll(null)} className="ml-2 bg-black/20 p-0.5 rounded hover:bg-black/40"><X className="w-3 h-3" /></button>
                            </div>
                        )}

                        <div className="p-2 md:p-4 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                            {state.inventory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-stone-800 opacity-20 gap-2">
                                    <Package className="w-12 h-12" />
                                    <p className="text-[10px] font-black uppercase">Vault Empty</p>
                                </div>
                            ) : (
                                <div className={`grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 transition-all duration-500 ease-out ${selectedItemId ? 'pb-[45dvh]' : 'pb-24'}`}>
                                    {state.inventory.map(item => {
                                        const isSelected = selectedItemId === item.id;
                                        const isEnchantTarget = enchantingScroll && item.type === 'EQUIPMENT';
                                        const isEnchantRestricted = enchantingScroll && item.type !== 'EQUIPMENT';

                                        return (
                                            <button
                                                key={item.id} onClick={() => handleSelect(item)}
                                                disabled={!!isEnchantRestricted}
                                                className={`relative flex flex-col items-center p-1 rounded-2xl border-2 transition-all aspect-square justify-between group overflow-hidden ${
                                                    isSelected && !enchantingScroll ? 'bg-amber-900/10 border-amber-500 ring-1 ring-amber-500/20' : 
                                                    isEnchantTarget ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 animate-pulse' :
                                                    isEnchantRestricted ? 'opacity-10 grayscale cursor-not-allowed border-transparent' :
                                                    'bg-stone-900/80 border-stone-800/60 hover:border-stone-600 shadow-md'
                                                }`}
                                            >
                                                <div className="absolute top-1.5 right-1.5 bg-stone-950/90 px-1 py-0.5 rounded-lg text-[7px] md:text-[9px] text-stone-500 font-mono font-bold flex items-center gap-0.5 z-20 border border-white/5">
                                                    {item.isLocked && <Lock className="w-2 h-2 text-amber-500" />}
                                                    x{item.quantity}
                                                </div>
                                                <div className="flex-1 flex items-center justify-center relative group-hover:scale-110 transition-transform">
                                                     <AdaptiveInventoryImage item={item} className="w-8 h-8 md:w-16 md:h-16 object-contain drop-shadow-xl" />
                                                     <RomanTierOverlay id={item.id} isSmall />
                                                </div>
                                                <div className="w-full py-0.5 px-1 bg-stone-950/40 backdrop-blur-sm">
                                                    <div className="text-[7px] md:text-[9px] text-center font-black text-stone-400 w-full truncate uppercase tracking-tighter">{item.name}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Detail Drawer - High Radius & Fluid Slide Up */}
                    <div 
                        className={`absolute bottom-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur-2xl border-t-4 border-stone-800 rounded-t-[2.5rem] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col min-w-0 ${
                            currentSelectedItem && !enchantingScroll 
                            ? 'translate-y-0 opacity-100 h-[50%]' 
                            : 'translate-y-full opacity-0 h-0'
                        }`}
                    >
                        {/* Gradient Shadow Hint */}
                        <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-stone-900/90 to-transparent pointer-events-none" />

                        {currentSelectedItem && (
                            <div className="flex-1 p-4 md:p-8 flex flex-col overflow-hidden relative">
                                {/* Header Bar for Sheet */}
                                <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-stone-800 rounded-lg">
                                            <Info className="w-3.5 h-3.5 text-stone-500" />
                                        </div>
                                        <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest leading-none">Inspection Hub</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => actions.toggleLockItem(currentSelectedItem.id)}
                                            className={`p-2 rounded-2xl border transition-all ${currentSelectedItem.isLocked ? 'bg-amber-950 border-amber-500 text-amber-500' : 'bg-stone-800 border-stone-700 text-stone-500 hover:text-stone-200 shadow-md'}`}
                                        >
                                            {currentSelectedItem.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                                        </button>
                                        <button 
                                            onClick={() => setSelectedItemId(null)}
                                            className="p-2 bg-stone-800 hover:bg-stone-700 rounded-2xl border border-stone-700 text-stone-400 shadow-md active:scale-95"
                                        >
                                            <ChevronDown size={22} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-6 shrink-0">
                                    <div className={`w-16 h-16 md:w-32 md:h-32 bg-stone-950 rounded-[1.5rem] md:rounded-[2rem] border-2 flex items-center justify-center shadow-2xl relative shrink-0 ${currentSelectedItem.equipmentData ? getRarityClasses(currentSelectedItem.equipmentData.rarity) : 'border-stone-800'}`}>
                                        <AdaptiveInventoryImage item={currentSelectedItem} className="w-10 h-10 md:w-20 md:h-20 object-contain drop-shadow-2xl" />
                                        <RomanTierOverlay id={currentSelectedItem.id} isSmall />
                                    </div>
                                    <div className="min-w-0 pr-2">
                                        <h2 className="text-sm md:text-3xl font-black text-amber-500 font-serif leading-tight uppercase tracking-tight truncate drop-shadow-lg">{currentSelectedItem.name}</h2>
                                        <div className="flex wrap gap-1.5 mt-2 md:mt-3">
                                            <span className="text-[7px] md:text-[10px] bg-stone-950 px-2 py-0.5 rounded-lg text-stone-500 font-mono font-black uppercase border border-white/5">{currentSelectedItem.type}</span>
                                            {currentSelectedItem.equipmentData && (
                                                <span className={`text-[7px] md:text-[10px] px-2 py-0.5 rounded-lg font-black uppercase border leading-none ${getRarityClasses(currentSelectedItem.equipmentData.rarity)}`}>
                                                    {currentSelectedItem.equipmentData.rarity}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/30 p-3 md:p-5 rounded-3xl border border-white/5 mb-4 shrink-0 shadow-inner">
                                    <p className="text-stone-400 text-[10px] md:text-sm italic leading-relaxed text-center px-4">"{currentSelectedItem.description}"</p>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 mb-4 px-1">
                                    {renderEquipmentStats(currentSelectedItem)}
                                </div>

                                <div className="mt-auto flex gap-2 md:gap-3 shrink-0 pb-2">
                                    {(currentSelectedItem.type === 'CONSUMABLE' || currentSelectedItem.type === 'SCROLL' || currentSelectedItem.type === 'SKILL_BOOK' || currentSelectedItem.type === 'SKILL_SCROLL') && (
                                        <button onClick={handleConsume} className="flex-[2] py-3 md:py-5 bg-emerald-700 hover:bg-emerald-600 text-emerald-50 rounded-2xl text-[10px] md:text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl border-b-4 border-emerald-900 active:scale-95">
                                            {currentSelectedItem.type === 'SKILL_SCROLL' ? 'Imbue Essence' : 'Release Power'}
                                        </button>
                                    )}
                                    {currentSelectedItem.baseValue > 0 && currentSelectedItem.type !== 'KEY_ITEM' && (
                                        <button 
                                            onClick={handleOpenSellModal} 
                                            disabled={currentSelectedItem.isLocked}
                                            className={`flex-1 py-3 md:py-5 rounded-2xl text-[10px] md:text-sm font-black uppercase tracking-[0.2em] border-b-4 transition-all ${currentSelectedItem.isLocked ? 'bg-stone-800 border-stone-950 text-stone-700' : 'bg-stone-800 hover:bg-red-950 text-stone-300 border-stone-950 shadow-xl'}`}
                                        >
                                            {currentSelectedItem.isLocked ? 'Locked' : `Liquidate (${Math.floor(currentSelectedItem.baseValue * 0.5)}G)`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sell Quantity Modal */}
            {isSellModalOpen && currentSelectedItem && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
                    <div className="bg-stone-900 border-2 border-stone-700 rounded-[2.5rem] w-full max-w-sm overflow-hidden flex flex-col shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] animate-in zoom-in-95">
                        <div className="p-4 border-b border-stone-800 bg-stone-850 flex justify-between items-center">
                            <h3 className="font-bold text-stone-200 font-serif uppercase tracking-widest text-xs">Liquidate Assets</h3>
                            <button onClick={() => setIsSellModalOpen(false)} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="p-6 flex flex-col items-center gap-6">
                            <div className="flex items-center gap-4 w-full">
                                <div className="w-16 h-16 bg-stone-950 rounded-2xl border border-stone-800 flex items-center justify-center shrink-0 shadow-inner">
                                    <AdaptiveInventoryImage item={currentSelectedItem} className="w-10 h-10 object-contain" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-stone-100 font-black text-sm truncate uppercase tracking-tight">{currentSelectedItem.name}</h4>
                                    <p className="text-amber-500 font-mono text-[10px] font-black mt-0.5">Market Bid: {Math.floor(currentSelectedItem.baseValue * 0.5)}G</p>
                                </div>
                            </div>

                            <div className="w-full bg-stone-950 p-6 rounded-[2rem] border border-stone-800 flex flex-col items-center gap-4 shadow-inner">
                                <div className="flex items-center gap-8">
                                    <button onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))} className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 border border-stone-700 active:scale-90 shadow-md hover:text-white"><Minus size={20} /></button>
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl font-mono font-black text-stone-100 leading-none">{sellQuantity}</span>
                                        <span className="text-[10px] font-bold text-stone-600 uppercase mt-2 tracking-tighter">/ Total {currentSelectedItem.quantity}</span>
                                    </div>
                                    <button onClick={() => setSellQuantity(Math.min(currentSelectedItem.quantity, sellQuantity + 1))} className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 border border-stone-700 active:scale-90 shadow-md hover:text-white"><Plus size={20} /></button>
                                </div>
                            </div>

                            <div className="w-full flex justify-between items-center px-4 py-3 bg-stone-950/40 rounded-2xl border border-white/5">
                                <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Est. Revenue</span>
                                <div className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-amber-500" />
                                    <span className="text-2xl font-mono font-black text-emerald-400">
                                        {(sellQuantity * Math.floor(currentSelectedItem.baseValue * 0.5)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-stone-850 border-t border-stone-800 flex gap-3">
                            <button onClick={() => setIsSellModalOpen(false)} className="flex-1 py-4 bg-stone-800 text-stone-400 font-black rounded-2xl text-[10px] uppercase tracking-widest border-b-4 border-stone-950">Cancel</button>
                            <button onClick={handleConfirmBulkSell} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest border-b-4 border-emerald-900 active:translate-y-1 shadow-lg">Confirm Trade</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal 
                isOpen={!!confirmEnchantTarget}
                title="Seal Power"
                message={`Permanently bind the essence to ${confirmEnchantTarget?.name}?`}
                confirmLabel="Seal Steel"
                cancelLabel="Cancel"
                onConfirm={handleConfirmEnchant}
                onCancel={() => setConfirmEnchantTarget(null)}
            />
        </div>
    );
};
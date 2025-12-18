import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Mercenary } from '../../models/Mercenary';
import { EquipmentSlotType } from '../../types/inventory';
import { X, Sword, Shield, Shirt, Hand, Footprints, Crown, Sparkles, Heart, Activity, Star, Box, MousePointer2, Zap, Brain, Target, Gem, User, ArrowRight, ChevronRight } from 'lucide-react';
import { getAssetUrl } from '../../utils';
import { calculateCombatPower, calculateDerivedStats, applyEquipmentBonuses, DerivedStats } from '../../models/Stats';
import { InventoryItem } from '../../types/inventory';
import { Equipment } from '../../models/Equipment';

interface MercenaryDetailModalProps {
    mercenary: Mercenary | null;
    onClose: () => void;
    onUnequip: (mercId: string, slot: EquipmentSlotType) => void;
}

const MercenaryPaperDoll = ({ 
    mercenary, 
    combatPower, 
    showAffinityGain, 
    onUnequip, 
    onSlotClick,
    selectedSlot,
}: { 
    mercenary: Mercenary; 
    combatPower: number; 
    showAffinityGain: boolean; 
    onUnequip: (slot: EquipmentSlotType) => void; 
    onSlotClick: (slot: EquipmentSlotType | null) => void;
    selectedSlot: EquipmentSlotType | null;
}) => {
    const renderSlot = ({ slot, icon, style }: { slot: EquipmentSlotType; icon: React.ReactNode; style: string }) => {
        const equippedItem = mercenary.equipment[slot];
        const isSelected = selectedSlot === slot;

        let borderColor = isSelected ? 'border-amber-400' : 'border-stone-700';
        let bgColor = 'bg-stone-900/80';

        if (equippedItem) {
            switch (equippedItem.rarity) {
                case 'Common': borderColor = isSelected ? 'border-amber-400' : 'border-stone-500'; break;
                case 'Uncommon': borderColor = isSelected ? 'border-amber-400' : 'border-emerald-600'; break;
                case 'Rare': borderColor = isSelected ? 'border-amber-400' : 'border-blue-500'; break;
                case 'Epic': borderColor = isSelected ? 'border-amber-400' : 'border-purple-500'; break;
                case 'Legendary': borderColor = isSelected ? 'border-amber-400' : 'border-amber-500'; break;
            }
            bgColor = 'bg-stone-800';
        }

        let imageUrl = '';
        if (equippedItem) {
            imageUrl = equippedItem.recipeId ? getAssetUrl(`${equippedItem.recipeId}.png`) : getAssetUrl(`${equippedItem.id.split('_')[0]}.png`);
        }

        return (
            <div 
                className={`absolute w-12 h-12 rounded-lg border-2 ${borderColor} ${bgColor} flex items-center justify-center shadow-lg transition-all z-20 group ${style} ${isSelected ? 'ring-2 ring-amber-500/50 scale-110' : ''} cursor-pointer`}
                onClick={() => onSlotClick(isSelected ? null : slot)}
            >
                {equippedItem ? (
                    <img 
                        src={imageUrl}
                        className="w-9 h-9 object-contain drop-shadow-md"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                    />
                ) : (
                    <div className="text-stone-600">{icon}</div>
                )}
                <div className="hidden text-xl">{equippedItem?.icon || '📦'}</div>
                {equippedItem && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onUnequip(slot); }}
                        className="absolute -top-2 -right-2 bg-stone-900 rounded-full border border-stone-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900 hover:border-red-500 text-stone-400 hover:text-red-200 z-30"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="w-full md:w-[40%] relative bg-gradient-to-b from-stone-900 to-stone-950 border-r border-stone-800 flex flex-col items-center justify-center overflow-hidden group select-none">
            <div className="absolute top-8 left-8 z-30">
                <h2 className="text-4xl font-black text-stone-200 font-serif tracking-tight drop-shadow-lg leading-none">{mercenary.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-bold text-amber-500 uppercase tracking-widest bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/50">{mercenary.job}</span>
                    <div className={`flex items-center gap-1 text-sm ${showAffinityGain ? 'text-pink-400 animate-pulse' : 'text-stone-500'}`}>
                        <Heart className={`w-3.5 h-3.5 ${showAffinityGain ? 'fill-pink-500' : ''}`} />
                        <span className="font-mono font-bold">{mercenary.affinity}</span>
                    </div>
                </div>
            </div>
            <div className="absolute top-8 right-8 z-30">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Combat Power</span>
                    <div className="flex items-center gap-1 text-xl font-mono font-bold text-stone-300">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {combatPower}
                    </div>
                </div>
            </div>
            <div className="relative w-full h-full flex items-center justify-center mt-12">
                <div className="relative h-[80%] w-full flex items-center justify-center">
                    <img 
                        src={mercenary.sprite ? getAssetUrl(mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')}
                        className="h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none -z-10">
                        <User className="w-64 h-64 text-stone-500" />
                    </div>
                </div>
                {renderSlot({ slot: "HEAD", icon: <Crown className="w-6 h-6" />, style: "top-[10%] left-1/2 -translate-x-1/2" })}
                {renderSlot({ slot: "BODY", icon: <Shirt className="w-6 h-6" />, style: "top-[35%] left-1/2 -translate-x-1/2" })}
                {renderSlot({ slot: "HANDS", icon: <Hand className="w-6 h-6" />, style: "top-[35%] left-[20%]" })}
                {renderSlot({ slot: "ACCESSORY", icon: <Sparkles className="w-6 h-6" />, style: "top-[35%] right-[20%]" })}
                {renderSlot({ slot: "MAIN_HAND", icon: <Sword className="w-6 h-6" />, style: "top-[55%] left-[15%]" })}
                {renderSlot({ slot: "OFF_HAND", icon: <Shield className="w-6 h-6" />, style: "top-[55%] right-[15%]" })}
                {renderSlot({ slot: "FEET", icon: <Footprints className="w-6 h-6" />, style: "bottom-[10%] left-1/2 -translate-x-1/2" })}
            </div>
        </div>
    );
};

const MercenaryStatsPanel = ({ mercenary, finalStats, previewStats }: { mercenary: Mercenary; finalStats: DerivedStats; previewStats: DerivedStats | null }) => {
    const xpPercent = mercenary.xpToNextLevel > 0 ? Math.min(100, Math.max(0, (mercenary.currentXp / mercenary.xpToNextLevel) * 100)) : 0;
    const hpPercent = finalStats.maxHp > 0 ? (mercenary.currentHp / finalStats.maxHp) * 100 : 0;
    const mpPercent = finalStats.maxMp > 0 ? (mercenary.currentMp / finalStats.maxMp) * 100 : 0;

    const renderStatRow = (icon: React.ReactNode, label: string, value: number | string, previewValue?: number | string, isPercent = false) => {
        let diff: number | null = null;
        if (previewValue !== undefined && typeof value === 'number' && typeof previewValue === 'number') {
            diff = previewValue - value;
        }
        return (
            <div className="bg-stone-800/50 p-2 rounded-lg border border-stone-800 flex justify-between items-center h-9">
                <span className="text-[10px] text-stone-400 font-bold flex items-center gap-1.5">{icon} {label}</span>
                <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${diff && diff !== 0 ? 'text-stone-500 line-through text-[10px]' : 'text-stone-200'}`}>
                        {value}{isPercent ? '%' : ''}
                    </span>
                    {diff !== null && diff !== 0 && (
                        <div className={`flex items-center text-xs font-mono font-bold ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            <ArrowRight className="w-3 h-3 mx-0.5" />
                            {previewValue}{isPercent ? '%' : ''}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-5 flex flex-col gap-4 overflow-y-auto shrink-0 border-b border-stone-800 custom-scrollbar max-h-[60%]">
            <div className="bg-stone-800/50 p-3 rounded-xl border border-stone-800 shadow-sm shrink-0">
                <div className="flex justify-between items-end mb-1.5">
                    <span className="text-amber-500 font-bold font-mono text-base">LEVEL {mercenary.level}</span>
                    <span className="text-stone-500 text-xs font-mono">{mercenary.currentXp} / {mercenary.xpToNextLevel} XP</span>
                </div>
                <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                    <div className="h-full bg-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.5)] transition-all duration-500 ease-out" style={{ width: `${xpPercent}%` }}></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-stone-800/50 p-2.5 rounded-xl border border-stone-800 flex items-center gap-3">
                    <div className="p-1.5 bg-red-900/20 rounded-lg text-red-500 border border-red-900/30"><Heart className="w-4 h-4" /></div>
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-stone-400 font-bold mb-1">
                            <span>HEALTH</span><span className="text-stone-200">{mercenary.currentHp} / {finalStats.maxHp}</span>
                        </div>
                        <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${hpPercent}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="bg-stone-800/50 p-2.5 rounded-xl border border-stone-800 flex items-center gap-3">
                    <div className="p-1.5 bg-blue-900/20 rounded-lg text-blue-500 border border-blue-900/30"><Activity className="w-4 h-4" /></div>
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-stone-400 font-bold mb-1">
                            <span>MANA</span><span className="text-stone-200">{mercenary.currentMp} / {finalStats.maxMp}</span>
                        </div>
                        <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${mpPercent}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-5 gap-2 shrink-0">
                {[
                    { label: 'STR', val: mercenary.stats.strength },
                    { label: 'INT', val: mercenary.stats.intelligence },
                    { label: 'DEX', val: mercenary.stats.dexterity },
                    { label: 'VIT', val: mercenary.stats.vitality },
                    { label: 'LUK', val: mercenary.stats.luck, color: 'text-emerald-400' }
                ].map((stat, i) => (
                    <div key={i} className="bg-stone-800/50 border border-stone-800 p-1.5 rounded-lg flex flex-col items-center justify-center">
                        <span className={`text-[9px] font-bold ${stat.color || 'text-stone-500'}`}>{stat.label}</span>
                        <span className="text-sm font-mono font-bold text-stone-200">{stat.val}</span>
                    </div>
                ))}
            </div>
            <div className="shrink-0">
                <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Sword className="w-3 h-3" /> Combat Statistics</h4>
                <div className="grid grid-cols-2 gap-2">
                    {renderStatRow(<Sword className="w-3 h-3" />, 'ATK', finalStats.physicalAttack, previewStats?.physicalAttack)}
                    {renderStatRow(<Shield className="w-3 h-3" />, 'DEF', finalStats.physicalDefense, previewStats?.physicalDefense)}
                    {renderStatRow(<Zap className="w-3 h-3" />, 'M.ATK', finalStats.magicalAttack, previewStats?.magicalAttack)}
                    {renderStatRow(<Brain className="w-3 h-3" />, 'M.DEF', finalStats.magicalDefense, previewStats?.magicalDefense)}
                    {renderStatRow(<Target className="w-3 h-3" />, 'CRIT', finalStats.critRate, previewStats?.critRate, true)}
                    {renderStatRow(<Gem className="w-3 h-3" />, 'DROP', `+${finalStats.dropRateBonus}`, previewStats ? `+${previewStats.dropRateBonus}` : undefined)}
                </div>
            </div>
        </div>
    );
};

const EquipmentInventoryList = ({ 
    inventory, 
    selectedItemId,
    onSelect,
    onEquip,
    selectedSlotFilter
}: { 
    inventory: InventoryItem[]; 
    selectedItemId: string | null;
    onSelect: (itemId: string) => void;
    onEquip: (itemId: string) => void;
    selectedSlotFilter: EquipmentSlotType | null;
}) => {
    const displayInventory = useMemo(() => {
        if (!selectedSlotFilter) return inventory;
        return inventory.filter(item => item.equipmentData?.slotType === selectedSlotFilter);
    }, [inventory, selectedSlotFilter]);

    return (
        <div className="bg-stone-950 p-4 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3 shrink-0">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                    <Box className="w-4 h-4 text-amber-600" /> 
                    {selectedSlotFilter ? `${selectedSlotFilter.replace('_', ' ')} Storage` : 'Equipment Storage'}
                </h3>
                <span className="text-[10px] text-stone-600 font-mono">{displayInventory.length} Items</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {displayInventory.length === 0 ? (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-stone-800 rounded-lg text-stone-600 text-sm italic">
                        {selectedSlotFilter ? 'No matching equipment.' : 'No equipment available.'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 content-start">
                        {displayInventory.map(item => {
                            if (!item.equipmentData) return null;
                            const isSelected = selectedItemId === item.id;
                            let rarityColor = item.equipmentData.quality >= 90 ? 'text-purple-400' : item.equipmentData.quality >= 75 ? 'text-blue-400' : item.equipmentData.quality >= 50 ? 'text-emerald-400' : 'text-stone-400';
                            let imageUrl = item.equipmentData.recipeId ? getAssetUrl(`${item.equipmentData.recipeId}.png`) : getAssetUrl(`${item.id.split('_')[0]}.png`);

                            return (
                                <div 
                                    key={item.id}
                                    onClick={() => isSelected ? onEquip(item.id) : onSelect(item.id)}
                                    className={`flex items-center gap-3 p-2 rounded-lg border ${isSelected ? 'border-amber-500 bg-stone-800' : 'border-stone-800 hover:bg-stone-900'} cursor-pointer transition-all group`}
                                >
                                    <div className="w-10 h-10 bg-stone-900 rounded border border-stone-700 flex items-center justify-center relative shrink-0">
                                        <img src={imageUrl} className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                        <div className="hidden text-xl">{item.icon || '📦'}</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold truncate text-stone-300">{item.name}</div>
                                        <div className="flex items-center gap-2 text-[10px]">
                                            <span className="text-stone-500">{item.equipmentData.slotType.replace('_', ' ')}</span>
                                            <span className={rarityColor}>Tier {Math.floor(item.equipmentData.quality / 20) + 1} ({item.equipmentData.quality})</span>
                                        </div>
                                    </div>
                                    {isSelected && <div className="shrink-0 text-[10px] text-amber-500 font-bold uppercase animate-pulse pr-2 flex items-center gap-1"><ChevronRight className="w-3 h-3" /> Equip</div>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const MercenaryDetailModal: React.FC<MercenaryDetailModalProps> = ({ mercenary, onClose, onUnequip }) => {
    const { state, actions } = useGame();
    const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);
    const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string | null>(null);
    const [prevAffinity, setPrevAffinity] = useState(0);
    const [showAffinityGain, setShowAffinityGain] = useState(false);

    useEffect(() => {
        if (mercenary) {
            setPrevAffinity(mercenary.affinity);
            setSelectedSlot(null);
            setSelectedInventoryItemId(null);
        }
    }, [mercenary?.id]);

    useEffect(() => {
        if (mercenary && mercenary.affinity > prevAffinity) {
            setShowAffinityGain(true);
            const timer = setTimeout(() => setShowAffinityGain(false), 3000);
            setPrevAffinity(mercenary.affinity);
            return () => clearTimeout(timer);
        }
    }, [mercenary?.affinity]);

    if (!mercenary) return null;

    const baseDerived = calculateDerivedStats(mercenary.stats, mercenary.level);
    const currentEquipmentStats = Object.values(mercenary.equipment).map(eq => eq?.stats).filter(Boolean);
    const finalStats = applyEquipmentBonuses(baseDerived, currentEquipmentStats as any);

    let previewStats: DerivedStats | null = null;
    if (selectedInventoryItemId) {
        const item = state.inventory.find(i => i.id === selectedInventoryItemId)?.equipmentData;
        if (item) {
            const previewEq = { ...mercenary.equipment };
            if (item.slotType === 'MAIN_HAND' && item.isTwoHanded) previewEq.OFF_HAND = null;
            else if (item.slotType === 'OFF_HAND' && previewEq.MAIN_HAND?.isTwoHanded) previewEq.MAIN_HAND = null;
            previewEq[item.slotType] = item;
            previewStats = applyEquipmentBonuses(baseDerived, Object.values(previewEq).map(e => e?.stats).filter(Boolean) as any);
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
            <button onClick={onClose} className="absolute top-6 right-6 z-[220] p-2 bg-stone-900 hover:bg-stone-800 rounded-full text-stone-500 hover:text-white border border-stone-700 transition-colors"><X className="w-6 h-6" /></button>
            <div className="w-full max-w-6xl h-[85vh] bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                <MercenaryPaperDoll mercenary={mercenary} combatPower={calculateCombatPower(mercenary.stats)} showAffinityGain={showAffinityGain} onUnequip={(slot) => onUnequip(mercenary.id, slot)} onSlotClick={setSelectedSlot} selectedSlot={selectedSlot} />
                <div className="w-full md:w-[60%] bg-stone-900 flex flex-col h-full max-h-full overflow-hidden">
                    <MercenaryStatsPanel mercenary={mercenary} finalStats={finalStats} previewStats={previewStats} />
                    <EquipmentInventoryList inventory={state.inventory.filter(i => i.type === 'EQUIPMENT')} selectedItemId={selectedInventoryItemId} onSelect={setSelectedInventoryItemId} onEquip={(id) => { actions.equipItem(mercenary.id, id); setSelectedInventoryItemId(null); }} selectedSlotFilter={selectedSlot} />
                </div>
            </div>
        </div>
    );
};

export default MercenaryDetailModal;
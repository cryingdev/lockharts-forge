
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Mercenary } from '../../models/Mercenary';
import { EquipmentSlotType } from '../../types/inventory';
import {
  X,
  Sword,
  Shield,
  Shirt,
  Hand,
  Footprints,
  Crown,
  Sparkles,
  Heart,
  Activity,
  Star,
  Box,
  Zap,
  Brain,
  Target,
  Wind,
  Plus,
  Minus,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Package,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Check,
  RotateCcw,
  Save,
} from 'lucide-react';
import { getAssetUrl } from '../../utils';
import {
  calculateDerivedStats,
  applyEquipmentBonuses,
  DerivedStats,
  PrimaryStats,
  mergePrimaryStats,
} from '../../models/Stats';
import { calculateCombatPower, calculateMercenaryPower } from '../../utils/combatLogic';
import { InventoryItem } from '../../types/inventory';
import { Equipment } from '../../models/Equipment';
import { SKILLS } from '../../data/skills';

interface MercenaryDetailModalProps {
  mercenary: Mercenary | null;
  onClose: () => void;
  onUnequip: (mercId: string, slot: EquipmentSlotType) => void;
  isReadOnly?: boolean;
}

const StatDiff = ({
  current,
  next,
  isPercent = false,
}: {
  current: number;
  next: number;
  isPercent?: boolean;
}) => {
  const diff = next - current;
  if (Math.abs(diff) < 0.01) return null;
  const isPositive = diff > 0;
  const color = isPositive ? 'text-emerald-400' : 'text-red-400';
  const Icon = isPositive ? ArrowUp : ArrowDown;
  return (
    <div
      className={`flex items-center gap-0.5 font-mono text-[10px] font-bold ${color} animate-in fade-in slide-in-from-left-1`}
    >
      <Icon className="w-2.5 h-2.5" />
      <span>{isPercent ? Math.abs(diff).toFixed(1) : Math.abs(Math.round(diff))}</span>
    </div>
  );
};

const getRarityClasses = (rarity?: string) => {
  switch (rarity) {
    case 'Legendary':
      return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
    case 'Epic':
      return 'text-purple-400 border-purple-500/50 bg-purple-950/40';
    case 'Rare':
      return 'text-blue-400 border-blue-500/50 bg-blue-950/40';
    case 'Uncommon':
      return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
    default:
      return 'text-stone-400 border-stone-700/50 bg-stone-900/40';
  }
};

const MercenaryPaperDoll = ({
  mercenary,
  currentCombatPower,
  nextCombatPower,
  showAffinityGain,
  onUnequip,
  onSlotClick,
  selectedSlot,
  isReadOnly,
  isInventoryOpen,
  onToggleInventory,
  isHired,
}: {
  mercenary: Mercenary;
  currentCombatPower: number;
  nextCombatPower: number;
  showAffinityGain: boolean;
  onUnequip: (slot: EquipmentSlotType) => void;
  onSlotClick: (slot: EquipmentSlotType | null) => void;
  selectedSlot: EquipmentSlotType | null;
  isReadOnly?: boolean;
  isInventoryOpen: boolean;
  onToggleInventory: () => void;
  isHired: boolean;
}) => {
  const renderSlot = ({
    slot,
    icon,
    style,
  }: {
    slot: EquipmentSlotType;
    icon: React.ReactNode;
    style: string;
  }) => {
    const equippedItem = mercenary.equipment[slot];
    const isSelected = selectedSlot === slot;
    let borderColor = isSelected ? 'border-amber-400' : 'border-stone-700/50';
    let bgColor = 'bg-stone-950/40';

    if (equippedItem) {
      switch (equippedItem.rarity) {
        case 'Common':
          borderColor = isSelected ? 'border-amber-400' : 'border-stone-500';
          break;
        case 'Uncommon':
          borderColor = isSelected ? 'border-amber-400' : 'border-emerald-600';
          break;
        case 'Rare':
          borderColor = isSelected ? 'border-amber-400' : 'border-blue-500';
          break;
        case 'Epic':
          borderColor = isSelected ? 'border-amber-400' : 'border-purple-500';
          break;
        case 'Legendary':
          borderColor = isSelected ? 'border-amber-400' : 'border-amber-500';
          break;
      }
      bgColor = 'bg-stone-800/60';
    }

    let imageUrl = '';
    if (equippedItem) {
      imageUrl = equippedItem.image
        ? getAssetUrl(equippedItem.image)
        : equippedItem.recipeId
          ? getAssetUrl(`${equippedItem.recipeId}.png`)
          : getAssetUrl(`${equippedItem.id.split('_')[0]}.png`);
    }

    return (
      <div
        className={`absolute w-10 h-10 md:w-14 md:h-14 rounded-xl border-2 backdrop-blur-md ${borderColor} ${bgColor} flex items-center justify-center shadow-lg transition-all z-20 group ${style} ${isSelected ? 'ring-4 ring-amber-500/30 scale-110' : 'hover:scale-105'} ${isHired ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={() => isHired && onSlotClick(isSelected ? null : slot)}
      >
        {equippedItem ? (
          <img src={imageUrl} className="w-7 h-7 md:w-10 md:h-10 object-contain drop-shadow-md" />
        ) : (
          <div className="text-stone-600/80 scale-75 md:scale-100">{icon}</div>
        )}
        {equippedItem && !isReadOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnequip(slot);
            }}
            className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity text-white shadow-lg"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  const hasPowerDiff = nextCombatPower !== currentCombatPower;

  return (
    <div className="w-full flex flex-col shrink-0">
      <div className="p-4 md:p-6 flex flex-col gap-0.5 md:gap-1 shrink-0 bg-stone-950/40 border-b border-white/5 backdrop-blur-md z-30">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-sm md:text-2xl font-black text-stone-100 font-serif truncate leading-none">
            {mercenary.name}
          </h2>
          {isHired && (
            <button
              onClick={onToggleInventory}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-black uppercase tracking-widest ${isInventoryOpen ? 'bg-amber-600 border-amber-400 text-white shadow-glow-sm' : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'}`}
            >
              <Package className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isInventoryOpen ? 'Close Gear' : 'Open Gear'}</span>
              {isInventoryOpen ? <ChevronLeft className="w-3 h-3 md:hidden" /> : <ChevronDown className="w-3 h-3 md:hidden" />}
            </button>
          )}
        </div>
        
        <div className="flex justify-between items-end">
          <div className="flex wrap items-center gap-1">
            <span className="text-[7px] md:text-xs font-black text-amber-500 uppercase tracking-widest bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/20">
              {mercenary.job}
            </span>
            <div
              className={`flex items-center gap-0.5 text-[8px] md:text-sm ${showAffinityGain ? 'text-pink-400 animate-pulse' : 'text-stone-500 font-bold'}`}
            >
              <Heart className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${showAffinityGain ? 'fill-pink-500' : ''}`} />
              <span>{mercenary.affinity}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[6px] md:text-[9px] text-stone-600 uppercase font-black tracking-tighter block leading-none">
              Combat Power
            </span>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 md:gap-1 text-[12px] md:text-xl font-mono font-black text-stone-300">
                <Star className="w-2.5 h-2.5 md:w-4 md:h-4 text-amber-600 fill-amber-600" />
                <span className={hasPowerDiff ? (nextCombatPower > currentCombatPower ? 'text-emerald-400' : 'text-red-400') : ''}>
                  {nextCombatPower}
                </span>
              </div>
              <StatDiff current={currentCombatPower} next={nextCombatPower} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] md:aspect-square flex items-center justify-center overflow-hidden min-h-[180px] md:min-h-[280px]">
        <div className="relative h-[90%] w-full flex items-center justify-center pointer-events-none opacity-80">
          <img
            src={mercenary.sprite ? getAssetUrl(mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')}
            className="h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          />
        </div>
        {renderSlot({ slot: 'HEAD', icon: <Crown className="w-5 h-5" />, style: 'top-[6%] left-1/2 -translate-x-1/2' })}
        {renderSlot({ slot: 'BODY', icon: <Shirt className="w-5 h-5" />, style: 'top-[26%] left-1/2 -translate-x-1/2' })}
        {renderSlot({ slot: 'HANDS', icon: <Hand className="w-5 h-5" />, style: 'top-[26%] left-[10%]' })}
        {renderSlot({ slot: 'ACCESSORY', icon: <Sparkles className="w-5 h-5" />, style: 'top-[26%] right-[10%]' })}
        {renderSlot({ slot: 'MAIN_HAND', icon: <Sword className="w-5 h-5" />, style: 'top-[50%] left-[4%]' })}
        {renderSlot({ slot: 'OFF_HAND', icon: <Shield className="w-5 h-5" />, style: 'top-[50%] right-[4%]' })}
        {renderSlot({
          slot: 'FEET',
          icon: <Footprints className="w-5 h-5" />,
          style: 'bottom-[8%] left-1/2 -translate-x-1/2',
        })}
      </div>
    </div>
  );
};

const MercenaryStatsPanel = ({
  mercenary,
  baseStats,
  finalStats,
  pendingAllocated,
  pendingPoints,
  equipmentStats,
  previewEquipmentStats,
  onModifyStat,
  onSave,
  onReset,
  isReadOnly,
}: {
  mercenary: Mercenary;
  baseStats: DerivedStats;
  finalStats: DerivedStats;
  pendingAllocated: PrimaryStats;
  pendingPoints: number;
  equipmentStats: PrimaryStats;
  previewEquipmentStats: PrimaryStats | null;
  onModifyStat: (key: keyof PrimaryStats, delta: number) => void;
  onSave: () => void;
  onReset: () => void;
  isReadOnly?: boolean;
}) => {
  const xpPercent =
    mercenary.xpToNextLevel > 0
      ? Math.min(100, Math.max(0, (mercenary.currentXp / mercenary.xpToNextLevel) * 100))
      : 0;
  const hpPercent = finalStats.maxHp > 0 ? (mercenary.currentHp / finalStats.maxHp) * 100 : 0;
  const mpPercent = finalStats.maxMp > 0 ? (mercenary.currentMp / finalStats.maxMp) * 100 : 0;

  const isModified = useMemo(() => {
    return (Object.keys(pendingAllocated) as Array<keyof PrimaryStats>).some(
        key => pendingAllocated[key] !== mercenary.allocatedStats[key]
    );
  }, [pendingAllocated, mercenary.allocatedStats]);

  const renderStatRow = (icon: React.ReactNode, label: string, baseValue: number, nextValue: number, isPercent = false) => {
    return (
      <div className="bg-stone-950/40 p-1.5 md:p-3 rounded-lg border border-white/5 flex justify-between items-center h-8 md:h-12">
        <span className="text-[7px] md:text-xs text-stone-500 font-black uppercase flex items-center gap-1.5 md:gap-2">
          {icon}
          <span className="hidden md:inline">{label}</span>
          <span className="md:hidden truncate max-w-[40px]">
            {label === 'Physical Atk' ? 'P.Atk' : label === 'Physical Def' ? 'P.Def' : label === 'Magical Atk' ? 'M.Atk' : label === 'Magical Def' ? 'M.Def' : label === 'Crit Rate' ? 'Crit' : label === 'Evasion' ? 'Eva' : label}
          </span>
        </span>
        <div className="flex items-center gap-1 md:gap-2">
          <span className={`font-mono text-[9px] md:text-base font-black ${nextValue > baseValue ? 'text-emerald-400' : nextValue < baseValue ? 'text-red-400' : 'text-stone-300'}`}>
            {isPercent ? nextValue.toFixed(1) : Math.round(nextValue)}
            {isPercent ? '%' : ''}
          </span>
          <StatDiff current={baseValue} next={nextValue} isPercent={isPercent} />
        </div>
      </div>
    );
  };

  const skillIds = (mercenary as any).skillIds as string[] | undefined;

  return (
    <div className="p-3 md:p-6 flex flex-col gap-4 md:gap-6 bg-stone-900/10 border-t border-white/5">
      <div className="bg-stone-950/40 p-3 md:p-5 rounded-xl border border-white/5 shadow-inner shrink-0">
        <div className="flex justify-between items-end mb-1 md:mb-2 leading-none">
          <span className="text-amber-500 font-black font-mono text-[10px] md:text-lg uppercase tracking-tight">
            XP PROGRESS
          </span>
          <span className="text-stone-500 text-[8px] md:text-sm font-mono font-bold">
            {mercenary.currentXp} / {mercenary.xpToNextLevel}
          </span>
        </div>
        <div className="w-full h-1 md:h-2 bg-stone-900 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-gradient-to-r from-amber-800 to-amber-500 transition-all duration-700" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>

      <div className="bg-stone-950/60 rounded-xl border border-stone-800 p-3 md:p-6 shrink-0 relative overflow-hidden">
        <div className="flex justify-between items-center mb-3 md:mb-4 px-1">
          <h4 className="text-[8px] md:text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
            <Star className="w-3 h-3 text-amber-600" /> Attributes
          </h4>
          {!isReadOnly && (
            <span className={`text-[8px] md:text-xs font-black px-2 md:px-3 py-0.5 md:py-1 border rounded-full transition-all ${pendingPoints > 0 ? 'bg-amber-900/30 border-amber-500/30 text-amber-400 animate-pulse' : 'bg-stone-900 border-stone-700 text-stone-600'}`}>
              {pendingPoints} AP AVAILABLE
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          {[
            { label: 'STR', key: 'str' as const, color: 'text-orange-400' },
            { label: 'INT', key: 'int' as const, color: 'text-blue-400' },
            { label: 'DEX', key: 'dex' as const, color: 'text-emerald-400' },
            { label: 'VIT', key: 'vit' as const, color: 'text-red-400' },
            { label: 'LUK', key: 'luk' as const, color: 'text-pink-400' },
          ].map((stat) => {
            const currentEquipBonus = equipmentStats[stat.key] || 0;
            const currentTotal = mercenary.stats[stat.key] + mercenary.allocatedStats[stat.key] + currentEquipBonus;
            
            const previewEquipBonus = previewEquipmentStats ? (previewEquipmentStats[stat.key] || 0) : currentEquipBonus;
            const previewTotal = mercenary.stats[stat.key] + pendingAllocated[stat.key] + previewEquipBonus;
            
            const isAllocatedModified = pendingAllocated[stat.key] > mercenary.allocatedStats[stat.key];
            const isPreviewing = previewEquipmentStats !== null;

            return (
              <div key={stat.key} className="flex flex-col gap-1 md:gap-2">
                <div
                  className={`bg-stone-900/80 border ${isAllocatedModified || (isPreviewing && previewTotal !== currentTotal) ? 'border-amber-500 shadow-glow-sm' : 'border-stone-800'} p-1 md:p-2 rounded-lg flex flex-col items-center justify-center h-14 md:h-20 transition-all relative`}
                >
                  <span className={`text-[6px] md:text-[8px] font-black ${stat.color} mb-0.5`}>{stat.label}</span>
                  <div className="flex items-center gap-0.5">
                    <span className={`text-[10px] md:text-lg font-mono font-black ${isPreviewing && previewTotal > currentTotal ? 'text-emerald-400' : isPreviewing && previewTotal < currentTotal ? 'text-red-400' : isAllocatedModified ? 'text-amber-400' : 'text-stone-400'}`}>
                      {previewTotal}
                    </span>
                  </div>
                  {previewEquipBonus > 0 && <span className="text-[6px] md:text-[8px] font-bold text-emerald-400 leading-none mt-0.5">+{previewEquipBonus}</span>}
                </div>

                {!isReadOnly && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onModifyStat(stat.key, 1)}
                      disabled={pendingPoints <= 0}
                      className="w-full h-4 md:h-7 bg-stone-800 hover:bg-amber-600 text-stone-500 hover:text-white rounded transition-all disabled:opacity-20 flex items-center justify-center shadow-sm"
                    >
                      <Plus className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                    </button>
                    <button
                      onClick={() => onModifyStat(stat.key, -1)}
                      disabled={pendingAllocated[stat.key] <= mercenary.allocatedStats[stat.key]}
                      className="w-full h-4 md:h-7 bg-stone-800 hover:bg-red-900 text-stone-500 hover:text-white rounded transition-all disabled:opacity-20 flex items-center justify-center shadow-sm"
                    >
                      <Minus className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isModified && !isReadOnly && (
          <div className="flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
              <button 
                onClick={onReset}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded-xl border border-stone-700 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                  <RotateCcw className="w-3.5 h-3.5" /> Discard
              </button>
              <button 
                onClick={onSave}
                className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl border-b-4 border-amber-800 shadow-xl transition-all active:translate-y-0.5 text-[10px] font-black uppercase tracking-widest"
              >
                  <Save className="w-3.5 h-3.5" /> Save Attributes
              </button>
          </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:gap-6 shrink-0">
        <div className="bg-stone-950/40 p-2 md:p-5 rounded-xl border border-white/5 flex items-center gap-2 md:gap-4 shadow-sm">
          <div className="p-1.5 md:p-3 bg-red-950/40 rounded-lg text-red-500 border border-red-900/30">
            <Heart className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[7px] md:text-xs text-stone-500 font-black mb-0.5 md:mb-1">
              <span>HP</span>
              <span className="text-stone-300 font-mono">
                {Math.floor(mercenary.currentHp)}/{finalStats.maxHp}
              </span>
            </div>
            <div className="w-full h-1 md:h-2 bg-stone-900 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${hpPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-stone-950/40 p-2 md:p-5 rounded-xl border border-white/5 flex items-center gap-2 md:gap-4 shadow-sm">
          <div className="p-1.5 md:p-3 bg-blue-950/40 rounded-lg text-blue-500 border border-blue-900/30">
            <Activity className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[7px] md:text-xs text-stone-500 font-black mb-0.5 md:mb-1">
              <span>MP</span>
              <span className="text-stone-300 font-mono">
                {Math.floor(mercenary.currentMp)}/{finalStats.maxMp}
              </span>
            </div>
            <div className="w-full h-1 md:h-2 bg-stone-900 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${mpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 md:space-y-3 pb-2 shrink-0">
        <h4 className="text-[8px] md:text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <Sword className="w-3 h-3" /> Battle Performance
        </h4>
        <div className="grid grid-cols-2 gap-1.5 md:gap-4">
          {renderStatRow(<Sword className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />, 'Physical Atk', baseStats.physicalAttack, finalStats.physicalAttack)}
          {renderStatRow(<Shield className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />, 'Physical Def', baseStats.physicalDefense, finalStats.physicalDefense)}
          {renderStatRow(<Zap className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />, 'Magical Atk', baseStats.magicalAttack, finalStats.magicalAttack)}
          {renderStatRow(<Brain className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />, 'Magical Def', baseStats.magicalDefense, finalStats.magicalDefense)}
          {renderStatRow(<Target className="w-3 h-3 md:w-4 md:h-4 text-red-500" />, 'Crit Rate', baseStats.critChance, finalStats.critChance, true)}
          {renderStatRow(<Wind className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />, 'Evasion', baseStats.evasion, finalStats.evasion)}
        </div>
      </div>

      <div className="space-y-2 md:space-y-3 pb-6 shrink-0">
        <h4 className="text-[8px] md:text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <Sparkles className="w-3 h-3 text-amber-600" /> Techniques & Skills
        </h4>

        {skillIds && skillIds.length > 0 ? (
          <div className="space-y-1.5 md:space-y-3">
            {skillIds.map((id) => {
              const skill = (SKILLS as any)[id];
              if (!skill) return null;
              return (
                <div
                  key={id}
                  className="bg-stone-950/40 border border-stone-800 rounded-xl p-3 md:p-4 flex justify-between items-center gap-3 hover:border-amber-900/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-amber-900/15 rounded-lg border border-amber-600/20 text-amber-500 shrink-0">
                      <Sword className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[10px] md:text-xs font-black text-stone-200 uppercase truncate">{skill.name}</h5>
                      <p className="text-[8px] md:text-[9px] text-stone-500 italic leading-tight line-clamp-1">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                     <span className="text-[7px] md:text-[8px] font-black text-amber-500 uppercase tracking-tighter">
                        {Math.round(skill.multiplier * 100)}% DMG
                      </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 md:py-6 text-center border-2 border-dashed border-stone-800 rounded-xl text-stone-600 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
            No learned skills
          </div>
        )}
      </div>
    </div>
  );
};

type CategoryFilter = 'ALL' | 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'CONSUMABLE';

const EquipmentInventoryList = ({
  inventory,
  selectedItemId,
  onSelect,
  onEquip,
  onConsume,
  selectedSlotFilter,
  mercenary,
  isReadOnly,
  onToggleInventory,
}: {
  inventory: InventoryItem[];
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
  onEquip: (itemId: string) => void;
  onConsume: (itemId: string) => void;
  selectedSlotFilter: EquipmentSlotType | null;
  mercenary: Mercenary;
  isReadOnly?: boolean;
  onToggleInventory: () => void;
}) => {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('ALL');

  const pureMercStats = useMemo(() => {
    return mergePrimaryStats(mercenary.stats, mercenary.allocatedStats);
  }, [mercenary.stats, mercenary.allocatedStats]);

  const displayInventory = useMemo(() => {
    let filtered = inventory;

    // 1. Slot Filter (Priority from PaperDoll)
    if (selectedSlotFilter) {
      return filtered.filter((item) => item.equipmentData?.slotType === selectedSlotFilter);
    }

    // 2. Category Filter (Manual Chips)
    if (activeFilter === 'WEAPON') {
      return filtered.filter((item) => item.equipmentData?.slotType === 'MAIN_HAND');
    }
    if (activeFilter === 'ARMOR') {
      return filtered.filter((item) => 
        ['HEAD', 'BODY', 'HANDS', 'FEET', 'OFF_HAND'].includes(item.equipmentData?.slotType || '')
      );
    }
    if (activeFilter === 'ACCESSORY') {
      return filtered.filter((item) => item.equipmentData?.slotType === 'ACCESSORY');
    }
    if (activeFilter === 'CONSUMABLE') {
      return filtered.filter((item) => item.type === 'CONSUMABLE');
    }

    return filtered;
  }, [inventory, selectedSlotFilter, activeFilter]);

  const getQualityLabel = (q: number): string => {
    if (q >= 110) return 'MASTERWORK';
    if (q >= 100) return 'PRISTINE';
    if (q >= 90) return 'SUPERIOR';
    if (q >= 80) return 'FINE';
    if (q >= 70) return 'STANDARD';
    if (q >= 60) return 'RUSTIC';
    return 'CRUDE';
  };

  const filterChips: { id: CategoryFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'All', icon: <Box className="w-3 h-3" /> },
    { id: 'WEAPON', label: 'Weapons', icon: <Sword className="w-3 h-3" /> },
    { id: 'ARMOR', label: 'Armor', icon: <Shield className="w-3 h-3" /> },
    { id: 'ACCESSORY', label: 'Accessory', icon: <Sparkles className="w-3 h-3" /> },
    { id: 'CONSUMABLE', label: 'Items', icon: <FlaskConical className="w-3 h-3" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div 
        onClick={onToggleInventory}
        className="p-4 md:p-6 bg-stone-950 border-b border-white/5 flex justify-between items-center shrink-0 z-10 backdrop-blur-md cursor-pointer hover:bg-stone-900 transition-colors group"
      >
        <div className="flex flex-col">
            <h3 className="text-[10px] md:text-sm font-black text-stone-100 uppercase tracking-widest flex items-center gap-2 group-hover:text-amber-500 transition-colors">
            <Package className="w-4 h-4 text-amber-600" />
            <span>{selectedSlotFilter ? `Filtering: ${selectedSlotFilter}` : 'Squad Inventory'}</span>
            </h3>
            <span className="text-[7px] md:text-[10px] text-stone-500 font-mono mt-0.5 uppercase">Click Header to Close</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] md:text-xs text-stone-600 font-mono bg-stone-900 px-2 py-0.5 rounded border border-stone-800">{displayInventory.length} ITEMS</span>
          <ChevronRight className="w-4 h-4 text-stone-700 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Category Filter Chips */}
      {!selectedSlotFilter && (
        <div className="px-3 md:px-6 py-2 md:py-3 bg-stone-950/40 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] md:text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${
                activeFilter === chip.id
                  ? 'bg-amber-600 border-amber-400 text-white shadow-glow-sm'
                  : 'bg-stone-800 border-stone-700 text-stone-500 hover:text-stone-300'
              }`}
            >
              {chip.icon}
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-2 md:space-y-3">
        {displayInventory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-800 italic p-12 text-center">
            <Box className="w-12 h-12 opacity-10 mb-2" />
            <p className="text-xs">No suitable gear found.</p>
            {selectedSlotFilter && (
              <button 
                onClick={onToggleInventory}
                className="mt-4 px-4 py-2 bg-stone-800 text-stone-400 rounded-lg text-[10px] uppercase font-bold hover:text-stone-200"
              >
                Back to View All
              </button>
            )}
          </div>
        ) : (
          displayInventory.map((item) => {
            const isConsumable = item.type === 'CONSUMABLE';
            const isSelected = selectedItemId === item.id;
            
            const reqs = item.equipmentData?.equipRequirements || {};
            const failedStats = Object.entries(reqs).filter(([stat, val]) => pureMercStats[stat as keyof PrimaryStats] < (val as number));
            const canEquip = !isConsumable && failedStats.length === 0;

            const rarityClasses = isConsumable ? 'text-stone-400 border-stone-700 bg-stone-900/40' : getRarityClasses(item.equipmentData?.rarity);
            const imageUrl = item.type === 'EQUIPMENT' && item.equipmentData
              ? (item.equipmentData.image
                  ? getAssetUrl(item.equipmentData.image)
                  : item.equipmentData.recipeId
                    ? getAssetUrl(`${item.equipmentData.recipeId}.png`)
                    : getAssetUrl(`${item.id.split('_')[0]}.png`))
              : getAssetUrl(`${item.id}.png`);

            return (
              <div
                key={item.id}
                onClick={() => !isSelected && onSelect(item.id)}
                className={`flex flex-col gap-2 p-3 md:p-5 rounded-xl border transition-all ${
                  isSelected ? 'border-amber-500 bg-stone-900/80 shadow-inner' : 'border-stone-800 bg-stone-900/30'
                } cursor-pointer group relative overflow-hidden ${!isConsumable && !canEquip ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`w-10 h-10 md:w-16 md:h-16 bg-stone-950 rounded-lg border-2 flex items-center justify-center shrink-0 ${rarityClasses}`}>
                    <img src={imageUrl} className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] md:text-lg font-black truncate text-stone-200">{item.name}</div>
                    <div className="flex wrap items-center gap-2 mt-1">
                      <span className={`text-[7px] md:text-[9px] px-1.5 py-0.5 rounded font-black uppercase border leading-none ${rarityClasses}`}>
                        {isConsumable ? 'CONSUMABLE' : item.equipmentData?.rarity}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[7px] md:text-[9px] text-stone-500 font-mono font-bold">
                          QTY: {item.quantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isReadOnly && isSelected && !isConsumable && canEquip && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEquip(item.id);
                      }}
                      className="shrink-0 px-3 md:px-8 py-1.5 md:py-3 bg-amber-700 hover:bg-amber-600 text-white text-[9px] md:text-xs font-black uppercase rounded shadow-lg transition-all"
                    >
                      Equip
                    </button>
                  )}

                  {/* Consumable Overlay Options */}
                  {!isReadOnly && isSelected && isConsumable && (
                    <div className="absolute top-0 right-0 h-full w-24 md:w-32 bg-stone-900/95 border-l border-amber-600/30 flex flex-col animate-in slide-in-from-right-full duration-200 z-30">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onConsume(item.id); }}
                            className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-emerald-900/40 text-emerald-400 transition-colors"
                        >
                            <Check className="w-4 h-4 md:w-6 md:h-6" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase">Consume</span>
                        </button>
                        <div className="h-px w-full bg-amber-600/10" />
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelect(""); }}
                            className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-red-900/40 text-stone-500 hover:text-red-400 transition-colors"
                        >
                            <X className="w-4 h-4 md:w-6 md:h-6" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase">Cancel</span>
                        </button>
                    </div>
                  )}
                </div>

                {!isConsumable && !canEquip && isSelected && (
                  <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-2 flex items-center gap-2 text-[8px] md:text-[10px] text-red-400 font-bold uppercase tracking-tight">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Missing: {failedStats.map(([s, v]) => `${s.toUpperCase()} ${v}`).join(', ')}
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-white/5 pt-2">
                   <div className="flex items-center gap-2">
                        {isConsumable ? (
                             <span className="text-[7px] md:text-[9px] text-stone-500 italic truncate max-w-[150px]">
                                {item.description}
                             </span>
                        ) : (
                            <span className="text-[7px] md:text-[9px] text-amber-600 font-black uppercase tracking-tighter bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/20">
                            {getQualityLabel(item.equipmentData?.quality || 100)}
                            </span>
                        )}
                    </div>
                    {!isConsumable && item.equipmentData && (
                        <div className="flex items-center gap-2 text-[8px] md:text-xs text-stone-600 font-mono">
                            {(item.equipmentData.stats.physicalAttack > 0 || item.equipmentData.stats.magicalAttack > 0) && (
                                <span className="flex items-center gap-1"><Sword className="w-2.5 h-2.5" /> {item.equipmentData.stats.physicalAttack || item.equipmentData.stats.magicalAttack}</span>
                            )}
                            {(item.equipmentData.stats.physicalDefense > 0 || item.equipmentData.stats.magicalDefense > 0) && (
                                <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> {item.equipmentData.stats.physicalDefense || item.equipmentData.stats.magicalDefense}</span>
                            )}
                        </div>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const MercenaryDetailModal: React.FC<MercenaryDetailModalProps> = ({ mercenary, onClose, onUnequip, isReadOnly = false }) => {
  const { state, actions } = useGame();
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string | null>(null);
  
  // Pending Allocation State
  const [pendingAllocated, setPendingAllocated] = useState<PrimaryStats>({ str: 0, vit: 0, dex: 0, int: 0, luk: 0 });
  const [pendingPoints, setPendingPoints] = useState(0);
  
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  useEffect(() => {
    if (mercenary) {
      setSelectedSlot(null);
      setSelectedInventoryItemId(null);
      setPendingAllocated({ ...mercenary.allocatedStats });
      setPendingPoints(mercenary.bonusStatPoints || 0);
    }
  }, [mercenary?.id, mercenary?.allocatedStats, mercenary?.bonusStatPoints]);

  if (!mercenary) return null;

  const isHired = mercenary.status !== 'VISITOR' && mercenary.status !== 'DEAD';

  const handleModifyStat = (key: keyof PrimaryStats, delta: number) => {
    if (delta > 0 && pendingPoints <= 0) return;
    if (delta < 0 && pendingAllocated[key] <= mercenary.allocatedStats[key]) return;

    setPendingAllocated(prev => ({ ...prev, [key]: prev[key] + delta }));
    setPendingPoints(prev => prev - delta);
  };

  const handleSaveAttributes = () => {
    if (!mercenary) return;
    actions.updateMercenaryStats(mercenary.id, pendingAllocated);
    actions.showToast(`${mercenary.name}'s attributes have been finalized.`);
  };

  const handleResetAttributes = () => {
    setPendingAllocated({ ...mercenary.allocatedStats });
    setPendingPoints(mercenary.bonusStatPoints || 0);
  };

  const currentEqPrimaryStats = useMemo(() => {
    return (Object.values(mercenary.equipment).filter(Boolean) as Equipment[]).reduce(
      (acc: PrimaryStats, eq: Equipment) => ({
        str: acc.str + (eq.stats.str || 0),
        vit: acc.vit + (eq.stats.vit || 0),
        dex: acc.dex + (eq.stats.dex || 0),
        int: acc.int + (eq.stats.int || 0),
        luk: acc.luk + (eq.stats.luk || 0),
      }),
      { str: 0, vit: 0, dex: 0, int: 0, luk: 0 }
    );
  }, [mercenary.equipment]);

  // Use pendingAllocated for derived calculation to show real-time preview
  const mergedPrimary = mergePrimaryStats(mercenary.stats, pendingAllocated, currentEqPrimaryStats);
  const baseDerived = calculateDerivedStats(mergedPrimary, mercenary.level);
  const currentEquipmentStatsList = (Object.values(mercenary.equipment) as (Equipment | null)[]).map((eq) => eq?.stats).filter(Boolean);
  const currentStats = applyEquipmentBonuses(baseDerived, currentEquipmentStatsList as any);
  const currentAttackType = mergedPrimary.int > mergedPrimary.str ? 'MAGICAL' : 'PHYSICAL';
  const currentCombatPower = calculateCombatPower(currentStats, mercenary.job, currentAttackType);

  let previewStats: DerivedStats | null = null;
  let previewCombatPower: number | null = null;
  let previewEqPrimaryStats: PrimaryStats | null = null;

  if (selectedInventoryItemId) {
    const item = state.inventory.find((i) => i.id === selectedInventoryItemId)?.equipmentData;
    if (item) {
      const previewEq = { ...mercenary.equipment };
      if (item.slotType === 'MAIN_HAND' && item.isTwoHanded) previewEq.OFF_HAND = null;
      else if (item.slotType === 'OFF_HAND' && previewEq.MAIN_HAND?.isTwoHanded) previewEq.MAIN_HAND = null;
      previewEq[item.slotType] = item;

      previewEqPrimaryStats = (Object.values(previewEq).filter(Boolean) as Equipment[]).reduce(
        (acc: PrimaryStats, eq: Equipment) => ({
          str: acc.str + (eq.stats.str || 0),
          vit: acc.vit + (eq.stats.vit || 0),
          dex: acc.dex + (eq.stats.dex || 0),
          int: acc.int + (eq.stats.int || 0),
          luk: acc.luk + (eq.stats.luk || 0),
        }),
        { str: 0, vit: 0, dex: 0, int: 0, luk: 0 }
      );

      const previewMerged = mergePrimaryStats(mercenary.stats, pendingAllocated, previewEqPrimaryStats);
      const previewBase = calculateDerivedStats(previewMerged, mercenary.level);
      previewStats = applyEquipmentBonuses(
        previewBase,
        (Object.values(previewEq) as (Equipment | null)[]).map((e) => e?.stats).filter(Boolean) as any
      );
      previewCombatPower = calculateCombatPower(previewStats, mercenary.job, previewMerged.int > previewMerged.str ? 'MAGICAL' : 'PHYSICAL');
    }
  }

  const effectiveFinalStats = previewStats || currentStats;
  const effectiveCombatPower = previewCombatPower !== null ? previewCombatPower : currentCombatPower;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 md:p-6 py-[10dvh] md:py-6 animate-in fade-in duration-300 overflow-hidden">
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[1050] p-1.5 md:p-3 bg-red-900/30 hover:bg-red-600 rounded-full text-red-500 hover:text-white border border-red-500/30 transition-all shadow-2xl backdrop-blur-md active:scale-90"
      >
        <X className="w-4 h-4 md:w-6 md:h-6" />
      </button>

      <div className={`w-full h-full md:max-w-7xl md:h-[90dvh] bg-stone-950 border border-white/10 rounded-2xl md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative ring-1 ring-white/10 transition-all duration-500`}>
        
        {/* Left Column: Profile + PaperDoll + Stats (Scrollable) */}
        <div className={`flex flex-col overflow-hidden transition-all duration-500 border-stone-800 ${isHired && isInventoryOpen ? 'w-full md:w-[45%] h-1/2 md:h-full border-b md:border-b-0 md:border-r' : 'w-full h-full'}`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-stone-900/20">
            <MercenaryPaperDoll
              mercenary={mercenary}
              currentCombatPower={calculateMercenaryPower(mercenary)}
              nextCombatPower={effectiveCombatPower}
              showAffinityGain={false}
              onUnequip={(slot) => onUnequip(mercenary.id, slot)}
              onSlotClick={(s) => {
                setSelectedSlot(s);
                if (s && !isInventoryOpen && isHired) setIsInventoryOpen(true);
              }}
              selectedSlot={selectedSlot}
              isReadOnly={isReadOnly}
              isInventoryOpen={isInventoryOpen}
              onToggleInventory={() => setIsInventoryOpen(!isInventoryOpen)}
              isHired={isHired}
            />
            <MercenaryStatsPanel
              mercenary={mercenary}
              baseStats={currentStats}
              finalStats={effectiveFinalStats}
              pendingAllocated={pendingAllocated}
              pendingPoints={pendingPoints}
              equipmentStats={currentEqPrimaryStats}
              previewEquipmentStats={previewEqPrimaryStats}
              onModifyStat={handleModifyStat}
              onSave={handleSaveAttributes}
              onReset={handleResetAttributes}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>

        {/* Right Column: Inventory Only (Toggleable) - Only render if hired */}
        {isHired && (
          <div className={`bg-stone-950/20 flex flex-col transition-all duration-500 overflow-hidden ${isInventoryOpen ? 'flex-1 h-1/2 md:h-full opacity-100' : 'w-0 h-0 md:h-full opacity-0'}`}>
            <EquipmentInventoryList
              inventory={state.inventory.filter((i) => i.type === 'EQUIPMENT' || i.type === 'CONSUMABLE')}
              selectedItemId={selectedInventoryItemId}
              onSelect={setSelectedInventoryItemId}
              onEquip={(id) => {
                actions.equipItem(mercenary.id, id);
                setSelectedInventoryItemId(null);
              }}
              onConsume={(id) => {
                actions.useItem(id, mercenary.id);
                // No need to clear selected state if multiple potions exist, but good for UI clarity
                setSelectedInventoryItemId(null);
              }}
              selectedSlotFilter={selectedSlot}
              mercenary={mercenary}
              isReadOnly={isReadOnly}
              onToggleInventory={() => setIsInventoryOpen(!isInventoryOpen)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

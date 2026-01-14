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
  ShieldAlert,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { getAssetUrl } from '../../utils';
import {
  calculateDerivedStats,
  applyEquipmentBonuses,
  DerivedStats,
  PrimaryStats,
  mergePrimaryStats,
} from '../../models/Stats';
import { calculateCombatPower } from '../../utils/combatLogic';
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
  baseCombatPower,
  nextCombatPower,
  showAffinityGain,
  onUnequip,
  onSlotClick,
  selectedSlot,
  isReadOnly,
}: {
  mercenary: Mercenary;
  baseCombatPower: number;
  nextCombatPower: number;
  showAffinityGain: boolean;
  onUnequip: (slot: EquipmentSlotType) => void;
  onSlotClick: (slot: EquipmentSlotType | null) => void;
  selectedSlot: EquipmentSlotType | null;
  isReadOnly?: boolean;
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
        className={`absolute w-10 h-10 md:w-14 md:h-14 rounded-xl border-2 backdrop-blur-md ${borderColor} ${bgColor} flex items-center justify-center shadow-lg transition-all z-20 group ${style} ${isSelected ? 'ring-4 ring-amber-500/30 scale-110' : 'hover:scale-105'} cursor-pointer`}
        onClick={() => onSlotClick(isSelected ? null : slot)}
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

  return (
    <div className="w-[42%] h-full relative bg-stone-900/40 flex flex-col overflow-hidden border-r border-white/5">
      <div className="p-3 md:p-6 flex flex-col gap-0.5 md:gap-1 shrink-0 bg-stone-950/40 border-b border-white/5 backdrop-blur-md z-30">
        <h2 className="text-xs md:text-2xl font-black text-stone-100 font-serif truncate leading-none">
          {mercenary.name}
        </h2>
        <div className="flex justify-between items-end">
          <div className="flex wrap items-center gap-1">
            <span className="text-[6px] md:text-xs font-black text-amber-500 uppercase tracking-widest bg-amber-950/40 px-1 py-0.5 rounded border border-amber-900/20">
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
              Power
            </span>
            <div className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xl font-mono font-black text-stone-300">
              <Star className="w-2.5 h-2.5 md:w-4 md:h-4 text-amber-600 fill-amber-600" />
              {nextCombatPower}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden min-h-0">
        <div className="relative h-[90%] w-full flex items-center justify-center pointer-events-none opacity-80">
          <img
            src={mercenary.sprite ? getAssetUrl(mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')}
            className="h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          />
        </div>
        {renderSlot({ slot: 'HEAD', icon: <Crown className="w-5 h-5" />, style: 'top-[6%] left-1/2 -translate-x-1/2' })}
        {renderSlot({ slot: 'BODY', icon: <Shirt className="w-5 h-5" />, style: 'top-[26%] left-1/2 -translate-x-1/2' })}
        {renderSlot({ slot: 'HANDS', icon: <Hand className="w-5 h-5" />, style: 'top-[26%] left-[8%]' })}
        {renderSlot({ slot: 'ACCESSORY', icon: <Sparkles className="w-5 h-5" />, style: 'top-[26%] right-[8%]' })}
        {renderSlot({ slot: 'MAIN_HAND', icon: <Sword className="w-5 h-5" />, style: 'top-[48%] left-[4%]' })}
        {renderSlot({ slot: 'OFF_HAND', icon: <Shield className="w-5 h-5" />, style: 'top-[48%] right-[4%]' })}
        {renderSlot({
          slot: 'FEET',
          icon: <Footprints className="w-5 h-5" />,
          style: 'bottom-[10%] left-1/2 -translate-x-1/2',
        })}
      </div>
    </div>
  );
};

const MercenaryStatsPanel = ({
  mercenary,
  baseStats,
  finalStats,
  localAllocated,
  equipmentStats,
  onSetLocalAllocated,
  isReadOnly,
}: {
  mercenary: Mercenary;
  baseStats: DerivedStats;
  finalStats: DerivedStats;
  localAllocated: PrimaryStats;
  equipmentStats: PrimaryStats;
  onSetLocalAllocated: (stats: PrimaryStats) => void;
  isReadOnly?: boolean;
}) => {
  const { actions } = useGame();
  const xpPercent =
    mercenary.xpToNextLevel > 0
      ? Math.min(100, Math.max(0, (mercenary.currentXp / mercenary.xpToNextLevel) * 100))
      : 0;
  const hpPercent = finalStats.maxHp > 0 ? (mercenary.currentHp / finalStats.maxHp) * 100 : 0;
  const mpPercent = finalStats.maxMp > 0 ? (mercenary.currentMp / finalStats.maxMp) * 100 : 0;

  const totalUsedLocal = Object.values(localAllocated).reduce((a, b) => a + b, 0);
  const totalPoints = (mercenary.level - 1) * 3;
  const availablePoints = Math.max(0, totalPoints - totalUsedLocal);
  const hasChanges = JSON.stringify(localAllocated) !== JSON.stringify(mercenary.allocatedStats);

  const renderStatRow = (icon: React.ReactNode, label: string, baseValue: number, nextValue: number, isPercent = false) => {
    const diff = nextValue - baseValue;
    const colorClass = diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-stone-300';
    return (
      <div className="bg-stone-950/40 p-1.5 md:p-3 rounded-lg border border-white/5 flex justify-between items-center h-8 md:h-12">
        <span className="text-[7px] md:text-xs text-stone-500 font-black uppercase flex items-center gap-1.5 md:gap-2">
          {icon}
          <span className="hidden md:inline">{label}</span>
          <span className="md:hidden">
            {label === 'Physical Atk'
              ? 'P.Atk'
              : label === 'Physical Def'
                ? 'P.Def'
                : label === 'Magical Atk'
                  ? 'M.Atk'
                  : label === 'Magical Def'
                    ? 'M.Def'
                    : label === 'Crit Rate'
                      ? 'Crit'
                      : label === 'Evasion'
                        ? 'Eva'
                        : label}
          </span>
        </span>
        <div className="flex items-center gap-1 md:gap-2">
          <span className={`font-mono text-[9px] md:text-base font-black ${colorClass}`}>
            {isPercent ? nextValue.toFixed(1) : Math.round(nextValue)}
            {isPercent ? '%' : ''}
          </span>
          <StatDiff current={baseValue} next={nextValue} isPercent={isPercent} />
        </div>
      </div>
    );
  };

  const updateLocalStat = (key: keyof PrimaryStats, delta: number) => {
    const newVal = localAllocated[key] + delta;
    if (delta > 0 && availablePoints <= 0) return;
    if (delta < 0 && newVal < mercenary.allocatedStats[key]) return;
    onSetLocalAllocated({ ...localAllocated, [key]: newVal });
  };

  const skillIds = (mercenary as any).skillIds as string[] | undefined;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 flex flex-col gap-4 md:gap-6 min-h-0 bg-stone-900/10">
      <div className="bg-stone-950/40 p-2 md:p-5 rounded-xl border border-white/5 shadow-inner shrink-0">
        <div className="flex justify-between items-end mb-1 md:mb-2 leading-none">
          <span className="text-amber-500 font-black font-mono text-[10px] md:text-lg uppercase tracking-tight">
            LV {mercenary.level}
          </span>
          <span className="text-stone-500 text-[8px] md:text-sm font-mono font-bold">
            {mercenary.currentXp} / {mercenary.xpToNextLevel} XP
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
          {!isReadOnly && availablePoints > 0 && (
            <span className="text-[8px] md:text-xs font-black text-amber-400 px-2 md:px-3 py-0.5 md:py-1 bg-amber-900/30 border border-amber-500/30 rounded-full animate-pulse">
              POINTS: {availablePoints}
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
            const equipBonus = equipmentStats[stat.key] || 0;
            const basePlusAlloc = mercenary.stats[stat.key] + localAllocated[stat.key];
            const totalValue = basePlusAlloc + equipBonus;
            const isAllocatedModified = localAllocated[stat.key] > mercenary.allocatedStats[stat.key];

            return (
              <div key={stat.key} className="flex flex-col gap-1 md:gap-1.5">
                <div
                  className={`bg-stone-900/80 border ${isAllocatedModified ? 'border-amber-500 shadow-glow-sm' : 'border-stone-800'} p-1 md:p-2 rounded-lg flex flex-col items-center justify-center h-14 md:h-24 transition-all relative`}
                >
                  <span className={`text-[6px] md:text-[10px] font-black ${stat.color} mb-0.5`}>{stat.label}</span>
                  <span className={`text-[10px] md:text-xl font-mono font-black ${isAllocatedModified ? 'text-amber-400' : 'text-stone-400'}`}>
                    {totalValue}
                  </span>
                  {equipBonus > 0 && <span className="text-[6px] md:text-[9px] font-bold text-emerald-400 leading-none mt-0.5">+{equipBonus}</span>}
                </div>

                {!isReadOnly && (
                  <div className="flex flex-col gap-0.5 md:gap-1">
                    <button
                      onClick={() => updateLocalStat(stat.key, 1)}
                      disabled={availablePoints <= 0}
                      className="w-full h-4 md:h-8 bg-stone-800 hover:bg-amber-600 text-stone-500 hover:text-white rounded transition-all disabled:opacity-0 flex items-center justify-center shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => updateLocalStat(stat.key, -1)}
                      disabled={localAllocated[stat.key] <= mercenary.allocatedStats[stat.key]}
                      className="w-full h-3 md:h-6 bg-stone-950 hover:bg-red-700 text-stone-700 hover:text-white rounded transition-all disabled:opacity-0 flex items-center justify-center"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isReadOnly && hasChanges && (
          <div className="mt-4 md:mt-6 flex gap-2 md:gap-3 animate-in slide-in-from-top-2">
            <button onClick={() => onSetLocalAllocated({ ...mercenary.allocatedStats })} className="flex-1 py-2 bg-stone-800 text-stone-500 text-[10px] font-black rounded-lg transition-all uppercase">
              Discard
            </button>
            <button onClick={() => actions.updateMercenaryStats(mercenary.id, localAllocated)} className="flex-[2] py-2 bg-amber-700 text-white text-[10px] font-black rounded-lg shadow-lg transition-all uppercase">
              Confirm
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-6 shrink-0">
        <div className="bg-stone-950/40 p-2 md:p-5 rounded-xl border border-white/5 flex items-center gap-2 md:gap-4 shadow-sm">
          <div className="p-1.5 md:p-3 bg-red-950/40 rounded-lg text-red-500 border border-red-900/30">
            <Heart className="w-4 h-4 md:w-7 md:h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[7px] md:text-xs text-stone-500 font-black mb-0.5 md:mb-1">
              <span>HP</span>
              <span className="text-stone-300 font-mono">
                {mercenary.currentHp}/{finalStats.maxHp}
              </span>
            </div>
            <div className="w-full h-1 md:h-2 bg-stone-900 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${hpPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-stone-950/40 p-2 md:p-5 rounded-xl border border-white/5 flex items-center gap-2 md:gap-4 shadow-sm">
          <div className="p-1.5 md:p-3 bg-blue-950/40 rounded-lg text-blue-500 border border-blue-900/30">
            <Activity className="w-4 h-4 md:w-7 md:h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[7px] md:text-xs text-stone-500 font-black mb-0.5 md:mb-1">
              <span>MP</span>
              <span className="text-stone-300 font-mono">
                {mercenary.currentMp}/{finalStats.maxMp}
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

      {/* ✅ B의 Skills 섹션을 A(STATS 탭) 안으로 통합 */}
      <div className="space-y-2 md:space-y-3 pb-6 shrink-0">
        <h4 className="text-[8px] md:text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <Sparkles className="w-3 h-3 text-amber-600" /> Techniques & Skills
        </h4>

        {skillIds && skillIds.length > 0 ? (
          <div className="space-y-1.5 md:space-y-3">
            {skillIds.map((id) => {
              const skill = (SKILLS as any)[id];
              if (!skill) {
                return (
                  <div
                    key={id}
                    className="bg-stone-950/30 border border-stone-800 rounded-xl p-3 text-[9px] md:text-xs text-stone-500 font-mono"
                  >
                    Unknown skill: {id}
                  </div>
                );
              }

              return (
                <div
                  key={id}
                  className="bg-stone-950/40 border border-stone-800 rounded-2xl p-3 md:p-5 flex justify-between items-center gap-3 md:gap-6 hover:border-amber-900/40 transition-all"
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="p-2 md:p-3 bg-amber-900/15 rounded-xl border border-amber-600/20 text-amber-500 shrink-0">
                      <Sword className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[10px] md:text-sm font-black text-stone-200 uppercase truncate">{skill.name}</h5>
                      <p className="text-[8px] md:text-[10px] text-stone-500 italic leading-snug md:leading-relaxed line-clamp-2">
                        “{skill.description}”
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col gap-1 shrink-0">
                    {typeof skill.mpCost === 'number' && (
                      <span className="bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase border border-blue-900/20">
                        {skill.mpCost} MP
                      </span>
                    )}
                    {typeof skill.multiplier === 'number' && (
                      <span className="text-[8px] md:text-[9px] font-black text-amber-500 uppercase tracking-tighter">
                        {Math.round(skill.multiplier * 100)}% {skill.type} DMG
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 md:py-10 text-center border-2 border-dashed border-stone-800 rounded-2xl text-stone-600 text-[9px] md:text-xs font-bold uppercase tracking-widest">
            No active techniques learned
          </div>
        )}
      </div>
    </div>
  );
};

const EquipmentInventoryList = ({
  inventory,
  selectedItemId,
  onSelect,
  onEquip,
  selectedSlotFilter,
  mercenary,
  isReadOnly,
}: {
  inventory: InventoryItem[];
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
  onEquip: (itemId: string) => void;
  selectedSlotFilter: EquipmentSlotType | null;
  mercenary: Mercenary;
  isReadOnly?: boolean;
}) => {
  // Exclude equipment bonuses from requirement checks.
  const pureMercStats = useMemo(() => {
    return mergePrimaryStats(mercenary.stats, mercenary.allocatedStats);
  }, [mercenary.stats, mercenary.allocatedStats]);

  const displayInventory = useMemo(() => {
    return selectedSlotFilter ? inventory.filter((item) => item.equipmentData?.slotType === selectedSlotFilter) : inventory;
  }, [inventory, selectedSlotFilter]);

  const getQualityLabel = (q: number): string => {
    if (q >= 110) return 'MASTERWORK';
    if (q >= 100) return 'PRISTINE';
    if (q >= 90) return 'SUPERIOR';
    if (q >= 80) return 'FINE';
    if (q >= 70) return 'STANDARD';
    if (q >= 60) return 'RUSTIC';
    return 'CRUDE';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-stone-950/40">
      <div className="p-3 md:p-6 bg-stone-900/60 border-b border-white/5 flex justify-between items-center shrink-0 z-10 backdrop-blur-md">
        <h3 className="text-[9px] md:text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
          <Box className="w-4 h-4 text-amber-600" />
          <span>{selectedSlotFilter ? `Filtering: ${selectedSlotFilter}` : 'Available Gear'}</span>
        </h3>
        <span className="text-[8px] md:text-xs text-stone-600 font-mono">{displayInventory.length} ITEMS</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-2 md:space-y-3">
        {displayInventory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-800 italic p-12 text-center">
            <Box className="w-12 h-12 opacity-10 mb-2" />
            <p className="text-xs">No suitable gear found.</p>
          </div>
        ) : (
          displayInventory.map((item) => {
            if (!item.equipmentData) return null;

            const isSelected = selectedItemId === item.id;
            const reqs = item.equipmentData.equipRequirements || {};

            const failedStats = Object.entries(reqs).filter(([stat, val]) => pureMercStats[stat as keyof PrimaryStats] < (val as number));
            const canEquip = failedStats.length === 0;

            const rarityClasses = getRarityClasses(item.equipmentData.rarity);
            const imageUrl = item.equipmentData.image
              ? getAssetUrl(item.equipmentData.image)
              : item.equipmentData.recipeId
                ? getAssetUrl(`${item.equipmentData.recipeId}.png`)
                : getAssetUrl(`${item.id.split('_')[0]}.png`);

            return (
              <div
                key={item.id}
                onClick={() => !isSelected && onSelect(item.id)}
                className={`flex flex-col gap-2 p-3 md:p-5 rounded-xl border transition-all ${
                  isSelected ? 'border-amber-500 bg-stone-900/80 shadow-inner' : 'border-stone-800 bg-stone-900/30'
                } cursor-pointer group ${!canEquip ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`w-10 h-10 md:w-16 md:h-16 bg-stone-950 rounded-lg border-2 flex items-center justify-center shrink-0 ${rarityClasses}`}>
                    <img src={imageUrl} className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] md:text-lg font-black truncate text-stone-200">{item.name}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-[7px] md:text-[9px] px-1.5 py-0.5 rounded font-black uppercase border leading-none ${rarityClasses}`}>
                        {item.equipmentData.rarity}
                      </span>
                      <span className="text-[7px] md:text-[9px] text-stone-600 font-mono font-bold">
                        LV.{item.equipmentData.quality >= 100 ? 'EX' : 'ST'}
                      </span>
                    </div>
                  </div>

                  {!isReadOnly && isSelected && canEquip && (
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
                </div>

                {!canEquip && isSelected && (
                  <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-2 flex items-center gap-2 text-[8px] md:text-[10px] text-red-400 font-bold uppercase tracking-tight">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Requirements not met: {failedStats.map(([s, v]) => `${s.toUpperCase()} ${v}`).join(', ')}
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-white/5 pt-2">
                  <div className="flex items-center gap-2 text-[8px] md:text-xs text-stone-600 font-bold">
                    <ShieldAlert className="w-3 h-3" />
                    DUR: {item.equipmentData.durability}/{item.equipmentData.maxDurability}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[7px] md:text-[9px] text-amber-600 font-black uppercase tracking-tighter bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/20">
                      {getQualityLabel(item.equipmentData.quality)}
                    </span>
                  </div>
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
  const [activeTab, setActiveTab] = useState<'STATS' | 'STORAGE'>('STATS');
  const [localAllocated, setLocalAllocated] = useState<PrimaryStats>({ str: 0, vit: 0, dex: 0, int: 0, luk: 0 });

  useEffect(() => {
    if (mercenary) {
      setSelectedSlot(null);
      setSelectedInventoryItemId(null);
      setLocalAllocated({ ...mercenary.allocatedStats });
      setActiveTab('STATS');
    }
  }, [mercenary?.id]);

  if (!mercenary) return null;

  // --- Core Stat Logic Sync ---
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

  const mergedPrimary = mergePrimaryStats(mercenary.stats, localAllocated, currentEqPrimaryStats);
  const baseDerived = calculateDerivedStats(mergedPrimary, mercenary.level);
  const currentEquipmentStats = (Object.values(mercenary.equipment) as (Equipment | null)[]).map((eq) => eq?.stats).filter(Boolean);
  const currentStats = applyEquipmentBonuses(baseDerived, currentEquipmentStats as any);
  const currentAttackType = mergedPrimary.int > mergedPrimary.str ? 'MAGICAL' : 'PHYSICAL';
  const currentCombatPower = calculateCombatPower(currentStats, mercenary.job, currentAttackType);

  // --- Preview Logic Sync ---
  let previewStats: DerivedStats | null = null;
  let previewCombatPower: number | null = null;
  if (selectedInventoryItemId) {
    const item = state.inventory.find((i) => i.id === selectedInventoryItemId)?.equipmentData;
    if (item) {
      const previewEq = { ...mercenary.equipment };
      if (item.slotType === 'MAIN_HAND' && item.isTwoHanded) previewEq.OFF_HAND = null;
      else if (item.slotType === 'OFF_HAND' && previewEq.MAIN_HAND?.isTwoHanded) previewEq.MAIN_HAND = null;
      previewEq[item.slotType] = item;

      const previewEqPrimary = (Object.values(previewEq).filter(Boolean) as Equipment[]).reduce(
        (acc: PrimaryStats, eq: Equipment) => ({
          str: acc.str + (eq.stats.str || 0),
          vit: acc.vit + (eq.stats.vit || 0),
          dex: acc.dex + (eq.stats.dex || 0),
          int: acc.int + (eq.stats.int || 0),
          luk: acc.luk + (eq.stats.luk || 0),
        }),
        { str: 0, vit: 0, dex: 0, int: 0, luk: 0 }
      );

      const previewMerged = mergePrimaryStats(mercenary.stats, localAllocated, previewEqPrimary);
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 md:p-6 py-[15dvh] md:py-6 animate-in fade-in duration-300 overflow-hidden">
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[1050] p-1.5 md:p-3 bg-red-900/30 hover:bg-red-600 rounded-full text-red-500 hover:text-white border border-red-500/30 transition-all shadow-2xl backdrop-blur-md active:scale-90"
      >
        <X className="w-4 h-4 md:w-6 md:h-6" />
      </button>

      <div className="w-full h-full md:max-w-7xl md:h-[90dvh] bg-stone-950 border border-white/10 rounded-2xl md:rounded-[2rem] shadow-2xl flex flex-row overflow-hidden relative ring-1 ring-white/10">
        <MercenaryPaperDoll
          mercenary={mercenary}
          baseCombatPower={currentCombatPower}
          nextCombatPower={effectiveCombatPower}
          showAffinityGain={false}
          onUnequip={(slot) => onUnequip(mercenary.id, slot)}
          onSlotClick={(s) => {
            setSelectedSlot(s);
            if (s) setActiveTab('STORAGE');
          }}
          selectedSlot={selectedSlot}
          isReadOnly={isReadOnly}
        />

        <div className="flex-1 bg-stone-900/30 flex flex-col h-full overflow-hidden">
          <div className="flex border-b border-white/5 bg-stone-950/80 shrink-0 z-20 backdrop-blur-3xl pr-16 md:pr-0">
            <button
              onClick={() => setActiveTab('STATS')}
              className={`flex-1 py-3 md:py-6 text-[10px] md:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-1.5 md:gap-3 transition-all whitespace-nowrap ${
                activeTab === 'STATS' ? 'text-amber-400 bg-stone-900/60 border-b-2 border-amber-500' : 'text-stone-600 hover:text-stone-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5 md:w-5 md:h-5" /> <span>Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('STORAGE')}
              className={`flex-1 py-3 md:py-6 text-[10px] md:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-1.5 md:gap-3 transition-all whitespace-nowrap ${
                activeTab === 'STORAGE' ? 'text-amber-400 bg-stone-900/60 border-b-2 border-amber-500' : 'text-stone-600 hover:text-stone-300'
              }`}
            >
              <Box className="w-3.5 h-3.5 md:w-5 md:h-5" /> <span>Storage</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-safe pb-safe">
            {activeTab === 'STATS' ? (
              <MercenaryStatsPanel
                mercenary={mercenary}
                baseStats={currentStats}
                finalStats={effectiveFinalStats}
                localAllocated={localAllocated}
                equipmentStats={currentEqPrimaryStats}
                onSetLocalAllocated={setLocalAllocated}
                isReadOnly={isReadOnly}
              />
            ) : (
              <EquipmentInventoryList
                inventory={state.inventory.filter((i) => i.type === 'EQUIPMENT')}
                selectedItemId={selectedInventoryItemId}
                onSelect={setSelectedInventoryItemId}
                onEquip={(id) => {
                  actions.equipItem(mercenary.id, id);
                  setSelectedInventoryItemId(null);
                }}
                selectedSlotFilter={selectedSlot}
                mercenary={mercenary}
                isReadOnly={isReadOnly}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
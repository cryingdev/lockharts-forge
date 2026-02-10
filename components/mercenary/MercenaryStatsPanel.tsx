
import React, { useMemo } from 'react';
import { 
  Sword, Shield, Activity, Star, Zap, Brain, Target, Wind, 
  Plus, Minus, RotateCcw, Save, Heart, Sparkles, Wrench
} from 'lucide-react';
import { Mercenary } from '../../models/Mercenary';
import { DerivedStats, PrimaryStats } from '../../models/Stats';
import { SKILLS } from '../../data/skills';
import { StatDiff } from './StatDiff';
import { SfxButton } from '../common/ui/SfxButton';
// Added Equipment import to fix type inference
import { Equipment } from '../../models/Equipment';

interface MercenaryStatsPanelProps {
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
}

export const MercenaryStatsPanel: React.FC<MercenaryStatsPanelProps> = ({
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
}) => {
  const xpPercent =
    mercenary.xpToNextLevel > 0
      ? Math.min(100, Math.max(0, (mercenary.currentXp / mercenary.xpToNextLevel) * 100))
      : 0;
  const hpPercent = finalStats.maxHp > 0 ? (mercenary.currentHp / finalStats.maxHp) * 100 : 0;
  const mpPercent = finalStats.maxMp > 0 ? (mercenary.currentMp / finalStats.maxMp) * 100 : 0;
  const staminaPercent = Math.min(100, Math.max(0, (mercenary.expeditionEnergy || 0)));

  const isModified = useMemo(() => {
    return (Object.keys(pendingAllocated) as Array<keyof PrimaryStats>).some(
        key => pendingAllocated[key] !== mercenary.allocatedStats[key]
    );
  }, [pendingAllocated, mercenary.allocatedStats]);

  // Combine learned skills and equipment-socketed skills
  // Fix: Added explicit type cast to (Equipment | null)[] to resolve 'unknown' property access errors for socketedSkillId (lines 59, 60)
  const allAvailableSkills = useMemo(() => {
      const learned = (mercenary.skillIds || []).map(id => ({ id, source: 'LEARNED' as const }));
      
      const fromGear = (Object.values(mercenary.equipment) as (Equipment | null)[]).reduce<{ id: string, source: 'GEAR' }[]>((acc, item) => {
          if (item?.socketedSkillId) {
              acc.push({ id: item.socketedSkillId, source: 'GEAR' as const });
          }
          return acc;
      }, []);

      return [...learned, ...fromGear];
  }, [mercenary.skillIds, mercenary.equipment]);

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
                    <SfxButton
                      onClick={() => onModifyStat(stat.key, 1)}
                      disabled={pendingPoints <= 0}
                      className="w-full h-4 md:h-7 bg-stone-800 hover:bg-amber-600 text-stone-500 hover:text-white rounded transition-all disabled:opacity-20 flex items-center justify-center shadow-sm"
                    >
                      <Plus className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                    </SfxButton>
                    <SfxButton
                      onClick={() => onModifyStat(stat.key, -1)}
                      disabled={pendingAllocated[stat.key] <= mercenary.allocatedStats[stat.key]}
                      className="w-full h-4 md:h-7 bg-stone-800 hover:bg-red-900 text-stone-500 hover:text-white rounded transition-all disabled:opacity-20 flex items-center justify-center shadow-sm"
                    >
                      <Minus className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                    </SfxButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isModified && !isReadOnly && (
          <div className="flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
              <SfxButton 
                sfx="switch"
                onClick={onReset}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 rounded-xl border border-stone-700 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                  <RotateCcw className="w-3.5 h-3.5" /> Discard
              </SfxButton>
              <SfxButton 
                onClick={onSave}
                className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl border-b-4 border-amber-800 shadow-xl transition-all active:translate-y-0.5 text-[10px] font-black uppercase tracking-widest"
              >
                  <Save className="w-3.5 h-3.5" /> Save Attributes
              </SfxButton>
          </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 shrink-0">
        <div className="bg-stone-950/40 p-2 md:p-3 rounded-xl border border-white/5 flex items-center gap-2 md:gap-3 shadow-sm">
          <div className="p-1.5 md:p-2 bg-red-950/40 rounded-lg text-red-500 border border-red-900/30">
            <Heart className="w-3.5 h-3.5 md:w-5 md:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[7px] md:text-[10px] text-stone-500 font-black mb-0.5 md:mb-1">
              <span>HP</span>
              <span className="text-stone-300 font-mono">
                {Math.floor(mercenary.currentHp)}/{finalStats.maxHp}
              </span>
            </div>
            <div className="w-full h-1 md:h-1.5 bg-stone-900 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${hpPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-stone-950/40 p-2 md:p-3 rounded-xl border border-white/5 flex items-center gap-2 md:gap-3 shadow-sm">
          <div className="p-1.5 md:p-2 bg-blue-950/40 rounded-lg text-blue-400 border border-blue-900/30">
            <Activity className="w-3.5 h-3.5 md:w-5 md:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[7px] md:text-[10px] text-stone-500 font-black mb-0.5 md:mb-1">
              <span>MP</span>
              <span className="text-stone-300 font-mono">
                {Math.floor(mercenary.currentMp)}/{finalStats.maxMp}
              </span>
            </div>
            <div className="w-full h-1 md:h-1.5 bg-stone-900 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${mpPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-stone-950/40 p-2 md:p-3 rounded-xl border border-white/5 flex items-center gap-2 md:gap-3 shadow-sm">
          <div className="p-1.5 md:p-2 bg-stone-800 rounded-lg text-stone-100 border border-white/10">
            <Zap className={`w-3.5 h-3.5 md:w-5 md:h-5 ${staminaPercent < 20 ? 'animate-pulse text-red-500' : 'text-stone-100'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[7px] md:text-[10px] text-stone-500 font-black mb-0.5 md:mb-1">
              <span>STAMINA</span>
              <span className="text-stone-300 font-mono">
                {Math.floor(mercenary.expeditionEnergy || 0)}/100
              </span>
            </div>
            <div className="w-full h-1 md:h-1.5 bg-stone-900 rounded-full overflow-hidden shadow-inner">
              <div className={`h-full transition-all duration-500 ${staminaPercent < 20 ? 'bg-red-500 animate-pulse' : 'bg-stone-100'}`} style={{ width: `${staminaPercent}%` }} />
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

        {allAvailableSkills.length > 0 ? (
          <div className="space-y-1.5 md:space-y-3">
            {allAvailableSkills.map((skillRef, idx) => {
              const skill = SKILLS[skillRef.id];
              if (!skill) return null;
              const isGearSkill = skillRef.source === 'GEAR';

              return (
                <div
                  key={`${skillRef.id}-${idx}`}
                  className={`bg-stone-950/40 border rounded-xl p-3 md:p-4 flex justify-between items-center gap-3 hover:border-amber-900/40 transition-all ${isGearSkill ? 'border-indigo-500/30 bg-indigo-900/10' : 'border-stone-800'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg border shrink-0 ${isGearSkill ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-400' : 'bg-amber-900/15 border-amber-600/20 text-amber-500'}`}>
                      {isGearSkill ? <Wrench className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Sword className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                          <h5 className="text-[10px] md:text-xs font-black text-stone-200 uppercase truncate">{skill.name}</h5>
                          {isGearSkill && <span className="text-[6px] md:text-[8px] font-black bg-indigo-600 text-white px-1 py-0.5 rounded leading-none uppercase">Gear</span>}
                      </div>
                      <p className="text-[8px] md:text-[9px] text-stone-500 italic leading-tight line-clamp-1">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                     <span className="text-[7px] md:text-[8px] font-black text-amber-500 uppercase tracking-tighter">
                        {Math.round((skill.multiplier || 0) * 100)}% {skill.damageType || 'EFF'}
                      </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 md:py-6 text-center border-2 border-dashed border-stone-800 rounded-xl text-stone-600 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
            No available skills
          </div>
        )}
      </div>
    </div>
  );
};

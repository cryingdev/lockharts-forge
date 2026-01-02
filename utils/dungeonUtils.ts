
import { Mercenary } from '../models/Mercenary';
import { mergePrimaryStats, calculateDerivedStats, applyEquipmentBonuses } from '../models/Stats';
import { calculateCombatPower } from './combatLogic';

export const calculateMercenaryPower = (merc: Mercenary): number => {
    // 1. Merge stats
    const primary = mergePrimaryStats(merc.stats, merc.allocatedStats);
    
    // 2. Base Derived
    const base = calculateDerivedStats(primary, merc.level);
    
    // 3. Apply Equipment
    const eqStatsList = Object.values(merc.equipment).map(e => e?.stats).filter(Boolean);
    const finalDerived = applyEquipmentBonuses(base, eqStatsList as any);
    
    // 4. Determine attack type based on highest stat
    const attackType = primary.int > primary.str ? 'MAGICAL' : 'PHYSICAL';
    
    return calculateCombatPower(finalDerived, attackType);
};

export const calculatePartyPower = (mercs: Mercenary[]): number => {
    return mercs.reduce((sum, m) => sum + calculateMercenaryPower(m), 0);
};

export const formatDuration = (ms: number): string => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

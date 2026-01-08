import { Mercenary } from '../models/Mercenary';
import { mergePrimaryStats, calculateDerivedStats, applyEquipmentBonuses } from '../models/Stats';
import { calculateCombatPower } from './combatLogic';

/**
 * Calculates the individual Combat Power (CP) of a mercenary,
 * incorporating their base stats, allocated points, and equipped gear.
 */
export const calculateMercenaryPower = (merc: Mercenary): number => {
    // 1. Merge stats (Base + Level up points)
    const primary = mergePrimaryStats(merc.stats, merc.allocatedStats);
    
    // 2. Calculate Base Derived Stats (HP, MP, Attack etc.)
    const base = calculateDerivedStats(primary, merc.level);
    
    // 3. Apply Equipment Bonuses
    const eqStatsList = Object.values(merc.equipment).map(e => e?.stats).filter(Boolean);
    const finalDerived = applyEquipmentBonuses(base, eqStatsList as any);
    
    // 4. Determine attack type based on the dominant primary stat
    const attackType = primary.int > primary.str ? 'MAGICAL' : 'PHYSICAL';
    
    // 5. Calculate CP using the job-specific efficiency logic
    return calculateCombatPower(finalDerived, merc.job, attackType);
};

/**
 * Calculates the combined power of a full party.
 */
export const calculatePartyPower = (mercs: Mercenary[]): number => {
    return mercs.reduce((sum, m) => sum + calculateMercenaryPower(m), 0);
};
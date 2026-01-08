import { DerivedStats, mergePrimaryStats, calculateDerivedStats, applyEquipmentBonuses } from '../models/Stats';
import { JobClass, JOB_EFFICIENCY } from '../models/JobClass';
import { Mercenary } from '../models/Mercenary';

export interface CombatResult {
  isHit: boolean;
  isCrit: boolean;
  damage: number;
  hitChance: number;
  efficiency: number;
}

// Standard target for DPS measurement (Average mid-game enemy)
const STANDARD_DEFENSE = 150;
const STANDARD_EVASION = 50;

/**
 * Optimized combat result calculation.
 */
export const calculateCombatResult = (
  attacker: DerivedStats,
  defender: DerivedStats,
  attackerJob: JobClass,
  type: 'PHYSICAL' | 'MAGICAL' = 'PHYSICAL'
): CombatResult => {
  const acc = attacker.accuracy;
  const eva = defender.evasion;
  
  // Step 0: Hit Probability Check
  // Clamped to 90-100% range as per previous high-efficiency standard
  const rawHitChance = (acc / (acc + eva * 0.7)) * 100;
  const hitChance = rawHitChance > 100 ? 100 : (rawHitChance < 90 ? 90 : rawHitChance);
  
  if (Math.random() * 100 > hitChance) {
    return { isHit: false, isCrit: false, damage: 0, hitChance, efficiency: 0 };
  }

  // Step 1: Attacker Efficiency Transformation
  const baseEff = type === 'PHYSICAL' ? JOB_EFFICIENCY[attackerJob].physical : JOB_EFFICIENCY[attackerJob].magical;
  // Efficiency is a random value between [baseEff, 100]
  const transformedEfficiency = (Math.random() * (100 - baseEff) + baseEff) / 100;

  // Step 2: Multiply attack by efficiency
  const rawBaseAtk = type === 'PHYSICAL' ? attacker.physicalAttack : attacker.magicalAttack;
  const effectiveAtk = rawBaseAtk * transformedEfficiency;

  // Step 3: Defense reduction and Critical Hit
  const reduction = type === 'PHYSICAL' ? defender.physicalReduction : defender.magicalReduction;
  const baseDamageAfterDef = effectiveAtk * (1 - reduction);
  
  const isCrit = Math.random() * 100 <= attacker.critChance;
  const critMult = isCrit ? attacker.critDamage * 0.01 : 1.0;

  const damage = Math.max(1, Math.round(baseDamageAfterDef * critMult));

  return { isHit: true, isCrit, damage, hitChance, efficiency: transformedEfficiency * 100 };
};

/**
 * High-performance lightweight combat calculation for bulk simulations.
 */
export const calculateFastDmg = (
  atkValue: number,
  reduction: number,
  critChance: number,
  critDamage: number,
  hitChance: number,
  baseEfficiency: number
): number => {
  // Step 0: Hit Check
  if (Math.random() * 100 > hitChance) return 0;
  
  // Step 1 & 2: Efficiency and Transformed Atk
  const eff = (Math.random() * (100 - baseEfficiency) + baseEfficiency) / 100;
  const effectiveAtk = atkValue * eff;
  
  // Step 3: Def and Crit
  const isCrit = Math.random() * 100 <= critChance;
  const dmg = effectiveAtk * (1 - reduction) * (isCrit ? critDamage * 0.01 : 1.0);
  
  return dmg < 1 ? 1 : dmg;
};

/**
 * Calculates theoretical Expected Damage Per Second (DPS) against a standard target.
 */
export const calculateExpectedDPS = (stats: DerivedStats, job: JobClass, attackType: 'PHYSICAL' | 'MAGICAL' = 'PHYSICAL'): number => {
    const critBonusMult = (stats.critChance * 0.01) * ((stats.critDamage * 0.01) - 1);
    const avgCritMult = 1 + critBonusMult;

    const baseEff = attackType === 'PHYSICAL' ? JOB_EFFICIENCY[job].physical : JOB_EFFICIENCY[job].magical;
    const avgEfficiency = (baseEff + 100) / 200; // Mean of random(base, 100) / 100

    const reduction = STANDARD_DEFENSE / (STANDARD_DEFENSE + 150);
    const rawAtk = attackType === 'PHYSICAL' ? stats.physicalAttack : stats.magicalAttack;
    
    // Base damage incorporating avg efficiency and avg crit
    const expectedDmgPerHit = (rawAtk * avgEfficiency) * (1 - reduction) * avgCritMult;

    const rawHitChance = (stats.accuracy / (stats.accuracy + STANDARD_EVASION * 0.7)) * 100;
    const hitChance = (rawHitChance > 100 ? 100 : (rawHitChance < 90 ? 90 : rawHitChance)) * 0.01;

    const actionsPerSecond = (stats.speed * 0.001) * 25;

    return Math.round(expectedDmgPerHit * hitChance * actionsPerSecond);
};

/**
 * Calculates overall Combat Power (CP).
 */
export const calculateCombatPower = (stats: DerivedStats, job: JobClass, attackType: 'PHYSICAL' | 'MAGICAL' = 'PHYSICAL'): number => {
    const dps = calculateExpectedDPS(stats, job, attackType);
    const offensiveScore = dps * 12;

    const avgReduction = (stats.physicalReduction + stats.magicalReduction) * 0.5;
    const effectiveHp = stats.maxHp / Math.max(0.1, (1 - avgReduction));
    
    const evasionBonus = 1 + (stats.evasion * 0.005);
    const defensiveScore = (effectiveHp * evasionBonus) * 0.25;

    return Math.round((offensiveScore + defensiveScore) * 0.1);
};

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

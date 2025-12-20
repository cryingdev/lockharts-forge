
import { DerivedStats } from '../models/Stats';
import { DERIVED_CONFIG } from '../config/derived-stats-config';

export interface CombatResult {
  isHit: boolean;
  isCrit: boolean;
  damage: number;
  hitChance: number;
}

// Standard target for DPS measurement (Average mid-game enemy)
const STANDARD_DEFENSE = 150;
const STANDARD_EVASION = 50;

/**
 * Calculates the outcome of a single combat exchange.
 */
export const calculateCombatResult = (
  attacker: DerivedStats,
  defender: DerivedStats,
  type: 'PHYSICAL' | 'MAGICAL' = 'PHYSICAL'
): CombatResult => {
  const rawHitChance = (attacker.accuracy / (attacker.accuracy + defender.evasion * DERIVED_CONFIG.HIT_EVA_WEIGHT)) * 100;
  const hitChance = Math.round(Math.min(95, Math.max(5, rawHitChance)));
  
  const hitRoll = Math.random() * 100;

  if (hitRoll > hitChance) {
    return { isHit: false, isCrit: false, damage: 0, hitChance };
  }

  const critRoll = Math.random() * 100;
  const isCrit = critRoll <= attacker.critChance;
  const critMult = isCrit ? attacker.critDamage / 100 : 1.0;

  let baseDamage = 0;
  if (type === 'PHYSICAL') {
    baseDamage = attacker.physicalAttack * (1 - defender.physicalReduction);
  } else {
    baseDamage = attacker.magicalAttack * (1 - defender.magicalReduction);
  }

  const damage = Math.max(1, Math.round(baseDamage * critMult));

  return {
    isHit: true,
    isCrit,
    damage,
    hitChance,
  };
};

/**
 * Calculates theoretical Expected Damage Per Second (DPS) against a standard target.
 * Formula: [Actions Per Second] * [Hit Chance] * [Avg Damage Incl. Crits]
 */
export const calculateExpectedDPS = (stats: DerivedStats, attackType: 'PHYSICAL' | 'MAGICAL' = 'PHYSICAL'): number => {
    const critBonusMult = (stats.critChance / 100) * ((stats.critDamage / 100) - 1);
    const avgDmgMult = 1 + critBonusMult;

    const reduction = STANDARD_DEFENSE / (STANDARD_DEFENSE + DERIVED_CONFIG.DEF_REDUCTION_CONSTANT);
    const rawAtk = attackType === 'PHYSICAL' ? stats.physicalAttack : stats.magicalAttack;
    const baseDmg = rawAtk * (1 - reduction);
    const expectedDmgPerHit = baseDmg * avgDmgMult;

    const rawHitChance = (stats.accuracy / (stats.accuracy + STANDARD_EVASION * DERIVED_CONFIG.HIT_EVA_WEIGHT)) * 100;
    const hitChance = Math.min(95, Math.max(5, rawHitChance)) / 100;

    const actionsPerSecond = (stats.speed / 1000) * 25;

    return Math.round(expectedDmgPerHit * hitChance * actionsPerSecond);
};

/**
 * Calculates overall Combat Power (CP) of a mercenary.
 * Combines offensive potential (DPS) and defensive longevity (Effective HP).
 */
export const calculateCombatPower = (stats: DerivedStats, attackType: 'PHYSICAL' | 'MAGICAL' = 'PHYSICAL'): number => {
    // 1. Offensive Score
    const dps = calculateExpectedDPS(stats, attackType);
    const offensiveScore = dps * 12; // Weighting DPS for tactical impact

    // 2. Defensive Score (Effective HP)
    // EHP = HP / (1 - Damage Reduction)
    const avgReduction = (stats.physicalReduction + stats.magicalReduction) / 2;
    const effectiveHp = stats.maxHp / Math.max(0.1, (1 - avgReduction));
    
    // Add Evasion weight (Simple bonus: 1% evasion = 1% more EHP potential)
    const evasionBonus = 1 + (stats.evasion / 200);
    const defensiveScore = (effectiveHp * evasionBonus) / 4;

    return Math.round((offensiveScore + defensiveScore) / 10);
};

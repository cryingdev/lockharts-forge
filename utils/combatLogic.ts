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
 * Optimized combat result calculation.
 */
export const calculateCombatResult = (
  attacker: DerivedStats,
  defender: DerivedStats,
  type: 'PHYSICAL' | 'MAGICAL' = 'PHYSICAL'
): CombatResult => {
  const acc = attacker.accuracy;
  const eva = defender.evasion;
  const rawHitChance = (acc / (acc + eva * 0.7)) * 100;
  const hitChance = rawHitChance > 95 ? 95 : (rawHitChance < 5 ? 5 : rawHitChance);
  
  if (Math.random() * 100 > hitChance) {
    return { isHit: false, isCrit: false, damage: 0, hitChance };
  }

  const isCrit = Math.random() * 100 <= attacker.critChance;
  const critMult = isCrit ? attacker.critDamage * 0.01 : 1.0;

  const baseAtk = type === 'PHYSICAL' ? attacker.physicalAttack : attacker.magicalAttack;
  const reduction = type === 'PHYSICAL' ? defender.physicalReduction : defender.magicalReduction;
  
  const baseDamage = baseAtk * (1 - reduction);
  const damage = Math.max(1, Math.round(baseDamage * critMult));

  return { isHit: true, isCrit, damage, hitChance };
};

/**
 * High-performance lightweight combat calculation for bulk simulations.
 * Minimizes object creation and property access overhead.
 */
export const calculateFastDmg = (
  atkValue: number,
  reduction: number,
  critChance: number,
  critDamage: number,
  hitChance: number
): number => {
  if (Math.random() * 100 > hitChance) return 0;
  const isCrit = Math.random() * 100 <= critChance;
  const dmg = atkValue * (1 - reduction) * (isCrit ? critDamage * 0.01 : 1.0);
  return dmg < 1 ? 1 : dmg;
};

/**
 * Calculates theoretical Expected Damage Per Second (DPS) against a standard target.
 */
export const calculateExpectedDPS = (stats: DerivedStats, attackType: 'PHYSICAL' | 'MAGICAL' = 'PHYSICAL'): number => {
    const critBonusMult = (stats.critChance * 0.01) * ((stats.critDamage * 0.01) - 1);
    const avgDmgMult = 1 + critBonusMult;

    const reduction = STANDARD_DEFENSE / (STANDARD_DEFENSE + 150);
    const rawAtk = attackType === 'PHYSICAL' ? stats.physicalAttack : stats.magicalAttack;
    const baseDmg = rawAtk * (1 - reduction);
    const expectedDmgPerHit = baseDmg * avgDmgMult;

    const rawHitChance = (stats.accuracy / (stats.accuracy + STANDARD_EVASION * 0.7)) * 100;
    const hitChance = (rawHitChance > 95 ? 95 : (rawHitChance < 5 ? 5 : rawHitChance)) * 0.01;

    const actionsPerSecond = (stats.speed * 0.001) * 25;

    return Math.round(expectedDmgPerHit * hitChance * actionsPerSecond);
};

/**
 * Calculates overall Combat Power (CP).
 */
export const calculateCombatPower = (stats: DerivedStats, attackType: 'PHYSICAL' | 'MAGICAL' = 'PHYSICAL'): number => {
    const dps = calculateExpectedDPS(stats, attackType);
    const offensiveScore = dps * 12;

    const avgReduction = (stats.physicalReduction + stats.magicalReduction) * 0.5;
    const effectiveHp = stats.maxHp / Math.max(0.1, (1 - avgReduction));
    
    const evasionBonus = 1 + (stats.evasion * 0.005);
    const defensiveScore = (effectiveHp * evasionBonus) * 0.25;

    return Math.round((offensiveScore + defensiveScore) * 0.1);
};
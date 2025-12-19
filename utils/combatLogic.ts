
import { DerivedStats } from '../models/Stats';
import { DERIVED_CONFIG } from '../config/derived-stats-config';

export interface CombatResult {
  isHit: boolean;
  isCrit: boolean;
  damage: number;
  hitChance: number;
}

/**
 * Calculates the outcome of a single combat exchange.
 * Uses non-linear formulas for both damage reduction and hit probability.
 */
export const calculateCombatResult = (
  attacker: DerivedStats,
  defender: DerivedStats,
  type: 'PHYSICAL' | 'MAGICAL' = 'PHYSICAL'
): CombatResult => {
  // 1. Accuracy vs Evasion Check (Non-linear curve)
  // Formula: (Acc / (Acc + Eva * Weight)) * 100
  // This ensures that even with massive evasion, a minimal hit chance remains,
  // and accuracy gains have diminishing returns.
  const rawHitChance = (attacker.accuracy / (attacker.accuracy + defender.evasion * DERIVED_CONFIG.HIT_EVA_WEIGHT)) * 100;
  
  // Apply absolute clamps [5% - 95%] to prevent guaranteed outcomes
  const hitChance = Math.round(Math.min(95, Math.max(5, rawHitChance)));
  
  const hitRoll = Math.random() * 100;

  if (hitRoll > hitChance) {
    return { isHit: false, isCrit: false, damage: 0, hitChance };
  }

  // 2. Critical Check
  const critRoll = Math.random() * 100;
  const isCrit = critRoll <= attacker.critChance;
  const critMult = isCrit ? attacker.critDamage / 100 : 1.0;

  // 3. Damage Calculation
  let baseDamage = 0;
  if (type === 'PHYSICAL') {
    // Physical Damage = Attacker P.ATK * (1 - Defender P.Reduction)
    baseDamage = attacker.physicalAttack * (1 - defender.physicalReduction);
  } else {
    // Magical Damage = Attacker M.ATK * (1 - Defender M.Reduction)
    baseDamage = attacker.magicalAttack * (1 - defender.magicalReduction);
  }

  // Final Damage calculation (minimum 1)
  const damage = Math.max(1, Math.round(baseDamage * critMult));

  return {
    isHit: true,
    isCrit,
    damage,
    hitChance,
  };
};

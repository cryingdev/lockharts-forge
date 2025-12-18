
import { EquipmentStats } from './Equipment';

export interface BaseStats {
  strength: number;    // Influences Physical Attack & HP
  vitality: number;    // Influences Max HP & Defense
  dexterity: number;   // Influences Crit & Accuracy
  intelligence: number;// Influences Magic Attack & MP
  luck: number;        // Influences Loot & Crit
}

export interface DerivedStats {
  maxHp: number;
  maxMp: number;
  physicalAttack: number;
  physicalDefense: number;
  magicalAttack: number;
  magicalDefense: number;
  // New Stats
  critRate: number;      // Percentage (0-100)
  dropRateBonus: number; // Percentage increase (e.g. 10 = +10% drop rate)
}

const round = (n: number) => Math.round(n * 10) / 10; // Round to 1 decimal

/**
 * Calculates detailed combat stats based on attributes and level.
 */
export const calculateDerivedStats = (base: BaseStats, level: number): DerivedStats => {
  const { strength: STR, vitality: VIT, dexterity: DEX, intelligence: INT, luck: LUK } = base;

  const maxHp = Math.round(50 + (VIT * 12) + (level * 8));
  const maxMp = Math.round(20 + (INT * 10) + (level * 5));

  const physicalAttack = Math.round(5 + (STR * 2.5) + (DEX * 1.0) + (level * 1.0));
  const physicalDefense = Math.round(3 + (VIT * 2.0) + (STR * 0.8) + (level * 0.8));

  const magicalAttack = Math.round(5 + (INT * 2.8) + (level * 1.0) + (LUK * 0.3));
  const magicalDefense = Math.round(3 + (INT * 1.4) + (VIT * 1.2) + (level * 0.8));

  // --- New Logic for Luck & Crit ---
  // Crit Rate: Base 1% + (DEX * 0.2) + (LUK * 0.3)
  const critRate = round(1 + (DEX * 0.2) + (LUK * 0.3));
  
  // Drop Rate Bonus: (LUK * 0.5)%
  const dropRateBonus = round(LUK * 0.5);

  return {
    maxHp,
    maxMp,
    physicalAttack,
    physicalDefense,
    magicalAttack,
    magicalDefense,
    critRate,
    dropRateBonus
  };
};

/**
 * Adds equipment bonuses to the base derived stats.
 */
export const applyEquipmentBonuses = (
  base: DerivedStats,
  equipmentStatsList: Array<EquipmentStats | undefined | null>
): DerivedStats => {
  const bonus = equipmentStatsList.reduce(
    (acc, s) => {
      if (!s) return acc;
      acc.physicalAttack += s.physicalAttack ?? 0;
      acc.physicalDefense += s.physicalDefense ?? 0;
      acc.magicalAttack += s.magicalAttack ?? 0;
      acc.magicalDefense += s.magicalDefense ?? 0;
      return acc;
    },
    { physicalAttack: 0, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  );

  return {
    ...base,
    physicalAttack: base.physicalAttack + bonus.physicalAttack,
    physicalDefense: base.physicalDefense + bonus.physicalDefense,
    magicalAttack: base.magicalAttack + bonus.magicalAttack,
    magicalDefense: base.magicalDefense + bonus.magicalDefense,
    // Equipment currently doesn't add flat Crit/Drop, so pass base through
    // Future update: Add bonus.critRate if added to EquipmentStats
    critRate: base.critRate, 
    dropRateBonus: base.dropRateBonus
  };
};

// --- Backward Compatibility Wrappers ---

export const calculateMaxHp = (stats: BaseStats, level: number): number => {
  return calculateDerivedStats(stats, level).maxHp;
};

export const calculateMaxMp = (stats: BaseStats, level: number): number => {
  return calculateDerivedStats(stats, level).maxMp;
};

export const calculateCombatPower = (stats: BaseStats): number => {
  // Rough estimate based on base stats sum
  return stats.strength + stats.vitality + stats.dexterity + stats.intelligence + stats.luck;
};

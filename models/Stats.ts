export interface BaseStats {
  strength: number;    // Influences Physical Attack & HP
  vitality: number;    // Influences Max HP & Defense
  dexterity: number;   // Influences Crit & Accuracy
  intelligence: number;// Influences Magic Attack & MP
  luck: number;        // Influences Loot & Crit
}

export const calculateMaxHp = (stats: BaseStats, level: number): number => {
  // Formula: (VIT * 10) + (STR * 2) + (Level * 10)
  return Math.floor((stats.vitality * 10) + (stats.strength * 2) + (level * 10));
};

export const calculateMaxMp = (stats: BaseStats, level: number): number => {
  // Formula: (INT * 10) + (Level * 5)
  return Math.floor((stats.intelligence * 10) + (level * 5));
};

export const calculateCombatPower = (stats: BaseStats): number => {
  return stats.strength + stats.vitality + stats.dexterity + stats.intelligence + stats.luck;
};

import { EquipmentStats } from './Equipment';
import { DERIVED_CONFIG } from '../config/derived-stats-config';

export interface PrimaryStats {
  str: number;    // Strength
  vit: number;    // Vitality
  dex: number;    // Dexterity
  int: number;    // Intelligence
  luk: number;    // Luck
}

export interface DerivedStats {
  maxHp: number;
  maxMp: number;

  physicalAttack: number;
  physicalDefense: number;
  physicalReduction: number; // 0 to 1
  magicalAttack: number;
  magicalDefense: number;
  magicalReduction: number;  // 0 to 1

  critChance: number;     // %
  critDamage: number;     // % (e.g. 150 = 1.5x)
  accuracy: number;       // Accuracy value
  evasion: number;        // Evasion value
  speed: number;          // Action order/Turn gauge
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Merges base character stats, level-up allocated stats, and optional temporary bonuses.
 */
export const mergePrimaryStats = (
  base: PrimaryStats,
  allocated: PrimaryStats,
  bonus?: Partial<PrimaryStats>
): PrimaryStats => ({
  str: base.str + allocated.str + (bonus?.str ?? 0),
  vit: base.vit + allocated.vit + (bonus?.vit ?? 0),
  dex: base.dex + allocated.dex + (bonus?.dex ?? 0),
  int: base.int + allocated.int + (bonus?.int ?? 0),
  luk: base.luk + allocated.luk + (bonus?.luk ?? 0),
});

/**
 * Calculates detailed combat stats based on attributes and level.
 */
export const calculateDerivedStats = (primary: PrimaryStats, level: number): DerivedStats => {
  const c = DERIVED_CONFIG;

  const maxHp = Math.round(c.HP_BASE + level * c.HP_PER_LEVEL + primary.vit * c.HP_PER_VIT);
  const maxMp = Math.round(c.MP_BASE + level * c.MP_PER_LEVEL + primary.int * c.MP_PER_INT);

  // Updated Physical Attack to include linear DEX contribution
  const physicalAttack = Math.round(
    level * c.ATK_PER_LEVEL + 
    primary.str * c.ATK_PER_STR + 
    primary.dex * c.ATK_PER_DEX
  );

  const physicalDefense = Math.round(level * c.DEF_PER_LEVEL + primary.vit * c.DEF_PER_VIT);

  const magicalAttack = Math.round(level * c.MATK_PER_LEVEL + primary.int * c.MATK_PER_INT);
  const magicalDefense = Math.round(
    level * c.MDEF_PER_LEVEL + primary.int * c.MDEF_PER_INT + primary.vit * c.MDEF_PER_VIT
  );

  const physicalReduction = physicalDefense / (physicalDefense + c.DEF_REDUCTION_CONSTANT);
  const magicalReduction = magicalDefense / (magicalDefense + c.DEF_REDUCTION_CONSTANT);

  // Curved Crit Chance Calculation: Base + (Multiplier * LUK^Exponent) + (DEX * Multiplier)
  const critChanceFromLuck = Math.pow(primary.luk, (c as any).CRIT_LUK_EXPONENT || 0.85) * c.CRIT_PER_LUK;
  const critChance = clamp(
    c.CRIT_BASE + critChanceFromLuck + primary.dex * c.CRIT_PER_DEX,
    0,
    c.CRIT_CAP
  );

  const critDamage = clamp(
    c.CRITDMG_BASE + primary.luk * c.CRITDMG_PER_LUK,
    c.CRITDMG_BASE,
    c.CRITDMG_CAP
  );

  // Accuracy and Speed reverted to linear scaling
  const accuracy = Math.round(
    c.ACC_BASE + 
    (primary.dex * c.ACC_PER_DEX) + 
    (primary.luk * c.ACC_PER_LUK)
  );

  const speed = Math.round(
    c.SPD_BASE + 
    (primary.dex * c.SPD_PER_DEX)
  );

  const evasion = Math.round(c.EVA_BASE + primary.dex * c.EVA_PER_DEX + primary.luk * c.EVA_PER_LUK);

  return {
    maxHp,
    maxMp,
    physicalAttack,
    physicalDefense,
    physicalReduction,
    magicalAttack,
    magicalDefense,
    magicalReduction,
    critChance: Math.round(critChance * 100) / 100,
    critDamage: Math.round(critDamage * 100) / 100,
    accuracy,
    evasion,
    speed,
  };
};

/**
 * Adds equipment bonuses to the base derived stats.
 */
export const applyEquipmentBonuses = (
  base: DerivedStats,
  equipmentStatsList: Array<EquipmentStats | undefined | null>
): DerivedStats => {
  const c = DERIVED_CONFIG;
  
  interface BonusTotals {
    physicalAttack: number;
    physicalDefense: number;
    magicalAttack: number;
    magicalDefense: number;
  }

  const initialBonus: BonusTotals = { 
    physicalAttack: 0, 
    physicalDefense: 0, 
    magicalAttack: 0, 
    magicalDefense: 0 
  };

  const bonus = equipmentStatsList.reduce<BonusTotals>((acc, s) => {
    if (!s) return acc;
    return {
      physicalAttack: acc.physicalAttack + (s.physicalAttack ?? 0),
      physicalDefense: acc.physicalDefense + (s.physicalDefense ?? 0),
      magicalAttack: acc.magicalAttack + (s.magicalAttack ?? 0),
      magicalDefense: acc.magicalDefense + (s.magicalDefense ?? 0),
    };
  }, initialBonus);

  const finalPhysDef = base.physicalDefense + bonus.physicalDefense;
  const finalMagDef = base.magicalDefense + bonus.magicalDefense;

  return {
    ...base,
    physicalAttack: base.physicalAttack + bonus.physicalAttack,
    physicalDefense: finalPhysDef,
    physicalReduction: finalPhysDef / (finalPhysDef + c.DEF_REDUCTION_CONSTANT),
    magicalAttack: base.magicalAttack + bonus.magicalAttack,
    magicalDefense: finalMagDef,
    magicalReduction: finalMagDef / (finalMagDef + c.DEF_REDUCTION_CONSTANT),
    critChance: base.critChance,
    critDamage: base.critDamage,
    accuracy: base.accuracy,
    evasion: base.evasion,
    speed: base.speed
  };
};

export const calculateMaxHp = (stats: PrimaryStats, level: number): number => {
  return calculateDerivedStats(stats, level).maxHp;
};

export const calculateMaxMp = (stats: PrimaryStats, level: number): number => {
  return calculateDerivedStats(stats, level).maxMp;
};

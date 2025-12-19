
/**
 * DERIVED_STATS_CONFIG
 * 전투 공식 및 캐릭터 성장에 필요한 파생 스탯 배율을 정의합니다.
 */
export const DERIVED_CONFIG = {
  HP_BASE: 50,
  HP_PER_LEVEL: 10,
  HP_PER_VIT: 16,

  MP_BASE: 20,
  MP_PER_LEVEL: 6,
  MP_PER_INT: 8,

  ATK_PER_LEVEL: 1.5,
  ATK_PER_STR: 1.8,
  ATK_PER_DEX: 0.5,        // DEX의 물리 공격력 선형 기여도

  DEF_PER_LEVEL: 0.8,
  DEF_PER_VIT: 2.4,

  MATK_PER_LEVEL: 1.0,
  MATK_PER_INT: 2.5,

  MDEF_PER_LEVEL: 0.5,
  MDEF_PER_INT: 1.0,
  MDEF_PER_VIT: 1.5,

  DEF_REDUCTION_CONSTANT: 150, 

  CRIT_BASE: 5,
  CRIT_PER_LUK: 0.5,
  CRIT_PER_DEX: 0.25,
  CRIT_CAP: 60,

  CRITDMG_BASE: 150,
  CRITDMG_PER_LUK: 0.5,
  CRITDMG_CAP: 250,

  ACC_BASE: 70,
  ACC_PER_LUK: 0.5,
  ACC_PER_DEX: 1.2,        // DEX의 명중 선형 기여도

  EVA_BASE: 5,
  EVA_PER_DEX: 1.2,
  EVA_PER_LUK: 0.3,

  HIT_EVA_WEIGHT: 0.7,

  SPD_BASE: 100,
  SPD_PER_DEX: 2.0,        // DEX의 속도 선형 기여도
} as const;

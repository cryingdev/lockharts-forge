
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
  ATK_PER_STR: 2.5,
  ATK_PER_DEX: 0.20,        // DEX의 물리 공격력 선형 기여도

  DEF_PER_LEVEL: 0.8,
  DEF_PER_VIT: 2.2,

  MATK_PER_LEVEL: 1.0,
  MATK_PER_INT: 2.5,

  MDEF_PER_LEVEL: 0.5,
  MDEF_PER_INT: 1.0,
  MDEF_PER_VIT: 1.4,

  DEF_REDUCTION_CONSTANT: 150, 

  CRIT_BASE: 5,
  CRIT_PER_LUK: 2.0,       // 로그형 성장을 위한 계수 조정 (기존 0.8)
  CRIT_LUK_EXPONENT: 0.85, // 로그/파워 곡선 지수 (0.85는 72포인트에서 약 80%에 도달하게 함)
  CRIT_PER_DEX: 0.25,
  CRIT_CAP: 80,            

  CRITDMG_BASE: 150,
  CRITDMG_PER_LUK: 1.5,    
  CRITDMG_CAP: 350,        

  ACC_BASE: 70,
  ACC_PER_LUK: 1.0,        
  ACC_PER_DEX: 1.2,        

  EVA_BASE: 5,
  EVA_PER_DEX: 1.2,
  EVA_PER_LUK: 0.8,        

  HIT_EVA_WEIGHT: 0.7,

  SPD_BASE: 100,
  SPD_PER_DEX: 2.0,        
} as const;

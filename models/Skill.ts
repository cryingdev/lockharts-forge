import { JobClass } from './JobClass';
import { PrimaryStats } from './Stats';

export type DamageType = 'PHYSICAL' | 'MAGICAL' | 'PURE';
export type SkillType = 'ACTIVE' | 'PASSIVE';
export type TargetType = 'SINGLE' | 'AREA' | 'SELF' | 'ALL_ENEMIES' | 'ALL_ALLIES';
export type SkillTag = 'DAMAGE' | 'AOE' | 'CC' | 'BUFF' | 'DEBUFF' | 'HEAL' | 'SHIELD' | 'MOBILITY' | 'UTILITY';

/**
 * Skill
 * 스킬의 정적 데이터와 전투 로직을 정의하는 인터페이스입니다.
 */
export interface Skill {
  id: string;
  name: string;
  job: JobClass[];      // 해당 스킬을 보유할 수 있는 직업군
  type: SkillType;
  targetType: TargetType;

  // 비용 및 쿨다운 (Active 전용)
  mpCost?: number;
  castMs?: number;      // 시전 시간 (캐스팅 게이지 연출용)
  recoveryMs?: number;  // 스킬 사용 후 다음 행동까지의 지연 시간
  cooldownMs?: number;  // 재사용 대기 시간
  
  // 수치 및 효과 로직
  damageType?: DamageType;
  multiplier?: number;   // 기본 공격력의 배율 (예: 1.25 = 125%)
  durationMs?: number;   // 버프, 디버프, CC기의 지속 시간
  
  // 스케일링 정보
  scalingStat?: keyof PrimaryStats; // 주력 보정 스탯 (STR, INT 등)

  // 조건 및 시각 정보
  minLevel: number;
  tags: SkillTag[];
  icon?: string;        // UI에 표시될 Lucide 아이콘 식별자
  image?: string;       // 스킬 전용 아트워크 이미지 파일명
  description: string;
}

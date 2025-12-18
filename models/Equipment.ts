import { EquipmentSlotType } from "../types/inventory";

export enum EquipmentRarity {
  COMMON = 'Common',       // 일반
  UNCOMMON = 'Uncommon',   // 고급
  RARE = 'Rare',           // 희귀
  EPIC = 'Epic',           // 영웅
  LEGENDARY = 'Legendary'  // 전설
}

export enum EquipmentType {
  SWORD = 'Sword',
  AXE = 'Axe',
  MACE = 'Mace',
  STAFF = 'Staff',
  DAGGER = 'Dagger',
  HELMET = 'Helmet',
  CHESTPLATE = 'Chestplate',
  SHIELD = 'Shield',
  GLOVES = 'Gloves',
  BOOTS = 'Boots',
}

export interface EquipmentStats {
  physicalAttack: number;  // 물리공격
  physicalDefense: number; // 물리방어
  magicalAttack: number;   // 마법공격
  magicalDefense: number;  // 마법방어
}

export interface SpecialAbility {
  id: string;
  name: string;            // 능력 이름
  description: string;     // 능력 설명
  value?: number;          // 수치
}

export interface Equipment {
  id: string;              // 고유 ID
  recipeId?: string;       // 원본 레시피 ID (이미지 매핑용)
  name: string;            // 이름
  type: EquipmentType;     // 종류
  quality: number;         // 품질 (0 ~ 100)
  rarity: EquipmentRarity; // 희귀도
  price: number;           // 가격
  
  // 시각적 데이터 보존
  icon?: string;
  description?: string;

  // 전투 스탯
  stats: EquipmentStats;
  
  // 특수 능력 목록
  specialAbilities: SpecialAbility[];
  
  // 메타데이터
  craftedDate?: number;    // 제작일
  crafterName?: string;    // 제작자
  
  // 소유권 추적 (호감도 어뷰징 방지)
  previousOwners?: string[]; 

  // 슬롯 정보
  slotType: EquipmentSlotType;
  isTwoHanded?: boolean;
}
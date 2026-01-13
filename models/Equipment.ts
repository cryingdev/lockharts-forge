import { PrimaryStats } from './Stats';

export type EquipmentSlotType = 'MAIN_HAND' | 'OFF_HAND' | 'HEAD' | 'BODY' | 'HANDS' | 'FEET' | 'ACCESSORY';

export enum EquipmentRarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary'
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
  physicalAttack: number;
  physicalDefense: number;
  magicalAttack: number;
  magicalDefense: number;
  // Primary Stat Bonuses
  str?: number;
  vit?: number;
  dex?: number;
  int?: number;
  luk?: number;
}

export interface SpecialAbility {
  id: string;
  name: string;
  description: string;
  value?: number;
}

export interface Equipment {
  id: string;
  recipeId?: string;
  name: string;
  type: EquipmentType;
  quality: number;
  rarity: EquipmentRarity;
  price: number;
  
  icon?: string;
  image?: string;
  description?: string;

  // 전투 스탯
  stats: EquipmentStats;
  
  // 미니게임 보너스 정보
  appliedBonus?: {
    stat: keyof EquipmentStats;
    value: number;
  };

  // 강화 시스템
  enhancementCount: number; // 5콤보마다 누적된 강화 횟수

  // 특수 능력
  specialAbilities: SpecialAbility[];
  
  // 내구도 시스템
  durability: number;      // 현재 내구도
  maxDurability: number;   // 최대 내구도
  isRepairable: boolean;   // 수리 가능 여부
  
  // 장착 가이드 (최소 스탯)
  equipRequirements?: Partial<PrimaryStats>;

  // 메타데이터
  craftedDate?: number;
  crafterName?: string;
  previousOwners?: string[]; 

  // 슬롯 정보
  slotType: EquipmentSlotType;
  isTwoHanded?: boolean;
}
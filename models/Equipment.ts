
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
  HELMET = 'Helmet',
  CHESTPLATE = 'Chestplate',
  // 추후 추가 가능
}

export interface EquipmentStats {
  physicalAttack: number;  // 물리공격
  physicalDefense: number; // 물리방어
  magicalAttack: number;   // 마법공격
  magicalDefense: number;  // 마법방어
}

export interface SpecialAbility {
  id: string;
  name: string;            // 능력 이름 (예: "흡혈", "화염 타격")
  description: string;     // 능력 설명
  value?: number;          // 수치 (예: 흡혈 5%)
}

export interface Equipment {
  id: string;              // 고유 ID (UUID 등)
  name: string;            // 이름
  type: EquipmentType;     // 종류
  quality: number;         // 품질 (0 ~ 100)
  rarity: EquipmentRarity; // 희귀도
  price: number;           // 가격 (판매가)
  
  // 전투 스탯
  stats: EquipmentStats;
  
  // 특수 능력 목록
  specialAbilities: SpecialAbility[];
  
  // 메타데이터 (선택 사항)
  craftedDate?: number;    // 제작일
  crafterName?: string;    // 제작자 이름 (플레이어)
}

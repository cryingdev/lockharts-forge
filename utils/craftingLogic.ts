import { EquipmentItem } from '../types/inventory';
import { Equipment, EquipmentRarity, EquipmentType, EquipmentStats } from '../models/Equipment';
import { MASTERY_THRESHOLDS } from '../config/mastery-config';
import { GAME_CONFIG } from '../config/game-config';

const mapSubCategoryToType = (subCat: string): EquipmentType => {
    return subCat as EquipmentType; 
};

/**
 * 상향 조정된 레벨별 누적 경험치 테이블
 * 아이템 품질(약 100)이 그대로 경험치가 되므로 요구량을 대폭 늘림
 */
export const LEVEL_EXP_TABLE = [
    0,      // Lv 1
    500,    // Lv 2 (약 5번 제작)
    1200,   // Lv 3
    2200,   // Lv 4
    3500,   // Lv 5 (Tier 2 Unlock)
    5200,   // Lv 6
    7500,   // Lv 7
    10500,  // Lv 8
    14500,  // Lv 9
    20000,  // Lv 10 (Tier 3 Unlock)
    27000,  // Lv 11
    36000,  // Lv 12
    47000,  // Lv 13
    60000,  // Lv 14
    75000,  // Lv 15
    95000   // Lv 16 (Tier 4 Unlock)
];

export function getSmithingLevel(exp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_EXP_TABLE.length; i++) {
    if (exp >= LEVEL_EXP_TABLE[i]) level = i + 1;
  }
  return level;
}

export function getUnlockedTier(level: number): number {
  if (level >= 16) return 4;
  if (level >= 10) return 3;
  if (level >= 5) return 2;
  return 1;
}

export function calcCraftExp(args: {
  tier: number;
  quality01: number;      // 0~1 (Internal multiplier, will use quality value instead)
  isQuickCraft: boolean;
  isFirstCraft: boolean;
  quality?: number;       // The actual quality value (0-120)
}): number {
  const { quality = 0, isQuickCraft } = args;

  // 제작된 아이템의 퀄리티를 그대로 경험치로 반환
  // 퀵 크래프트(간이 제작)시에는 효율이 50%로 감소
  const baseExp = quality;
  const quickMult = isQuickCraft ? 0.5 : 1.0;

  return Math.round(baseExp * quickMult);
}

export const getEnergyCost = (item: EquipmentItem, masteryCount: number): number => {
    let cost = GAME_CONFIG.ENERGY_COST.CRAFT; 
    if (masteryCount >= MASTERY_THRESHOLDS.ARTISAN) {
        cost -= MASTERY_THRESHOLDS.ARTISAN_BONUS.energyDiscount;
    }
    return Math.max(5, cost);
};

export const generateEquipment = (recipe: EquipmentItem, quality: number, masteryCount: number, enhancementCount: number = 0): Equipment => {
    let statMultiplier = 1.0;
    let priceMultiplier = 1.0;
    let namePrefix = '';

    if (masteryCount >= MASTERY_THRESHOLDS.ARTISAN) {
        statMultiplier = MASTERY_THRESHOLDS.ARTISAN_BONUS.stats;
        priceMultiplier = MASTERY_THRESHOLDS.ARTISAN_BONUS.price;
        namePrefix = MASTERY_THRESHOLDS.ARTISAN_BONUS.prefix;
    } else if (masteryCount >= MASTERY_THRESHOLDS.ADEPT) {
        statMultiplier = MASTERY_THRESHOLDS.ADEPT_BONUS.stats;
        priceMultiplier = MASTERY_THRESHOLDS.ADEPT_BONUS.price;
        namePrefix = MASTERY_THRESHOLDS.ADEPT_BONUS.prefix;
    }

    const qualityMultiplier = Math.max(0.2, quality / 100); 
    const finalMultiplier = qualityMultiplier * statMultiplier;

    const base = recipe.baseStats || { physicalAttack: 0, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 };
    
    const stats: EquipmentStats = {
        physicalAttack: Math.round(base.physicalAttack * finalMultiplier),
        physicalDefense: Math.round(base.physicalDefense * finalMultiplier),
        magicalAttack: Math.round(base.magicalAttack * finalMultiplier),
        magicalDefense: Math.round(base.magicalDefense * finalMultiplier),
        // 주능력치 보너스 매핑 (템플릿 수치 고정 적용)
        ...(base.str !== undefined && { str: base.str }),
        ...(base.vit !== undefined && { vit: base.vit }),
        ...(base.dex !== undefined && { dex: base.dex }),
        ...(base.int !== undefined && { int: base.int }),
        ...(base.luk !== undefined && { luk: base.luk }),
    };

    const statKeys = ['physicalAttack', 'physicalDefense', 'magicalAttack', 'magicalDefense'] as const;
    for (let i = 0; i < enhancementCount; i++) {
        const randomKey = statKeys[Math.floor(Math.random() * statKeys.length)];
        const currentVal = stats[randomKey];
        if (currentVal !== undefined) {
            stats[randomKey] = Math.round(currentVal * 1.02);
        }
    }

    const rarityScore = quality + (enhancementCount * 2);
    
    let rarity = EquipmentRarity.COMMON;
    if (rarityScore >= 125) rarity = EquipmentRarity.LEGENDARY; 
    else if (rarityScore >= 110) rarity = EquipmentRarity.EPIC;  
    else if (rarityScore >= 95) rarity = EquipmentRarity.RARE;
    else if (rarityScore >= 75) rarity = EquipmentRarity.UNCOMMON;

    const price = Math.round(recipe.baseValue * finalMultiplier * priceMultiplier * (1 + enhancementCount * 0.05));

    return {
        id: `${recipe.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        recipeId: recipe.id,
        name: namePrefix ? `${namePrefix} ${recipe.name}` : recipe.name,
        type: mapSubCategoryToType(recipe.subCategoryId),
        quality: quality,
        rarity: rarity,
        price: price,
        icon: recipe.icon,
        image: recipe.image,
        description: recipe.description,
        stats: stats,
        enhancementCount,
        specialAbilities: [], 
        durability: recipe.maxDurability, 
        maxDurability: recipe.maxDurability,
        isRepairable: recipe.isRepairable,
        minLevel: recipe.minLevel,
        craftedDate: Date.now(),
        crafterName: 'Lockhart',
        previousOwners: [], 
        slotType: recipe.slotType,
        isTwoHanded: recipe.isTwoHanded
    };
};
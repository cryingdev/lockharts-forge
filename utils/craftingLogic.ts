import { EquipmentItem } from '../types/inventory';
import { Equipment, EquipmentRarity, EquipmentType, EquipmentStats } from '../models/Equipment';
import { MASTERY_THRESHOLDS } from '../config/mastery-config';

const mapSubCategoryToType = (subCat: string): EquipmentType => {
    return subCat as EquipmentType; 
};

export const getEnergyCost = (item: EquipmentItem, masteryCount: number): number => {
    let cost = 20; 
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
    };

    // --- ENHANCEMENT LOGIC ---
    // Every +1 grants a 2% boost to a random relevant stat
    const statKeys: (keyof EquipmentStats)[] = ['physicalAttack', 'physicalDefense', 'magicalAttack', 'magicalDefense'];
    for (let i = 0; i < enhancementCount; i++) {
        const randomKey = statKeys[Math.floor(Math.random() * statKeys.length)];
        stats[randomKey] = Math.round(stats[randomKey] * 1.02);
    }

    // Rarity determination based on Quality + Enhancement intensity
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
        equipRequirements: recipe.equipRequirements,
        craftedDate: Date.now(),
        crafterName: 'Lockhart',
        previousOwners: [], 
        slotType: recipe.slotType,
        isTwoHanded: recipe.isTwoHanded
    };
};
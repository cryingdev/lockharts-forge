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

export const generateEquipment = (recipe: EquipmentItem, quality: number, masteryCount: number): Equipment => {
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

    let rarity = EquipmentRarity.COMMON;
    if (quality >= 100) rarity = EquipmentRarity.LEGENDARY;
    else if (quality >= 90) rarity = EquipmentRarity.EPIC;
    else if (quality >= 75) rarity = EquipmentRarity.RARE;
    else if (quality >= 50) rarity = EquipmentRarity.UNCOMMON;

    const qualityMultiplier = 0.5 + (quality / 100) * 0.7; 
    const finalMultiplier = qualityMultiplier * statMultiplier;

    const base = recipe.baseStats || { physicalAttack: 0, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 };
    const stats: EquipmentStats = {
        physicalAttack: Math.round(base.physicalAttack * finalMultiplier),
        physicalDefense: Math.round(base.physicalDefense * finalMultiplier),
        magicalAttack: Math.round(base.magicalAttack * finalMultiplier),
        magicalDefense: Math.round(base.magicalDefense * finalMultiplier),
    };

    const price = Math.round(recipe.baseValue * finalMultiplier * priceMultiplier);

    return {
        id: `${recipe.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        recipeId: recipe.id,
        name: namePrefix ? `${namePrefix} ${recipe.name}` : recipe.name,
        type: mapSubCategoryToType(recipe.subCategoryId),
        quality: quality,
        rarity: rarity,
        price: price,
        icon: recipe.icon,
        description: recipe.description,
        stats: stats,
        specialAbilities: [], 
        craftedDate: Date.now(),
        previousOwners: [], 
        slotType: recipe.slotType,
        isTwoHanded: recipe.isTwoHanded
    };
};
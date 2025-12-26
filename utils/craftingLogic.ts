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

export const generateEquipment = (recipe: EquipmentItem, quality: number, masteryCount: number, bonus: number = 0): Equipment => {
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
    if (quality >= 110) rarity = EquipmentRarity.LEGENDARY; 
    else if (quality >= 100) rarity = EquipmentRarity.EPIC;  
    else if (quality >= 85) rarity = EquipmentRarity.RARE;
    else if (quality >= 60) rarity = EquipmentRarity.UNCOMMON;

    const qualityMultiplier = (quality / 100); 
    const finalMultiplier = qualityMultiplier * statMultiplier;

    const base = recipe.baseStats || { physicalAttack: 0, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 };
    
    const stats: EquipmentStats = {
        physicalAttack: Math.round(base.physicalAttack * finalMultiplier),
        physicalDefense: Math.round(base.physicalDefense * finalMultiplier),
        magicalAttack: Math.round(base.magicalAttack * finalMultiplier),
        magicalDefense: Math.round(base.magicalDefense * finalMultiplier),
    };

    let appliedBonus: Equipment['appliedBonus'] = undefined;

    if (bonus > 0) {
        let targetStat: keyof EquipmentStats = 'physicalAttack';
        if (stats.magicalAttack > stats.physicalAttack) {
            targetStat = 'magicalAttack';
        } else if (stats.physicalDefense > stats.physicalAttack && stats.physicalDefense > stats.magicalAttack) {
            targetStat = 'physicalDefense';
        } else if (stats.magicalDefense > stats.physicalAttack && stats.magicalDefense > stats.magicalAttack) {
            targetStat = 'magicalDefense';
        }
        
        stats[targetStat] += bonus;
        appliedBonus = { stat: targetStat, value: bonus };
    }

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
        image: recipe.image,
        description: recipe.description,
        stats: stats,
        appliedBonus,
        specialAbilities: [], 
        durability: recipe.maxDurability, 
        maxDurability: recipe.maxDurability,
        isRepairable: recipe.isRepairable,
        equipRequirements: recipe.equipRequirements,
        craftedDate: Date.now(),
        previousOwners: [], 
        slotType: recipe.slotType,
        isTwoHanded: recipe.isTwoHanded
    };
};
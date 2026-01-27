import { Mercenary } from '../models/Mercenary';
import { ShopCustomer } from '../types/index';
import { EQUIPMENT_ITEMS } from '../data/equipment';
import { JobClass } from '../models/JobClass';

// Define what kind of equipment each job is interested in
const JOB_PREFERENCES: Record<JobClass, string[]> = {
    [JobClass.NOVICE]: ['SWORD', 'DAGGER', 'HELMET', 'CHESTPLATE', 'GLOVES', 'BOOTS', 'PANTS', 'BELT', 'RING'], 
    [JobClass.FIGHTER]: ['SWORD', 'AXE', 'MACE', 'SHIELD', 'HELMET', 'CHESTPLATE', 'GLOVES', 'BOOTS', 'PANTS', 'BELT'],
    [JobClass.ROGUE]: ['SWORD', 'DAGGER', 'GLOVES', 'BOOTS', 'PANTS', 'BELT', 'RING'], 
    [JobClass.MAGE]: ['STAFF', 'HELMET', 'GLOVES', 'BOOTS', 'PANTS', 'RING'],
    [JobClass.CLERIC]: ['MACE', 'SHIELD', 'HELMET', 'CHESTPLATE', 'GLOVES', 'BOOTS', 'PANTS', 'BELT', 'RING'],
};

/**
 * Determine the appropriate equipment tier for a mercenary's level
 */
const getTargetTierByLevel = (level: number): number => {
    if (level >= 22) return 4;
    if (level >= 15) return 3;
    if (level >= 8) return 2;
    return 1;
};

export const generateShopRequest = (merc: Mercenary, unlockedRecipes: string[] = []): ShopCustomer => {
    // STRICT RULE: Customers ONLY request Equipment.
    
    let requestedId = '';
    let price = 0;
    let dialogue = '';
    let markup = 1.1 + Math.random() * 0.4;

    // 1. Determine target tier based on mercenary level
    const targetTier = getTargetTierByLevel(merc.level);
    const allowedSubCats = JOB_PREFERENCES[merc.job] || [];
    
    // 2. Filter Equipment based on Job Class and appropriate Tier
    let validItems = EQUIPMENT_ITEMS.filter(i => 
        i.tier === targetTier && allowedSubCats.includes(i.subCategoryId)
    );

    // Fallback: If no items found for target tier, try lower tiers
    if (validItems.length === 0) {
        const lowerTierItems = EQUIPMENT_ITEMS.filter(i => 
            i.tier < targetTier && allowedSubCats.includes(i.subCategoryId)
        ).sort((a, b) => b.tier - a.tier);
        
        if (lowerTierItems.length > 0) {
            const highestAvailableTier = lowerTierItems[0].tier;
            validItems = lowerTierItems.filter(i => i.tier === highestAvailableTier);
        }
    }

    // 3. Filter by Unlock Status
    const unlockedCandidates = validItems.filter(i => i.unlockedByDefault || unlockedRecipes.includes(i.id));
    const lockedCandidates = validItems.filter(i => !i.unlockedByDefault && !unlockedRecipes.includes(i.id));

    let target;
    // 85% chance to pick from unlocked items if any exist.
    if (unlockedCandidates.length > 0 && Math.random() < 0.85) {
        target = unlockedCandidates[Math.floor(Math.random() * unlockedCandidates.length)];
    } else if (lockedCandidates.length > 0) {
        target = lockedCandidates[Math.floor(Math.random() * lockedCandidates.length)];
    } else if (validItems.length > 0) {
        target = validItems[Math.floor(Math.random() * validItems.length)];
    }

    if (target) {
        requestedId = target.id;
        price = Math.ceil(target.baseValue * markup);
        dialogue = `I require a ${target.name}.`;
    } else {
        const fallbackList = EQUIPMENT_ITEMS.filter(i => i.tier === 1 && allowedSubCats.includes(i.subCategoryId));
        const fallback = fallbackList.length > 0 ? fallbackList[0] : EQUIPMENT_ITEMS[0];
        requestedId = fallback.id;
        markup = 1.2;
        price = Math.ceil(fallback.baseValue * markup);
        dialogue = `I'll take a ${fallback.name}.`;
    }

    // Personalized dialogue based on affinity
    if (merc.affinity >= 50) {
        dialogue = `Always a pleasure, Lockhart! ${dialogue}`;
    } else if (merc.affinity >= 20) {
        dialogue = `Good to see you again. ${dialogue}`;
    } else {
        dialogue = `Greetings. ${dialogue}`;
    }

    return {
        id: `trans_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        mercenary: merc,
        request: {
            type: 'EQUIPMENT',
            requestedId,
            price,
            markup,
            dialogue
        },
        entryTime: Date.now()
    };
};
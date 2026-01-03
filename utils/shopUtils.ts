
import { Mercenary } from '../models/Mercenary';
import { ShopCustomer } from '../types/index';
import { EQUIPMENT_ITEMS } from '../data/equipment';
import { JobClass } from '../models/JobClass';

// Define what kind of equipment each job is interested in
const JOB_PREFERENCES: Record<JobClass, string[]> = {
    [JobClass.NOVICE]: ['SWORD', 'DAGGER', 'HELMET', 'CHESTPLATE', 'GLOVES', 'BOOTS'], // Can use basics
    [JobClass.FIGHTER]: ['SWORD', 'AXE', 'SHIELD', 'HELMET', 'CHESTPLATE', 'GLOVES', 'BOOTS'], // Heavy user
    [JobClass.ROGUE]: ['SWORD', 'DAGGER', 'GLOVES', 'BOOTS'], // Light weapons (using Sword as dagger proxy)
    [JobClass.MAGE]: ['STAFF', 'HELMET', 'GLOVES', 'BOOTS'], // Limited options currently
    [JobClass.CLERIC]: ['MACE', 'HELMET', 'CHESTPLATE', 'GLOVES', 'BOOTS'], // Protective gear
};

export const generateShopRequest = (merc: Mercenary): ShopCustomer => {
    // Determine request type
    // STRICT RULE: Customers ONLY request Equipment. No raw resources.
    
    let requestedId = '';
    let price = 0;
    let dialogue = '';

    // Filter Equipment based on Job Class and Tier 1
    const allowedSubCats = JOB_PREFERENCES[merc.job] || [];
    
    let validItems = EQUIPMENT_ITEMS.filter(i => 
        i.tier === 1 && allowedSubCats.includes(i.subCategoryId)
    );

    // Fallback if no valid items found for this specific job (e.g. data issue), just pick any Tier 1 Equipment
    if (validItems.length === 0) {
        validItems = EQUIPMENT_ITEMS.filter(i => i.tier === 1);
    }

    const target = validItems[Math.floor(Math.random() * validItems.length)];
    
    if (target) {
        requestedId = target.id;
        price = Math.ceil(target.baseValue * (1.1 + Math.random() * 0.4));
        dialogue = `I require a ${target.name}.`;
    } else {
        // Ultimate fallback (Should never happen if gameData is correct)
        // Defaults to the first item in the game data to prevent crash
        const fallback = EQUIPMENT_ITEMS[0];
        requestedId = fallback.id;
        price = fallback.baseValue;
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
            dialogue
        },
        entryTime: Date.now()
    };
};

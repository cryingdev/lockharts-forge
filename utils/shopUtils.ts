import { Mercenary } from '../models/Mercenary';
import { ShopCustomer } from '../types';
import { ITEMS } from '../constants';
import { EQUIPMENT_ITEMS } from '../gameData';

export const generateShopRequest = (merc: Mercenary): ShopCustomer => {
    // Determine request type
    const isResource = Math.random() < 0.4;
    let requestedId = '';
    let price = 0;
    let dialogue = '';

    if (isResource) {
        const resources = [ITEMS.IRON_ORE, ITEMS.WOOD, ITEMS.COPPER_ORE];
        const target = resources[Math.floor(Math.random() * resources.length)];
        requestedId = target.id;
        price = Math.ceil(target.baseValue * (1.2 + Math.random() * 0.5));
        dialogue = `I need some ${target.name}. Have any?`;
    } else {
        const tier1Items = EQUIPMENT_ITEMS.filter(i => i.tier === 1);
        const target = tier1Items[Math.floor(Math.random() * tier1Items.length)];
        requestedId = target.id;
        price = Math.ceil(target.baseValue * (1.1 + Math.random() * 0.4));
        dialogue = `I require a ${target.name}.`;
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
            type: isResource ? 'RESOURCE' : 'EQUIPMENT',
            requestedId,
            price,
            dialogue
        },
        entryTime: Date.now()
    };
};
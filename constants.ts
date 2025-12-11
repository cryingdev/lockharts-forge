
import { GameState, InventoryItem } from './types';
import { NAMED_MERCENARIES } from './data/mercenaries';
import { MATERIALS } from './data/materials';

export { MATERIALS }; // Re-export if needed, but mainly used for INITIAL_INVENTORY below

export const INITIAL_INVENTORY: InventoryItem[] = [
    { ...MATERIALS.ANVIL, type: 'TOOL', quantity: 1 },
    { ...MATERIALS.HAMMER, type: 'TOOL', quantity: 1 },
    // Starter Materials
    { ...MATERIALS.CHARCOAL, quantity: 5 },
    { ...MATERIALS.COPPER_ORE, quantity: 2 },
    { ...MATERIALS.TIN_ORE, quantity: 1 },
    { ...MATERIALS.OAK_LOG, quantity: 1 },
];

export const INITIAL_STATE: GameState = {
    stats: {
        gold: 1000,
        energy: 100,
        maxEnergy: 100,
        day: 1,
        tierLevel: 0, // Starts at 0, requires Furnace to reach Tier 1
    },
    inventory: INITIAL_INVENTORY,
    forge: {
        hasFurnace: false, // Starts without furnace
        anvilLevel: 1,
        isShopOpen: false,
    },
    activeEvent: null,
    logs: ['You stand amidst the ruins of Lockhart\'s Forge.', 'The furnace is cold and broken. You need to buy a new one.'],
    knownMercenaries: [...NAMED_MERCENARIES],

    // Shop State
    activeCustomer: null,
    shopQueue: [],
    visitorsToday: [],

    // Game Logic State
    isCrafting: false,
    showSleepModal: false,
    showJournal: false,
    
    // Progression
    craftingMastery: {},

    // Minigame Persistence
    forgeTemperature: 0,
    lastForgeTime: 0,
};

export const GAME_CONFIG = {
    ENERGY_COST: {
        REPAIR: 15,
        OPEN_SHOP: 15, 
        CRAFT: 20
    }
};

export const MASTERY_THRESHOLDS = {
    NOVICE: 0,
    ADEPT: 10,
    ARTISAN: 30,
    // Bonuses
    ADEPT_BONUS: { price: 1.1, stats: 1.1, prefix: 'Fine' },
    ARTISAN_BONUS: { price: 1.25, stats: 1.2, prefix: 'Masterwork', energyDiscount: 5 }
};

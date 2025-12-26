import { GameState, InventoryItem } from '../types/index';
import { NAMED_MERCENARIES } from '../data/mercenaries';
import { MATERIALS } from '../data/materials';
import { DUNGEON_CONFIG } from '../config/dungeon-config';

const createInitialInventory = (): InventoryItem[] => [
    { ...MATERIALS.ANVIL, type: 'TOOL', quantity: 1 },
    { ...MATERIALS.HAMMER, type: 'TOOL', quantity: 1 },
    // Starter Materials
    { ...MATERIALS.CHARCOAL, quantity: 5 },
    { ...MATERIALS.COPPER_ORE, quantity: 2 },
    { ...MATERIALS.TIN_ORE, quantity: 1 },
    { ...MATERIALS.OAK_LOG, quantity: 1 },
];

export const createInitialGameState = (): GameState => ({
    stats: {
        gold: 2500,
        energy: 100,
        maxEnergy: 100,
        day: 1,
        tierLevel: 0,
        incomeToday: 0,
    },
    inventory: createInitialInventory(),
    forge: {
        hasFurnace: false,
        hasWorkbench: false,
        anvilLevel: 1,
        isShopOpen: false,
    },
    activeEvent: null,
    logs: ['You stand amidst the ruins of Lockhart\'s Forge.', 'The equipment is cold and broken. You need to gather gold to rebuild.'],
    knownMercenaries: [...NAMED_MERCENARIES].map(m => ({
        ...m,
        expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
        currentXp: 0,
        xpToNextLevel: m.level * 100,
        status: 'VISITOR'
    })),

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

    // Dungeon System
    activeExpeditions: [],
    dungeonClearCounts: {},
    dungeonResult: null,

    // Result Tracking
    lastCraftedItem: null,

    // UI Effects State
    uiEffects: {
        energyHighlight: false
    }
});
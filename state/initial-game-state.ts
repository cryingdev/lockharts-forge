
import { GameState, InventoryItem } from '../types/index';
import { NAMED_MERCENARIES } from '../data/mercenaries';
import { MATERIALS } from '../data/materials';
import { MARKET_CATALOG } from '../data/market/index';
import { DUNGEON_CONFIG } from '../config/dungeon-config';

const createInitialInventory = (): InventoryItem[] => [
    { ...MATERIALS.ANVIL, type: 'TOOL', quantity: 1 },
    { ...MATERIALS.HAMMER, type: 'TOOL', quantity: 1 },
    // Starter Materials
    { ...MATERIALS.CHARCOAL, quantity: 5 },
    { ...MATERIALS.COPPER_ORE, quantity: 2 },
    { ...MATERIALS.TIN_ORE, quantity: 1 },
    { ...MATERIALS.OAK_LOG, quantity: 1 },
    { ...MATERIALS.EMERGENCY_GOLD, quantity: 1 },
];

export const createInitialGameState = (): GameState => ({
    stats: {
        gold: 1500,
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
    talkedToToday: [],

    // Market Initial Stock
    marketStock: MARKET_CATALOG.reduce((acc, item) => ({ ...acc, [item.id]: item.maxStock }), {}),

    // Game Logic State
    isCrafting: false,
    showSleepModal: false,
    showJournal: false,
    toast: null,
    
    // Progression
    craftingMastery: {},
    unlockedRecipes: [],

    // Minigame Persistence
    forgeTemperature: 0,
    lastForgeTime: 0,

    // Dungeon System
    activeExpeditions: [],
    dungeonClearCounts: {},
    dungeonResult: null,
    activeManualDungeon: null,
    showManualDungeonOverlay: false,

    // Result Tracking
    lastCraftedItem: null,

    // UI Effects State
    uiEffects: {
        energyHighlight: false
    }
});

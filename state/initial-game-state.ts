import { GameState, InventoryItem, GameSettings } from '../types/index';
import { NAMED_MERCENARIES } from '../data/mercenaries';
import { materials } from '../data/materials';
import { MARKET_CATALOG } from '../data/market/index';
import { DUNGEON_CONFIG } from '../config/dungeon-config';
import { DUNGEONS } from '../data/dungeons';
import { loadGlobalSettings } from '../utils/saveSystem';
import { createRandomMercenary } from '../utils/mercenaryGenerator';
import { NAMED_CONTRACT_REGISTRY } from '../data/contracts/namedContracts';

const createInitialInventory = (): InventoryItem[] => [
    { ...materials.anvil, type: 'TOOL', quantity: 1 },
    { ...materials.hammer, type: 'TOOL', quantity: 1 },
    // Starter Materials
    { ...materials.charcoal, quantity: 10 }, 
    { ...materials.copper_ore, quantity: 4 }, 
    { ...materials.tin_ore, quantity: 2 },    
    { ...materials.oak_log, quantity: 2 },    
    
    // Skill Items for Testing
    { ...materials.book_bash, quantity: 1 },
    { ...materials.scroll_skill_bash, quantity: 2 },
    { ...materials.book_holy_light, quantity: 1 },
    { ...materials.scroll_skill_holy_light, quantity: 2 },

    // Recovery Items for early testing
    { ...materials.potion_energy_small, quantity: 2 },
    { ...materials.potion_stamina_small, quantity: 2 },
    
    { ...materials.affinity_debug_gift, quantity: 4 },
    { ...materials.emergency_gold, quantity: 4 },
];

export const createInitialGameState = (): GameState => {
    const globalSettings = loadGlobalSettings();

    const defaultSettings: GameSettings = {
        showLogTicker: true,
        inventoryViewMode: 'LIST',
        audio: {
            masterVolume: 0.5,
            musicVolume: 0.8,
            sfxVolume: 0.8,
            masterEnabled: true,
            musicEnabled: true,
            sfxEnabled: true
        }
    };

    // 로컬 스토리지에 저장된 설정이 있다면 병합
    const finalSettings: GameSettings = globalSettings ? {
        ...defaultSettings,
        ...globalSettings,
        audio: {
            ...defaultSettings.audio,
            ...(globalSettings.audio || {})
        }
    } : defaultSettings;

    return {
        stats: {
            gold: 1500,
            energy: 100,
            maxEnergy: 100,
            day: 1,
            tierLevel: 0,
            smithingExp: 0,
            workbenchExp: 0,
            inviteCount: 0,
            totalSalesCount: 0,
            dailyFinancials: {
                incomeShop: 0,
                incomeInventory: 0,
                incomeDungeon: 0,
                incomeRepair: 0,
                expenseMarket: 0,
                expenseWages: 0,
                expenseScout: 0
            },
        },
        inventory: createInitialInventory(),
        forge: {
            hasFurnace: false,
            hasWorkbench: false,
            hasResearchTable: false,
            anvilLevel: 1,
            isShopOpen: false,
        },
        activeEvent: null,
        logs: ['You stand amidst the ruins of Lockhart\'s Forge.', 'The equipment is cold and broken. You need to gather gold to rebuild.'],
        knownMercenaries: [
            // Plus 5 random mercenaries
            ...Array.from({ length: 5 }).map(() => createRandomMercenary(1))
        ],

        // Shop State
        activeCustomer: null,
        shopQueue: [],
        visitorsToday: [],
        talkedToToday: [],
        boughtDrinkToday: [],

        // Market Initial Stock
        marketStock: MARKET_CATALOG.reduce((acc, item) => ({ ...acc, [item.id]: item.maxStock }), {}),
        garrickAffinity: 0,
        talkedToGarrickToday: false,

        // Game Logic State
        isCrafting: false,
        isResearchOpen: false,
        showSleepModal: false,
        showJournal: false,
        showTutorialCompleteModal: false,
        toast: null,
        toastQueue: [],
        
        // Progression
        craftingMastery: {},
        unlockedRecipes: [],
        unlockedTabs: ['MAIN', 'FORGE', 'MARKET'],
        unlockedTierPopup: null,
        tutorialStep: 'PROLOGUE_DIALOG_GUIDE',
        activeTutorialScene: 'PROLOGUE',
        hasCompletedPrologue: false,

        // Minigame Persistence
        forgeTemperature: 0,
        lastForgeTime: 0,

        // Dungeon System
        activeExpeditions: [],
        dungeonClearCounts: {},
        maxFloorReached: DUNGEONS.reduce((acc, d) => ({ ...acc, [d.id]: 1 }), {}),
        dungeonResult: null,
        activeManualDungeon: null,
        showManualDungeonOverlay: false,

        // Result Tracking
        lastCraftedItem: null,

        commission: {
            activeContracts: [],
            completedContractIds: [],
            failedContractIds: [],
            namedEncounters: NAMED_CONTRACT_REGISTRY.reduce((acc, entry) => ({
                ...acc,
                [entry.mercenaryId]: {
                    mercenaryId: entry.mercenaryId,
                    unlocked: false,
                    hasAppeared: false,
                    recruitUnlocked: false,
                    daysEligible: 0,
                    declinedUntilDay: 0,
                }
            }), {}),
            lastDailyCommissionRefreshDay: 0,
            lastEncounterCheckDayByLocation: {
                SHOP: 0,
                TAVERN: 0,
                MARKET: 0,
                SYSTEM: 0,
            },
            hasSeenRecoveryFlow: false,
            hasHadInjuredMercenary: false,
            trackedObjectiveProgress: {},
        },
        activeDialogue: null,

        // UI Effects State
        uiEffects: {
            energyHighlight: false
        },

        // User Preferences
        settings: finalSettings,
        seed: Date.now()
    };
};

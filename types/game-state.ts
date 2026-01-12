
import { InventoryItem } from './inventory';
import { GameEvent } from './events';
import { ShopCustomer } from './shop';
import { Mercenary } from '../models/Mercenary';
import { Expedition } from '../models/Dungeon';

export type RoomType = 'EMPTY' | 'ENTRANCE' | 'BOSS' | 'KEY' | 'WALL' | 'NPC' | 'GOLD' | 'TRAP';

export interface ManualDungeonSession {
    dungeonId: string;
    partyIds: string[];
    grid: RoomType[][];
    visited: boolean[][]; // Fog of war
    playerPos: { x: number, y: number };
    hasKey: boolean;
    isBossLocked: boolean;
    isBossDefeated?: boolean; // New: Tracks if boss was beaten but player is still inside
    npcFound?: boolean; // Track if the NPC in this session was interacted with
    rescuedNpcId?: string; // ID of the NPC rescued during this session
    goldCollected: number; // Cumulative gold found during this session
}

export interface DailyFinancials {
  incomeShop: number;
  incomeInventory: number;
  incomeDungeon: number;
  incomeRepair: number;
  expenseMarket: number;
  expenseWages: number;
  expenseScout: number;
}

export interface PlayerStats {
  gold: number;
  energy: number;
  maxEnergy: number;
  day: number;
  tierLevel: number; // Current market tier access
  smithingExp: number; // Experience for Forge tasks
  workbenchExp: number; // Experience for Workbench tasks
  dailyFinancials: DailyFinancials; // Track detailed financial history for the current day
}

export interface ForgeStatus {
  hasFurnace: boolean;
  hasWorkbench: boolean;
  anvilLevel: number;
  isShopOpen: boolean;
}

export interface DungeonResult {
    dungeonName: string;
    rewards: { id: string; name: string; count: number }[];
    goldGained?: number;
    mercenaryResults: {
        id: string;
        name: string;
        job: string;
        levelBefore: number;
        levelAfter: number;
        xpGained: number;
        currentXp: number;
        xpToNext: number;
    }[];
    rescuedMercenary?: Mercenary; // Rescued NPC to be displayed in the result
}

export interface GameToast {
    message: string;
    visible: boolean;
}

export type TutorialSceneMode = 'PROLOGUE' | 'FURNACE_RESTORED';

export interface GameSettings {
    showLogTicker: boolean;
}

export interface GameState {
  stats: PlayerStats;
  inventory: InventoryItem[];
  forge: ForgeStatus;
  activeEvent: GameEvent | null;
  logs: string[]; // For showing history of actions
  knownMercenaries: Mercenary[]; // Tracked regulars and named NPCs
  
  // Shop System State
  activeCustomer: null | ShopCustomer; // The person currently at the counter
  shopQueue: ShopCustomer[]; // People waiting in line
  visitorsToday: string[]; // List of Mercenary IDs who have visited today
  talkedToToday: string[]; // List of Mercenary IDs who have been talked to today for affinity bonus

  // Market State
  marketStock: Record<string, number>; // Remaining quantity per item ID
  garrickAffinity: number;
  talkedToGarrickToday: boolean;

  // Game Logic Control
  isCrafting: boolean; // Is the player currently in the minigame?
  showSleepModal: boolean; // Should the End of Day modal be visible?
  showJournal: boolean; // Toggle for the Log/Journal Modal
  showTutorialCompleteModal: boolean; // Toggle for the Final Tutorial Result Modal
  toast: GameToast | null; // Global toast notifications
  
  // Progression
  craftingMastery: Record<string, number>; // Key: Item ID, Value: Craft Count
  unlockedRecipes: string[]; // List of IDs for recipes discovered via gameplay
  unlockedTabs: string[]; // List of unlocked Tab IDs (e.g. 'FORGE', 'MARKET', 'SHOP')
  unlockedTierPopup: { type: 'FORGE' | 'WORKBENCH'; tier: number } | null; // Trigger for Tier Unlock Modal
  
  // Tutorial System
  tutorialStep: 'MARKET_GUIDE' | 'BROWSE_GOODS_GUIDE' | 'FURNACE_GUIDE' | 'OPEN_SHOPPING_CART' | 'CLOSE_SHOPPING_CART' | 'PAY_NOW' | 'TALK_TO_GARRICK_AFTER_PURCHASE' | 'LEAVE_MARKET_GUIDE' | 'CRAFT_PROMPT' | 'FORGE_TAB_GUIDE' | 'SELECT_SWORD_GUIDE' | 'START_FORGING_GUIDE' | 'CRAFT_RESULT_PROMPT' | 'FINALIZE_FORGE_GUIDE' | 'SHOP_INTRO_PROMPT' | 'OPEN_SHOP_TAB_GUIDE' | 'OPEN_SHOP_SIGN_GUIDE' | 'SELL_ITEM_GUIDE' | 'PIP_PRAISE' | 'DRAGON_TALK' | 'TUTORIAL_END_MONOLOGUE' | null;
  activeTutorialScene: TutorialSceneMode | null;
  hasCompletedPrologue: boolean;

  // Minigame Persistence
  forgeTemperature: number; // Residual heat from last session
  lastForgeTime: number; // Timestamp of last minigame interaction

  // Dungeon System
  activeExpeditions: Expedition[];
  dungeonClearCounts: Record<string, number>; // Key: Dungeon ID, Value: Count
  dungeonResult: DungeonResult | null; // Populated when claim is clicked to show modal
  activeManualDungeon: ManualDungeonSession | null; // Current manual play session
  showManualDungeonOverlay: boolean; // Toggle for dungeon UI visibility

  // Result Tracking
  lastCraftedItem: null | InventoryItem;

  // UI Effects State
  uiEffects: {
    energyHighlight: boolean;
  };

  // User Preferences
  settings: GameSettings;
}

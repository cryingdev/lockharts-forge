import { InventoryItem } from './inventory';
import { GameEvent } from './events';
import { ShopCustomer } from './shop';
import { Mercenary } from '../models/Mercenary';
import { Expedition } from '../models/Dungeon';
import { Monster } from '../models/Monster';

export type RoomType = 'EMPTY' | 'ENTRANCE' | 'BOSS' | 'KEY' | 'WALL' | 'NPC' | 'GOLD' | 'TRAP' | 'STAIRS' | 'ENEMY' | 'RESOURCE';

export interface ManualDungeonSession {
    dungeonId: string;
    partyIds: string[];
    grid: RoomType[][];
    visited: boolean[][]; // Fog of war
    playerPos: { x: number, y: number };
    pathHistory: { x: number, y: number }[]; // 이동 경로 기록
    hasKey: boolean;
    isBossLocked: boolean;
    isBossDefeated?: boolean; 
    enemies?: Monster[]; 
    npcFound?: boolean; 
    rescuedNpcId?: string; 
    goldCollected: number; 
    collectedLoot: { id: string; count: number; name: string }[]; // New: Real-time loot tracking
    sessionXp: Record<string, number>; // New: Track XP gained during this session for result screen
    encounterStatus: 'NONE' | 'ENCOUNTERED' | 'BATTLE' | 'VICTORY' | 'DEFEAT' | 'STAIRS';
    currentEnemyHp?: number;
    lastActionMessage?: string; 
    currentFloor: number;
    maxFloors: number;
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
  tierLevel: number; 
  smithingExp: number; 
  workbenchExp: number; 
  dailyFinancials: DailyFinancials; 
}

export interface ForgeStatus {
  hasFurnace: boolean;
  hasWorkbench: boolean;
  hasResearchTable: boolean;
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
        statusChange?: 'NONE' | 'INJURED' | 'DEAD';
    }[];
    rescuedMercenary?: Mercenary; 
    isDefeat?: boolean;
}

export interface GameToast {
    message: string;
    visible: boolean;
}

export type TutorialSceneMode = 'PROLOGUE' | 'FURNACE_RESTORED' | 'MARKET' | 'SMITHING';

export interface GameSettings {
    showLogTicker: boolean;
    inventoryViewMode: 'GRID' | 'LIST';
}

export interface GameState {
  stats: PlayerStats;
  inventory: InventoryItem[];
  forge: ForgeStatus;
  activeEvent: GameEvent | null;
  logs: string[]; 
  knownMercenaries: Mercenary[]; 
  
  activeCustomer: null | ShopCustomer; 
  shopQueue: ShopCustomer[]; 
  visitorsToday: string[]; 
  talkedToToday: string[]; 

  marketStock: Record<string, number>; 
  garrickAffinity: number;
  talkedToGarrickToday: boolean;

  isCrafting: boolean; 
  isResearchOpen: boolean;
  showSleepModal: boolean; 
  showJournal: boolean; 
  showTutorialCompleteModal: boolean; 
  toast: GameToast | null; 
  toastQueue: string[]; 
  
  craftingMastery: Record<string, number>; 
  unlockedRecipes: string[]; 
  unlockedTabs: string[]; 
  unlockedTierPopup: { type: 'FORGE' | 'WORKBENCH'; tier: number } | null; 
  
  tutorialStep: 
    | 'PROLOGUE_DIALOG'
    | 'MARKET_GUIDE' 
    | 'BROWSE_GOODS_GUIDE' 
    | 'FURNACE_GUIDE' 
    | 'OPEN_SHOPPING_CART' 
    | 'CLOSE_SHOPPING_CART' 
    | 'PAY_NOW' 
    | 'GARRICK_AFTER_PURCHASE_DIALOG' 
    | 'LEAVE_MARKET_GUIDE' 
    | 'CRAFT_START_DIALOG' 
    | 'FORGE_TAB_GUIDE' 
    | 'SELECT_SWORD_GUIDE' 
    | 'START_FORGING_GUIDE' 
    | 'PRE_IGNITE_DIALOG_1' 
    | 'PRE_IGNITE_DIALOG_2' 
    | 'PRE_IGNITE_INDICATE'
    | 'SMITHING_MINIGAME_IGNITE' 
    | 'PRE_PUMP_DIALOG' 
    | 'PRE_PUMP_INDICATE' 
    | 'SMITHING_MINIGAME_PUMP' 
    | 'POST_PUMP_DIALOG'
    | 'SMITHING_MINIGAME_HIT'
    | 'FIRST_HIT_DIALOG' 
    | 'CRAFT_RESULT_DIALOG' 
    | 'FINALIZE_FORGE_GUIDE' 
    | 'SHOP_INTRO_DIALOG' 
    | 'OPEN_SHOP_TAB_GUIDE' 
    | 'OPEN_SHOP_SIGN_GUIDE' 
    | 'SELL_ITEM_GUIDE' 
    | 'PIP_PRAISE_DIALOG' 
    | 'DRAGON_TALK_DIALOG' 
    | 'TUTORIAL_END_DIALOG' 
    | 'HEAT_CONFIRM_DIALOG'
    | 'FURNACE_FINAL_DIALOG'
    | null;
    
  activeTutorialScene: TutorialSceneMode | null;
  hasCompletedPrologue: boolean;

  forgeTemperature: number; 
  lastForgeTime: number; 

  activeExpeditions: Expedition[];
  dungeonClearCounts: Record<string, number>; 
  maxFloorReached: Record<string, number>; // New: Track progress per dungeon area
  dungeonResult: DungeonResult | null; 
  activeManualDungeon: ManualDungeonSession | null; 
  showManualDungeonOverlay: boolean; 

  lastCraftedItem: null | InventoryItem;

  uiEffects: {
    energyHighlight: boolean;
  };

  settings: GameSettings;
}
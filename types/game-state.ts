
import { InventoryItem } from './inventory';
import { GameEvent } from './events';
import { ShopCustomer } from './shop';
import { Mercenary } from '../models/Mercenary';
import { Expedition } from '../models/Dungeon';
import { Monster } from '../models/Monster';

export type RoomType = 'EMPTY' | 'ENTRANCE' | 'BOSS' | 'KEY' | 'WALL' | 'NPC' | 'GOLD' | 'TRAP';

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
    bossEntity?: Monster; 
    npcFound?: boolean; 
    rescuedNpcId?: string; 
    goldCollected: number; 
    // 전투 관련 상태
    encounterStatus: 'NONE' | 'ENCOUNTERED' | 'BATTLE' | 'VICTORY' | 'DEFEAT';
    currentEnemyHp?: number;
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

export type TutorialSceneMode = 'PROLOGUE' | 'FURNACE_RESTORED';

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
  showSleepModal: boolean; 
  showJournal: boolean; 
  showTutorialCompleteModal: boolean; 
  toast: GameToast | null; 
  toastQueue: string[]; 
  
  craftingMastery: Record<string, number>; 
  unlockedRecipes: string[]; 
  unlockedTabs: string[]; 
  unlockedTierPopup: { type: 'FORGE' | 'WORKBENCH'; tier: number } | null; 
  
  tutorialStep: 'MARKET_GUIDE' | 'BROWSE_GOODS_GUIDE' | 'FURNACE_GUIDE' | 'OPEN_SHOPPING_CART' | 'CLOSE_SHOPPING_CART' | 'PAY_NOW' | 'TALK_TO_GARRICK_AFTER_PURCHASE' | 'LEAVE_MARKET_GUIDE' | 'CRAFT_PROMPT' | 'FORGE_TAB_GUIDE' | 'SELECT_SWORD_GUIDE' | 'START_FORGING_GUIDE' | 'CRAFT_RESULT_PROMPT' | 'FINALIZE_FORGE_GUIDE' | 'SHOP_INTRO_PROMPT' | 'OPEN_SHOP_TAB_GUIDE' | 'OPEN_SHOP_SIGN_GUIDE' | 'SELL_ITEM_GUIDE' | 'PIP_PRAISE' | 'DRAGON_TALK' | 'TUTORIAL_END_MONOLOGUE' | null;
  activeTutorialScene: TutorialSceneMode | null;
  hasCompletedPrologue: boolean;

  forgeTemperature: number; 
  lastForgeTime: number; 

  activeExpeditions: Expedition[];
  dungeonClearCounts: Record<string, number>; 
  dungeonResult: DungeonResult | null; 
  activeManualDungeon: ManualDungeonSession | null; 
  showManualDungeonOverlay: boolean; 

  lastCraftedItem: null | InventoryItem;

  uiEffects: {
    energyHighlight: boolean;
  };

  settings: GameSettings;
}

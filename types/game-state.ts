import { InventoryItem } from './inventory';
import { GameEvent } from './events';
import { ShopCustomer } from './shop';
import { Mercenary } from '../models/Mercenary';
import { Expedition } from '../models/Dungeon';

export interface PlayerStats {
  gold: number;
  energy: number;
  maxEnergy: number;
  day: number;
  tierLevel: number; // Current crafting/market tier access
  incomeToday: number; // Track gold earned during the current day
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
}

export interface GameState {
  stats: PlayerStats;
  inventory: InventoryItem[];
  forge: ForgeStatus;
  activeEvent: GameEvent | null;
  logs: string[]; // For showing history of actions
  knownMercenaries: Mercenary[]; // Tracked regulars and named NPCs
  
  // Shop System State
  activeCustomer: ShopCustomer | null; // The person currently at the counter
  shopQueue: ShopCustomer[]; // People waiting in line
  visitorsToday: string[]; // List of Mercenary IDs who have visited today
  talkedToToday: string[]; // List of Mercenary IDs who have been talked to today for affinity bonus

  // Game Logic Control
  isCrafting: boolean; // Is the player currently in the minigame?
  showSleepModal: boolean; // Should the End of Day modal be visible?
  showJournal: boolean; // Toggle for the Log/Journal Modal
  
  // Progression
  craftingMastery: Record<string, number>; // Key: Item ID, Value: Craft Count
  unlockedRecipes: string[]; // List of IDs for recipes discovered via gameplay

  // Minigame Persistence
  forgeTemperature: number; // Residual heat from last session
  lastForgeTime: number; // Timestamp of last minigame interaction

  // Dungeon System
  activeExpeditions: Expedition[];
  dungeonClearCounts: Record<string, number>; // Key: Dungeon ID, Value: Count
  dungeonResult: DungeonResult | null; // Populated when claim is clicked to show modal

  // Result Tracking
  lastCraftedItem: InventoryItem | null;

  // UI Effects State
  uiEffects: {
    energyHighlight: boolean;
  };
}
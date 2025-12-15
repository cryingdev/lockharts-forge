import { InventoryItem } from './inventory';
import { GameEvent } from './events';
import { ShopCustomer } from './shop';
import { Mercenary } from '../models/Mercenary';

export interface PlayerStats {
  gold: number;
  energy: number;
  maxEnergy: number;
  day: number;
  tierLevel: number; // Current crafting/market tier access
}

export interface ForgeStatus {
  hasFurnace: boolean;
  anvilLevel: number;
  isShopOpen: boolean;
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

  // Game Logic Control
  isCrafting: boolean; // Is the player currently in the minigame?
  showSleepModal: boolean; // Should the End of Day modal be visible?
  showJournal: boolean; // Toggle for the Log/Journal Modal
  
  // Progression
  craftingMastery: Record<string, number>; // Key: Item ID, Value: Craft Count

  // Minigame Persistence
  forgeTemperature: number; // Residual heat from last session
  lastForgeTime: number; // Timestamp of last minigame interaction
}
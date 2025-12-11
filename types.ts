
import { Equipment, EquipmentStats } from './models/Equipment';
import { Mercenary } from './models/Mercenary';

export type ItemType = 'RESOURCE' | 'TOOL' | 'KEY_ITEM' | 'PRODUCT' | 'EQUIPMENT' | 'SCROLL';

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  baseValue: number;
  icon?: string; 
}

export interface InventoryItem extends ItemDefinition {
  quantity: number;
  equipmentData?: Equipment; // Stores the unique instance data for equipment
}

export enum TimeOfDay {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  EVENING = 'Evening',
}

export interface PlayerStats {
  gold: number;
  energy: number;
  maxEnergy: number;
  day: number;
  time: TimeOfDay;
  tierLevel: number; // Current crafting/market tier access
}

export interface ForgeStatus {
  hasFurnace: boolean;
  anvilLevel: number;
  isShopOpen: boolean;
}

export type GameEventId = 'NONE' | 'MERCHANT_ARRIVAL' | 'CUSTOMER_VISIT';

export interface GameEvent {
  id: GameEventId;
  title: string;
  description: string;
  options: {
    label: string;
    action: () => void;
    cost?: { gold?: number; items?: { id: string; count: number }[] };
  }[];
}

export interface ShopRequest {
    type: 'RESOURCE' | 'EQUIPMENT';
    requestedId: string;
    price: number;
    dialogue: string;
}

export interface ShopCustomer {
    id: string; // unique transaction id
    mercenary: Mercenary;
    request: ShopRequest;
    entryTime: number; 
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
  pendingDayAdvance: boolean; // Is the day waiting to end after crafting?
  
  // Progression
  craftingMastery: Record<string, number>; // Key: Item ID, Value: Craft Count
}

export interface GameContextType {
  state: GameState;
  actions: {
    repairItem: () => void; // Placeholder for Cold Forging
    rest: () => void; // Advance time/Restore energy
    handleEventOption: (action: () => void) => void;
    closeEvent: () => void;
    craftItem: (item: EquipmentItem, quality: number) => void;
    buyItems: (items: { id: string; count: number }[], totalCost: number) => void;
    sellItem: (itemId: string, count: number, price: number, equipmentInstanceId?: string, customer?: Mercenary) => void;
    toggleShop: () => void;
    addMercenary: (merc: Mercenary) => void;
    consumeItem: (id: string, count: number) => void;
    
    // Shop Specific Actions
    enqueueCustomer: (customer: ShopCustomer) => void;
    nextCustomer: () => void;
    dismissCustomer: () => void;

    // Logic Control
    setCrafting: (isCrafting: boolean) => void;
  };
}

// --- New Equipment / Crafting Types ---

export type EquipmentCategory = 'WEAPON' | 'ARMOR';

export interface EquipmentSubCategory {
  id: string;
  name: string;
  categoryId: EquipmentCategory;
}

export interface EquipmentItem {
  id: string;
  name: string;
  tier: number; // 1 = Novice, 2 = Apprentice, etc.
  icon: string; // Emoji for now
  description: string;
  subCategoryId: string;
  baseValue: number;
  requirements: { id: string; count: number }[];
  baseStats?: EquipmentStats; // Baseline stats for calculation
}

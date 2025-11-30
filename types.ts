
export type ItemType = 'RESOURCE' | 'TOOL' | 'KEY_ITEM' | 'PRODUCT';

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
}

export interface ForgeStatus {
  hasFurnace: boolean;
  anvilLevel: number;
  rubbleCleared: number; // 0 to 10 (fully cleared)
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

export interface GameState {
  stats: PlayerStats;
  inventory: InventoryItem[];
  forge: ForgeStatus;
  activeEvent: GameEvent | null;
  logs: string[]; // For showing history of actions
}

export interface GameContextType {
  state: GameState;
  actions: {
    cleanRubble: () => void;
    repairItem: () => void; // Placeholder for Cold Forging
    rest: () => void; // Advance time/Restore energy
    handleEventOption: (action: () => void) => void;
    closeEvent: () => void;
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
}

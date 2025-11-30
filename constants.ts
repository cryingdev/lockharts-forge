import { GameState, InventoryItem, TimeOfDay } from './types';

export const ITEMS = {
  IRON_ORE: { id: 'iron_ore', name: 'Iron Ore', type: 'RESOURCE', description: 'Raw iron from the earth.', baseValue: 2 },
  COPPER_ORE: { id: 'copper_ore', name: 'Copper Ore', type: 'RESOURCE', description: 'Shiny raw copper.', baseValue: 1 },
  WOOD: { id: 'wood', name: 'Wood', type: 'RESOURCE', description: 'Sturdy oak logs.', baseValue: 1 },
  CHARCOAL: { id: 'charcoal', name: 'Charcoal', type: 'RESOURCE', description: 'Fuel for the furnace.', baseValue: 5 },
  HAMMER: { id: 'hammer', name: 'Blacksmith Hammer', type: 'TOOL', description: 'Your trusty tool.', baseValue: 0 },
  ANVIL: { id: 'anvil', name: 'Old Anvil', type: 'TOOL', description: 'Heavy and reliable.', baseValue: 0 },
  FURNACE: { id: 'furnace', name: 'Furnace', type: 'KEY_ITEM', description: 'Required for smelting.', baseValue: 500 },
  SCRAP_METAL: { id: 'scrap', name: 'Scrap Metal', type: 'RESOURCE', description: 'Salvaged from rubble.', baseValue: 1 },
} as const;

export const INITIAL_INVENTORY: InventoryItem[] = [
  { ...ITEMS.ANVIL, type: 'TOOL', quantity: 1 },
  { ...ITEMS.HAMMER, type: 'TOOL', quantity: 1 },
  { ...ITEMS.IRON_ORE, type: 'RESOURCE', quantity: 10 },
  { ...ITEMS.COPPER_ORE, type: 'RESOURCE', quantity: 5 },
  { ...ITEMS.WOOD, type: 'RESOURCE', quantity: 5 },
];

export const INITIAL_STATE: GameState = {
  stats: {
    gold: 0,
    energy: 100,
    maxEnergy: 100,
    day: 1,
    time: TimeOfDay.MORNING,
  },
  inventory: INITIAL_INVENTORY,
  forge: {
    hasFurnace: false,
    anvilLevel: 1,
    rubbleCleared: 0,
    isShopOpen: false,
  },
  activeEvent: null,
  logs: ['You stand amidst the ruins of Lockhart\'s Forge.', 'It is quiet, but the anvil still stands.'],
};

export const GAME_CONFIG = {
  ENERGY_COST: {
    CLEAN: 20,
    REPAIR: 15,
    OPEN_SHOP: 30,
  },
  RUBBLE_MAX: 10,
  MERCHANT_TRIGGER_RUBBLE: 3,
};
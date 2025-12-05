
import { EquipmentCategory, EquipmentSubCategory, EquipmentItem } from '../types';

export const EQUIPMENT_CATEGORIES: { id: EquipmentCategory; name: string }[] = [
  { id: 'WEAPON', name: 'Weapons' },
  { id: 'ARMOR', name: 'Armor' },
];

export const EQUIPMENT_SUBCATEGORIES: EquipmentSubCategory[] = [
  // Weapons
  { id: 'SWORD', name: 'Swords', categoryId: 'WEAPON' },
  { id: 'AXE', name: 'Axes', categoryId: 'WEAPON' },
  // Armor
  { id: 'HELMET', name: 'Helmets', categoryId: 'ARMOR' },
  { id: 'CHESTPLATE', name: 'Chestplates', categoryId: 'ARMOR' },
];

export const MARKET_CATALOG = [
  { id: 'charcoal', price: 25 },
  { id: 'iron_ore', price: 100 },
  { id: 'copper_ore', price: 80 },
  { id: 'wood', price: 50 },
  { id: 'scroll_t2', price: 1000 },
];

// Market Prices for Reference:
// Iron Ore: 100 G
// Copper Ore: 80 G
// Wood: 50 G

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  // --- SWORDS ---
  {
    id: 'sword_01_t1',
    name: 'Rusty Iron Sword',
    tier: 1,
    icon: '🗡️',
    description: 'A basic blade, heavy and dull.',
    subCategoryId: 'SWORD',
    // Cost: 3 Iron (300) -> Sell: 450
    baseValue: 450,
    requirements: [
      { id: 'iron_ore', count: 3 }
    ],
    baseStats: { physicalAttack: 10, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  },
  {
    id: 'sword_02_t1',
    name: 'Polished Steel Sword',
    tier: 1,
    icon: '⚔️',
    description: 'A reliable weapon for a city guard.',
    subCategoryId: 'SWORD',
    // Cost: 5 Iron (500) -> Sell: 750
    baseValue: 750,
    requirements: [
      { id: 'iron_ore', count: 5 }
    ],
    baseStats: { physicalAttack: 25, physicalDefense: 2, magicalAttack: 0, magicalDefense: 0 }
  },
  {
    id: 'sword_03_t1',
    name: 'Knight\'s Longsword',
    tier: 1,
    icon: '⚜️',
    description: 'Finely balanced and dangerously sharp.',
    subCategoryId: 'SWORD',
    // Cost: 5 Iron (500) + 2 Copper (160) = 660 -> Sell: 1000
    baseValue: 1000,
    requirements: [
      { id: 'iron_ore', count: 5 },
      { id: 'copper_ore', count: 2 }
    ],
    baseStats: { physicalAttack: 60, physicalDefense: 5, magicalAttack: 0, magicalDefense: 0 }
  },

  // --- AXES ---
  {
    id: 'axe_01_t1',
    name: 'Woodcutter\'s Axe',
    tier: 1,
    icon: '🪓',
    description: 'More tool than weapon, but it hurts.',
    subCategoryId: 'AXE',
    // Cost: 3 Iron (300) + 2 Wood (100) = 400 -> Sell: 600
    baseValue: 600,
    requirements: [
      { id: 'iron_ore', count: 3 },
      { id: 'wood', count: 2 }
    ],
    baseStats: { physicalAttack: 12, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  },
  {
    id: 'axe_02_t1',
    name: 'Battle Axe',
    tier: 1,
    icon: '☠️',
    description: 'Double-headed destruction.',
    subCategoryId: 'AXE',
    // Cost: 6 Iron (600) + 3 Wood (150) = 750 -> Sell: 1150
    baseValue: 1150,
    requirements: [
      { id: 'iron_ore', count: 6 },
      { id: 'wood', count: 3 },
    ],
    baseStats: { physicalAttack: 30, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  },

  // --- HELMETS ---
  {
    id: 'helm_01_t1',
    name: 'Iron Pot Helm',
    tier: 1,
    icon: '🥣',
    description: 'Better than nothing. Barely.',
    subCategoryId: 'HELMET',
    // Cost: 3 Iron (300) -> Sell: 450
    baseValue: 450,
    requirements: [
      { id: 'iron_ore', count: 3 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 5, magicalAttack: 0, magicalDefense: 0 }
  },
  {
    id: 'helm_02_t1',
    name: 'Soldier\'s Helmet',
    tier: 1,
    icon: '🪖',
    description: 'Standard issue protection.',
    subCategoryId: 'HELMET',
    // Cost: 5 Iron (500) -> Sell: 750
    baseValue: 750,
    requirements: [
      { id: 'iron_ore', count: 5 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 15, magicalAttack: 0, magicalDefense: 0 }
  },

  // --- CHESTPLATES ---
  {
    id: 'chest_01_t1',
    name: 'Chainmail Shirt',
    tier: 1,
    icon: '👕',
    description: 'Heavy links of iron.',
    subCategoryId: 'CHESTPLATE',
    // Cost: 8 Iron (800) -> Sell: 1200
    baseValue: 1200,
    requirements: [
      { id: 'iron_ore', count: 8 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 25, magicalAttack: 0, magicalDefense: 2 }
  },
];


import { EquipmentCategory, EquipmentSubCategory, EquipmentItem } from './types';

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

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  // Swords
  {
    id: 'sword_t1',
    name: 'Rusty Iron Sword',
    tier: 1,
    icon: '🗡️',
    description: 'A basic blade, heavy and dull.',
    subCategoryId: 'SWORD',
    baseValue: 15,
    requirements: [
      { id: 'iron_ore', count: 3 },
      { id: 'charcoal', count: 1 }
    ],
    baseStats: { physicalAttack: 10, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  },
  {
    id: 'sword_t2',
    name: 'Polished Steel Sword',
    tier: 2,
    icon: '⚔️',
    description: 'A reliable weapon for a city guard.',
    subCategoryId: 'SWORD',
    baseValue: 45,
    requirements: [
      { id: 'iron_ore', count: 5 },
      { id: 'charcoal', count: 2 }
    ],
    baseStats: { physicalAttack: 25, physicalDefense: 2, magicalAttack: 0, magicalDefense: 0 }
  },
  {
    id: 'sword_t3',
    name: 'Knight\'s Longsword',
    tier: 3,
    icon: '⚜️',
    description: 'Finely balanced and dangerously sharp.',
    subCategoryId: 'SWORD',
    baseValue: 120,
    requirements: [
      { id: 'iron_ore', count: 10 },
      { id: 'charcoal', count: 5 },
      { id: 'copper_ore', count: 2 }
    ],
    baseStats: { physicalAttack: 60, physicalDefense: 5, magicalAttack: 0, magicalDefense: 0 }
  },
  // Axes
  {
    id: 'axe_t1',
    name: 'Woodcutter\'s Axe',
    tier: 1,
    icon: '🪓',
    description: 'More tool than weapon, but it hurts.',
    subCategoryId: 'AXE',
    baseValue: 12,
    requirements: [
      { id: 'iron_ore', count: 2 },
      { id: 'wood', count: 2 }
    ],
    baseStats: { physicalAttack: 12, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  },
  {
    id: 'axe_t2',
    name: 'Battle Axe',
    tier: 2,
    icon: '☠️',
    description: 'Double-headed destruction.',
    subCategoryId: 'AXE',
    baseValue: 50,
    requirements: [
      { id: 'iron_ore', count: 6 },
      { id: 'wood', count: 3 },
      { id: 'charcoal', count: 2 }
    ],
    baseStats: { physicalAttack: 30, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  },
  // Helmets
  {
    id: 'helm_t1',
    name: 'Iron Pot Helm',
    tier: 1,
    icon: '🥣',
    description: 'Better than nothing. Barely.',
    subCategoryId: 'HELMET',
    baseValue: 10,
    requirements: [
      { id: 'iron_ore', count: 3 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 5, magicalAttack: 0, magicalDefense: 0 }
  },
  {
    id: 'helm_t2',
    name: 'Soldier\'s Helmet',
    tier: 2,
    icon: '🪖',
    description: 'Standard issue protection.',
    subCategoryId: 'HELMET',
    baseValue: 35,
    requirements: [
      { id: 'iron_ore', count: 5 },
      { id: 'charcoal', count: 1 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 15, magicalAttack: 0, magicalDefense: 0 }
  },
  // Chestplates
  {
    id: 'chest_t1',
    name: 'Chainmail Shirt',
    tier: 1,
    icon: '👕',
    description: 'Heavy links of iron.',
    subCategoryId: 'CHESTPLATE',
    baseValue: 60,
    requirements: [
      { id: 'iron_ore', count: 8 },
      { id: 'charcoal', count: 2 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 25, magicalAttack: 0, magicalDefense: 2 }
  },
];

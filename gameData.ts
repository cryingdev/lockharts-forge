
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
  },
  {
    id: 'sword_t2',
    name: 'Polished Steel Sword',
    tier: 2,
    icon: '⚔️',
    description: 'A reliable weapon for a city guard.',
    subCategoryId: 'SWORD',
    baseValue: 45,
  },
  {
    id: 'sword_t3',
    name: 'Knight\'s Longsword',
    tier: 3,
    icon: '⚜️',
    description: 'Finely balanced and dangerously sharp.',
    subCategoryId: 'SWORD',
    baseValue: 120,
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
  },
  {
    id: 'axe_t2',
    name: 'Battle Axe',
    tier: 2,
    icon: '☠️',
    description: 'Double-headed destruction.',
    subCategoryId: 'AXE',
    baseValue: 50,
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
  },
  {
    id: 'helm_t2',
    name: 'Soldier\'s Helmet',
    tier: 2,
    icon: '🪖',
    description: 'Standard issue protection.',
    subCategoryId: 'HELMET',
    baseValue: 35,
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
  },
];

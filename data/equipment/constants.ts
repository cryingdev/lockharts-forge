import { EquipmentCategory, EquipmentSubCategory } from '../../types/index';

export const EQUIPMENT_CATEGORIES: { id: EquipmentCategory; name: string }[] = [
  { id: 'WEAPON', name: 'Weapons' },
  { id: 'ARMOR', name: 'Armor' },
  { id: 'ACCESSORY', name: 'Accessories' },
];

export const EQUIPMENT_SUBCATEGORIES: EquipmentSubCategory[] = [
  { id: 'SWORD', name: 'Swords', categoryId: 'WEAPON' },
  { id: 'AXE', name: 'Axes', categoryId: 'WEAPON' },
  { id: 'MACE', name: 'Maces', categoryId: 'WEAPON' },
  { id: 'STAFF', name: 'Staffs', categoryId: 'WEAPON' },
  { id: 'DAGGER', name: 'Daggers', categoryId: 'WEAPON' },

  { id: 'HELMET', name: 'Helmets', categoryId: 'ARMOR' },
  { id: 'CHESTPLATE', name: 'Chestplates', categoryId: 'ARMOR' },
  { id: 'PANTS', name: 'Leggings', categoryId: 'ARMOR' },
  { id: 'GLOVES', name: 'Gloves', categoryId: 'ARMOR' },
  { id: 'SHIELD', name: 'Shields', categoryId: 'ARMOR' },
  { id: 'BOOTS', name: 'Boots', categoryId: 'ARMOR' },

  { id: 'BELT', name: 'Belts', categoryId: 'ACCESSORY' },
  { id: 'RING', name: 'Rings', categoryId: 'ACCESSORY' },
];

// Tier → Required Level rule
export const TIER_REQ_LEVEL = { 1: 1, 2: 8, 3: 15, 4: 22 } as const;

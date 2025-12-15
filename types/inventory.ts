import { Equipment, EquipmentStats } from '../models/Equipment';

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
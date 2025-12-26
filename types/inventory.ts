import { Equipment, EquipmentStats, EquipmentSlotType } from '../models/Equipment';
import { PrimaryStats } from '../models/Stats';

export type { EquipmentSlotType };

export type ItemType = 'RESOURCE' | 'TOOL' | 'KEY_ITEM' | 'PRODUCT' | 'EQUIPMENT' | 'SCROLL' | 'CONSUMABLE';

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
  equipmentData?: Equipment; 
}

export type EquipmentCategory = 'WEAPON' | 'ARMOR';

export interface EquipmentSubCategory {
  id: string;
  name: string;
  categoryId: EquipmentCategory;
}

export type CraftingType = 'FORGE' | 'WORKBENCH';

export interface EquipmentItem {
  id: string;
  name: string;
  tier: number; 
  icon: string; 
  description: string;
  subCategoryId: string;
  baseValue: number;
  requirements: { id: string; count: number }[];
  baseStats?: EquipmentStats;
  
  // Durability & Requirements Template
  maxDurability: number;
  isRepairable: boolean;
  equipRequirements?: Partial<PrimaryStats>;

  slotType: EquipmentSlotType;
  isTwoHanded?: boolean;
  craftingType: CraftingType;
}

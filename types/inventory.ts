import { Equipment, EquipmentStats, EquipmentSlotType } from '../models/Equipment';
import { PrimaryStats } from '../models/Stats';

export type { EquipmentSlotType };

export type ItemType = 'RESOURCE' | 'TOOL' | 'KEY_ITEM' | 'PRODUCT' | 'EQUIPMENT' | 'SCROLL' | 'CONSUMABLE';

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  // Added category property to support research filtering and fix TS error in useResearch.ts
  category?: string;
  description: string;
  baseValue: number;
  icon?: string; 
  image?: string;
}

export interface InventoryItem extends ItemDefinition {
  quantity: number;
  equipmentData?: Equipment; 
  isLocked?: boolean;
}

export type EquipmentCategory = 'WEAPON' | 'ARMOR' | 'ACCESSORY';

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
  image?: string;
  description: string;
  subCategoryId: string;
  baseValue: number;
  requirements: { id: string; count: number }[];
  baseStats?: EquipmentStats;
  
  // Unlock logic
  unlockedByDefault?: boolean; // If false, requires a recipe scroll to show in Forge

  // Durability & Requirements Template
  maxDurability: number;
  isRepairable: boolean;
  minLevel: number;

  slotType: EquipmentSlotType;
  isTwoHanded?: boolean;
  craftingType: CraftingType;
}
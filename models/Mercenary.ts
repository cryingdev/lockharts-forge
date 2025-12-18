
import { BaseStats } from './Stats';
import { JobClass } from './JobClass';
import { EquipmentSlotType } from '../types/inventory';
import { Equipment } from './Equipment';

export type Gender = 'Male' | 'Female';

export type MercenaryStatus = 'VISITOR' | 'HIRED' | 'ON_EXPEDITION' | 'INJURED' | 'DEAD';

// Define the equipment slots structure
// Maps SlotType to the Equipment Instance, or null if empty
export type MercenaryEquipment = Record<EquipmentSlotType, Equipment | null>;

export interface Mercenary {
  id: string;
  name: string;
  gender: Gender;
  job: JobClass;
  level: number;
  stats: BaseStats;
  
  // Vitals
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;

  // Visuals
  icon?: string; // Emoji
  sprite?: string; // Asset filename

  // Relationships
  affinity: number; // 0 to 100
  visitCount: number;
  isUnique: boolean; // True if this is a named/special character
  
  // State
  lastVisitDay?: number;
  status: MercenaryStatus; // Replaces isHired
  assignedExpeditionId?: string; // Links to the active Expedition ID if status is ON_EXPEDITION
  
  // Dungeon System
  expeditionEnergy: number; // 0 to 100
  
  // Progression
  currentXp: number;
  xpToNextLevel: number;

  // Equipment
  equipment: MercenaryEquipment;
}

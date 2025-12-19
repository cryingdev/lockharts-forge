
import { PrimaryStats } from './Stats';
import { JobClass } from './JobClass';
import { EquipmentSlotType } from '../types/inventory';
import { Equipment } from './Equipment';

export type Gender = 'Male' | 'Female';

export type MercenaryStatus = 'VISITOR' | 'HIRED' | 'ON_EXPEDITION' | 'INJURED' | 'DEAD';

export type MercenaryEquipment = Record<EquipmentSlotType, Equipment | null>;

export interface Mercenary {
  id: string;
  name: string;
  gender: Gender;
  job: JobClass;
  level: number;
  stats: PrimaryStats; // Base/Initial attributes
  allocatedStats: PrimaryStats; // Points from leveling up
  
  // Vitals
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;

  // Visuals
  icon?: string;
  sprite?: string;

  // Relationships
  affinity: number;
  visitCount: number;
  isUnique: boolean;
  
  // State
  lastVisitDay?: number;
  status: MercenaryStatus;
  assignedExpeditionId?: string;
  
  // Dungeon System
  expeditionEnergy: number;
  
  // Progression
  currentXp: number;
  xpToNextLevel: number;

  // Equipment
  equipment: MercenaryEquipment;
}

import { PrimaryStats } from './Stats';
import { JobClass } from './JobClass';
import { Equipment, EquipmentSlotType } from './Equipment';

export type Gender = 'Male' | 'Female';
export type MercenaryTemperament = 'bold' | 'cautious' | 'greedy' | 'kind' | 'stoic';
export type MercenaryVoice = 'formal' | 'blunt' | 'cheerful' | 'dry';

export type MercenaryStatus = 'VISITOR' | 'HIRED' | 'ON_EXPEDITION' | 'INJURED' | 'DEAD' | 'ENCOUNTERED' | 'CONTRACT_ACTIVE' | 'DEPARTED';
export type InjurySeverity = 'MINOR' | 'MODERATE' | 'SEVERE';

export type MercenaryEquipment = Record<EquipmentSlotType, Equipment | null>;

export interface Mercenary {
  id: string;
  name: string;
  gender: Gender;
  job: JobClass;
  level: number;
  stats: PrimaryStats; // Base/Initial attributes
  allocatedStats: PrimaryStats; // Points from leveling up
  bonusStatPoints: number; // New: Remaining points to be allocated by player
  
  // Vitals
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;

  // Visuals
  icon?: string;
  spriteImage?: string;
  portraitImage?: string;
  fullBodyImage?: string;

  // Relationships
  affinity: number;
  visitCount: number;
  isUnique: boolean;
  temperament: MercenaryTemperament;
  voice: MercenaryVoice;
  
  // State
  lastVisitDay?: number;
  status: MercenaryStatus;
  assignedExpeditionId?: string;
  recoveryUntilDay?: number; // The day when the mercenary will recover from injury
  injurySeverity?: InjurySeverity;
  injuryPenaltyPercent?: number;
  
  // Dungeon System
  expeditionEnergy: number;
  
  // Progression
  currentXp: number;
  xpToNextLevel: number;

  // Skills
  skillIds?: string[];

  // Equipment
  equipment: MercenaryEquipment;
}

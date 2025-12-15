
import { BaseStats } from './Stats';
import { JobClass } from './JobClass';

export type Gender = 'Male' | 'Female';

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
  isHired?: boolean; // True if actively hired by player
  
  // Dungeon System
  expeditionEnergy: number; // 0 to 100
  
  // Progression
  currentXp: number;
  xpToNextLevel: number;
}

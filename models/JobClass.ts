import { BaseStats } from './Stats';

export enum JobClass {
  NOVICE = 'Novice',
  FIGHTER = 'Fighter',
  MAGE = 'Mage',
  ROGUE = 'Rogue',
  CLERIC = 'Cleric'
}

export const JOB_STAT_WEIGHTS: Record<JobClass, BaseStats> = {
  [JobClass.NOVICE]: { strength: 1, vitality: 1, dexterity: 1, intelligence: 1, luck: 1 },
  [JobClass.FIGHTER]: { strength: 3, vitality: 3, dexterity: 1, intelligence: 0, luck: 0 },
  [JobClass.MAGE]: { strength: 0, vitality: 1, dexterity: 1, intelligence: 4, luck: 1 },
  [JobClass.ROGUE]: { strength: 1, vitality: 1, dexterity: 3, intelligence: 1, luck: 2 },
  [JobClass.CLERIC]: { strength: 1, vitality: 2, dexterity: 0, intelligence: 3, luck: 1 },
};
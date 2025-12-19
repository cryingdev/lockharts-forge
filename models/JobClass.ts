
import { PrimaryStats } from './Stats';

export enum JobClass {
  NOVICE = 'Novice',
  FIGHTER = 'Fighter',
  MAGE = 'Mage',
  ROGUE = 'Rogue',
  CLERIC = 'Cleric'
}

export const JOB_STAT_WEIGHTS: Record<JobClass, PrimaryStats> = {
  [JobClass.NOVICE]: { str: 1, vit: 1, dex: 1, int: 1, luk: 1 },
  [JobClass.FIGHTER]: { str: 3, vit: 3, dex: 1, int: 0, luk: 0 },
  [JobClass.MAGE]: { str: 0, vit: 1, dex: 1, int: 4, luk: 1 },
  [JobClass.ROGUE]: { str: 1, vit: 1, dex: 3, int: 1, luk: 2 },
  [JobClass.CLERIC]: { str: 1, vit: 2, dex: 0, int: 3, luk: 1 },
};

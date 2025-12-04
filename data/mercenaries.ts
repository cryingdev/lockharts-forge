import { Mercenary } from '../models/Mercenary';
import { JobClass } from '../models/JobClass';
import { calculateMaxHp, calculateMaxMp } from '../models/Stats';

// Helper to create stats
const stats = (s: number, v: number, d: number, i: number, l: number) => ({
  strength: s, vitality: v, dexterity: d, intelligence: i, luck: l
});

// --- NOVICES ---
const pipStats = stats(4, 5, 6, 3, 15);
const tillyStats = stats(3, 4, 8, 5, 20);

// --- FIGHTERS ---
const garretStats = stats(20, 25, 10, 5, 5);
const brunhildeStats = stats(28, 22, 12, 4, 8);

// --- MAGES ---
const elaraStats = stats(5, 8, 12, 25, 10);
const xanStats = stats(4, 6, 14, 28, 12);

// --- ROGUES ---
const slyStats = stats(10, 10, 20, 8, 15);
const nyxStats = stats(12, 9, 26, 10, 14);

// --- CLERICS ---
const ariaStats = stats(8, 15, 8, 22, 12);
const benedictStats = stats(16, 20, 6, 18, 10);

export const NAMED_MERCENARIES: Mercenary[] = [
  // NOVICES
  {
    id: 'pip_green',
    name: 'Pip the Green',
    gender: 'Male',
    job: JobClass.NOVICE,
    level: 1,
    stats: pipStats,
    currentHp: calculateMaxHp(pipStats, 1),
    maxHp: calculateMaxHp(pipStats, 1),
    currentMp: calculateMaxMp(pipStats, 1),
    maxMp: calculateMaxMp(pipStats, 1),
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'adventurer_novice_01.png',
    icon: '🌱'
  },
  {
    id: 'tilly_footloose',
    name: 'Tilly Footloose',
    gender: 'Female',
    job: JobClass.NOVICE,
    level: 2,
    stats: tillyStats,
    currentHp: calculateMaxHp(tillyStats, 2),
    maxHp: calculateMaxHp(tillyStats, 2),
    currentMp: calculateMaxMp(tillyStats, 2),
    maxMp: calculateMaxMp(tillyStats, 2),
    affinity: 5,
    visitCount: 0,
    isUnique: true,
    sprite: 'adventurer_novice_02.png',
    icon: '🌾'
  },

  // FIGHTERS
  {
    id: 'garret_shield',
    name: 'Iron Garret',
    gender: 'Male',
    job: JobClass.FIGHTER,
    level: 7,
    stats: garretStats,
    currentHp: calculateMaxHp(garretStats, 7),
    maxHp: calculateMaxHp(garretStats, 7),
    currentMp: calculateMaxMp(garretStats, 7),
    maxMp: calculateMaxMp(garretStats, 7),
    affinity: 5,
    visitCount: 0,
    isUnique: true,
    sprite: 'adventurer_warrior_01.png',
    icon: '🛡️'
  },
  {
    id: 'brunhilde_bear',
    name: 'Brunhilde',
    gender: 'Female',
    job: JobClass.FIGHTER,
    level: 8,
    stats: brunhildeStats,
    currentHp: calculateMaxHp(brunhildeStats, 8),
    maxHp: calculateMaxHp(brunhildeStats, 8),
    currentMp: calculateMaxMp(brunhildeStats, 8),
    maxMp: calculateMaxMp(brunhildeStats, 8),
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'adventurer_warrior_02.png',
    icon: '🐻'
  },

  // MAGES
  {
    id: 'elara_flame',
    name: 'Elara of the Flame',
    gender: 'Female',
    job: JobClass.MAGE,
    level: 5,
    stats: elaraStats,
    currentHp: calculateMaxHp(elaraStats, 5),
    maxHp: calculateMaxHp(elaraStats, 5),
    currentMp: calculateMaxMp(elaraStats, 5),
    maxMp: calculateMaxMp(elaraStats, 5),
    affinity: 10,
    visitCount: 0,
    isUnique: true,
    sprite: 'adventurer_mage_01.png',
    icon: '🔥'
  },
  {
    id: 'xan_void',
    name: 'Xan the Whisperer',
    gender: 'Male',
    job: JobClass.MAGE,
    level: 6,
    stats: xanStats,
    currentHp: calculateMaxHp(xanStats, 6),
    maxHp: calculateMaxHp(xanStats, 6),
    currentMp: calculateMaxMp(xanStats, 6),
    maxMp: calculateMaxMp(xanStats, 6),
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'adventurer_mage_02.png',
    icon: '🔮'
  },

  // ROGUES
  {
    id: 'sly_vargo',
    name: 'Sly Vargo',
    gender: 'Male',
    job: JobClass.ROGUE,
    level: 4,
    stats: slyStats,
    currentHp: calculateMaxHp(slyStats, 4),
    maxHp: calculateMaxHp(slyStats, 4),
    currentMp: calculateMaxMp(slyStats, 4),
    maxMp: calculateMaxMp(slyStats, 4),
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'adventurer_rogue_01.png',
    icon: '🗡️'
  },
  {
    id: 'nyx_shadow',
    name: 'Nyx Shadowstep',
    gender: 'Female',
    job: JobClass.ROGUE,
    level: 6,
    stats: nyxStats,
    currentHp: calculateMaxHp(nyxStats, 6),
    maxHp: calculateMaxHp(nyxStats, 6),
    currentMp: calculateMaxMp(nyxStats, 6),
    maxMp: calculateMaxMp(nyxStats, 6),
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'adventurer_rogue_02.png',
    icon: '🌑'
  },

  // CLERICS
  {
    id: 'sister_aria',
    name: 'Sister Aria',
    gender: 'Female',
    job: JobClass.CLERIC,
    level: 6,
    stats: ariaStats,
    currentHp: calculateMaxHp(ariaStats, 6),
    maxHp: calculateMaxHp(ariaStats, 6),
    currentMp: calculateMaxMp(ariaStats, 6),
    maxMp: calculateMaxMp(ariaStats, 6),
    affinity: 20,
    visitCount: 0,
    isUnique: true,
    sprite: 'adventurer_cleric_01.png',
    icon: '✨'
  },
  {
    id: 'father_benedict',
    name: 'Father Benedict',
    gender: 'Male',
    job: JobClass.CLERIC,
    level: 7,
    stats: benedictStats,
    currentHp: calculateMaxHp(benedictStats, 7),
    maxHp: calculateMaxHp(benedictStats, 7),
    currentMp: calculateMaxMp(benedictStats, 7),
    maxMp: calculateMaxMp(benedictStats, 7),
    affinity: 15,
    visitCount: 0,
    isUnique: true,
    sprite: 'adventurer_cleric_02.png',
    icon: '📜'
  }
];

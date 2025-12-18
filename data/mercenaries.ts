
import { Mercenary } from '../models/Mercenary';
import { JobClass } from '../models/JobClass';
import { calculateMaxHp, calculateMaxMp } from '../models/Stats';
import { DUNGEON_CONFIG } from '../config/dungeon-config';
import { EquipmentSlotType } from '../types/inventory';
import { Equipment } from '../models/Equipment';

// Helper to create stats
const stats = (s: number, v: number, d: number, i: number, l: number) => ({
  strength: s, vitality: v, dexterity: d, intelligence: i, luck: l
});

const defaultEquipment: Record<EquipmentSlotType, Equipment | null> = {
    MAIN_HAND: null,
    OFF_HAND: null,
    HEAD: null,
    BODY: null,
    HANDS: null, // Added
    FEET: null,
    ACCESSORY: null
};

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
    sprite: 'pip_the_green.png',
    icon: '🌱',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 100,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
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
    sprite: 'tily_footloose.png',
    icon: '🌾',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 200,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
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
    sprite: 'iron_garret.png',
    icon: '🛡️',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 700,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
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
    sprite: 'brunhilde.png',
    icon: '🐻',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 800,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
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
    sprite: 'elara_of_the_flame.png',
    icon: '🔥',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 500,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
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
    sprite: 'xan_the_whisperer.png',
    icon: '🔮',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 600,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
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
    sprite: 'sly_vargo.png',
    icon: '🗡️',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 400,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
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
    sprite: 'nyx_shadowstep.png',
    icon: '🌑',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 600,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
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
    sprite: 'sister_aria.png',
    icon: '✨',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 600,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
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
    sprite: 'father_benedict.png',
    icon: '📜',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 700,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
  }
];

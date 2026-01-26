import { Mercenary } from '../models/Mercenary';
import { JobClass } from '../models/JobClass';
import { calculateMaxHp, calculateMaxMp, PrimaryStats } from '../models/Stats';
import { DUNGEON_CONFIG } from '../config/dungeon-config';
import { Equipment, EquipmentSlotType } from '../models/Equipment';

const stats = (s: number, v: number, d: number, i: number, l: number): PrimaryStats => ({
  str: s, vit: v, dex: d, int: i, luk: l
});

const emptyAllocated = (): PrimaryStats => ({
    str: 0, vit: 0, dex: 0, int: 0, luk: 0
});

const defaultEquipment: Record<EquipmentSlotType, Equipment | null> = {
    MAIN_HAND: null,
    OFF_HAND: null,
    HEAD: null,
    BODY: null,
    HANDS: null,
    FEET: null,
    LEGS: null,
    WAIST: null,
    ACCESSORY: null
};

/**
 * SPECIAL_RECRUITS
 * These mercenaries do not appear in the Tavern by default.
 * They must be found through specific events or dungeons.
 */
export const TILLY_FOOTLOOSE: Mercenary = {
    id: 'tilly_footloose',
    name: 'Tilly Footloose',
    gender: 'Female',
    job: JobClass.NOVICE,
    level: 2,
    stats: stats(3, 4, 8, 5, 8),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 15, // Starts with some affinity if rescued
    visitCount: 0,
    isUnique: true,
    sprite: 'tilly_footloose_sprite.png',
    profileImage: 'tilly_footloose_profile.png',
    icon: '🌾',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 200,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
};

// Vitals for Tilly
const maxHpTilly = calculateMaxHp(TILLY_FOOTLOOSE.stats, TILLY_FOOTLOOSE.level);
const maxMpTilly = calculateMaxMp(TILLY_FOOTLOOSE.stats, TILLY_FOOTLOOSE.level);
TILLY_FOOTLOOSE.maxHp = maxHpTilly;
TILLY_FOOTLOOSE.currentHp = maxHpTilly;
TILLY_FOOTLOOSE.maxMp = maxMpTilly;
TILLY_FOOTLOOSE.currentMp = maxMpTilly;

export const NAMED_MERCENARIES: Mercenary[] = [
  {
    id: 'pip_green',
    name: 'Pip the Green',
    gender: 'Male',
    job: JobClass.NOVICE,
    level: 1,
    stats: stats(4, 4, 6, 3, 8),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'pip_green_sprite.png',
    profileImage: 'pip_green_profile.png',
    icon: '🌱',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 100,
    status: 'VISITOR',
    skillIds: ['hard_attack'],
    equipment: { ...defaultEquipment }
  },
  {
    id: 'adeline_shield',
    name: 'Adeline Ashford',
    gender: 'Female',
    job: JobClass.FIGHTER,
    level: 3,
    stats: stats(8, 6, 4, 5, 5),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'adeline_ashford_sprite.png',
    profileImage: 'adeline_ashford_profile.png',
    icon: '🛡️',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 300,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
  },
  {
    id: 'garret_shield',
    name: 'Iron Garret',
    gender: 'Male',
    job: JobClass.FIGHTER,
    level: 7,
    stats: stats(14, 10, 6, 5, 5),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'iron_garret_sprite.png',
    profileImage: 'iron_garret_profile.png',
    icon: '🛡️',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 700,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
  },
  {
    id: 'elara_flame',
    name: 'Elara of the Flame',
    gender: 'Female',
    job: JobClass.MAGE,
    level: 5, //12
    stats: stats(3, 5, 4, 16, 6),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'elara_flame_sprite.png',
    profileImage: 'elara_flame_profile.png',
    icon: '🔥',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 500,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
  },
  {
    id: 'ylva_ironvein',
    name: 'Ylva Ironvein',
    gender: 'Female',
    job: JobClass.FIGHTER,
    level: 6, //15
    stats: stats(16, 7, 4, 5, 5),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'ylva_ironvein_sprite.png',
    profileImage: 'ylva_ironvein_profile.png',
    icon: '🐻',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 600,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
  },
  {
    id: 'lucian_ravenscar',
    name: 'Lucian Ravenscar',
    gender: 'Male',
    job: JobClass.MAGE,
    level: 4, // 12
    stats: stats(4, 8, 4, 12, 8),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'lucian_ravenscar_sprite.png',
    profileImage: 'lucian_ravenscar_profile.png',
    icon: '🌑',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 400,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
  },
  {
    id: 'skeld_stormblood',
    name: 'Skeld Stormblood',
    gender: 'Male',
    job: JobClass.FIGHTER,
    level: 4, // 12
    stats: stats(14, 6, 6, 4, 6),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'skeld_stormblood_sprite.png',
    profileImage: 'skeld_stormblood_profile.png',
    icon: '🐻',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 400,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
  },
  {
    id: 'sly_vargo',
    name: 'Sly Vargo',
    gender: 'Male',
    job: JobClass.ROGUE,
    level: 3, // +6
    stats: stats(6, 6, 6, 4, 10),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'sly_vargo_sprite.png',
    profileImage: 'sly_vargo_profile.png',
    icon: '🦊',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 300,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
  },
  {
    id: 'jade_nightbinder',
    name: 'Jade Nightbinder',
    gender: 'Female',
    job: JobClass.ROGUE,
    level: 3, // +6
    stats: stats(4, 4, 8, 4, 12),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'jade_nightbinder_sprite.png',
    profileImage: 'jade_nightbinder_profile.png',
    icon: '🦊',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 300,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
  },
  {
    id: 'sister_aria',
    name: 'Sister Aria',
    gender: 'Female',
    job: JobClass.CLERIC,
    level: 4, // 9
    stats: stats(6, 7, 4, 9, 5),
    allocatedStats: emptyAllocated(),
    bonusStatPoints: 0,
    currentHp: 0,
    maxHp: 0,
    currentMp: 0,
    maxMp: 0,
    affinity: 0,
    visitCount: 0,
    isUnique: true,
    sprite: 'sister_aria_sprite.png',
    profileImage: 'sister_aria_profile.png',
    icon: '🕊️',
    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
    currentXp: 0,
    xpToNextLevel: 400,
    status: 'VISITOR',
    equipment: { ...defaultEquipment }
  },
].map(m => {
    // Fill vitals
    const maxHp = calculateMaxHp(m.stats, m.level);
    const maxMp = calculateMaxMp(m.stats, m.level);
    return { ...m, maxHp, currentHp: maxHp, maxMp, currentMp: maxMp } as Mercenary;
});
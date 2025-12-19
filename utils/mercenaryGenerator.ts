
import { Mercenary, Gender } from '../models/Mercenary';
import { NAMED_MERCENARIES } from '../data/mercenaries';
import { JobClass, JOB_STAT_WEIGHTS } from '../models/JobClass';
import { calculateMaxHp, calculateMaxMp, PrimaryStats, mergePrimaryStats } from '../models/Stats';
import { generateFullName } from './nameGenerator';
import { DUNGEON_CONFIG } from '../config/dungeon-config';
import { EquipmentSlotType } from '../types/inventory';
import { Equipment } from '../models/Equipment';

const distributeRandomPoints = (weights: PrimaryStats, points: number): PrimaryStats => {
    const stats = { str: 0, vit: 0, dex: 0, int: 0, luk: 0 };
    const totalWeight = weights.str + weights.vit + weights.dex + weights.int + weights.luk;
    
    if (totalWeight === 0) return stats;

    let remaining = points;
    const keys = ['str', 'vit', 'dex', 'int', 'luk'] as const;

    while (remaining > 0) {
        const rand = Math.random() * totalWeight;
        let cumulative = 0;
        for (const key of keys) {
            cumulative += weights[key];
            if (rand <= cumulative) {
                stats[key]++;
                remaining--;
                break;
            }
        }
    }
    return stats;
};

const generateBaseStats = (job: JobClass): PrimaryStats => {
    const weights = JOB_STAT_WEIGHTS[job];
    // Base stats at level 1: 5-8 points distributed randomly using weights
    const baseTotal = 20 + Math.floor(Math.random() * 5);
    return distributeRandomPoints(weights, baseTotal);
};

const defaultEquipment: Record<EquipmentSlotType, Equipment | null> = {
    MAIN_HAND: null,
    OFF_HAND: null,
    HEAD: null,
    BODY: null,
    HANDS: null,
    FEET: null,
    ACCESSORY: null
};

const calculateLevelDataFromTotalXp = (totalXp: number) => {
    let level = 1;
    let xpToNext = 100;
    let remainingXp = totalXp;

    while (remainingXp >= xpToNext) {
        remainingXp -= xpToNext;
        level++;
        xpToNext = level * 100;
    }

    return {
        level,
        currentXp: remainingXp,
        xpToNextLevel: xpToNext
    };
};

export const createRandomMercenary = (currentDay: number): Mercenary => {
    const jobKeys = Object.values(JobClass);
    const job = jobKeys[Math.floor(Math.random() * jobKeys.length)];
    
    const randomFactor = Math.random(); 
    const totalXp = Math.floor(Math.pow(randomFactor, 2) * 2500); 

    const { level, currentXp, xpToNextLevel } = calculateLevelDataFromTotalXp(totalXp);

    const baseStats = generateBaseStats(job);
    // Level up points: (level - 1) * 3
    const bonusPoints = (level - 1) * 3;
    const allocatedStats = distributeRandomPoints(JOB_STAT_WEIGHTS[job], bonusPoints);
    
    const merged = mergePrimaryStats(baseStats, allocatedStats);
    const maxHp = calculateMaxHp(merged, level);
    const maxMp = calculateMaxMp(merged, level);
    
    const gender: Gender = Math.random() < 0.5 ? 'Male' : 'Female';
    const fullName = generateFullName(gender, job);
    
    return {
        id: `rnd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: fullName,
        gender: gender,
        job: job,
        level: level,
        stats: baseStats,
        allocatedStats: allocatedStats,
        currentHp: maxHp,
        maxHp: maxHp,
        currentMp: maxMp,
        maxMp: maxMp,
        affinity: 0,
        visitCount: 1,
        isUnique: false,
        lastVisitDay: currentDay,
        icon: '👤',
        expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
        currentXp: currentXp,
        xpToNextLevel: xpToNextLevel,
        status: 'VISITOR',
        equipment: { ...defaultEquipment }
    };
};

// Added missing export required by TavernTab.tsx
export const getUnmetNamedMercenary = (knownMercenaries: Mercenary[]): Mercenary | null => {
    const unknownNamed = NAMED_MERCENARIES.filter(
        named => !knownMercenaries.some(known => known.id === named.id)
    );
    if (unknownNamed.length === 0) return null;
    return unknownNamed[Math.floor(Math.random() * unknownNamed.length)];
};

export const generateMercenary = (knownMercenaries: Mercenary[], currentDay: number): Mercenary => {
    const rand = Math.random();

    if (knownMercenaries.length > 0 && rand < 0.3) {
        const potentialRegulars = knownMercenaries.filter(m => m.lastVisitDay !== currentDay);
        if (potentialRegulars.length > 0) {
            const regular = potentialRegulars[Math.floor(Math.random() * potentialRegulars.length)];
            const merged = mergePrimaryStats(regular.stats, regular.allocatedStats);
            const maxHp = calculateMaxHp(merged, regular.level);
            const maxMp = calculateMaxMp(merged, regular.level);
            return { 
                ...regular,
                currentHp: maxHp,
                currentMp: maxMp,
                maxHp,
                maxMp,
                expeditionEnergy: regular.expeditionEnergy ?? DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
                currentXp: regular.currentXp ?? 0,
                xpToNextLevel: regular.xpToNextLevel ?? (regular.level * 100),
                equipment: regular.equipment || { ...defaultEquipment }
            }; 
        }
    }

    if (rand < 0.5) {
        const unknownNamed = NAMED_MERCENARIES.filter(
            named => !knownMercenaries.some(known => known.id === named.id)
        );
        if (unknownNamed.length > 0) {
            const merc = unknownNamed[Math.floor(Math.random() * unknownNamed.length)];
            return {
                ...merc,
                visitCount: 1, 
                lastVisitDay: currentDay
            } as Mercenary;
        }
    }

    return createRandomMercenary(currentDay);
};
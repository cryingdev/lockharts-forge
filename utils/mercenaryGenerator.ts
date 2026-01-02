import { Mercenary, Gender } from '../models/Mercenary';
import { NAMED_MERCENARIES } from '../data/mercenaries';
import { JobClass, JOB_STAT_WEIGHTS } from '../models/JobClass';
import { calculateMaxHp, calculateMaxMp, BaseStats } from '../models/Stats';
import { generateFullName } from './nameGenerator';

const generateRandomStats = (job: JobClass, level: number): BaseStats => {
    const weights = JOB_STAT_WEIGHTS[job];
    const basePoints = 20 + (level * 5); // Total stat points to distribute
    
    // Distribute based on weights + randomness
    const stats = { strength: 0, vitality: 0, dexterity: 0, intelligence: 0, luck: 0 };
    
    // Simple distribution strategy
    const totalWeight = weights.strength + weights.vitality + weights.dexterity + weights.intelligence + weights.luck + 1;
    
    stats.strength = Math.floor((basePoints * weights.strength) / totalWeight) + Math.floor(Math.random() * 3);
    stats.vitality = Math.floor((basePoints * weights.vitality) / totalWeight) + Math.floor(Math.random() * 3);
    stats.dexterity = Math.floor((basePoints * weights.dexterity) / totalWeight) + Math.floor(Math.random() * 3);
    stats.intelligence = Math.floor((basePoints * weights.intelligence) / totalWeight) + Math.floor(Math.random() * 3);
    stats.luck = Math.floor((basePoints * weights.luck) / totalWeight) + Math.floor(Math.random() * 3);

    // Ensure minimum 1
    stats.strength = Math.max(1, stats.strength);
    stats.vitality = Math.max(1, stats.vitality);
    stats.dexterity = Math.max(1, stats.dexterity);
    stats.intelligence = Math.max(1, stats.intelligence);
    stats.luck = Math.max(1, stats.luck);

    return stats;
};

// Exported for debug/manual creation
export const createRandomMercenary = (currentDay: number): Mercenary => {
    const jobKeys = Object.values(JobClass);
    const job = jobKeys[Math.floor(Math.random() * jobKeys.length)];
    const level = Math.floor(Math.random() * 5) + 1; // Level 1-5
    const stats = generateRandomStats(job, level);
    const maxHp = calculateMaxHp(stats, level);
    const maxMp = calculateMaxMp(stats, level);
    
    const gender: Gender = Math.random() < 0.5 ? 'Male' : 'Female';
    const fullName = generateFullName(gender, job);
    
    return {
        id: `rnd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: fullName,
        gender: gender,
        job: job,
        level: level,
        stats: stats,
        currentHp: maxHp,
        maxHp: maxHp,
        currentMp: maxMp,
        maxMp: maxMp,
        affinity: 0,
        visitCount: 1,
        isUnique: false,
        lastVisitDay: currentDay,
        icon: '👤'
    };
};

export const getUnmetNamedMercenary = (knownMercenaries: Mercenary[]): Mercenary | null => {
    const unknownNamed = NAMED_MERCENARIES.filter(
        named => !knownMercenaries.some(known => known.id === named.id)
    );
    
    if (unknownNamed.length > 0) {
        return unknownNamed[Math.floor(Math.random() * unknownNamed.length)];
    }
    return null;
};

export const generateMercenary = (knownMercenaries: Mercenary[], currentDay: number): Mercenary => {
    const rand = Math.random();

    // 1. Chance for a Regular (Known Mercenary) to visit (30%)
    if (knownMercenaries.length > 0 && rand < 0.3) {
        const potentialRegulars = knownMercenaries.filter(m => m.lastVisitDay !== currentDay);
        if (potentialRegulars.length > 0) {
            const regular = potentialRegulars[Math.floor(Math.random() * potentialRegulars.length)];
            // Return a fresh copy reference, but keep ID to link back later
            const maxHp = calculateMaxHp(regular.stats, regular.level);
            const maxMp = calculateMaxMp(regular.stats, regular.level);
            return { 
                ...regular,
                currentHp: maxHp,
                currentMp: maxMp,
                maxHp,
                maxMp
            }; 
        }
    }

    // 2. Chance for a New Named Mercenary (20%)
    if (rand < 0.5) {
        const named = getUnmetNamedMercenary(knownMercenaries);
        if (named) {
            return {
                ...named,
                visitCount: 1, 
                lastVisitDay: currentDay
            } as Mercenary;
        }
    }

    // 3. Generate Random Mercenary (Fallback)
    return createRandomMercenary(currentDay);
};

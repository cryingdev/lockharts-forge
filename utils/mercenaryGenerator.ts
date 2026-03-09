
import { Mercenary, Gender } from '../models/Mercenary';
import { NAMED_MERCENARIES } from '../data/mercenaries';
import { JobClass, JOB_STAT_WEIGHTS } from '../models/JobClass';
import { calculateMaxHp, calculateMaxMp, PrimaryStats, mergePrimaryStats } from '../models/Stats';
import { generateFullName } from './nameGenerator';
import { DUNGEON_CONFIG } from '../config/dungeon-config';
import { Equipment, EquipmentSlotType } from '../models/Equipment';
import { rng } from './random';

/**
 * MERCENARY_ASSETS
 * 성별과 직업 조합에 따른 가용 이미지 리소스 설정입니다.
 * 신규 이미지가 추가될 경우 이 매핑 테이블만 업데이트하면 생성 로직에 즉시 반영됩니다.
 */
const MERCENARY_ASSETS: Record<string, Partial<Record<JobClass, { count: number; prefix: string }>>> = {
    Male: {
        [JobClass.FIGHTER]: { count: 32, prefix: 'male_fighter' },
        [JobClass.ROGUE]: { count: 24, prefix: 'male_rogue' },
        [JobClass.MAGE]: { count: 27, prefix: 'male_mage' },
        [JobClass.CLERIC]: { count: 28, prefix: 'male_healer' },
    },
    Female: {
        [JobClass.FIGHTER]: { count: 24, prefix: 'female_fighter' },
        [JobClass.ROGUE]: { count: 16, prefix: 'female_rogue' },
        [JobClass.MAGE]: { count: 18, prefix: 'female_mage' },
        [JobClass.CLERIC]: { count: 22, prefix: 'female_healer' },
    }
};

const distributeRandomPoints = (weights: PrimaryStats, points: number): PrimaryStats => {
    const stats = { str: 0, vit: 0, dex: 0, int: 0, luk: 0 };
    const totalWeight = weights.str + weights.vit + weights.dex + weights.int + weights.luk;
    
    if (totalWeight === 0) return stats;

    let remaining = points;
    const keys = ['str', 'vit', 'dex', 'int', 'luk'] as const;

    while (remaining > 0) {
        const rand = rng.next() * totalWeight;
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
    // Base stats at level 1: 20-25 points distributed randomly using weights
    const baseTotal = rng.rangeInt(20, 24);
    return distributeRandomPoints(weights, baseTotal);
};

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
    const job = rng.pick(jobKeys);
    const gender: Gender = rng.chance(0.5) ? 'Male' : 'Female';
    
    const randomFactor = rng.next(); 
    const totalXp = Math.floor(Math.pow(randomFactor, 2) * 2500); 

    const { level, currentXp, xpToNextLevel } = calculateLevelDataFromTotalXp(totalXp);
    const baseStats = generateBaseStats(job);
    
    const merged = mergePrimaryStats(baseStats, { str: 0, vit: 0, dex: 0, int: 0, luk: 0 });
    const maxHp = calculateMaxHp(merged, level);
    const maxMp = calculateMaxMp(merged, level);
    
    const fullName = generateFullName(gender, job);

    // --- 무작위 외형(이미지) 할당 로직 ---
    let assetConfig = MERCENARY_ASSETS[gender]?.[job];

    // Novice인 경우 전체 에셋 중 무작위 선택
    if (!assetConfig && job === JobClass.NOVICE) {
        const genders = Object.keys(MERCENARY_ASSETS);
        const randomGender = rng.pick(genders);
        const availableJobs = Object.keys(MERCENARY_ASSETS[randomGender]) as unknown as JobClass[];
        const randomJob = rng.pick(availableJobs);
        assetConfig = MERCENARY_ASSETS[randomGender][randomJob];
    }

    let sprite = '';
    
    if (assetConfig) {
        const variantNum = rng.rangeInt(1, assetConfig.count);
        sprite = `${assetConfig.prefix}_${variantNum.toString().padStart(2, '0')}.png`;
    }

    return {
        id: `rnd_${Date.now()}_${rng.rangeInt(0, 999)}`,
        name: fullName,
        gender: gender,
        job: job,
        level: level,
        stats: baseStats,
        allocatedStats: { str: 0, vit: 0, dex: 0, int: 0, luk: 0 },
        bonusStatPoints: (level - 1) * 3,
        currentHp: maxHp,
        maxHp: maxHp,
        currentMp: maxMp,
        maxMp: maxMp,
        affinity: 0,
        visitCount: 1,
        isUnique: false,
        lastVisitDay: currentDay,
        icon: '👤',
        sprite: sprite || undefined, // 설정이 없는 경우 undefined로 두어 기본 처리
        expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
        currentXp: currentXp,
        xpToNextLevel: xpToNextLevel,
        status: 'VISITOR',
        equipment: { ...defaultEquipment }
    };
};

export const getUnmetNamedMercenary = (knownMercenaries: Mercenary[]): Mercenary | null => {
    const unknownNamed = NAMED_MERCENARIES.filter(
        named => !knownMercenaries.some(known => known.id === named.id)
    );
    if (unknownNamed.length === 0) return null;
    return rng.pick(unknownNamed);
};

export const generateMercenary = (knownMercenaries: Mercenary[], currentDay: number): Mercenary => {
    const rand = rng.next();

    if (knownMercenaries.length > 0 && rand < 0.3) {
        const potentialRegulars = knownMercenaries.filter(m => m.lastVisitDay !== currentDay);
        if (potentialRegulars.length > 0) {
            const regular = rng.pick(potentialRegulars);
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
            const merc = rng.pick(unknownNamed);
            return {
                ...merc,
                visitCount: 1, 
                lastVisitDay: currentDay
            } as Mercenary;
        }
    }

    return createRandomMercenary(currentDay);
};

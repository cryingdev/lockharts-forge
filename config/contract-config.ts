
import { JobClass } from "../models/JobClass";

export const CONTRACT_CONFIG = {
    HIRE_AFFINITY_THRESHOLD: 1, // 30(1 for debug), Affinity required to unlock hiring
    BASE_HIRING_COST: 100,       // Base gold cost
    COST_PER_LEVEL: 50,          // Additional cost per level
    WAGE_PERCENTAGE: 0.15,       // Daily wage is 15% of hiring cost
};

export const calculateHiringCost = (level: number, job: JobClass): number => {
    // We could add job-specific multipliers later
    return CONTRACT_CONFIG.BASE_HIRING_COST + (level * CONTRACT_CONFIG.COST_PER_LEVEL);
};

export const calculateDailyWage = (level: number, job: JobClass): number => {
    const hiringCost = calculateHiringCost(level, job);
    return Math.floor(hiringCost * CONTRACT_CONFIG.WAGE_PERCENTAGE);
};

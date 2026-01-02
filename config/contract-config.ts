/**
 * CONTRACT_CONFIG
 * 용병 고용 및 유지비용에 관한 규칙을 정의합니다.
 * 호감도에 따른 고용 해금 조건 및 레벨별 일당 계산 로직이 포함됩니다.
 */
import { JobClass } from "../models/JobClass";

export const CONTRACT_CONFIG = {
    HIRE_AFFINITY_THRESHOLD: 10, // 고용을 위해 필요한 최소 호감도 (디버그를 위해 1로 설정됨)
    BASE_HIRING_COST: 100,       // 기본 고용 계약금
    COST_PER_LEVEL: 50,          // 레벨당 추가 계약금
    WAGE_PERCENTAGE: 0.15,       // 일당 비율 (계약금의 15%)
};

/**
 * 용병의 레벨과 직업을 기반으로 일회성 고용 비용을 계산합니다.
 */
export const calculateHiringCost = (level: number, job: JobClass): number => {
    return CONTRACT_CONFIG.BASE_HIRING_COST + (level * CONTRACT_CONFIG.COST_PER_LEVEL);
};

/**
 * 매일 자정(Rest) 시 지불해야 하는 용병의 일당을 계산합니다.
 */
export const calculateDailyWage = (level: number, job: JobClass): number => {
    const hiringCost = calculateHiringCost(level, job);
    return Math.floor(hiringCost * CONTRACT_CONFIG.WAGE_PERCENTAGE);
};

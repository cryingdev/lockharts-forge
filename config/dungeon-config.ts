/**
 * DUNGEON_CONFIG
 * 던전 탐험 및 용병의 원정 에너지 시스템을 정의합니다.
 * 용병의 최대 활동량과 매일 회복되는 에너지 양을 관리합니다.
 */
export const DUNGEON_CONFIG = {
    MAX_EXPEDITION_ENERGY: 100,      // 용병의 최대 원정 에너지
    DAILY_ENERGY_RECOVERY: 25,       // 휴식 시 회복되는 에너지 양
    BASE_DUNGEON_ENERGY_COST: 20     // 던전 입장 시 기본 소모 에너지 (개별 던전 설정에서 오버라이드 가능)
};

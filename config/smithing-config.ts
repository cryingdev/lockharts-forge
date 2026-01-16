
/**
 * SMITHING_CONFIG
 * 망치질 미니게임의 링 난이도 구성 및 밸런스를 정의합니다.
 */
export const SMITHING_CONFIG = {
    // 링 등급별 물리적 속성
    DIFFICULTY: {
        EASY: {
            id: 'EASY',
            color: 0x10b981,      // Emerald Green
            speedMult: 0.70,      // 기본 속도 대비 70% (느림)
            baseProbability: 0.15,
            qualityBonus: 1
        },
        NORMAL: {
            id: 'NORMAL',
            color: 0xfabf24,      // Amber Yellow
            speedMult: 1.0,       // 기본 속도
            baseProbability: 0.60,
            qualityBonus: 0
        },
        HARD: {
            id: 'HARD',
            color: 0xef4444,      // Rose Red
            speedMult: 1.6,       // 기본 속도 대비 160% (매우 빠름)
            baseProbability: 0.25,
            qualityBonus: -1 // 하드 모드는 실수를 유도하지만, 성공 시 보상은 점수 위주
        }
    },

    // 콤보에 따른 난이도 상승 로직 상수
    BALANCING: {
        MAX_RED_BIAS: 0.75,      // 빨간 링이 나올 최대 확률 한도
        BIAS_PER_COMBO: 0.08,    // 콤보당 빨간 링 확률 증가치
        MIN_GREEN_PROB: 0.02,    // 콤보가 아무리 높아도 유지되는 최소 초록 링 확률
        EASY_REDUCTION_FACTOR: 0.2 // 콤보 보정치에 따른 초록 링 감소율
    },

    // 타겟 판정 범위
    JUDGMENT: {
        PERFECT_THRESHOLD: 0.35, // 타겟 반지름의 35% 이내
        GOOD_THRESHOLD: 0.95    // 타겟 반지름의 95% 이내
    }
};

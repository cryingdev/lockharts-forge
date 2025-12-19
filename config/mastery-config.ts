/**
 * MASTERY_CONFIG
 * 아이템 제작 숙련도에 따른 보너스 및 등급 문턱값을 정의합니다.
 * 많이 제작할수록 아이템의 가치가 상승하고 제작 효율(에너지 절감 등)이 좋아집니다.
 */
export const MASTERY_THRESHOLDS = {
    NOVICE: 0,      // 초보 단계
    ADEPT: 10,       // 숙련 단계 (10회 제작 시)
    ARTISAN: 30,     // 장인 단계 (30회 제작 시)
    
    // 숙련 단계 보너스 (판매가 상승, 스탯 상승, 이름 접두사)
    ADEPT_BONUS: { price: 1.1, stats: 1.1, prefix: 'Fine' },
    
    // 장인 단계 보너스 (에너지 소모 감소 포함)
    ARTISAN_BONUS: { price: 1.25, stats: 1.2, prefix: 'Masterwork', energyDiscount: 5 }
};

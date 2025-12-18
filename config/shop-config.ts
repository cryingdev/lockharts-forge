
export const SHOP_CONFIG = {
    // 방문객 생성 주기 (밀리초)
    ARRIVAL: {
        MIN_INTERVAL_MS: 5000,      // 최소 대기 시간 (5초)
        VARIANCE_MS: 20000          // 추가 무작위 대기 시간 (0 ~ 20초)
        // 결과: 5초 ~ 25초 사이 랜덤 방문
    },
    // 손님 인내심 (밀리초)
    PATIENCE_MS: 30000,             // 30초 후 떠남
    
    // 대기열 처리 (밀리초)
    QUEUE_PROCESS_DELAY_MS: 1000    // 카운터가 비었을 때 다음 손님이 올 때까지의 딜레이
};

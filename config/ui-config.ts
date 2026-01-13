/**
 * UI_MODAL_LAYOUT
 * 모든 팝업형 모달의 공통 레이아웃 규격을 정의합니다.
 * 가로 모드 최적화 및 뷰포트 여백 관리를 중앙에서 제어합니다.
 */
export const UI_MODAL_LAYOUT = {
    // 배경 블러 및 위치 설정
    OVERLAY: "fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-md px-4 py-4 md:py-[5vh] overflow-hidden",
    
    // 모달 컨테이너의 구조적 스타일 (너비 제한 및 최대 높이 포함)
    CONTAINER: "relative w-[92%] sm:w-[88%] max-w-[400px] h-fit max-h-[90vh] bg-stone-900 border-2 rounded-2xl flex flex-col overflow-hidden mx-auto",

    // 시스템별 우선순위에 따른 Z-Index 관리
    Z_INDEX: {
        RESULT: "z-[1000]",    // 제작 결과
        SLEEP: "z-[2000]",     // 일일 정산
        UNLOCK: "z-[6000]",    // 티어 해금, 튜토리얼 완료
        CONFIRM: "z-[9000]",   // 중요 확인/삭제 팝업
    }
};
# Lockhart's Forge - Tutorial System Documentation (v0.1.44)

본 문서는 `Lockhart's Forge`의 튜토리얼 시스템 흐름과 각 단계별 동작 사양을 정의합니다. v0.1.44a 이후 탭 방식이 아닌 월드 맵 POI(Point of Interest) 기반으로 안내가 변경되었습니다.

---

## 🏗️ 1. 전체 흐름 요약 (Phase-based Flow)

튜토리얼은 크게 5가지 페이즈로 구성됩니다:
1.  **Phase 1: Prologue** - 배경 이야기와 초기 목표(용광로 복구) 설정
2.  **Phase 2: Market District** - 마켓 지구 방문 및 용광로 부품 구매
3.  **Phase 3: Furnace Restoration** - 대장간 복귀 및 용광로 설치/점화 가이드
4.  **Phase 4: First Crafting** - 첫 번째 아이템(Bronze Shortsword) 제작 및 미니게임 학습
5.  **Phase 5: First Sale** - 상점 오픈 및 첫 번째 고객(Pip) 응대

---

## 📜 2. 단계별 세부 사양

### [Phase 1] Prologue & Initial Tragedy
*   **Location**: `TutorialScene` (Ruined Forge)
*   **Steps Sequence**:
    1.  `PROLOGUE_DIALOG`: 가족 매장, 파괴된 대장간 확인, 복수 결의, 용광로 수리 불가 확인, 마켓 이동 지시로 이어지는 다이얼로그 시퀀스.
    *   종료 시 `tutorialStep`이 `MARKET_GUIDE`로 설정됨.

### [Phase 2] Market District & Procurement
*   **Location**: `MainScene` -> `MarketTab`
*   **Steps Sequence**:
    1.  `MARKET_GUIDE`: 월드 맵의 'Material Store' 건물(Garrick's Wares) 스포트라이트.
    2.  `BROWSE_GOODS_GUIDE`: 'Browse Goods' 버튼 스포트라이트.
    3.  `FURNACE_GUIDE`: 카탈로그 내 'Furnace' 아이템 스포트라이트.
    4.  `OPEN_SHOPPING_CART`: 우측 장바구니 열기 버튼 스포트라이트.
    5.  `CLOSE_SHOPPING_CART`: 장바구니 내용 확인 후 닫기 버튼 스포트라이트.
    6.  `PAY_NOW`: 'Buy Now' 버튼 스포트라이트. (구매 완료 시 `furnace` 아이템 획득)
    7.  `GARRICK_AFTER_PURCHASE_DIALOG`: 구매 후 Garrick과의 작별 대화.
    8.  `LEAVE_MARKET_GUIDE`: 'Back' 버튼 스포트라이트. 클릭 시 대장간 외곽으로 복귀.

### [Phase 3] Furnace Restoration
*   **Location**: `TutorialScene` (Ruined Forge -> Fixed Forge Transition)
*   **Steps Sequence**:
    1.  `REPLACE FURNACE`: (Prompt) 화면 중앙 클릭 시 용광로가 설치되는 연출 발생.
    2.  `WAIT_HEAT`: 화면 우측 하단 'Ignite' 버튼 스포트라이트.
    3.  `HEAT_CONFIRM_DIALOG`: 점화 성공 후 온도 상승 확인 다이얼로그.
    4.  `WAIT_PUMP`: 'Pump' 버튼 스포트라이트. 연타하여 온도 게이지 99% 달성 유도.
    5.  `FURNACE_FINAL_DIALOG`: 용광로 정상화 선언 다이얼로그. 
    *   완료 시 `activeTutorialScene`이 `SMITHING`으로 전환되며 `tutorialStep`이 `CRAFT_START_DIALOG`로 설정됨.

### [Phase 4] First Crafting (Smithing Mastery)
*   **Location**: `MainScene` -> `ForgeTab` -> `SmithingMinigame`
*   **Steps Sequence**:
    1.  `CRAFT_START_DIALOG`: 대장간 메인 화면에서 제작 결의 다이얼로그.
    2.  `FORGE_TAB_GUIDE`: 월드 맵의 'Lockhart's Forge' 건물 스포트라이트.
    3.  `SELECT_SWORD_GUIDE`: 레시피 목록 중 'Bronze Shortsword' 영역 스포트라이트.
    4.  `START_FORGING_GUIDE`: 제작 상세 창의 'Start Crafting' 버튼 스포트라이트.
    5.  **Minigame Internal Steps**:
        *   `PRE_IGNITE_DIALOG_1`: 미니게임 진입 후 첫 독백.
        *   `PRE_IGNITE_DIALOG_2`: 두 번째 독백 (점화 지시).
        *   `SMITHING_MINIGAME_IGNITE`: 'Ignite' 버튼 스포트라이트.
        *   `PRE_PUMP_DIALOG`: 풀무질 원리 설명 다이얼로그.
        *   `SMITHING_MINIGAME_PUMP`: 'Pump' 버튼 스포트라이트.
        *   `SMITHING_MINIGAME_HIT`: 타이밍 링 첫 노출. (40% 감속 및 EASY 고정)
        *   `FIRST_HIT_DIALOG`: 첫 타격 성공 후 격려 다이얼로그.
    6.  `CRAFT_RESULT_DIALOG`: 제작 완료 후 결과창(품질/숙련도) 확인 다이얼로그.
    7.  `FINALIZE_FORGE_GUIDE`: 'Finalize Forge' 버튼 스포트라이트. 클릭 시 대장간 외곽으로 복귀.

### [Phase 5] First Sale (Shop Loop)
*   **Location**: `MainScene` -> `ShopTab`
*   **Steps Sequence**:
    1.  `SHOP_INTRO_DIALOG`: 판매의 중요성 설명 다이얼로그.
    2.  `OPEN_SHOP_TAB_GUIDE`: 월드 맵의 'Lockhart's Forge' 건물 스포트라이트 (상점 카운터로 연결).
    3.  `OPEN_SHOP_SIGN_GUIDE`: 우측 상단 'CLOSED' 간판 스포트라이트. 클릭 시 'OPEN'으로 전환.
    4.  `SELL_ITEM_GUIDE`: Pip 입장 후 'Sell' 버튼 스포트라이트.
    5.  `PIP_PRAISE_DIALOG`: Pip의 품질 칭찬 다이얼로그.
    6.  `DRAGON_TALK_DIALOG`: 드래곤에 대한 공감대 형성 다이얼로그.
    7.  `TUTORIAL_END_DIALOG`: Lockhart의 최종 결의 다이얼로그. 종료 시 모든 시스템 해금.

---

## 🛠️ 3. 기술적 구현 특징

*   **World POI Spotlight (`TutorialOverlay`)**: `MainScene`의 건물 오브젝트를 가리킵니다. `direction: 'right'` 설정을 통해 건물 왼쪽에서 포인터가 진입하도록 하여 건물을 가리지 않게 합니다.
*   **Dialogue Steps (`_DIALOG`)**: 단순히 다이얼로그만 보여주는 단계는 `TutorialOverlay` 대신 `DialogueBox`를 명시적으로 호출하며, 맵 상의 인터랙션을 잠시 차단합니다.
*   **Intelligent Navigation**: `MainGameLayout`의 `handleSceneNavigation`은 튜토리얼 단계가 `OPEN_SHOP_TAB_GUIDE`인 경우 같은 건물이라도 `SHOP` 탭으로, 그 외에는 `FORGE` 탭으로 영리하게 연결합니다.
*   **Automatic Progression**: 다이얼로그의 'Continue' 버튼이나 특정 UI 액션 성공 시 `actions.setTutorialStep`을 호출하여 다음 단계로 이동합니다.
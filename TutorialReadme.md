# Lockhart's Forge - Tutorial System Documentation (v0.1.46b)

본 문서는 `Lockhart's Forge`의 튜토리얼 시스템 흐름과 각 단계별 동작 사양을 정의합니다. v0.1.46b 기준으로 탭 방식이 아닌 월드 맵 POI(Point of Interest) 기반 안내 구조를 반영합니다.

---

## 🏗️ 1. 전체 흐름 요약 (Phase-based Flow)

튜토리얼은 크게 5가지 페이즈로 구성됩니다:
1.  **Phase 1: Prologue** - 배경 이야기와 초기 목표(용광로 복구) 설정
2.  **Phase 2: Market District** - 마켓 지구 방문 및 용광로 부품 구매
3.  **Phase 3: Furnace Restoration** - 대장간 복귀 및 용광로 설치/점화 가이드
4.  **Phase 4: First Order** - 상점 오픈 및 첫 번째 고객(Pip) 주문 접수
5.  **Phase 5: First Crafting & Delivery** - Bronze Shortsword 제작, Pip 재방문, 첫 판매 마무리

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
    *   완료 시 용광로 연출을 닫고, 바로 `SHOP_INTRO_DIALOG_GUIDE`로 넘어가 첫 주문 루프를 시작합니다.

### [Phase 4] First Order (Shop Loop Setup)
*   **Location**: `MainScene` -> `ShopTab`
*   **Steps Sequence**:
    1.  `SHOP_INTRO_DIALOG_GUIDE`: 상점을 열고 첫 손님을 맞을 준비를 하라는 다이얼로그.
    2.  `OPEN_SHOP_TAB_GUIDE`: 월드 맵의 상점 카운터로 이어지는 경로 스포트라이트.
    3.  `OPEN_SHOP_SIGN_GUIDE`: 상점 간판을 열라는 스포트라이트.
    4.  `SELL_ITEM_GUIDE`: Pip이 첫 손님으로 방문하여 Bronze Shortsword를 요청합니다.
    5.  `PIP_INITIAL_FAREWELL_DIALOG_GUIDE`: Pip이 주문을 남기고 잠시 떠납니다.
    6.  `CRAFT_FIRST_SWORD_DIALOG_GUIDE`: 플레이어가 검을 만들어야 한다는 제작 지시 다이얼로그.
    7.  `CRAFT_FIRST_SWORD_GUIDE`: Forge로 이동하여 Bronze Shortsword를 제작하라는 안내.

### [Phase 5] First Crafting & Delivery (Smithing Mastery)
*   **Location**: `MainScene` -> `ForgeTab` -> `SmithingMinigame` -> `ShopTab`
*   **Steps Sequence**:
    1.  `SELECT_SWORD_GUIDE`: 레시피 목록 중 'Bronze Shortsword' 영역 스포트라이트.
    2.  `START_FORGING_GUIDE`: 제작 상세 창의 'Start Crafting' 버튼 스포트라이트.
    3.  **Minigame Internal Steps**:
        *   미니게임 진입 시 더 이상 `IGNITE` / `PUMP` 별도 설명 단계로 진행하지 않습니다.
        *   화면에는 `HEAT`, `PUMP`, 온도 게이지가 그대로 보이지만, 첫 타격 학습 구간 동안은 이미 준비된 상태처럼 최고 온도로 고정됩니다.
        *   `FIRST_HIT_DIALOG_GUIDE`: 첫 타격 직전 설명 다이얼로그. 이 단계에서는 smithing 입력이 차단됩니다.
        *   `SMITHING_MINIGAME_HIT_GUIDE`: 첫 타격 학습 링 노출.
            *   첫 링 생성 직후에는 입력이 잠겨 있습니다.
            *   링이 목표 원에 충분히 가까워질 때만 포커싱 하이라이트가 등장합니다.
            *   가장 정확한 타이밍에서 링이 정지하고 타격 인디케이터가 나타납니다.
            *   이 순간에만 입력이 열리며, 첫 타격은 사실상 `PERFECT`로 유도됩니다.
            *   `HEAT` / `PUMP` / 온도 게이지 주변 탭은 미스 판정으로 처리되지 않도록 보호됩니다.
        *   첫 타격 성공 후에는 일반 링 흐름으로 복귀하며, 이후부터는 일반 smithing 입력 규칙을 따릅니다.
    4.  `CRAFT_RESULT_DIALOG`: 제작 완료 후 결과창(품질/숙련도) 확인 다이얼로그.
    5.  `FINALIZE_FORGE_GUIDE`: 'Finalize Forge' 버튼 스포트라이트.
    6.  `PIP_RETURN_DIALOG_GUIDE`: 상점으로 돌아가면 Pip이 재방문하여 주문한 검을 먼저 점검합니다.
    7.  `PIP_RETURN_GUIDE`: 그 다음 실제 판매 선택지가 열립니다.
    8.  `PIP_PRAISE_DIALOG`: Pip의 품질 칭찬 다이얼로그.
    9.  `DRAGON_TALK_DIALOG`: 드래곤에 대한 공감대 형성 다이얼로그.
    10. `TUTORIAL_END_DIALOG`: 플레이어의 최종 결의 다이얼로그. 종료 시 모든 시스템 해금.
    *   Pip의 작별 인사가 먼저 끝난 뒤 튜토리얼 완료 팝업이 노출됩니다.
    *   튜토리얼 완료 팝업이 열려 있는 동안에는 일반 손님 큐잉이 진행되지 않습니다.

---

## 🛠️ 3. 기술적 구현 특징

*   **World POI Spotlight (`TutorialOverlay`)**: `MainScene`의 건물 오브젝트를 가리킵니다. `direction: 'right'` 설정을 통해 건물 왼쪽에서 포인터가 진입하도록 하여 건물을 가리지 않게 합니다.
*   **Dialogue Steps (`_DIALOG`)**: 단순히 다이얼로그만 보여주는 단계는 `TutorialOverlay` 대신 `DialogueBox`를 명시적으로 호출하며, 맵 상의 인터랙션을 잠시 차단합니다.
*   **Smithing Tutorial Guardrails**:
    *   첫 타격 학습 직전 다이얼로그가 보이는 동안에는 링 터치, `HEAT`, `PUMP` 같은 smithing 입력이 잠깁니다.
    *   첫 타격은 안내용 강제 성공 흐름을 사용해 초반 사용자 실수를 줄입니다.
    *   첫 타격 이후에만 일반 shrinking ring 판정으로 자연스럽게 복귀합니다.
*   **Intelligent Navigation**: `MainGameLayout`의 `handleSceneNavigation`은 튜토리얼 단계가 `OPEN_SHOP_TAB_GUIDE`인 경우 같은 건물이라도 `SHOP` 탭으로, 그 외에는 `FORGE` 탭으로 영리하게 연결합니다.
*   **Automatic Progression**: 다이얼로그의 'Continue' 버튼이나 특정 UI 액션 성공 시 `actions.setTutorialStep`을 호출하여 다음 단계로 이동합니다.

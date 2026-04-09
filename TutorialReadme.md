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
    4.  `PAY_NOW`: Furnace 선택 시 장바구니가 자동으로 열리고, 'Buy Now' 버튼이 스포트라이트된다. (구매 완료 시 `furnace` 아이템 획득)
    5.  `GARRICK_AFTER_PURCHASE_DIALOG`: 구매 후 Garrick에게 감사를 전하는 버튼 유도 단계.
    6.  `GARRICK_EXIT_DIALOG_GUIDE`: 구매 후 Garrick의 배웅 대사.
    7.  `LEAVE_MARKET_GUIDE`: 'Back' 버튼 스포트라이트. 클릭 시 대장간 외곽으로 복귀.

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
    1.  `SHOP_INTRO_DIALOG_GUIDE`: 누군가 찾아온 것 같다는 다이얼로그. `계속`을 누르면 Shop으로 이동합니다.
    2.  `OPEN_SHOP_SIGN_GUIDE`: ShopSign과 영업 배너를 강조합니다. 플레이어가 상점을 열면 바로 첫 손님 루프로 이어집니다.
    3.  `SELL_ITEM_GUIDE`: Pip이 첫 손님으로 방문하여 Bronze Shortsword를 요청합니다.
    4.  `CRAFT_FIRST_SWORD_DIALOG_GUIDE`: Pip이 주문을 남기고 떠난 직후, 플레이어가 검을 만들어야 한다는 제작 지시 다이얼로그.
    5.  `CRAFT_FIRST_SWORD_GUIDE`: Forge로 이동하여 Bronze Shortsword를 제작하라는 안내.

### [Phase 5] First Crafting & Delivery (Smithing Mastery)
*   **Location**: `MainScene` -> `ForgeTab` -> `SmithingMinigame` -> `ShopTab`
*   **Steps Sequence**:
    1.  `SELECT_SWORD_GUIDE`: 레시피 목록 중 'Bronze Shortsword' 영역 스포트라이트.
    2.  `START_FORGING_GUIDE`: 제작 상세 창의 'Start Crafting' 버튼만 스포트라이트합니다.
    3.  `SMITHING_INTRO_DIALOG_GUIDE`: 미니게임 진입 직후 "리듬에 맞춰 달궈진 쇠를 친다"는 짧은 설명 다이얼로그를 보여줍니다.
    4.  `SMITHING_TOUCH_TO_START_GUIDE`: 설명을 넘기면 `Touch to Start` 상태로 대기합니다.
    5.  **Minigame Internal Steps**:
        *   미니게임 진입 시 더 이상 `IGNITE` / `PUMP` 별도 설명 단계로 진행하지 않습니다.
        *   화면에는 `HEAT`, `PUMP`, 온도 게이지가 그대로 보이지만, 첫 타격 학습 구간 동안은 이미 준비된 상태처럼 최고 온도로 고정됩니다.
        *   `FIRST_HIT_DIALOG_GUIDE`: 첫 탭 이후, 첫 타격 직전 설명 다이얼로그. 이 단계에서는 smithing 입력이 차단됩니다.
        *   `SMITHING_MINIGAME_HIT_GUIDE`: 첫 타격 학습 링 노출.
            *   첫 링 생성 직후에는 입력이 잠겨 있습니다.
            *   링이 목표 원에 충분히 가까워질 때만 포커싱 하이라이트가 등장합니다.
            *   가장 정확한 타이밍에서 링이 정지하고 타격 인디케이터가 나타납니다.
            *   이 순간에만 입력이 열리며, 첫 타격은 사실상 `PERFECT`로 유도됩니다.
            *   `HEAT` / `PUMP` / 온도 게이지 주변 탭은 미스 판정으로 처리되지 않도록 보호됩니다.
        *   첫 타격 성공 후에는 일반 링 흐름으로 복귀하며, 이후부터는 일반 smithing 입력 규칙을 따릅니다.
        *   일반 smithing에서는 링을 그냥 놓치면 `MISS`로 처리되고 다음 링이 바로 시작됩니다.
        *   반대로 잘못 친 타격은 쇠가 틀어진 것으로 간주되어 `TONGS`로 정렬을 맞춘 뒤 `HAMMER`로 돌아와야 다음 링이 다시 시작됩니다.
    6.  `CRAFT_RESULT_DIALOG`: 제작 완료 후 결과창(품질/숙련도) 확인 다이얼로그.
    7.  `FINALIZE_FORGE_GUIDE`: 'Finalize Forge' 버튼 스포트라이트.
    8.  `PIP_RETURN_DIALOG_GUIDE`: 상점으로 돌아가면 Pip이 재방문하여 주문한 검을 먼저 점검합니다.
    9.  `PIP_RETURN_GUIDE`: 그 다음 실제 판매 선택지가 열립니다.
    10. `PIP_PRAISE_DIALOG`: Pip의 품질 칭찬 다이얼로그.
    11. `DRAGON_TALK_DIALOG`: 드래곤에 대한 공감대 형성 다이얼로그.
    12. `TUTORIAL_END_DIALOG`: 플레이어의 최종 결의 다이얼로그. 종료 시 모든 시스템 해금.
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
    *   일반 smithing 흐름에서는 `미입력 MISS`와 `잘못된 타격`을 분리하여, 후자만 재정렬 루프로 이어집니다.
*   **Intelligent Navigation**: `MainGameLayout`의 `handleSceneNavigation`은 같은 건물 클릭을 마지막 대장간 하위 탭으로 연결합니다. Shop 튜토리얼 진입은 `SHOP_INTRO_DIALOG_GUIDE`의 `계속` 액션에서 직접 처리됩니다.
*   **Automatic Progression**: 다이얼로그의 'Continue' 버튼이나 특정 UI 액션 성공 시 `actions.setTutorialStep`을 호출하여 다음 단계로 이동합니다.

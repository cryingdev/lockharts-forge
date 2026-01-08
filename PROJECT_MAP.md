# Project Map – Lockhart’s Forge (v0.1.35)

이 문서는 프로젝트의 모든 파일 구조와 각 파일의 세부 역할을 설명합니다.

---

## 🏗️ 1. Core & Infrastructure (뿌리 및 인프라)

### Root Directory
- `index.html`: Entry HTML. **Grenze/Gotisch** 폰트 로드, 뷰포트 보호, 전역 CSS(스크롤바 숨김, 애니메이션) 정의.
- `index.tsx`: React 앱 진입점. 모든 폰트가 로드된 후 마운트하여 텍스트 깨짐 방지.
- `App.tsx`: 최상위 뷰 컨트롤러. `INTRO -> TITLE -> GAME` 상태 전환 및 세이브 데이터 하이드레이션 관리.
- `utils.ts`: 전역 유틸리티. 에셋 URI 생성(캐시 포함) 및 `MM:SS` 시간 포맷팅.
- `metadata.json`: 앱 메타데이터 및 권한 설정.
- `package.json` / `tsconfig.json` / `vite.config.ts`: 프로젝트 빌드 및 타입 설정.

### Framework Context
- `context/GameContext.tsx`: 전역 상태 공급자. Reducer와 UI 액션을 연결하며, 날짜 변경 시 자동 저장 로직 포함.

---

## ⚛️ 2. State Management (상태 관리 - `state/`)

### Core Reducer
- `state/gameReducer.ts`: 메인 리듀서 엔진. 하위 핸들러들을 조합하여 액션을 처리.
- `state/actions.ts`: 모든 가능한 게임 액션(`START_CRAFTING`, `MOVE_MANUAL_DUNGEON` 등)의 타입 정의.
- `state/initial-game-state.ts`: 신규 게임 시작 시의 초기값(창세기 상태) 정의.

### Action Handlers (`state/reducer/`)
- `inventory.ts`: 아이템 획득, 소비, 판매, 상점 구매 및 티어 업그레이드 로직.
- `mercenary.ts`: 용병 영입/해고, 호감도 선물, 대화, 능력치(Stat) 분배 및 레벨업 처리.
- `crafting.ts`: 제작 시작/취소/완료 처리 및 제작 숙련도(Mastery) 가산.
- `expedition.ts`: 전략 파견 시작 및 보상 계산(Luck 기반), 경험치 분배.
- `manualDungeon.ts`: 직접 돌파 모드의 그리드 생성, 이동 소모량 계산 및 보스전 전환.
- `shop.ts`: 상점 오픈/클로즈, 손님 대기열(Queue) 관리.
- `equipment.ts`: 용병 장비 장착/해제 및 장착 제한(Requirements) 검증.
- `sleep.ts`: 일일 결산(임금 지불), 상점 재입고, 에너지 회복 및 자동 저장 트리거.
- `events.ts`: 랜덤 이벤트 발생 및 저널(Log) 토글.
- `repair.ts`: 에너지 소모를 통한 수동 골드 벌기(수리 작업).

---

## ⚙️ 3. Logic & Math (비즈니스 로직 - `utils/`)

- `utils/combatLogic.ts`: **전투 엔진**. 명중/크리티컬 판정, Expected DPS 계산 및 종합 전투력(CP) 도출.
- `utils/craftingLogic.ts`: 제작 결과물 생성. 숙련도/품질에 따른 스탯 배율 및 보너스 적용.
- `utils/saveSystem.ts`: 로컬 스토리지 연동. 3개 슬롯 관리, 메타데이터 생성 및 버전 체크.
- `utils/mercenaryGenerator.ts`: 절차적 용병 생성. 직업별 가중치 스탯 분배 및 이름 지정.
- `utils/shopUtils.ts`: 상점 AI. 용병의 직업과 선호도에 따른 구매 요청 생성.
- `utils/nameGenerator.ts`: 이름 생성 엔진. `nameData.ts`를 조합하여 유니크한 이름 반환.

---

## ⚛️ 4. UI Components (사용자 인터페이스 - `components/`)

### Layout & Common
- `components/MainGameLayout.tsx`: 게임 메인 대시보드. 탭 내비게이션, 토스트 알림, 배경 서비스 실행.
- `components/Header.tsx`: 상단 HUD. 골드, 에너지, 날짜, 로그 티커 표시.
- `components/DialogueBox.tsx`: 스토리 및 상호작용용 대화창. 타이핑 효과 및 선택지 UI.
- `components/InventoryDisplay.tsx`: 가방 시스템. 아이템 상세 확인, 퀵 판매, 소비 아이템 사용.
- `components/IntroScreen.tsx`: 인트로 씬의 React 래퍼 및 리사이즈 관리.
- `components/TitleScreen.tsx`: 메인 타이틀. 이어하기, 새 게임, 로드 메뉴 진입점.

### Tabs (기능 페이지)
- `tabs/Forge/ForgeTab.tsx`: 제작 메인 페이지. 레시피 선택, 숙련도 확인, 요구 재료 툴팁.
- `tabs/Forge/SmithingMinigame.tsx`: 대장질 미니게임 래퍼. Phaser 씬과 React 데이터 동기화.
- `tabs/Forge/WorkbenchMinigame.tsx`: 작업대 미니게임 래퍼.
- `tabs/Forge/MainForgeCanvas.tsx`: 대장간 내부를 자유롭게 둘러보는 Phaser 뷰.
- `tabs/Shop/ShopTab.tsx`: 상점 운영. 손님 응대, 가격 흥정, 간판 전환(Open/Closed).
- `tabs/Tavern/TavernTab.tsx`: 용병 목록 및 신규 용병 모집.
- `tabs/Tavern/TavernInteraction.tsx`: 용병 상세 상호작용(대화, 선물, 고용, 관리).
- `tabs/Dungeon/DungeonTab.tsx`: 던전 선택 및 파티 구성. 전략 파견과 직접 돌파 선택.
- `tabs/Dungeon/AssaultNavigator.tsx`: 직접 돌파 모드의 전술 내비게이터(D-Pad 및 전술 통신).
- `tabs/Simulation/SimulationTab.tsx`: 전투 밸런스 테스트 베드. 팀 편성 및 대량 시뮬레이션.

### Modals (팝업 시스템)
- `modals/EventModal.tsx`: 랜덤 월드 이벤트 처리.
- `modals/SleepModal.tsx`: 일일 결산 보고서 및 휴식 확인.
- `modals/JournalModal.tsx`: 전체 로그 기록 열람.
- `modals/DungeonResultModal.tsx`: 탐험 보상 및 경험치 획득 요약.
- `modals/CraftingResultModal.tsx`: 제작 완료 아이템의 품질 및 스탯 보너스 확인.
- `modals/MercenaryDetailModal.tsx`: 용병 페이퍼돌 장비 장착 및 능력치 투자.
- `modals/SettingsModal.tsx`: 시스템 메뉴 (저장/불러오기/타이틀로).
- `modals/SaveLoadModal.tsx`: 세이브 슬롯 관리 및 삭제/로드.
- `modals/ConfirmationModal.tsx`: 위험 작업 방지용 공용 확인창.

---

## 🎮 5. Phaser Game Engine (게임 엔진 - `game/`)

- `game/IntroScene.ts`: 시네마틱 오프닝. 드래곤 이펙트 및 나레이션 연출.
- `game/SmithingScene.ts`: 대장질 리듬 게임. 타격 판정, 빌렛 외형 변화, 온도 시스템.
- `game/WorkbenchScene.ts`: 바느질/목공 미니게임. 곡선 경로 추적 및 타이밍 타격.
- `game/MainForgeScene.ts`: 대장간 허브 시각화 및 오브젝트 상호작용 렌더링.
- `game/DungeonScene.ts`: 던전 탐험 가시화. 타일 렌더링, 플레이어 마커 이동, 안개 해제.

---

## 📊 6. Data & Configuration (데이터 및 설정)

### Database (`data/`)
- `data/equipment.ts`: 모든 장비 아이템의 기본 스탯, 레시피, 티어 정의.
- `data/materials.ts`: 원재료, 연료, 소비품, 퀘스트 아이템 데이터베이스.
- `data/mercenaries.ts`: 고정 이름(Named) 용병들의 초기 스탯 및 스프레이트 설정.
- `data/dungeons.ts`: 탐험 구역 정의 (몬스터 파워, 보상 테이블, 맵 크기).
- `data/nameData.ts`: 무작위 이름 생성을 위한 언어 데이터 세트.
- `data/market/market-catalog.ts`: 시장 판매 품목 및 초기 재고량.

### Config (`config/`)
- `config/game-config.ts`: 전역 에너지 소모량 설정.
- `config/derived-stats-config.ts`: 전투 공식 상수 (스탯당 HP, 공격력 증가량 등).
- `config/mastery-config.ts`: 제작 숙련도 레벨 및 보너스 수치.
- `config/contract-config.ts`: 용병 고용 비용 및 일당 계산 공식.
- `config/shop-config.ts`: 상점 방문 확률 및 손님 인내심 설정.
- `config/dungeon-config.ts`: 던전 에너지 회복 및 입장 제한.

---

## 📐 7. Models & Types (모델 및 타입 정의)

- `models/Mercenary.ts`: 용병 엔티티 인터페이스.
- `models/Stats.ts`: 기본/파생 스탯 계산 및 병합 로직.
- `models/Equipment.ts`: 아이템 객체 및 희귀도 정의.
- `models/JobClass.ts`: 직업별 스탯 가중치 및 공격 효율 정보.
- `models/Dungeon.ts`: 원정 및 던전 인스턴스 정보.
- `types/*.ts`: 시스템 전역에서 사용되는 상태, 컴포넌트 Props, 이벤트 타입.

# Project Map – Lockhart’s Forge (v0.1.46b)

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file.

---

## 🏗️ 1. Core & Infrastructure

### Root Directory
- `index.html`: Entry HTML. Defines **Grenze/Gotisch** plus **NanumMyeongjoEco** font integration, language-aware typography defaults, and Tailwind configuration.
- `index.tsx`: React entry point. Handles font readiness and web cache initialization.
- `App.tsx`: Central View Controller. Manages top-level state transitions (INTRO -> TITLE -> GAME).
- `utils.ts`: Global utilities. Asset URL generation, `AssetCache` singleton, and time formatting.
- `metadata.json`: App metadata and versioning (`0.1.46b`).
- `GAME_DESIGN.md`: Comprehensive game design document covering mechanics and world-building.
- `TECH_DESIGN.md`: Technical architecture and implementation details.
- `COMBAT_FORMULA.md`: Official combat calculation sequence and formulas.
- `PROBABILITY_SYSTEM.md`: RNG standardization rules.
- `ARCHITECTURE_POLICIES.md`: Economic balance, state transitions, and save migration policies.
- `PROJECT_MAP.md`: This document.
- `TODO.md`: Follow-up backlog for Korean typography, version-refresh handling, and helper/file review notes.
- `locales/en.ts`: English localization dictionary.
- `locales/ko.ts`: Korean localization dictionary.

### Configuration (`config/`)
- `config/game-config.ts`: General rules and energy costs (Repair, Shop, Craft).
- `config/smithing-config.ts`: Smithing difficulty, balancing, and judgment thresholds.
- `config/mastery-config.ts`: Crafting mastery thresholds (Novice/Adept/Artisan).
- `config/ui-config.ts`: Standardized modal layout and Z-index management.
- `config/contract-config.ts`: Hiring costs and wage formulas.
- `config/dungeon-config.ts`: Expedition energy and recovery constants.
- `config/derived-stats-config.ts`: Combat formulas and attribute scaling weights.
- `config/shop-config.ts`: Customer arrival intervals and patience timers.

---

## ⚛️ 2. State Management (`state/`)

### Core Logic
- `state/gameReducer.ts`: Primary state machine. Routes actions to modular handlers.
- `state/initial-game-state.ts`: Initial data structure for new saves. (Includes testing items).
- `state/actions.ts`: TypeScript definitions for all game actions.

### Reducer Modules (`state/reducer/`)
- `state/reducer/crafting.ts`: Start/Finish crafting, exp gain, and mastery tracking.
- `state/reducer/inventory.ts`: Item acquisition, consumption, selling, locking, and **Skill Application**.
- `state/reducer/mercenary.ts`: Scouting, hiring, stat allocation, gifting, named conversation answers, and relationship-based tavern progression.
- `state/reducer/expedition.ts`: Auto-expedition lifecycle and reward claiming.
- `state/reducer/manualDungeon.ts`: Grid movement, floor transitions, and **Immersive Narrative Logic**.
- `state/reducer/shop.ts`: Shop open/close, queue management, and customer refusal.
- `state/reducer/commission.ts`: Named recruitment contracts, board commissions, tavern minor contracts, named personal requests, boss trophy contracts, and reward application.
- `state/reducer/equipment.ts`: Equip/Unequip logic and level requirement checks.
- `state/reducer/research.ts`: Research combination logic for discovering blueprints.
- `state/reducer/market-affinity.ts`: Garrick relationship tracking.
- `state/reducer/repair.ts`: Forge facility restoration logic.
- `state/reducer/sleep.ts`: End-of-day cleanup, recovery, and daily financials.
- `state/reducer/events.ts`: Global event trigger and journal toggling.

---

## 🎨 3. UI Framework (`components/`)

### High-Level Layout
- `components/Header.tsx`: HUD for Day, Gold, Energy, and Log Ticker.
- `components/MainGameLayout.tsx`: Tab navigation, tutorial overlays, full-screen transitions, and document language sync (`lang`, `lang-ko`) for Korean typography.
- `components/DialogueBox.tsx`: The narrative engine. Handles typing effects and item tooltips.

### Functional Tabs (`components/tabs/`)
- **Forge Tab**: `ForgeTab.tsx`, `hooks/useForge.ts`. Featuring **floating overlay controls** and immersive background rendering.
- **Inventory Tab**: `InventoryDisplay.tsx`, `ItemSelectorList.tsx`. **Enchantment Mode implemented.**
- **Shop Tab**: `ShopTab.tsx`, `hooks/useShop.ts`. Immersive counter-view with floating 3D sign.
- **Market Tab**: `MarketTab.tsx`, `hooks/useMarket.ts`. Interaction view with **Garrick's animated sprite** and shopping cart drawer.
- **Tavern Tab**: `TavernTab.tsx`, `TavernInteraction.tsx`. **Immersive floating back button** and character focus mode.
- **Dungeon Tab**: `DungeonTab.tsx`. **Floating Back Overlay** (auto-hides during squad selection). Features `AssaultNavigator.tsx` and grid exploration.
- **Research Tab**: `ResearchTab.tsx`, hooks/useResearch.ts.
- **Simulation Tab**: SimulationTab.tsx.

### Modals (`components/modals/`)
- `modals/CraftingResultModal.tsx`: Mastery progress and stat gain display.
- `modals/DungeonResultModal.tsx`: XP radial gauges and loot summary.
- `modals/MercenaryDetailModal.tsx`: PaperDoll equipment and attribute management.
- `modals/SleepModal.tsx`: End-of-day financial report.
- `modals/SaveLoadModal.tsx`: Persistence slot management.
- `modals/SettingsModal.tsx`: System preferences and data controls.
- `modals/JournalModal.tsx`: Narrative log history.
- `modals/TierUnlockModal.tsx`: New crafting tier celebrations.
- `modals/ConfirmationModal.tsx`: Shared decision UI.

---

## 🎮 4. Game Engine & Visuals (`game/`, `components/common/`)

### Phaser Scenes
- `game/IntroScene.ts`: Cinematic prologue with Dragon sequence.
- `game/MainForgeScene.ts`: Interactive lobby for the forge.
- `game/SmithingScene.ts`: Timing-based forging minigame.
- `game/WorkbenchScene.ts`: Rhythm/Path-tracking workbench minigame.
- `game/DungeonScene.ts`: Grid-based exploration engine with dynamic fog and Red Focus FX.
- `game/SmithingTutorialHandler.ts`: Minigame-specific tutorial logic.

### UI Animation & Core Components (`components/common/ui/`)
- `components/common/ui/SfxButton.tsx`: **Global standardized button** with integrated audio triggers.
- `components/common/ui/AnimatedMercenary.tsx`: Handles eye-blinking and sprite rendering.
- `components/common/ui/MercenaryPortrait.tsx`: Multi-mode face-cropping for sprites.
- `components/common/ui/CustomSlider.tsx`: Precision input for audio levels.
- `components/tutorial/TutorialScene.tsx`: Narrative-driven prologue and furnace restoration.

---

## 💾 5. Data & Models (`data/`, `models/`)

### Business Models (`models/`)
- `models/Mercenary.ts`: Character definition and **Status Types (Injured/K.I.A)**.
- `models/Equipment.ts`: Item stats, rarity, and **Skill Slots (socketedSkillId)**.
- `models/Stats.ts`: Calculation logic for Primary and Derived combat attributes.
- `models/Monster.ts`: Enemy archetypes.
- `models/Dungeon.ts`: Map definitions and reward pools.
- `models/Skill.ts`: Combat skill definitions.

### Static Data (`data/`)
- `data/materials.ts`: The global material registry (including **Skill Manuals** and **Skill Scrolls**).
- `data/equipment/`: Tier-based recipe files (Tier 1-4).
- `data/monsters.ts`: Combat stat snapshots for all enemies.
- `data/monster-drops.ts`: Loot tables for manual/auto expeditions.
- `data/mercenaries.ts`: Named character data (Pip, Adeline, Sister Aria).
- `data/dialogue/tavernTalk.ts`: Data-driven tavern talk pool filtered by job, temperament, voice, and progress stage.
- `data/dialogue/namedConversationPrompts.ts`: Named-only question/answer prompts with affinity and relationship outcomes.
- `data/contracts/bossTrophies.ts`: Boss trophy registry used by rare public boss commission generation.
- `data/skills.ts`: Combat skill registry (Players & Monsters).
- `data/market/market-catalog.ts`: Garrick’s base stock configuration.

---

## 🛠️ 6. Logic & Utilities (`utils/`, `services/`, `hooks/`)

### Logic Engines
- `utils/craftingLogic.ts`: Level/EXP tables and equipment generation logic.
- `utils/combatLogic.ts`: Hit resolution, DPS, and **Combat Power (CP)** formulas.
- `utils/saveSystem.ts`: Version-validated LocalStorage persistence. (Global Settings support added).
- `utils/shopUtils.ts`: Tier-matched request logic and recipe weightings.
- `utils/mercenaryGenerator.ts`: Random trait and name assignment.
- `utils/random.ts`: Seeded RNG utility (LCG implementation).
- `utils/dropLogic.ts`: Standardized loot calculation engine.
- `utils/cacheManager.ts`: Automated web cache maintenance and version markers.
- `utils/i18n.ts`: Localization lookup utility with key-based translation, parameter interpolation, and translation existence checks.
- `state/helpers/tavernTalkHelpers.ts`: Tavern talk selection, weighting, and progress-stage filtering.
- `state/helpers/namedConversationHelpers.ts`: Named prompt selection and non-repeating conversation gating.

### Core Services (`services/`)
- `services/AssetManager.tsx`: Centralized asset loading and memory cache management.
- `services/AudioManager.tsx`: Headless Web Audio API controller for BGM/SFX.
- `services/shop/shop-service.ts`: Handles customer arrival intervals and queue processing.
- `services/dungeon/dungeon-service.ts`: Monitors auto-expedition completion timers.

---

## 🔄 Recent Updates (v0.1.46b)
*   **Architecture & Governance**:
    *   `ARCHITECTURE_POLICIES.md` established for economic balance, state transitions, and save migration.
    *   RNG standardization (seeded LCG) fully integrated across all game systems.
    *   Save migration logic implemented to handle version upgrades and field injection.
*   **Immersive Navigation Overhaul**:
    *   Traditional top headers removed in functional tabs for a full-screen background experience.
    *   Floating "Back" button overlay implemented with automatic visibility management during slot selection.
*   **Persistence Overhaul**:
    *   Global settings (Audio, UI) now persist independently of save slots.
    *   Language preference is stored in `settings.language` and shared across all saves.
    *   Save/load paths now normalize loaded state against the current initial-state shape for safer current-version restores.
    *   Startup cache initialization now fetches `metadata.json` with `no-store` semantics and silently reloads once when a newer deployed build is detected.
*   **Localization Foundation**:
    *   Key-value locale dictionaries introduced in `locales/en.ts` and `locales/ko.ts`.
    *   `utils/i18n.ts` added to resolve translated UI strings and formatted dialogue/log templates.
    *   Tavern, shop, and commission UI flows now support English/Korean switching while keeping item names and proper nouns in English.
    *   Korean UI now uses `NanumMyeongjoEco` as the Hangul-capable fallback while preserving the existing fantasy-styled English font stack.
*   **Conversation & Relationship Expansion**:
    *   Tavern talk is now data-driven and varies by job, temperament, voice, adventurer standing, and overall game progress.
    *   Named mercenaries can trigger non-repeating personal question prompts whose answers affect Affinity, Adventurer Standing, and relationship alignment.
    *   Strong alignment with certain named mercenaries can unlock personal requests and extended completion follow-up dialogue.
*   **Skill Knowledge**:
    *   Skill Manuals and Scrolls fully integrated into the economic and crafting cycles.

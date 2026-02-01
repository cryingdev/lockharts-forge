# Project Map – Lockhart’s Forge (v0.1.43b)

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file.

---

## 🏗️ 1. Core & Infrastructure

### Root Directory
- `index.html`: Entry HTML. Defines **Grenze/Gotisch** font integration and Tailwind configuration.
- `index.tsx`: React entry point. Handles font readiness and web cache initialization.
- `App.tsx`: Central View Controller. Manages top-level state transitions (INTRO -> TITLE -> GAME).
- `utils.ts`: Global utilities. Asset URL generation, `AssetCache` singleton, and time formatting.
- `metadata.json`: App metadata and versioning (`0.1.43b`).

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
- `state/reducer/mercenary.ts`: Scouting, hiring, stat allocation, and gifting.
- `state/reducer/expedition.ts`: Auto-expedition lifecycle and reward claiming.
- `state/reducer/manualDungeon.ts`: Grid movement, floor transitions, and **Immersive Narrative Logic**.
- `state/reducer/shop.ts`: Shop open/close, queue management, and customer refusal.
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
- `components/MainGameLayout.tsx`: Tab navigation, tutorial overlays, and full-screen transitions.
- `components/DialogueBox.tsx`: The narrative engine. Handles typing effects and item tooltips.

### Functional Tabs (`components/tabs/`)
- **Forge Tab**: `ForgeTab.tsx`, `hooks/useForge.ts`, and specialized UI components (`RecipeCard`, `MasteryRadialGauge`).
- **Inventory Tab**: `InventoryDisplay.tsx`, `ItemSelectorList.tsx`. **Enchantment Mode implemented.**
- **Shop Tab**: `ShopTab.tsx`, `hooks/useShop.ts`, and HUD/Overlay components.
- **Market Tab**: `MarketTab.tsx`, `hooks/useMarket.ts`, MarketCatalog.tsx, ShoppingCartDrawer.tsx.
- **Tavern Tab**: `TavernTab.tsx`, TavernInteraction.tsx (Character focus mode).
- **Dungeon Tab**: `DungeonTab.tsx`, AssaultNavigator.tsx, DungeonCombatView.tsx (Manual battle).
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
- `utils/cacheManager.ts`: Automated web cache maintenance and version markers.

### Core Services (`services/`)
- `services/AssetManager.tsx`: Centralized asset loading and memory cache management.
- `services/AudioManager.tsx`: Headless Web Audio API controller for BGM/SFX.
- `services/shop/shop-service.ts`: Handles customer arrival intervals and queue processing.
- `services/dungeon/dungeon-service.ts`: Monitors auto-expedition completion timers.

---

## 🔄 Recent Updates (v0.1.43b)
*   **Persistence Overhaul**:
    *   Global settings (Audio, UI) now persist independently of save slots.
    *   Save logic refined to ensure no transient UI state is leaked into persistent storage.
*   **Skill Knowledge**:
    *   Skill Manuals and Scrolls fully integrated into the economic and crafting cycles.
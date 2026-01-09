# Project Map – Lockhart’s Forge (v0.1.36)

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file.

---

## 🏗️ 1. Core & Infrastructure

### Root Directory
- `index.html`: Entry HTML. Defines **Grenze/Gotisch** font integration, viewport protections, and global CSS (hidden scrollbars, animations).
- `index.tsx`: React entry point. Ensures all web fonts are fully loaded before mounting to prevent layout shifting.
- `App.tsx`: Central View Controller. Manages the high-level state transitions (`INTRO -> TITLE -> GAME`) and handles save data hydration.
- `utils.ts`: Global utilities. Contains logic for Asset URI generation (with session-based caching) and `MM:SS` duration formatting.
- `metadata.json`: App metadata and permission configurations.
- `package.json` / `tsconfig.json` / `vite.config.ts`: Project build, dependency management, and TypeScript configurations.

### Framework Context
- `context/GameContext.tsx`: Global state provider. Connects the Reducer to the UI and includes auto-save triggers synchronized with the game's Day cycle.

---

## ⚛️ 2. State Management (`state/`)

### Core Reducer
- `state/gameReducer.ts`: The primary Reducer engine. Orchestrates various sub-handlers to process complex game actions.
- `state/actions.ts`: TypeScript definitions for every dispatchable action (e.g., `START_CRAFTING`, `MOVE_MANUAL_DUNGEON`).
- `state/initial-game-state.ts`: The "Genesis" state; defines the starting values for every new game.

### Action Handlers (`state/reducer/`)
- `inventory.ts`: Logic for item acquisition, consumption, sales, market purchases, and tier upgrades.
- `mercenary.ts`: Recruitment, firing, affinity gifts, dialogue processing, and stat allocation during level-ups.
- `crafting.ts`: Transitions between recipe selection and minigame results, including Crafting Mastery increments.
- `expedition.ts`: Strategic (Auto) deployment logic, reward calculation (Luck-based), and XP distribution.
- `manualDungeon.ts`: Direct Assault logic; handles grid generation, movement costs, and boss room transitions.
- `shop.ts`: Store state management (Open/Closed) and customer queue processing.
- `equipment.ts`: Mercenary paper-doll management; handles equipping/unequipping and requirement validation.
- `sleep.ts`: End-of-day financial settlement (wages), market restocking, energy recovery, and auto-save triggers.
- `events.ts`: Random world event triggers and Journal (Log) visibility toggles.
- `repair.ts`: Manual gold generation through energy-intensive "Cold Repair" work.

---

## ⚙️ 3. Logic & Math (`utils/`)

- `utils/combatLogic.ts`: **Central Combat Engine**. Calculates hit probabilities, critical hits, Expected DPS, and comprehensive **Combat Power (CP)**.
- `utils/craftingLogic.ts`: Forging result generation. Determines quality-based stat scaling and performance bonuses.
- `utils/saveSystem.ts`: Browser persistence logic. Manages 3 independent slots with version stamping and metadata previews.
- `utils/mercenaryGenerator.ts`: Procedural generation engine. Weights stats based on Job Class and handles unique NPC spawning.
- `utils/shopUtils.ts`: AI logic for generating customer requests based on mercenary class needs and affinity levels.
- `utils/nameGenerator.ts`: Combinatorial engine that pulls from `nameData.ts` to create unique wayfarer names.

---

## ⚛️ 4. UI Components (`components/`)

### Layout & Common
- `components/MainGameLayout.tsx`: The primary dashboard. Features tab navigation, the Golden Ratio Toast system, and background service loops.
- `components/Header.tsx`: Top HUD tracking Gold, Energy, Date, and the typewriter-style Log Ticker.
- `components/DialogueBox.tsx`: Narrative and interaction interface. Features typing effects and contextual choice buttons.
- `components/InventoryDisplay.tsx`: Inventory management UI. Detailed item views, quick-sell, and consumable usage.
- `components/IntroScreen.tsx`: React wrapper for the Phaser IntroScene; handles viewport scaling.
- `components/TitleScreen.tsx`: Main Menu. Entry point for New Game, Continue, and the Save Slot browser.

### Tabs (Functional Pages)
- `tabs/Forge/ForgeTab.tsx`: Crafting hub. Features recipe selection, mastery tracking, and the SVG **Mastery Radial** gauge.
- `tabs/Forge/SmithingMinigame.tsx`: Phaser wrapper for the rhythm-based hammer-and-anvil game.
- `tabs/Forge/WorkbenchMinigame.tsx`: Phaser wrapper for the precision-based stitching/woodworking game.
- `tabs/Forge/MainForgeCanvas.tsx`: Interactive 3D/2D visualization of the forge interior for room-based interactions.
- `tabs/Shop/ShopTab.tsx`: Shop management. Handle customers, negotiate prices, and toggle the shop sign.
- `tabs/Tavern/TavernTab.tsx`: Recruitment roster and visitor list.
- `tabs/Tavern/TavernInteraction.tsx`: Deep-dive interaction for mercenaries (Talk, Gift, Manage).
- `tabs/Dungeon/DungeonTab.tsx`: Expedition selection. Choose between Strategic (Auto) and Direct (Manual) Assault.
- `tabs/Dungeon/AssaultNavigator.tsx`: Tactical UI for manual dungeon control (D-Pad and comms).
- `tabs/Simulation/SimulationTab.tsx`: Combat balance environment. Team-based mass simulation and performance metrics.

### Modals (Popup System)
- `modals/EventModal.tsx`: Interface for random world events and choice consequences.
- `modals/SleepModal.tsx`: Daily financial report and rest confirmation.
- `modals/JournalModal.tsx`: Full-screen history viewer for action logs.
- `modals/DungeonResultModal.tsx`: Summary of loot found and XP gained after expeditions.
- `modals/CraftingResultModal.tsx`: Post-forge summary showing item quality and applied bonuses.
- `modals/MercenaryDetailModal.tsx`: Detailed unit management (Equipment Paper-Doll and Attribute investment).
- `modals/SettingsModal.tsx`: System menu (Save/Load/Quit).
- `modals/SaveLoadModal.tsx`: Visual browser for save slots with metadata and versioning.
- `modals/ConfirmationModal.tsx`: Generic safety prompt for destructive or critical actions.

---

## 🎮 5. Phaser Game Engine (`game/`)

- `game/IntroScene.ts`: Cinematic opening. Dragon effects and narrative presentation.
- `game/SmithingScene.ts`: Rhythm-based forging. Handles heat management, billet morphing, and strike timing.
- `game/WorkbenchScene.ts`: Stitching/Woodworking minigame. Path tracking and timing-based precision. **Now features dynamic hammer swing animation for nail-striking phases.**
- `game/MainForgeScene.ts`: Forge hub visualization and object-based interaction rendering.
- `game/DungeonScene.ts`: Dungeon exploration renderer. Grid visualization, fog-of-war, and player movement.

---

## 📊 6. Data & Configuration

### Database (`data/`)
- `data/equipment.ts`: Definitions for all gear, including base stats, recipes, and tier requirements.
- `data/materials.ts`: Database of ores, timber, fuels, consumables, and quest items.
- `data/mercenaries.ts`: Static data for "Unique/Named" wayfarers.
- `data/dungeons.ts`: Exploration zone definitions (Monster power, loot tables, map dimensions).
- `data/nameData.ts`: Language datasets for the procedural name generator.
- `data/market/market-catalog.ts`: Market inventory limits and base pricing.

### Config (`config/`)
- `config/game-config.ts`: Global energy costs and core rule constants.
- `config/derived-stats-config.ts`: Combat math constants (Stat-to-HP scaling, crit growth curves).
- `config/mastery-config.ts`: Level thresholds and quality bonuses for crafting experience.
- `config/contract-config.ts`: Wage calculation formulas and recruitment requirements.
- `config/shop-config.ts`: Probability and timing settings for the shop loop.
- `config/dungeon-config.ts`: Expedition energy recovery and entrance constraints.

---

## 📐 7. Models & Types

- `models/Mercenary.ts`: Mercenary entity interface.
- `models/Stats.ts`: Base/Derived stat calculation and merging logic.
- `models/Equipment.ts`: Item objects and rarity definitions.
- `models/JobClass.ts`: Class-based stat weighting and efficiency data.
- `models/Dungeon.ts`: Expedition and dungeon instance definitions.
- `types/*.ts`: System-wide types for state, component props, and events.

---

## 🔄 Recent Updates (v0.1.36)

*   **Tactical Camera Overhaul (Direct Assault)**:
    *   **Three-Tier Camera Control**: Added a cycle toggle between **Locked**, **Adaptive**, and **Free** modes.
    *   **Delayed Intelligence**: 1-second movement delay before tracking.
*   **Workbench Enhancement**:
    *   **Hammer Mechanics**: Phase 1 & 3 now include a dynamic `hammer.png` animation.
    *   **Strike Logic**: The hammer flies from an upper offset and rotates from 5° to -30° upon impact with nail heads.
*   **System & Maintenance**:
    *   Version incremented to `v0.1.36`.
    *   Fixed UI overflow in mobile confirmation modals.

# Project Map – Lockhart’s Forge (v0.1.39)

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file.

---

## 🏗️ 1. Core & Infrastructure

### Root Directory
- `index.html`: Entry HTML. Defines **Grenze/Gotisch** font integration, viewport protections, and global CSS (hidden scrollbars, animations).
- `index.tsx`: React entry point. Ensures all web fonts are fully loaded before mounting.
- `App.tsx`: Central View Controller. Manages the high-level state transitions (`INTRO -> TITLE -> GAME`) and handles save data hydration.
- `utils.ts`: Global utilities. Contains logic for Asset URI generation and duration formatting.
- `metadata.json`: App metadata and permission configurations.

### Configuration (`config/`)
- `config/game-config.ts`: General rules and energy consumption values.
- `config/ui-config.ts`: Global UI layout constants, standardized modal dimensions, and Z-index management.
- `config/mastery-config.ts`: Crafting mastery thresholds and bonuses.
- `config/dungeon-config.ts`: Expedition energy and recovery rules.
- `config/contract-config.ts`: Mercenary hiring costs and wage calculations.
- `config/derived-stats-config.ts`: Combat formulas and attribute scaling.

---

## ⚛️ 2. State Management (`state/`)

### Core Reducer
- `state/gameReducer.ts`: Primary state engine. Orchestrates sub-handlers for all game actions.
- `state/actions.ts`: TypeScript definitions for dispatchable actions.
- `state/initial-game-state.ts`: Default values for new game sessions. Includes `settings` for user preferences (UI view modes, log ticker).

### Action Handlers (`state/reducer/`)
- `inventory.ts`: Item acquisition, market purchases, and tier upgrades.
- `mercenary.ts`: Recruitment, affinity, and attribute point allocation.
- `crafting.ts`: Transitions between recipes and minigame results.
- `expedition.ts`: Strategic deployment and reward calculation.
- `manualDungeon.ts`: Direct Assault logic, grid movement, and boss transitions.
- `shop.ts`: Counter management and customer queue processing.
- `sleep.ts`: End-of-day settlement and state resets.

---

## ⚛️ 3. UI Components (`components/`)

### Layout & Common
- `components/MainGameLayout.tsx`: Primary dashboard. Handles tab navigation and the **Tutorial Overlay System**.
- `components/Header.tsx`: Top HUD optimized for **Mobile Portrait** with adaptive font scaling and conditional log ticker rendering.
- `components/DialogueBox.tsx`: Narrative interface with typewriter effects and contextual choices.
- `components/ItemSelectorList.tsx`: Reusable inventory browser with grid/list toggles synced to global settings.

### Tabs (Functional Pages)
- `tabs/forge/ForgeTab.tsx`: Crafting hub acting as an assembler for modular forge UI units.
- `tabs/Tavern/TavernTab.tsx`: Roster management and visitor interactions.
- `tabs/Market/MarketTab.tsx`: Supply procurement and affinity-based facility upgrades.
- `tabs/Dungeon/DungeonTab.tsx`: Expedition selection for Auto/Manual modes.
- `tabs/Dungeon/AssaultNavigator.tsx`: Tactical D-Pad UI with **3-Tier Camera Control**.
- `tabs/Simulation/SimulationTab.tsx`: Combat balance testing ground with bulk and live match analysis.

### Forge Tab (Modular Architecture)
- `tabs/forge/ForgeTab.tsx`: Main view assembler for the crafting system.
- `tabs/forge/hooks/useForge.ts`: Central logic hook for recipe filtering, materials validation, and minigame state management.
- `tabs/forge/ui/ForgeSkillHeader.tsx`: Smithing and Workbench level progress displays with Tier tracking.
- `tabs/forge/ui/ForgeStatsGrid.tsx`: Visual layout for equipment combat and bonus attributes.
- `tabs/forge/ui/RecipeCard.tsx`: Individual recipe item with favorite toggles and inventory tracking.
- `tabs/forge/ui/MasteryRadialGauge.tsx`: Circular mastery progress and high-fidelity item visualizer.
- `tabs/forge/ui/QuickCraftOverlay.tsx`: Processing overlay for high-mastery automated crafting.
- `tabs/forge/ui/RecipeTooltip.tsx`: Contextual material requirements and inventory lookup UI.
- `tabs/forge/ui/SmithingMinigame.tsx`: Phaser-based rhythm forging interface with heat management.
- `tabs/forge/ui/WorkbenchMinigame.tsx`: Phaser-based precision assembly interface with path-tracking.
- `tabs/forge/ui/MainForgeCanvas.tsx`: Interactive world viewport for the forge environment (Furnace, Anvil).

### Shop Tab (Domain-Specific Structure)
- `tabs/shop/ShopTab.tsx`: Shop view assembler. Orchestrates domain-specific hooks and UI fragments.
- `tabs/shop/hooks/useShop.ts`: Shop business logic, including customer queue management, sale execution, and tutorial flow.
- `tabs/shop/ui/ShopSign.tsx`: Interactive sign component with 3D flip animation for shop status.
- `tabs/shop/ui/BlinkingMercenary.tsx`: Animated mercenary sprite renderer with eye-blink logic.
- `tabs/shop/ui/CustomerHUD.tsx`: Customer status display (HP/MP, Affinity) with reactive animations.
- `tabs/shop/ui/ShopQueueBadge.tsx`: Visual indicator for the number of customers waiting in line.
- `tabs/shop/ui/ShopClosedOverlay.tsx`: Full-screen overlay for closed status or energy exhaustion.
- `tabs/shop/ui/InstanceSelectorPopup.tsx`: Detailed item selection modal with stats inspection and lock toggles.

### Tutorial System
- `tutorial/TutorialScene.tsx`: Narrative-driven introduction focusing on the furnace restoration. (Relocated to dedicated tutorial folder)

### Modals (Popup System)
- `modals/ConfirmationModal.tsx`: Safety prompts with **Mobile-Stacking** button layouts.
- `modals/CraftingResultModal.tsx`: Post-forge summary with animated Mastery progress.
- `modals/SettingsModal.tsx`: System settings and save/load management. Includes UI customization toggles.
- `modals/SaveLoadModal.tsx`: Browser for save slots with metadata previews and version validation.
- `modals/TierUnlockModal.tsx`: Celebration UI for crafting progression.
- `modals/TutorialCompleteModal.tsx`: Summary of unlocked systems post-guide.

---

## 4. Phaser Game Engine (`game/)

- `game/SmithingScene.ts`: Rhythm-based forging with billet morphing.
- `game/WorkbenchScene.ts`: Precision stitching with path-tracking and hammer strike animations.
- `game/DungeonScene.ts`: Manual exploration renderer with fog-of-war and **Delayed Tracking Camera**.
- `game/IntroScene.ts`: Narrative prologue with dynamic camera shake and breath-fire effects.
- `game/MainForgeScene.ts`: Interactive world map for the forge interior.

---

## 🔄 Recent Updates (v0.1.39)

*   **Forge Tab Modularization**: 
    *   Renamed folder to lowercase `forge`.
    *   Moved business logic to `tabs/forge/hooks/useForge.ts`.
    *   Separated UI components into `tabs/forge/ui/` for improved maintainability.
*   **Tutorial Scene Relocation**: Moved `TutorialScene.tsx` to `components/tutorial/` to separate narrative content from core facilities.
*   **Shop Tab Architectural Refactoring**: 
    *   Decomposed `ShopTab.tsx` into modular UI fragments.
    *   Integrated `useShop` hook for centralized state.
*   **UI Consolidation**: Standardized modal layout and Z-index management in `config/ui-config.ts`.
*   **System**: Version incremented to `v0.1.39`.
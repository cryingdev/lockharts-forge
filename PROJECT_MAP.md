
# Project Map – Lockhart’s Forge (v0.1.37)

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file.

---

## 🏗️ 1. Core & Infrastructure

### Root Directory
- `index.html`: Entry HTML. Defines **Grenze/Gotisch** font integration, viewport protections, and global CSS (hidden scrollbars, animations).
- `index.tsx`: React entry point. Ensures all web fonts are fully loaded before mounting.
- `App.tsx`: Central View Controller. Manages the high-level state transitions (`INTRO -> TITLE -> GAME`) and handles save data hydration.
- `utils.ts`: Global utilities. Contains logic for Asset URI generation and duration formatting.
- `metadata.json`: App metadata and permission configurations.

---

## ⚛️ 2. State Management (`state/`)

### Core Reducer
- `state/gameReducer.ts`: Primary state engine. Orchestrates sub-handlers for all game actions.
- `state/actions.ts`: TypeScript definitions for dispatchable actions.
- `state/initial-game-state.ts`: Default values for new game sessions.

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
- `components/Header.tsx`: Top HUD optimized for **Mobile Portrait** with adaptive font scaling.
- `components/DialogueBox.tsx`: Narrative interface with typewriter effects and contextual choices.
- `components/DialogueBox.tsx`: (Internal) Improved item preview tooltips for Shop requests.

### Tabs (Functional Pages)
- `tabs/Forge/ForgeTab.tsx`: Crafting hub with Mastery Radial gauges.
- `tabs/Forge/TutorialScene.tsx`: Narrative-driven introduction focusing on the furnace restoration.
- `tabs/Shop/ShopTab.tsx`: Store management with character-depth-aware heart animations.
- `tabs/Tavern/TavernTab.tsx`: Roster management and visitor interactions.
- `tabs/Dungeon/DungeonTab.tsx`: Expedition selection for Auto/Manual modes.
- `tabs/Dungeon/AssaultNavigator.tsx`: Tactical D-Pad UI with **3-Tier Camera Control**.

### Modals (Popup System)
- `modals/ConfirmationModal.tsx`: Safety prompts with **Mobile-Stacking** button layouts.
- `modals/CraftingResultModal.tsx`: Post-forge summary with animated Mastery progress.
- `modals/MercenaryDetailModal.tsx`: Unit management and equipment paper-doll.
- `modals/SaveLoadModal.tsx`: Browser for save slots with metadata previews.

---

## 🎮 4. Phaser Game Engine (`game/`)

- `game/SmithingScene.ts`: Rhythm-based forging with billet morphing.
- `game/WorkbenchScene.ts`: Precision stitching with path-tracking and hammer strike animations.
- `game/DungeonScene.ts`: Manual exploration renderer with fog-of-war and **Delayed Tracking Camera**.

---

## 🔄 Recent Updates (v0.1.37)

*   **Mobile Optimization**: Header and Modals refined for 320px+ screens.
*   **Layering Fix**: Affinity hearts in Shop now render behind character sprites.
*   **Tutorial Polish**: Integrated the prologue sequence and furnace ignition steps.
*   **System**: version incremented to `v0.1.37`.

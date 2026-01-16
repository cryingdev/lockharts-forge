
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

---

## ⚛️ 2. State Management (`state/`)

### Core Reducer
- `state/gameReducer.ts`: Primary state engine. Orchestrates sub-handlers for all game actions.
- `state/actions.ts`: TypeScript definitions for dispatchable actions.
- `state/initial-game-state.ts`: Default values for new game sessions. Includes `settings` for user preferences (UI view modes, log ticker).

---

## ⚛️ 3. UI Components (`components/`)

### Tabs (Functional Pages)
- `tabs/forge/ForgeTab.tsx`: Main view assembler for the crafting system.
- `tabs/forge/hooks/useForge.ts`: Central logic hook for smithing and workbench.
- `tabs/forge/ui/`: Modular UI fragments for the forge (Gauges, Cards, Stats).

- `tabs/market/MarketTab.tsx`: Main view assembler for the supply system.
- `tabs/market/hooks/useMarket.ts`: Central logic hook for procurement, affinity, and cart management.
- `tabs/market/ui/MarketCatalog.tsx`: Grid-based supply browser with tier filtering.
- `tabs/market/ui/MarketItemCard.tsx`: Interactive tile for material acquisition.
- `tabs/market/ui/GarrickSprite.tsx`: Animated vendor interface with reactive heart effects.
- `tabs/market/ui/ShoppingCartDrawer.tsx`: Overlay for settlement and bulk purchase validation.
- `tabs/market/ui/MarketTutorialOverlay.tsx`: Contextual narrative guide for initial restoration.

- `tabs/shop/ShopTab.tsx`: Shop view assembler with modular fragments.
- `tabs/shop/hooks/useShop.ts`: Business logic for customer queue and sales.

- `tabs/Tavern/TavernTab.tsx`: Roster management and visitor interactions.
- `tabs/Dungeon/DungeonTab.tsx`: Expedition selection for Auto/Manual modes.
- `tabs/Simulation/SimulationTab.tsx`: Combat balance testing ground.

### Tutorial System
- `tutorial/TutorialScene.tsx`: Narrative-driven introduction focusing on the furnace restoration.

---

## 4. Phaser Game Engine (`game/)
- `game/SmithingScene.ts`: Rhythm-based forging with billet morphing.
- `game/WorkbenchScene.ts`: Precision stitching with path-tracking.
- `game/DungeonScene.ts`: Manual exploration renderer with fog-of-war.
- `game/IntroScene.ts`: Narrative prologue with dynamic camera shake.
- `game/MainForgeScene.ts`: Interactive world map for the forge interior.

---

## 🔄 Recent Updates (v0.1.39)
*   **Market Tab Modularization**: 
    *   Renamed folder to lowercase `market`.
    *   Business logic moved to `useMarket.ts`.
    *   UI components decomposed into `/ui/` sub-directory.
*   **Forge Tab Modularization**: Standardized structure with hooks and fragments.
*   **System**: Version incremented to `v0.1.39`.

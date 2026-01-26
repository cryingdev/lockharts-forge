# Project Map – Lockhart’s Forge (v0.1.41a)

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file.

---

## 🏗️ 1. Core & Infrastructure

### Root Directory
- `index.html`: Entry HTML. Defines **Grenze/Gotisch** font integration, viewport protections, and global CSS.
- `index.tsx`: React entry point. Handles web cache initialization and font loading before mounting.
- `App.tsx`: Central View Controller. Manages top-level state transitions (`INTRO -> TITLE -> GAME`).
- `utils.ts`: Global utilities. Asset URL generation and formatting helpers.
- `metadata.json`: App metadata and versioning.

### Configuration (`config/`)
- `config/game-config.ts`: General rules and energy costs.
- `config/smithing-config.ts`: Difficulty parameters and probability balancing for smithing.
- `config/ui-config.ts`: Standardized modal layout and Z-index specs.
- `config/contract-config.ts`: Hiring costs and wage formulas.
- `config/dungeon-config.ts`: Expedition energy and recovery constants.
- `config/mastery-config.ts`: Crafting mastery thresholds and bonus definitions.
- `config/derived-stats-config.ts`: Combat formulas and stat scaling coefficients.

---

## ⚛️ 2. State Management & Data (`state/`, `models/`, `data/`)

### Core State Engine
- `state/gameReducer.ts`: Primary state machine.
- `state/reducer/`: Modularized handlers (repair, crafting, mercenary, expedition, shop, etc.).
- `state/actions.ts`: Dispatchable action type definitions.
- `state/initial-game-state.ts`: Initial data structure for new saves.

### Business Models (`models/`)
- `models/Mercenary.ts`: Characters, vitals, and relationship structures.
- `models/Equipment.ts`: Equipment specs and durability logic.
- `models/Stats.ts`: Combat stat calculation (Primary & Derived).
- `models/Skill.ts`: Combat skill definitions.
- `models/Monster.ts`: Monster data structures.
- `models/Dungeon.ts`: Dungeon and reward definitions.

### Game Data Repository (`data/`)
- `data/mercenaries.ts`: Named NPC definitions.
- `data/materials.ts`: Database of resources and special materials.
- `data/monsters.ts`: Monster combat stats.
- `data/dungeons.ts`: Tiered dungeon and floor layouts.
- `data/equipment/`: Tiered equipment templates (Tier 1-4).

---

## ⚛️ 3. UI Components (`components/`)

### Common UI (`components/common/ui/`)
Shared visual fragments used across multiple modules.
- `AnimatedMercenary.tsx`: Dynamic character rendering with blinking animation logic.
- `MercenaryPortrait.tsx`: Cropped portrait rendering for HUDs and lists.

### Modular Tabs (`components/tabs/`)
Functional pages following the Hooks/UI separation pattern.
- `tabs/forge/`: The crafting interface.
    - `hooks/useForge.ts`: Crafting business logic.
    - `ui/`: Sub-components for smithing/workbench interaction.
- `tabs/market/`: Garrick's store.
    - `hooks/useMarket.ts`: Procurement and affinity logic.
    - `ui/`: Shopping cart and catalog interface.
- `tabs/shop/`: Customer counter.
    - `hooks/useShop.ts`: Sales queue and pricing logic.
    - `ui/`: Counter interface and customer HUD.

### Mercenary Management (`components/mercenary/`)
- `MercenaryPaperDoll.tsx`: Visual equipment management.
- `MercenaryStatsPanel.tsx`: Attribute allocation.
- `EquipmentInventoryList.tsx`: Gear selection and filtering.

---

## 🎮 4. Game Logic & Systems (`hooks/`, `services/`, `utils/`)

### Background Services
- `services/shop/shop-service.ts`: Customer arrival and patience logic.
- `services/dungeon/dungeon-service.ts`: Auto-expedition timer monitoring.

### Logic Hooks
- `hooks/useSimulation.ts`: Combat analysis engine.
- `hooks/useMercenaryDetail.ts`: Reactive state for character inspection.

### Core Utilities
- `utils/saveSystem.ts`: Version-validated persistence.
- `utils/combatLogic.ts`: CP formulas and hit resolution.
- `utils/craftingLogic.ts`: Experience curves and equipment generation.
- `utils/cacheManager.ts`: Web cache and storage maintenance.

---

## ⚙️ 5. Phaser Game Engine (`game/`)

- `game/SmithingScene.ts`: Smithing minigame core.
- `game/SmithingTutorialHandler.ts`: Phase-based tutorial logic for Phaser.
- `game/WorkbenchScene.ts`: Precision crafting core.
- `game/DungeonScene.ts`: Manual assault renderer.

---

## 🔄 Recent Updates (v0.1.41a)
*   **Project Mapping**: Fully synchronized structural map with versioned modularity.
*   **Shared UI**: Standardized character rendering via `common/ui/`.
*   **System Integrity**: Version alignment across all configuration and persistent storage modules.
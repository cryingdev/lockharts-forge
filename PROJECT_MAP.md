# Project Map – Lockhart’s Forge (v0.1.40)

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
- `config/game-config.ts`: Energy costs and global game loop constants.
- `config/smithing-config.ts`: Centralized difficulty parameters and probability bias for the smithing minigame.
- `config/ui-config.ts`: Standardized modal layout specs and Z-index management.
- `config/contract-config.ts`: Hiring costs and wage calculation logic.
- `config/dungeon-config.ts`: Expedition energy and recovery rules.
- `config/mastery-config.ts`: Thresholds for Adept/Artisan mastery and associated stat bonuses.
- `config/derived-stats-config.ts`: Combat formulas and stat scaling coefficients.

---

## ⚛️ 2. State Management & Data (`state/`, `models/`, `data/`)

### Core State Engine
- `state/gameReducer.ts`: Primary state engine. Orchestrates sub-handlers for all game actions.
- `state/reducer/`: Modularized reducer handlers (repair, inventory, crafting, mercenary, expedition, shop, etc.).
- `state/actions.ts`: TypeScript definitions for dispatchable actions.
- `state/initial-game-state.ts`: Default values for new game sessions.

### Business Models (`models/`)
- `models/Mercenary.ts`: Structure for characters, vitals, and relationships.
- `models/Equipment.ts`: Equipment specs, stats, and durability logic.
- `models/Stats.ts`: Primary and Derived combat stat calculation logic.
- `models/Skill.ts`: Combat skill definitions.
- `models/Monster.ts`: Boss and mob data structures.
- `models/Dungeon.ts`: Dungeon layout and reward definitions.

### Game Data Repository (`data/`)
- `data/mercenaries.ts`: Named NPC roster definitions.
- `data/materials.ts`: Expanded database including basic resources and **Special Tier 3/4 Materials** (Sunstone, Storm Cores, Dragon Scales, etc.).
- `data/monsters.ts`: Combat stats for all dungeon inhabitants.
- `data/monster-drops.ts`: Loot tables mapping materials to specific monsters.
- `data/dungeons.ts`: Tiered dungeon definitions and manual grid settings.

### Equipment Database (`data/equipment/`)
- `data/equipment/tier1.ts`: Basic copper and bronze starter gear.
- `data/equipment/tier2.ts`: Iron and Silver mid-tier equipment.
- `data/equipment/tier3.ts`: Gold, Ironwood, and **Special Variant** (Monster Part) Tier 3 items.
- `data/equipment/tier4.ts`: Mithril and **Legendary Special** Tier 4 items.
- `data/equipment/constants.ts`: Shared subcategory definitions and Tier-to-Level mappings.
- `data/equipment.ts`: Consolidation point for all tiered equipment exports.

---

## ⚛️ 3. UI Components (`components/`)

### Modular Tabs (Functional Pages)
Tabs follow a consistent structure with `/hooks/` for business logic and `/ui/` for visual fragments.

- `tabs/forge/`: Crafting system.
    - `hooks/useForge.ts`: Logic for smithing, workbench, and quick-crafting.
    - `ui/`: Mastery gauges, stats grids, and minigame wrappers.
- `tabs/market/`: Supply and Procurement.
    - `hooks/useMarket.ts`: Logic for procurement, affinity, and cart management.
    - `ui/`: Item cards, shopping cart, and Garrick vendor interface.
- `tabs/shop/`: Sales and Customer Interaction.
    - `hooks/useShop.ts`: Business logic for customer queue and pricing.
    - `ui/`: Counter interface, sign toggle, and HUD.
- `tabs/tavern/`: Roster management.
- `tabs/Dungeon/`: Expedition deployment.
- `tabs/Simulation/`: Combat analytics.

### Mercenary System (`components/mercenary/`)
Dedicated UI for character management.
- `MercenaryPaperDoll.tsx`: Visual equipment slot management.
- `MercenaryStatsPanel.tsx`: Attribute allocation and combat stat display.
- `EquipmentInventoryList.tsx`: Filtering and equipping gear.

---

## 🎮 4. Game Logic & Hooks (`hooks/`, `utils/`)

### Logic Hooks (`hooks/`)
- `hooks/useSimulation.ts`: High-performance combat simulation engine.
- `hooks/useMercenaryDetail.ts`: Reactive state management for the character inspection modal.

### System Utilities
- `utils/saveSystem.ts`: Slot-based persistence with version validation.
- `utils/combatLogic.ts`: Unified combat result and Combat Power (CP) formulas.
- `utils/craftingLogic.ts`: Experience curves, quality generation, and equipment generation.
- `utils/mercenaryGenerator.ts`: Procedural NPC generation logic.

---

## ⚙️ 5. Phaser Game Engine (`game/`)

- `game/SmithingScene.ts`: Rhythm-based forging with billet morphing.
- `game/SmithingTutorialHandler.ts`: Logic handler for complex tutorial branching in smithing.
- `game/WorkbenchScene.ts`: Precision stitching with path-tracking.
- `game/DungeonScene.ts`: Manual exploration renderer with fog-of-war.
- `game/MainForgeScene.ts`: Interactive world map for the forge interior.

---

## 🔄 Recent Updates (v0.1.40)
*   **Specialized Crafting**: Integrated 30+ new Tier 3 and Tier 4 special items requiring rare monster drops.
*   **Modular Architecture**: Fully aligned Forge, Shop, and Market tabs to the hook/ui pattern.
*   **Refinement**: Centralized smithing config and introduced tutorial logic handlers.
*   **System**: Version incremented to `v0.1.40`.
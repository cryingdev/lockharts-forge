
# Project Map – Lockhart’s Forge (v0.1.42a)

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file.

---

## 🏗️ 1. Core & Infrastructure

### Root Directory
- `index.html`: Entry HTML. Defines **Grenze/Gotisch** font integration.
- `index.tsx`: React entry point. Handles web cache initialization.
- `App.tsx`: Central View Controller. Manages top-level state transitions.
- `utils.ts`: Global utilities. Asset URL generation.
- `metadata.json`: App metadata and versioning (`0.1.42a`).

### Configuration (`config/`)
- `config/game-config.ts`: General rules and energy costs.
- `config/smithing-config.ts`: Smithing difficulty parameters.
- `config/ui-config.ts`: Standardized modal layout.
- `config/contract-config.ts`: Hiring costs and wage formulas.
- `config/dungeon-config.ts`: Expedition energy and recovery constants.

---

## ⚛️ 2. State Management & Data (`state/`, `models/`, `data/`)

### Core State Engine
- `state/gameReducer.ts`: Primary state machine.
- `state/reducer/`: Modularized handlers.
    - `manualDungeon.ts`: Grid generation, movement, and **Immersive Narrative Logic**.
    - `expedition.ts`: Auto-expedition results and status updates.
    - `research.ts`: Alchemical combination logic.
- `state/initial-game-state.ts`: Initial data structure for new saves.

### Business Models (`models/`)
- `models/Mercenary.ts`: Characters, vitals, and **Status Types (Injured/Dead)**.
- `models/Stats.ts`: Combat stat calculation (Primary & Derived).

---

## ⚛️ 3. UI Components (`components/`)

### Modular Tabs (`components/tabs/`)
- `tabs/Dungeon/`: Tactical Assault system.
    - `DungeonTab.tsx`: Mission overview and **Squad Assembly with Casualty UI**.
    - `AssaultNavigator.tsx`: Manual dungeon UI with **Narrative Dialogue Hub**.
    - `DungeonCombatView.tsx`: Turn-based manual battle system.

### Mercenary Management (`components/mercenary/`)
- `MercenaryPaperDoll.tsx`: Visual equipment management.
- `MercenaryStatsPanel.tsx`: Attribute allocation.

---

## 🎮 4. Game Logic & Systems (`hooks/`, `services/`, `utils/`)

### Core Utilities
- `utils/saveSystem.ts`: Version-validated persistence (`0.1.42a`).
- `utils/combatLogic.ts`: CP formulas and hit resolution.
- `utils/cacheManager.ts`: Web cache maintenance.

---

## 🔄 Recent Updates (v0.1.42a)
*   **Narrative Immersion**:
    *   Shifted Manual Dungeon feedback from technical AI logs to "Inner Voice" and "Exploration Logs".
    *   Environmental descriptions added to movement and interaction events.
*   **Casualty Visibility**:
    *   Implemented "Injured" and "K.I.A" status overlays in squad slots and mercenary picker.
*   **Version Synchronization**:
    *   Updated across all metadata and UI systems to `0.1.42a`.

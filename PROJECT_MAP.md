# Project Map – Lockhart’s Forge

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file as of **v0.1.31**.

---

## 📂 Project Hierarchy

### 🏗️ Core Application
- `index.html`: Entry HTML with global CSS, Tailwind, and Import Maps.
- `index.tsx`: React entry point; mounts the application.
- `App.tsx`: Main view controller (Intro -> Title -> Game).
- `metadata.json`: App metadata and permissions.
- `utils.ts`: Global utilities (Asset URL generation with caching).

### 🎮 Game Engine (Phaser 3)
- `game/IntroScene.ts`: Cinematic introduction with narrative text and effects.
- `game/MainForgeScene.ts`: The physical forge environment; interactive anvil and furnace slots.
- `game/SmithingScene.ts`: The core forging minigame; manages thermal logic and progressive visuals.

### ⚛️ UI Layer (React)
- **Framework**
  - `context/GameContext.tsx`: Global state provider and action dispatcher.
  - `components/MainGameLayout.tsx`: Main dashboard with tab navigation.
  - `components/Header.tsx`: Persistent status bar (Energy, Gold, Day, Logs).

- **Tabs (Features)**
  - `components/tabs/Forge/`: Crafting hub, Main Forge canvas, and minigame wrappers (Smithing, Workbench).
  - `components/tabs/Shop/`: Interaction with wandering customers; counter mechanics.
  - `components/tabs/Tavern/`: Mercenary recruitment, gifting, and detail inspection.
  - `components/tabs/Market/`: Resource procurement and forge upgrades.
  - `components/tabs/Dungeon/`: Expedition preparation and party deployment.
  - `components/tabs/Simulation/`: Combat analytics and tactical debugging.

- **Modals & Overlays**
  - `components/modals/`: Specialized dialogs for Events, Sleeping (EOD Report), Journal (History), Results (Crafting/Dungeon), and Mercenary Management.
  - `components/DialogueBox.tsx`: Dynamic narrative and choice component.

### ⚙️ State Management (Reducer Pattern)
- `state/actions.ts`: Type definitions for all game actions.
- `state/gameReducer.ts`: Root reducer delegating to specialized handlers.
- `state/initial-game-state.ts`: Default state values.
- `state/reducer/`: Logic handlers for individual subsystems (Inventory, Shop, Expeditions, etc.).

### 📊 Models & Data
- `models/`: Interface definitions for domain entities (Mercenaries, Equipment, Stats).
- `data/`: Static game data including Items, Recipes, Dungeons, and Mercenary archetypes.

### 🛠️ Infrastructure & Services
- `services/`: Background logic for time-based events (Shop arrivals, Expedition timers).
- `utils/`: Complex logic functions (Combat formulas, Procedural generation, Crafting results).
- `hooks/`: Custom React hooks (e.g., `useSimulation`).

### 📦 Configuration
- `config/`: Constant parameters for balancing (Energy costs, Mastery thresholds, Stat curves).

---

## 📜 Functional Specification

### 1. The Thermal Smithing System
Located in `game/SmithingScene.ts`, the forge simulates heat dissipation.
- **Ignition**: Forge must be > 0°C to use the bellows. Fuel (Charcoal/Coal) is required to start from cold.
- **Quality**: Determined by hit accuracy and maintaining optimal temperature stages.

### 2. Shop Interaction
Handled by `services/shop/shop-service.ts` and `ShopTab.tsx`.
- **Procedural Requests**: Customers (known mercenaries) arrive and request specific equipment based on their Job Class.
- **Patience**: Customers will eventually leave if not served.

### 3. Mercenary Progression
Controlled by `models/Stats.ts` and `mercenaryGenerator.ts`.
- **Combat Power (CP)**: A derived value balancing DPS (Offense) and Effective HP (Defense).
- **Affinity**: Increased via trading and gifting; required for recruitment.

### 4. Expedition Loop
Managed by `services/dungeon/dungeon-service.ts` and `DungeonTab.tsx`.
- **Asynchronous**: Expeditions run in real-time. Results depend on party CP and Luck stats.

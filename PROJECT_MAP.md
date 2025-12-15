
# Project Map – Lockhart’s Forge

This document describes the **current structural map** of the Lockhart’s Forge project.

## Purpose

- Help AI assistants and developers quickly understand how the project is organized
- Clarify the responsibility of each folder and major file
- Prevent incorrect assumptions about missing systems or architecture

## Non-Goals

This document is **not**:

- A refactoring proposal  
- A future architecture plan  
- A feature roadmap  

It only reflects the **current, transitional** state of the project.

---

## Game Concept & Narrative Context

Lockhart’s Forge is a dark fantasy, blacksmith-centered management game.

- The player is the child of a blacksmith whose village and family were destroyed by a dragon.
- The player does **not** fight directly.
- Progress is achieved by rebuilding the forge, crafting and selling equipment, managing relationships with visitors, hiring companions, and sending parties to explore dungeons for materials.
- The long-term narrative goal is to prepare for a confrontation with the dragon responsible for the village’s destruction.

Narrative role of systems:

- **Crafting**: Core player expression and mastery  
- **NPC Relationships**: Trust, reputation, and long-term progression  
- **Parties & Dungeons**: Indirect conflict and material acquisition  
- **GameState**: A record of time, progress, and consequences  

---

## Current File & Folder Structure (High-Level)

```txt
App.tsx             (View Manager: Intro -> Title -> Game)
index.tsx
utils.ts            (legacy/general helpers, to be split later)

components/
  DialogueBox.tsx
  EventModal.tsx
  ForgeTab.tsx
  Header.tsx
  IntroScreen.tsx   (Wraps IntroScene)
  InventoryDisplay.tsx
  JournalModal.tsx
  MainForgeCanvas.tsx
  MainGameLayout.tsx (The main gameplay UI wrapper)
  MarketTab.tsx
  ShopManager.tsx
  ShopTab.tsx
  SleepModal.tsx
  SmithingMinigame.tsx
  TavernTab.tsx
  TitleScreen.tsx   (New Game / Menu)

config/
  contract-config.ts (Hiring rules & costs)
  game-config.ts
  mastery-config.ts

context/
  GameContext.tsx

data/
  equipment.ts
  market/
    index.ts
    market-catalog.ts
  materials.ts
  mercenaries.ts
  nameData.ts

game/
  IntroScene.ts     (Phaser intro animation)
  MainForgeScene.ts
  SmithingScene.ts

models/
  Equipment.ts
  JobClass.ts
  Mercenary.ts
  Stats.ts

state/
  initial-game-state.ts

types/
  context.ts
  events.ts
  game-state.ts
  images.d.ts
  index.ts
  inventory.ts
  shop.ts

utils/
  mercenaryGenerator.ts
  nameGenerator.ts
  shopUtils.ts

metadata.json
README.md
PROJECT_MAP.md
tsconfig.json
vite.config.ts
```

---

## Entry Points

- `index.tsx`  
  - Application entry point  
  - Mounts the React application onto the DOM

- `App.tsx`  
  - High-level View Controller.
  - Manages transitions between `IntroScreen`, `TitleScreen`, and `MainGameLayout`.

---

## Runtime Layers

### UI Layer (React)

- **Location**: `components/`, `context/`, some helpers in `utils/`
- **Responsibilities**:
  - Rendering UI (tabs, modals, inventory, shop, tavern, etc.)
  - Handling player input via React components
  - Reading and updating game state through `GameContext`
  - Embedding or controlling Phaser scenes via components like `SmithingMinigame` and `MainForgeCanvas`
- **Notes**:
  - `MainGameLayout.tsx` now contains what was previously in `App.tsx` (the game UI loop).

### Configuration Layer

- **Location**: `config/`
- **Responsibilities**:
  - Defining static game rules, balance constants, and thresholds (e.g., energy costs, mastery bonuses).
  - Separates "tuning" values from logic and content.

### Game Layer (Phaser)

- **Location**: `game/`
- **Responsibilities**:
  - Phaser Scene implementations:
    - `IntroScene.ts` - Cinematic intro.
    - `MainForgeScene.ts` - Visuals for the main forge tab.
    - `SmithingScene.ts` - The crafting minigame.
  - Timing, animation, and interactive visuals.
- **Notes**:
  - Scenes are typically controlled/embedded via React components.

### State & Context Layer

- **Location**: `context/`, `state/`, `types/`, `models/`
- **Responsibilities**:
  - `context/GameContext.tsx`:
    - Holds the main React context for game state and actions.
    - Provides state to UI components (gold, energy, inventory, visitors, etc.).
  - `state/initial-game-state.ts`:
    - Logic for initializing a fresh game session (inventory, stats).
  - `types/` and `models/`:
    - Define TypeScript types (`game-state.ts`, `inventory.ts`, etc.) and domain models (`Equipment.ts`, `Mercenary.ts`).
- **Notes**:
  - `GameContext` is now mounted only when the player enters the Game View, ensuring a fresh state on "New Game".

### Data Layer

- **Location**: `data/`
- **Responsibilities**:
  - Static game content and definitions:
    - `materials.ts` – material definitions (ore, wood, etc.)
    - `equipment.ts` – weapon/armor templates
    - `mercenaries.ts` – named NPC presets
    - `nameData.ts` – name pools for procedural generation
    - `market/` – market catalog and shop configuration
- **Notes**:
  - Implemented in TypeScript.
  - Distinct from `config/` in that `data/` defines *content* (what exists), while `config/` defines *rules* (how it works).

### Utility Layer

- **Location**: `utils.ts`, `utils/`
- **Responsibilities**:
  - `utils/`
    - `mercenaryGenerator.ts` – procedural generation of mercenaries
    - `nameGenerator.ts` – procedural name generation
    - `shopUtils.ts` – shop-related helper functions
  - Root `utils.ts`
    - Legacy/general helpers. Considered a “misc” bucket for now.
- **Notes**:
  - This layer is **transitional**. Over time, helpers may be split into more focused modules.

---

## Folder Responsibilities (Current)

- `components/`  
  Feature-level React components:
  - Game Screens (`IntroScreen`, `TitleScreen`, `MainGameLayout`)
  - Forge UI (`ForgeTab`, `MainForgeCanvas`, `SmithingMinigame`)
  - Shop & market (`ShopTab`, `MarketTab`, `ShopManager`)
  - Tavern (`TavernTab`)
  - Overlays/modals (`SleepModal`, `JournalModal`, `EventModal`, `DialogueBox`)
  - UI layout (`Header`, `InventoryDisplay`)

- `config/`
  - `contract-config.ts` – Hiring costs and affinity thresholds.
  - `game-config.ts` – Global game constants (energy costs).
  - `mastery-config.ts` – Logic constants for smithing mastery.

- `context/`  
  - Global game state via React Context (`GameContext.tsx`)
  - Provides state and dispatch/actions to UI components

- `data/`  
  - Static game data and presets (materials, equipment, mercenaries, names)
  - `market/` - Market catalog definitions

- `game/`  
  - Phaser Scene implementations (intro, forge, smithing)

- `models/`  
  - Domain models for entities (equipment, mercenaries, stats)

- `state/`
  - `initial-game-state.ts` – Initialization logic for new games.

- `types/`  
  - Shared TypeScript type declarations split by domain:
    - `context.ts`
    - `events.ts`
    - `game-state.ts`
    - `inventory.ts`
    - `shop.ts`
    - `index.ts` (Barrel export)

- `utils/`  
  - Utility functions for generation and shop logic

- `utils.ts`  
  - Legacy general-purpose utilities; may be refactored into more specific modules later.

---

## Known Couplings & Intentional Trade-offs

- React components directly control aspects of Phaser scene lifecycle.
- `MainGameLayout` contains all game tabs to avoid complex routing, acting as a tab switcher.

These trade-offs are **intentional for early development and vibe-coding speed**.

---

## Non-Goals (Current)

- No ECS (Entity Component System) architecture
- No multiplayer or networking
- Save/Load system UI exists but is non-functional in `TitleScreen`.

---

## Summary

This document exists to ensure that both humans and AI assistants understand:

- **Where things currently live**
- **Why they are structured this way**
- **Which parts are transitional and may change later**

All structural or architectural changes should keep this map in mind and update it when the meaning of folders or layers changes.

# Lockhart's Forge - Technical Design Document (TDD)

## 1. Tech Stack
-   **Framework**: React 18+ (Vite)
-   **Language**: TypeScript (Strict Mode)
-   **Styling**: Tailwind CSS
-   **Animations**: Motion (formerly Framer Motion)
-   **Icons**: Lucide React

## 2. Architecture & State Management

### 2.1 Centralized State
The game uses a single source of truth managed via React's `useReducer` and `Context API`.
-   **Location**: `/state/gameReducer.ts`
-   **State Shape**: Defined in `/types/game-state.ts` (or `/types/index.ts`).
-   **Actions**: Strongly typed actions in `/state/actions.ts`.

### 2.2 Reducer Pattern
The main reducer is split into specialized sub-reducers for maintainability:
-   `reducer/inventory.ts`: Item acquisition, usage, and selling.
-   `reducer/mercenary.ts`: Hiring, stat allocation, and affinity.
-   `reducer/shop.ts`: Customer queue and shop status.
-   `reducer/expedition.ts`: Dungeon logic and results.
-   `reducer/manualDungeon.ts`: Grid-based exploration and narrative triggers.

### 2.3 Background Services (Headless Logic)
Background logic that runs independently of the UI is handled in custom hooks/services:
-   `useShopService`: Manages customer arrivals and patience timers.
-   `useDungeonService`: Processes automated expeditions.
-   `AudioManager`: A headless Web Audio API controller for BGM and SFX.
-   `AssetManager`: Handles preloading and memory caching of critical assets.

## 3. Game Engine Integration (Phaser)
While the UI is React-based, core gameplay scenes are powered by **Phaser 3**:
-   **SmithingScene**: Handles the physics and timing of the forging mini-game.
-   **DungeonScene**: Manages the grid exploration, fog-of-war, and combat visuals.
-   **Bridge**: Communication between React and Phaser is handled via custom events and direct scene references.

## 4. Data Modeling
Core entities are defined as TypeScript interfaces in `/models/`:
-   `Mercenary`: Stats, equipment, affinity, and status.
-   `Equipment`: Rarity, quality, and base stats.
-   `Dungeon`: Floor data, monster encounters, and loot tables.

## 4. Key Systems Implementation

### 4.1 Save System
-   **Storage**: `localStorage`
-   **Slots**: Supports multiple save slots.
-   **Global Settings**: Separate persistence for audio and UI preferences.
-   **Location**: `/utils/saveSystem.ts`

### 4.2 Mercenary Generation
-   Uses a weighted random generator for names, jobs, and stats.
-   Supports "Unique" (Named) mercenaries and "Random" recruits.
-   **Location**: `/utils/mercenaryGenerator.ts`

### 4.3 Tutorial System
-   State-driven tutorial steps (`tutorialStep`).
-   Spotlight overlays and forced navigation to guide new players.
-   **Location**: `/components/MainGameLayout.tsx` (Overlay logic) and `/components/tutorial/`.

## 5. UI/UX Patterns
-   **Responsive Design**: Mobile-first approach with Tailwind's `px-safe` and flex/grid layouts.
-   **SfxButton**: A wrapper for standard buttons that integrates sound effects.
-   **Modals**: Managed via state flags (e.g., `showSleepModal`) for immersive overlays.

## 6. Performance Considerations
-   Extensive use of `useMemo` and `useCallback` to prevent unnecessary re-renders in the complex game state.
-   Asset management via `AssetManager` for preloading critical images.

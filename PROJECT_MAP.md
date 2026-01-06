# Project Map – Lockhart’s Forge

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file as of **v0.1.35**.

---

## 📂 Project Hierarchy

### 🏗️ Core Application
- `index.html`: Entry HTML with global CSS. Includes UI protections and mobile viewport fixes.
- `index.tsx`: React entry point.
- `App.tsx`: Central View Controller. Implements the "Safe Loading" bridge and tracks the active `activeSlotIndex` across sessions.
- `utils.ts`: Global utilities (Asset management via session cache).

### ⚛️ UI Layer (React)
- **Framework**
  - `context/GameContext.tsx`: Global state provider. Manages auto-save triggers synchronized with the active slot ref.
  - `components/MainGameLayout.tsx`: Main dashboard. Handles tab navigation and safe-loading requests from the system menu.
  - `components/Header.tsx`: Fluid layout tracking Day, Energy, and Gold.

- **Modals & Persistence**
  - `components/modals/SaveLoadModal.tsx`: Slot selection interface with metadata previews (Day, Gold, Timestamp).
  - `components/modals/SettingsModal.tsx`: System-level controls. Triggers the "Safe Load" process through the App controller.
  - `utils/saveSystem.ts`: Core persistence logic. Handles `localStorage` slot indexing and metadata management.

- **Tabs (Features)**
  - `components/tabs/Dungeon/`: Expedition hub. Optimized with dual-entry branching (Auto/Manual).
  - `components/tabs/Forge/`: Crafting center. Features radial mastery indicators and minigame entry points.
  - `components/tabs/Tavern/`: Recruitment and relationship management.

---

## 📜 Functional Specification

### 1. Advanced Persistence System (v0.1.35)
- **Smart Allocation**: On "New Game", the system identifies the first empty slot. 
- **Active Slot Tracking**: Loading a game or manually saving switches the "Active Slot", ensuring all subsequent auto-saves (on Rest) target the correct file.
- **State Integrity**: Loading from within the game now forces a temporary return to the Title screen to prevent state mixing between different save files.
- **Compact Slot Design**: Save/Load interface optimized for vertical lists using a streamlined h-20 slot height and high-contrast status text for empty states.

### 2. Dungeon Exploration Modes (v0.1.35)
- **Strategic Deploy**: Traditional time-based auto-exploration.
- **Direct Assault**: New active play mode entry point. Unified validation ensures squad preparedness regardless of chosen mode.

### 3. Mobile & Visual Optimization
- **Ghosting Prevention**: Dungeon paging uses React `key` properties to force complete DOM re-renders of the selection panel, combined with CSS `transform-gpu`.
- **Mastery Radial**: Item progress is visually represented by a SVG radial track surrounding the item sprite, providing immediate feedback on craftsmanship level.

### 4. Immersive Interaction Design
- **Verticality**: Optimized for mobile portrait mode using `dvh` units.
- **Depth Masking**: Characters are positioned behind a foreground element (Counter/Table) with their feet hidden to simulate depth.
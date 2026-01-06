# Project Map – Lockhart’s Forge

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file as of **v0.1.35**.

---

## 📂 Project Hierarchy

### 🏗️ Core Application
- `index.html`: Entry HTML with global CSS. Includes UI protections, mobile viewport fixes, and **Grenze/Grenze Gotisch** font integration via Google Fonts.
- `index.tsx`: React entry point.
- `App.tsx`: Central View Controller. Implements the "Safe Loading" bridge and tracks the active `activeSlotIndex` across sessions.
- `utils.ts`: Global utilities (Asset management via session cache).

### ⚛️ UI Layer (React)
- **Framework**
  - `context/GameContext.tsx`: Global state provider. Manages auto-save triggers synchronized with the active slot ref.
  - `components/MainGameLayout.tsx`: Main dashboard. Handles tab navigation, safe-loading requests, and **Golden Ratio Toast** notifications.
  - `components/Header.tsx`: Fluid layout tracking Day, Energy, and Gold.

- **Modals & Persistence**
  - `components/modals/`: Centralized modal management.
    - `SaveLoadModal.tsx`: Slot selection interface with **version metadata** and timestamp previews.
    - `SettingsModal.tsx`: System-level controls. Triggers the "Safe Load" process.
    - `ConfirmationModal.tsx`: Global confirmation utility.
  - `utils/saveSystem.ts`: Core persistence logic. Handles `localStorage` slot indexing and **version-stamped** metadata.

---

## 📜 Functional Specification

### 1. Advanced Persistence System (v0.1.35)
- **Smart Allocation**: On "New Game", the system identifies the first empty slot. 
- **Active Slot Tracking**: Loading a game or manually saving switches the "Active Slot", ensuring all subsequent auto-saves (on Rest) target the correct file.
- **Version Integrity**: Each save records the engine version (`v0.1.35`) to ensure compatibility and provide clear feedback in the load menu.
- **State Integrity**: Loading from within the game forces a return to the Title screen to prevent state mixing.

### 2. Dungeon Exploration Modes
- **Strategic Deploy**: Traditional time-based auto-exploration.
- **Direct Assault**: Procedural grid-based manual exploration with tactical extraction interaction.

### 3. Mobile-First UI/UX Policy
- **Golden Ratio Layout**: All central modals and floating notifications (Toasts) implement a mandatory 20% total horizontal margin (`max-w-[80vw]` for toasts) to ensure visual breathing room on narrow mobile screens.
- **Visual Identity**: Full integration of **Grenze Gotisch** for titles and **Grenze** for body text across both React components and Phaser scenes to maintain a cohesive medieval forge aesthetic.
- **Ghosting Prevention**: Dungeon paging uses React `key` properties to force complete DOM re-renders of the selection panel, combined with CSS `transform-gpu`.

### 4. Crafting & Progression
- **Mastery Radial**: Item progress is visually represented by a SVG radial track surrounding the item sprite.
- **Workbench Refinements**: Rhythm-based stitching for leather and wood using a refined brown dashed-line guide and inverted needle physics.
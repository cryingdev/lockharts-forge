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

- **Tabs & Features**
  - `components/tabs/Market/MarketTab.tsx`: Enhanced trading interface. Features **long-touch acceleration with real-time stock validation**, persistent cart panels, and **inventory ownership badges**.
  - `components/tabs/Forge/ForgeTab.tsx`: Crafting hub with Mastery Radial indicators.
  - `components/tabs/Dungeon/DungeonTab.tsx`: Dual-mode deployment center (Strategic/Direct Assault).

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
- **Version Integrity**: Each save records the engine version (`v0.1.35`) to ensure compatibility.
- **State Integrity**: Loading from within the game forces a return to the Title screen to prevent state mixing.

### 2. Market & Economy Logic
- **Stock Guard System**: Cart additions are capped by `marketStock`. Long-press acceleration automatically halts when stock is depleted or 0 is reached during removal.
- **Smart Cart Persistence**: The shopping cart remains open after a successful purchase, allowing for seamless consecutive shopping cycles.
- **Ownership Awareness**: Each item in the market catalog displays the player's current inventory count (`Package` icon badge) to prevent over-purchasing.

### 3. Dungeon Exploration Modes
- **Strategic Deploy**: Traditional time-based auto-exploration.
- **Direct Assault**: Procedural grid-based manual exploration with tactical extraction interaction via `AssaultNavigator`.

### 4. Mobile-First UI/UX Policy
- **Golden Ratio Layout**: All central modals and floating notifications (Toasts) implement a mandatory 20% total horizontal margin (`max-w-[80vw]`).
- **Visual Identity**: Full integration of **Grenze Gotisch** for titles and **Grenze** for body text across both React components and Phaser scenes.
- **Feedback Consistency**: Button colors are unified to `stone-800`/`stone-900` palettes for a grounded, medieval aesthetic.

### 5. Crafting & Progression
- **Mastery Radial**: Item progress is visually represented by a SVG radial track surrounding the item sprite.
- **Workbench Refinements**: Rhythm-based stitching for leather and wood using a refined brown dashed-line guide and inverted needle physics.
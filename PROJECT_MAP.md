# Project Map – Lockhart’s Forge

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file as of **v0.1.32**.

---

## 📂 Project Hierarchy

### 🏗️ Core Application
- `index.html`: Entry HTML with global CSS. Includes **v0.1.32** UI protections:
  - `-webkit-touch-callout: none` and `user-select: none` to block system overlays.
  - `contextmenu` event prevention to disable long-press menus.
- `index.tsx`: React entry point.
- `App.tsx`: Main view controller.
- `utils.ts`: Global utilities (Asset management via session cache).

### ⚛️ UI Layer (React)
- **Framework**
  - `context/GameContext.tsx`: Global state provider.
  - `components/MainGameLayout.tsx`: Main dashboard and tab controller.
  - `components/Header.tsx`: Optimized fluid layout pushing stats and dates to margins via a flexible Log Ticker.

- **Tabs (Features)**
  - `components/tabs/Tavern/`:
    - `TavernTab.tsx`: Hired list and recruitment hub.
    - `TavernInteraction.tsx`: High-immersion interaction view with massive DVH-scaled sprites and foreground "Tavern Table".

---

## 📜 Functional Specification

### 1. Global UI Interaction (v0.1.32)
Managed via `index.html` and global CSS.
- **App-like Feel**: Long-pressing buttons or background assets will not trigger browser copy/paste or image saving menus.
- **Selection**: All text selection is disabled except for standard input fields.

### 2. Immersive Interaction Design
Located in `ShopTab.tsx` and `TavernInteraction.tsx`.
- **Verticality**: Optimized for mobile portrait mode using `dvh` units.
- **Depth Masking**: Characters are positioned behind a foreground element (Counter/Table) with their feet hidden, simulating environmental depth.

### 3. Header Strategy
Located in `Header.tsx`.
- **Flexible Ticker**: The Journal button acts as a spacer, ensuring the Date info is pinned left and Stats are pinned right regardless of screen width.
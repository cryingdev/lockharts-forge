# Project Map – Lockhart’s Forge

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file as of **v0.1.34**.

---

## 📂 Project Hierarchy

### 🏗️ Core Application
- `index.html`: Entry HTML with global CSS. Includes UI protections.
- `index.tsx`: React entry point.
- `App.tsx`: Main view controller and GameLoader for initial state hydration.
- `utils.ts`: Global utilities (Asset management via session cache).

### ⚛️ UI Layer (React)
- **Framework**
  - `context/GameContext.tsx`: Global state provider with save/load action routing.
  - `components/MainGameLayout.tsx`: Main dashboard and tab controller.
  - `components/Header.tsx`: Optimized fluid layout.

- **Modals & Persistence**
  - `components/modals/SaveLoadModal.tsx`: Visual interface for managing save slots.
  - `components/modals/SettingsModal.tsx`: System-level controls including manual save/load triggers. Includes dynamic version display.
  - `utils/saveSystem.ts`: Core logic for serializing `GameState` and managing `localStorage` slots.

- **Tabs (Features)**
  - `components/tabs/Tavern/`: Recruitment hub.
  - `components/tabs/Forge/`: Minigame entries (Anvil/Workbench).

---

## 📜 Functional Specification

### 1. Persistence & Save System
- **Serialization**: The entire `GameState` is stripped of temporary UI flags and serialized into JSON.
- **Metadata Layer**: A secondary lightweight key stores summaries for quick scanning in the Load menu.
- **Resume Logic**: Identification of the most recent slot for the "Continue" feature.

### 2. Crafting Refinements (v0.1.34)
- **Stitching Guide**: Workbench minigame now features a dashed-line guide in dark brown (0x3e2723) to better fit the blacksmithing/leatherworking aesthetic.
- **Needle Physics**: The needle sprite orientation is fixed to follow the path tangent with a corrected offset.

### 3. Immersive Interaction Design
- **Verticality**: Optimized for mobile portrait mode using `dvh` units.
- **Depth Masking**: Characters are positioned behind a foreground element (Counter/Table) with their feet hidden.
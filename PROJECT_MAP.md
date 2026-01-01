
# Project Map – Lockhart’s Forge

This document provides a comprehensive structural map of the project, detailing the directory hierarchy and the specific responsibilities of each file as of **v0.1.33**.

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
  - `components/modals/SettingsModal.tsx`: System-level controls including manual save/load triggers.
  - `utils/saveSystem.ts`: Core logic for serializing `GameState` and managing `localStorage` slots.

- **Tabs (Features)**
  - `components/tabs/Tavern/`: Recruitment hub.
  - `components/tabs/Forge/`: Minigame entries (Anvil/Workbench).

---

## 📜 Functional Specification

### 1. Persistence & Save System (v0.1.33)
- **Serialization**: The entire `GameState` is stripped of temporary UI flags (modals, events) and serialized into JSON.
- **Metadata Layer**: A secondary lightweight key (`lockharts_forge_meta`) stores summaries of all slots to allow quick scanning of the Load menu without parsing massive state strings.
- **Resume Logic**: The app automatically identifies the slot with the most recent `timestamp` to enable the "Continue" feature on the title screen.

### 2. Global UI Interaction
- **App-like Feel**: Long-pressing buttons or background assets will not trigger browser copy/paste or image saving menus.
- **Selection**: All text selection is disabled except for standard input fields.

### 3. Immersive Interaction Design
- **Verticality**: Optimized for mobile portrait mode using `dvh` units.
- **Depth Masking**: Characters are positioned behind a foreground element (Counter/Table) with their feet hidden, simulating environmental depth.

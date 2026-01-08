# Lockhart's Forge

> **Version**: 0.1.36
> **Status**: Alpha / Active Development

**Lockhart's Forge** is a casual blacksmithing simulation game where players manage a ruined forge, craft weapons and armor, and trade with wandering mercenaries.

## 🔄 Recent Updates (v0.1.36)

*   **Tactical Camera Overhaul (Direct Assault)**:
    *   **Three-Tier Camera Control**: Added a cycle toggle between **Locked**, **Adaptive**, and **Free** modes via the D-Pad center button.
    *   **Delayed Intelligence**: The camera now waits **1 second** after movement before tracking the squad, allowing players to survey the local tile results before the view shifts.
    *   **Adaptive Lock Logic**: Smart tracking now only engages when the squad moves toward the screen boundary (approx. 45% distance from center), minimizing unnecessary screen jitter.
*   **UI/UX Refinement**:
    *   **Confirmation Modal Fix**: Fixed a critical UI bug where long action labels (e.g., "Confirm Retreat") would overflow the modal boundaries on mobile devices.
    *   **Responsive Actions**: Buttons now stack vertically on narrow screens and allow text wrapping for better accessibility.
*   **System & Maintenance**:
    *   Version incremented to `v0.1.36` across all internal systems.

## 🌟 Key Features

### 1. The Forge (Crafting System)
*   **Smithing**: Manage heat and timing. Watch the billet morph into a blade as you strike the anvil.
*   **Workbench**: Rhythm-based stitching for leather and wood using the refined dashed-line guide.

### 2. Smart Persistence
*   Three robust save slots with metadata previews, ensuring your progress is never lost across sessions.

## 📜 License

Private / Proprietary (Lockhart's Forge Team)
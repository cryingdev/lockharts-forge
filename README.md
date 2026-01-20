
# Lockhart's Forge

> **Version**: 0.1.40
> **Status**: Alpha / Active Development

**Lockhart's Forge** is a casual blacksmithing simulation game where players manage a ruined forge, craft weapons and armor, and trade with wandering mercenaries.

## 🔄 Recent Updates (v0.1.40)

*   **Modular Architecture Alignment**:
    *   Fully transitioned Forge, Market, and Shop tabs to a standardized modular structure with separate `/hooks/` and `/ui/` components.
*   **Infrastructure Stabilization**:
    *   Introduced `game/SmithingTutorialHandler.ts` to manage complex tutorial branching within the Phaser engine.
    *   Centralized smithing difficulty and balancing logic into `config/smithing-config.ts`.
*   **Mercenary System Refinement**:
    *   Organized mercenary-specific UI (PaperDoll, Stats, Inventory) into dedicated sub-directories.
    *   Enhanced combat calculations with improved primary stat integration.
*   **Documentation Update**:
    *   Synchronized `PROJECT_MAP.md` to reflect the current codebase hierarchy and modular design patterns.

## 🔄 Recent Updates (v0.1.39)

*   **Market Catalog Optimization**:
    *   Reorganized sections to prioritize Tier Resources, followed by Potions & Supplies, and Facilities at the bottom.
*   **Tutorial Revamp (Furnace Restoration)**:
    *   The furnace acquisition step is now free! Garrick will support your first equipment purchase as an investment in the village's future.
*   **UX Improvements (Shop & Inventory)**:
    *   **Persistent View Mode**: Grid/List view settings are now saved globally and persist across game tabs.
    *   **Explicit Confirmation**: Added "Select & Confirm" and "Cancel" buttons to the item selection popup in the Shop to improve clarity and prevent accidental sales.

## 🌟 Key Features

### 1. The Forge (Crafting System)
*   **Smithing**: Manage heat and timing. Watch the billet morph into a blade as you strike the anvil.
*   **Workbench**: Rhythm-based stitching for leather and wood using refined path-tracking mechanics and dynamic hammer animations.

### 2. Tactical Assault
*   Explore dungeons in either **Strategic (Auto)** or **Direct (Manual)** mode. Control your squad's movement through trap-filled grids to secure rare loot.

### 3. Smart Persistence
*   Three robust save slots with metadata previews, ensuring your progress is never lost across sessions.

## 📜 License

Private / Proprietary (Lockhart's Forge Team)

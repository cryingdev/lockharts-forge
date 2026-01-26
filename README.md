
# Lockhart's Forge

> **Version**: 0.1.41a
> **Status**: Alpha / Active Development

**Lockhart's Forge** is a casual blacksmithing simulation game where players manage a ruined forge, craft weapons and armor, and trade with wandering mercenaries.

## 🔄 Recent Updates (v0.1.41a)

*   **Architectural Synchronization**:
    *   Updated `PROJECT_MAP.md` to reflect the latest modular directory structure.
    *   Standardized versioning across all configuration files and system constants.
*   **Shared UI Componentization**:
    *   Established `components/common/ui/` for shared visual elements like `AnimatedMercenary` and `MercenaryPortrait`.
*   **Modularity Refinement**:
    *   Documented the internal structure of Forge, Market, and Shop tabs (Hooks vs UI separation).

## 🔄 Recent Updates (v0.1.40)

*   **Modular Architecture Alignment**:
    *   Fully transitioned Forge, Market, and Shop tabs to a standardized modular structure with separate `/hooks/` and `/ui/` components.
*   **Infrastructure Stabilization**:
    *   Introduced `game/SmithingTutorialHandler.ts` to manage complex tutorial branching within the Phaser engine.
    *   Centralized smithing difficulty and balancing logic into `config/smithing-config.ts`.
*   **Mercenary System Refinement**:
    *   Organized mercenary-specific UI (PaperDoll, Stats, Inventory) into dedicated sub-directories.
    *   Enhanced combat calculations with improved primary stat integration.

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
# Lockhart's Forge

> **Version**: 0.1.44a
> **Status**: Alpha / Active Development

**Lockhart's Forge** is a casual blacksmithing simulation game where players manage a ruined forge, craft weapons and armor, and trade with wandering mercenaries.

## 🔄 Recent Updates (v0.1.44a)

*   **Immersive UI Overhaul**:
    *   Removed fixed top navigation bars in major functional tabs (Dungeon, Tavern, Market).
    *   Introduced a unified floating "Back" button overlay with backdrop-blur for a more immersive background experience.
    *   Smart Visibility: Floating UI elements now automatically hide during squad selection or modal interactions to reduce visual clutter.
*   **Global Settings Persistence**: 
    *   System settings (audio volumes, UI preferences) now persist across different save slots and sessions via `lockharts_forge_global_settings`.
*   **Enhanced Save System**:
    *   Manual and auto-save blobs are now sanitized to clear temporary UI states (toasts, active events) before writing to storage.

## 🌟 Key Features

### 1. The Forge (Crafting System)
*   **Smithing**: Manage heat and timing. Watch the billet morph into a blade as you strike the anvil.
*   **Workbench**: Rhythm-based stitching for leather and wood using refined path-tracking mechanics.
*   **Research**: Experiment with rare ores and monster parts to reclaim the legendary Lockhart patterns.

### 2. Tactical Assault
*   Explore dungeons in either **Strategic (Auto)** or **Direct (Manual)** mode. Control your squad's movement through trap-filled grids to secure rare loot.

### 3. Smart Persistence
*   Three robust save slots with metadata previews, ensuring your progress is never lost across sessions.

## 📜 License

Private / Proprietary (Lockhart's Forge Team)
# Lockhart's Forge

> **Version**: 0.1.35
> **Status**: Alpha / Active Development

**Lockhart's Forge** is a casual blacksmithing simulation game where players manage a ruined forge, craft weapons and armor, and trade with wandering mercenaries.

## 🔄 Recent Updates (v0.1.35)

*   **Dungeon Expansion Phase 1**:
    *   Split Dungeon Entry into two distinct paths: **Strategic Deploy** (Auto) and **Direct Assault** (Manual).
    *   Unified requirement checking for both modes (Power, Energy, Party).
*   **Smart Persistence Engine**: 
    *   Implemented automatic slot discovery for New Games.
    *   Dynamic Slot Sync: Saving to a specific slot via Settings now redirects all future auto-saves to that slot.
    *   Safe Loading: Added a "Title-to-Game" bridge to ensure state hydration happens in a clean memory environment.
    *   **Persistence UI Polish**: Compressed save slots to a compact h-20 format and increased legibility for empty slot markers.
*   **Mobile Performance & UX**:
    *   **Dungeon Ghosting Fix**: Added unique container keys and GPU hardware acceleration to prevent afterimages during dungeon paging.
    *   **UI Polish**: Relocated the Sleep Modal close button to the top-right for standard accessibility.
*   **Mastery Visuals**: 
    *   Replaced standard borders with a radial mastery gauge around the selected item's image in the Forge.
*   **Workbench Refinements**: 
    *   Inverted needle orientation and replaced the guide path with an aesthetic brown dashed line.

## 🌟 Key Features

### 1. The Forge (Crafting System)
*   **Smithing**: Manage heat and timing. Watch the billet morph into a blade as you strike the anvil.
*   **Workbench**: Rhythm-based stitching for leather and wood using the refined dashed-line guide.

## 📜 License

Private / Proprietary (Lockhart's Forge Team)
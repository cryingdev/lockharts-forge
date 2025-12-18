
# Project Map – Lockhart’s Forge

This document describes the **current structural map** of the Lockhart’s Forge project.

## Purpose
- Help AI assistants and developers quickly understand how the project is organized.
- Clarify the responsibility of each folder and major file.

---

## Game Concept & Narrative Context
Lockhart’s Forge is a dark fantasy, blacksmith-centered management game.
- The player rebuilds a ruined forge after a dragon attack.
- Progress via crafting, selling, and managing relationships with mercenaries who explore dungeons for you.

---

## Current File & Folder Structure

### UI Layer (React)
- **Location**: `components/`, `context/`
- **MercenaryDetailModal.tsx**: Handles detailed mercenary info and equipment management.
  - *Current Logic*: Click-to-Select list view with responsive 2-column grid.
  - *Stat Preview*: Real-time comparison between current and potential equipment stats.
  - *Equip Flow*: Sequential click interaction (Select -> Preview -> Equip).

### Services Layer (Headless Logic)
- **Location**: `services/`
- `shop-service.ts`: Background customer arrival and patience timers.
- `dungeon-service.ts`: Background expedition timer monitoring.

### State & Context Layer
- `context/GameContext.tsx`: Main state provider.
- `state/reducer/equipment.ts`: Core logic for swapping items, handling 2H weapons, and calculating affinity gains from first-time equipment.

---

## Folder Responsibilities

- `components/modals/`: Overlay UI including the newly overhauled `MercenaryDetailModal`.
- `models/`: Domain objects like `Equipment.ts` (now tracks `previousOwners` and `recipeId`).
- `utils/craftingLogic.ts`: Logic for generating randomized equipment stats and rarity based on quality and mastery.

---

## Summary
The project is moving towards a more robust, mobile-friendly interaction pattern by replacing drag-and-drop with direct list interactions and providing clear visual feedback through the Stat Preview system.

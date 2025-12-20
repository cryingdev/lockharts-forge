
# Project Map – Lockhart’s Forge

This document describes the **current structural map** of the Lockhart’s Forge project.

## Purpose
- Help AI assistants and developers quickly understand how the project is organized.
- Clarify the responsibility of each folder and major file.

---

## Game Concept & Narrative Context
Lockhart’s Forge is a dark fantasy, blacksmith-centered management game.
- Progress via crafting, selling, and managing relationships with mercenaries.

---

## Current File & Folder Structure

### UI Layer (React)
- **WorkbenchMinigame.tsx**: Rhythm-based stitching.
  - *Stitching Logic*: Uses scale down + fill color to leave marks.
- **SimulationTab.tsx**: Tactical testing ground.
  - *Archetype Engine*: New logic to classify units for debugging stat impacts.

### State & Context Layer
- `state/reducer/crafting.ts`: Bridges minigame results to equipment generation.
- `utils/craftingLogic.ts`: Primary equipment factory. Handles `bonus` stats from perfect streaks.

### Combat Logic
- `utils/combatLogic.ts`: Core math for Hit/Crit/Damage.
- `hooks/useSimulation.ts`: Orchestrates automated battle loops and bulk testing.

---

## Summary (v0.1.29)
The project now features a complete feedback loop where player skill in minigames directly influences item power, and the simulation tool allows for high-fidelity debugging of how those bonuses affect combat balance.

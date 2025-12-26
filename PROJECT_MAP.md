
# Project Map – Lockhart’s Forge

This document describes the **current structural map** of the Lockhart’s Forge project.

---

## Current File & Folder Structure (v0.1.31)

### Core Systems (Phaser)
- **game/SmithingScene.ts**: 
  - *Thermal Logic*: Temperature cooling, fuel-based ignition, and bellows pumping (restricted at 0°C).
  - *Heat Glow*: `ambientGlow` centered on anvil area.
  - *Dynamic Visuals*: Color interpolation based on temperature; progressive blade morphing.

### UI Layer (React)
- **ForgeTab.tsx**: 
  - Crafting hub with category filtering (Weapon/Armor).
  - Mastery tracking and resource requirement tooltips.
- **SmithingMinigame.tsx**: 
  - *Responsive Layout*: Uses `Phaser.Scale.RESIZE` to fill the container.
  - *Full-Width Anvil*: Anvil image and surface scale to fill the entire container width.
- **WorkbenchMinigame.tsx**: Rhythm-based stitching for leather/wood.
- **SimulationTab.tsx**: Tactical testing ground for combat formulas.

---

## Summary
V0.1.31 introduces stricter ignition rules (requiring fuel to start from 0°C) and visual alignment fixes for ambient heat effects, reinforcing the "Forge Management" loop.

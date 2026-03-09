# Probability System Specification (RNG Standardization)

This document defines the standardized approach for Random Number Generation (RNG) across all game systems in **Lockhart's Forge**.

## 1. Core Principles

- **Reproducibility**: All random events must be derived from a seeded generator to allow for consistent testing and bug reproduction.
- **Clarity**: Use explicit methods for common tasks (range, chance, pick).
- **Integrity**: Avoid direct use of `Math.random()` in game logic.

## 2. Standard RNG Utility (`utils/random.ts`)

The `GameRandom` class implements a Linear Congruential Generator (LCG).

### API Reference

| Method | Description | Example |
| :--- | :--- | :--- |
| `next()` | Returns float `[0, 1)` | `rng.next()` |
| `range(min, max)` | Returns float `[min, max)` | `rng.range(1.1, 1.5)` |
| `rangeInt(min, max)` | Returns integer `[min, max]` | `rng.rangeInt(1, 10)` |
| `chance(prob)` | Returns `true` if `next() < prob` | `rng.chance(0.15)` |
| `pick(array)` | Picks a random element | `rng.pick(['A', 'B'])` |
| `clamp(val, min, max)` | Clamps value to bounds | `rng.clamp(v, 0, 100)` |

## 3. System Implementations

### 3.1. Smithing (Mini-game)
- **Ring Appearance**: The type of ring (Easy/Normal/Hard) is determined by `rng.next()` compared against thresholds in `SMITHING_CONFIG`.
- **Target Position**: `rng.range()` is used to pick coordinates within the `spawnPoly`.
- **Kickback**: Billet displacement after a hit uses `rng.range()`.

### 3.2. Shop (Commerce)
- **Customer Arrival**: Interval between customers uses `rng.range(min, max)`.
- **Request Generation**: 
    - Markup calculation: `rng.range(1.1, 1.5)`.
    - Item selection: `rng.pick()` from valid candidates.
    - Transaction ID: `rng.rangeInt(0, 999)`.

### 3.3. Mercenary Generation
- **Job/Gender**: `rng.pick()` and `rng.chance(0.5)`.
- **Stats**: Total base points `rng.rangeInt(20, 24)` distributed via weighted weights.
- **Visuals**: Sprite variant selection `rng.rangeInt(1, count)`.

### 3.4. Item Drops (Loot)
- **Drop Chance**: `rng.chance(entry.chance)`.
- **Quantity**: `rng.rangeInt(min, max)`.

## 4. Testing & Seeding

To reproduce a specific game state:
1. Capture the current seed from the `rng` instance.
2. Re-initialize `rng.setSeed(capturedSeed)` before running the logic.

---
*Last Updated: 2026-03-09*

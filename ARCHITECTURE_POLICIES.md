# Lockhart's Forge - Architecture & Balance Policies

This document outlines the core economic formulas, state transition rules, and save/migration policies to ensure consistency and maintainability.

## 1. Economic Balance Sheet (Daily Expected Values)

These values are used for difficulty tuning and progression pacing.

| Metric | Tier 1 (Novice) | Tier 2 (Apprentice) | Tier 3 (Journeyman) |
| :--- | :--- | :--- | :--- |
| **Avg Customers** | 8 - 12 | 12 - 18 | 18 - 25 |
| **Conversion Rate** | 70% | 65% | 60% |
| **Avg Item Price** | 50 - 150 G | 200 - 500 G | 600 - 1500 G |
| **Target Margin** | 125% | 130% | 140% |
| **Daily Wages** | 0 G (Solo) | 100 - 300 G | 500 - 1000 G |
| **Material Costs** | ~200 G | ~500 G | ~1500 G |
| **Recovery/Misc** | 0 G | 50 G | 200 G |
| **Expected Net Profit** | **300 - 500 G** | **800 - 1200 G** | **2000 - 4000 G** |

### Formulas
- `Expected Daily Revenue = Avg Customers * Conversion Rate * Avg Item Price * Margin`
- `Expected Daily Expense = Daily Wages + Material Costs + Recovery Costs`
- `Net Profit = Expected Daily Revenue - Expected Daily Expense`

---

## 2. State Transition Diagram

To prevent illegal states (e.g., sleeping while in a dungeon), follow these transition rules.

| Current State | Action | Next State | Transition Condition / Exception |
| :--- | :--- | :--- | :--- |
| **Shop Closed** | `TOGGLE_SHOP` | **Shop Open** | Allowed if not in Manual Dungeon. |
| **Shop Open** | `TOGGLE_SHOP` | **Shop Closed** | Always allowed. Clears active customer/queue. |
| **Dungeon Idle** | `START_DUNGEON` | **Dungeon Active** | Allowed if Shop is Closed & Energy >= Cost. |
| **Dungeon Active** | `MOVE` | **Dungeon Active** | Allowed if HP > 0 & not in Combat. |
| **Dungeon Active** | `ENCOUNTER` | **Combat Active** | Triggered by 'ENEMY' or 'BOSS' tile. |
| **Combat Active** | `WIN` | **Dungeon Active** | Enemy HP <= 0. |
| **Combat Active** | `DEFEAT` | **Dungeon Idle** | Player HP <= 0. Forces retreat. |
| **Dungeon Active** | `FINISH / RETREAT` | **Dungeon Idle** | At Exit or via Retreat button. |
| **Any** | `SLEEP` | **Next Day** | **Forbidden if Shop Open or Dungeon Active.** |

---

## 3. Save & Migration Policy

Ensures backward compatibility and data integrity across updates.

### Versioning Rules
- **Format**: `MAJOR.MINOR.PATCH[suffix]` (e.g., `0.1.45a`).
- **Major**: Breaking architectural changes (requires reset or complex migration).
- **Minor**: New features, new fields (requires default value injection).
- **Patch**: Bug fixes, no schema changes.

### Migration Logic (Implemented in `saveSystem.ts`)
1. **Field Addition**: If a new field is added to `GameState`, the loader must inject the default value from `initialGameState`.
2. **Field Deletion**: Extra fields in the saved JSON are ignored by the application state.
3. **Data Transformation**: If a field's type or structure changes, a migration function must be mapped to the version string.
4. **Failure Handling**:
    - **Soft Fail**: Missing non-critical data -> Inject defaults and continue.
    - **Hard Fail**: Corrupted or incompatible major version -> Warn user, offer "Reset to Default" or "Attempt Recovery".

### Default Value Injection Example
```typescript
const migratedState = {
    ...initialGameState,
    ...loadedState,
    stats: { ...initialGameState.stats, ...loadedState.stats },
    // Deep merge critical objects to ensure new nested fields exist
};
```

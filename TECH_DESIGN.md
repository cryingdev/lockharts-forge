# Lockhart's Forge - Technical Design Document (TDD)

## 1. Tech Stack
-   **Framework**: React 18+ (Vite)
-   **Language**: TypeScript (Strict Mode)
-   **Styling**: Tailwind CSS
-   **Animations**: Motion (formerly Framer Motion)
-   **Icons**: Lucide React

## 2. Architecture & State Management

### 2.1 Centralized State
The game uses a single source of truth managed via React's `useReducer` and `Context API`.
-   **Location**: `/state/gameReducer.ts`
-   **State Shape**: Defined in `/types/game-state.ts` (or `/types/index.ts`).
-   **Actions**: Strongly typed actions in `/state/actions.ts`.

### 2.2 Reducer Pattern
The main reducer is split into specialized sub-reducers for maintainability:
-   `reducer/inventory.ts`: Item acquisition, usage, and selling.
-   `reducer/mercenary.ts`: Hiring, stat allocation, and affinity.
-   `reducer/shop.ts`: Customer queue and shop status.
-   `reducer/expedition.ts`: Dungeon logic and results.
-   `reducer/manualDungeon.ts`: Grid-based exploration and narrative triggers.

### 2.3 Background Services (Headless Logic)
Background logic that runs independently of the UI is handled in custom hooks/services:
-   `useShopService`: Manages customer arrivals and patience timers.
-   `useDungeonService`: Processes automated expeditions.
-   `AudioManager`: A headless Web Audio API controller for BGM and SFX.
-   `AssetManager`: Handles preloading and memory caching of critical assets.

## 3. Game Engine Integration (Phaser)
While the UI is React-based, core gameplay scenes are powered by **Phaser 3**:
-   **SmithingScene**: Handles the physics and timing of the forging mini-game.
-   **DungeonScene**: Manages the grid exploration, fog-of-war, and combat visuals.
-   **Bridge**: Communication between React and Phaser is handled via custom events and direct scene references.

## 4. Data Modeling
Core entities are defined as TypeScript interfaces in `/models/`:
-   `Mercenary`: Stats, equipment, affinity, and status.
-   `Equipment`: Rarity, quality, and base stats.
-   `Dungeon`: Floor data, monster encounters, and loot tables.

## 4. Key Systems Implementation

### 4.1 Save System
-   **Storage**: `localStorage`
-   **Slots**: Supports multiple save slots.
-   **Global Settings**: Separate persistence for audio and UI preferences.
-   **Location**: `/utils/saveSystem.ts`

### 4.2 Mercenary Generation
-   Uses a weighted random generator for names, jobs, and stats.
-   Supports "Unique" (Named) mercenaries and "Random" recruits.
-   **Location**: `/utils/mercenaryGenerator.ts`

### 4.3 Tutorial System
-   State-driven tutorial steps (`tutorialStep`).
-   Spotlight overlays and forced navigation to guide new players.
-   **Location**: `/components/MainGameLayout.tsx` (Overlay logic) and `/components/tutorial/`.

### 4.4 Commission System
The commission system is split into repeatable economy contracts and named recruitment contracts.

-   **General Commissions**:
    -   Generated from deterministic pools with seeded randomness.
    -   Focus on item delivery, quality thresholds, and deadlines.
    -   Can be refreshed on day start.
-   **Special Contracts**:
    -   Spawn only after explicit progression conditions are met.
    -   Use controlled encounter windows instead of pure tavern-invite randomness.
    -   Completing the contract unlocks the named mercenary as recruitable.

#### 4.4.1 Data Modeling (`types/`)
The recommended addition is a contract-focused slice in `/types/game-state.ts`.

```ts
export type ContractType = 'GENERAL' | 'SPECIAL';
export type ContractStatus = 'OFFERED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
export type ContractSource = 'SHOP' | 'TAVERN' | 'MARKET' | 'SYSTEM';
export type ContractRewardType = 'GOLD' | 'AFFINITY' | 'ITEM' | 'UNLOCK_RECRUIT';

export interface ContractItemRequirement {
  itemId: string;
  quantity: number;
  minQuality?: number;
  acceptedTags?: string[];
}

export interface ContractReward {
  type: ContractRewardType;
  gold?: number;
  affinity?: number;
  itemId?: string;
  itemCount?: number;
  mercenaryId?: string;
}

export interface ContractEncounterRule {
  location: ContractSource;
  unlockDay?: number;
  minTier?: number;
  requiredRecipeIds?: string[];
  requiredDungeonIds?: string[];
  requiredItemIds?: string[];
  requiredSalesCount?: number;
  encounterWindowDays: number;
  appearanceChance: number;
  guaranteeAfterDays: number;
}

export interface ContractDefinition {
  id: string;
  type: ContractType;
  title: string;
  clientName: string;
  mercenaryId?: string;
  source: ContractSource;
  description: string;
  requirements: ContractItemRequirement[];
  rewards: ContractReward[];
  deadlineDay: number;
  status: ContractStatus;
  encounterRule?: ContractEncounterRule;
  chainId?: string;
  unique?: boolean;
}
```

For named mercenary contracts, the design source should be stored in a registry-style structure that AI agents and reducers can read without inferring narrative text:

```ts
export interface NamedContractRegistryEntry {
  mercenaryId: string;
  displayName: string;
  contractId: string;
  unlockRule: {
    tutorialCompleted?: boolean;
    minDay?: number;
    minTier?: number;
    requiredRecipeIds?: string[];
    requiredSalesCount?: number;
    requiredItemIds?: string[];
    requireInjuredMercenary?: boolean;
    requireRecoveryFlowSeen?: boolean;
  };
  encounterRule: ContractEncounterRule;
  requirements: ContractItemRequirement[];
  rewards: ContractReward[];
}
```

Recommended registry seed data:

```ts
export const NAMED_CONTRACT_REGISTRY: NamedContractRegistryEntry[] = [
  {
    mercenaryId: 'pip_green',
    displayName: 'Pip the Green',
    contractId: 'contract_named_pip_bronze_blade',
    unlockRule: {
      tutorialCompleted: true,
      minDay: 3,
    },
    encounterRule: {
      location: 'SHOP',
      encounterWindowDays: 3,
      appearanceChance: 0.4,
      guaranteeAfterDays: 3,
    },
    requirements: [
      { itemId: 'bronze_shortsword', quantity: 1, minQuality: 70 },
    ],
    rewards: [
      { type: 'UNLOCK_RECRUIT', mercenaryId: 'pip_green' },
      { type: 'GOLD', gold: 120 },
      { type: 'AFFINITY', affinity: 5, mercenaryId: 'pip_green' },
    ],
  },
  {
    mercenaryId: 'adeline_shield',
    displayName: 'Adeline Ashford',
    contractId: 'contract_named_adeline_frontline_set',
    unlockRule: {
      minTier: 1,
      requiredRecipeIds: ['bronze_buckler'],
      requiredSalesCount: 5,
    },
    encounterRule: {
      location: 'TAVERN',
      encounterWindowDays: 3,
      appearanceChance: 0.4,
      guaranteeAfterDays: 3,
    },
    requirements: [
      { itemId: 'one_handed_weapon', quantity: 1, acceptedTags: ['ONE_HAND'], minQuality: 70 },
      { itemId: 'shield_item', quantity: 1, acceptedTags: ['SHIELD'], minQuality: 70 },
    ],
    rewards: [
      { type: 'UNLOCK_RECRUIT', mercenaryId: 'adeline_shield' },
    ],
  },
  {
    mercenaryId: 'elara_flame',
    displayName: 'Elara of the Flame',
    contractId: 'contract_named_elara_flame_focus',
    unlockRule: {
      requiredItemIds: ['fire_essence'],
      requiredRecipeIds: ['apprentice_focus'],
    },
    encounterRule: {
      location: 'MARKET',
      encounterWindowDays: 3,
      appearanceChance: 0.4,
      guaranteeAfterDays: 3,
    },
    requirements: [
      { itemId: 'fire_essence', quantity: 1 },
      { itemId: 'magic_focus', quantity: 1, acceptedTags: ['MAGIC'], minQuality: 70 },
    ],
    rewards: [
      { type: 'UNLOCK_RECRUIT', mercenaryId: 'elara_flame' },
    ],
  },
  {
    mercenaryId: 'sister_aria',
    displayName: 'Sister Aria',
    contractId: 'contract_named_aria_recovery_kit',
    unlockRule: {
      requireInjuredMercenary: true,
      requireRecoveryFlowSeen: true,
    },
    encounterRule: {
      location: 'SHOP',
      encounterWindowDays: 3,
      appearanceChance: 0.4,
      guaranteeAfterDays: 3,
    },
    requirements: [
      { itemId: 'healing_supply', quantity: 1, acceptedTags: ['HEALING'] },
      { itemId: 'cleric_gear', quantity: 1, acceptedTags: ['CLERIC'], minQuality: 70 },
    ],
    rewards: [
      { type: 'UNLOCK_RECRUIT', mercenaryId: 'sister_aria' },
    ],
  },
];
```

The active game state can then be expanded as follows:

```ts
export interface NamedEncounterState {
  mercenaryId: string;
  unlocked: boolean;
  firstEligibleDay?: number;
  guaranteeDay?: number;
  hasAppeared: boolean;
  specialContractId?: string;
  recruitUnlocked: boolean;
}

export interface CommissionState {
  activeContracts: ContractDefinition[];
  completedContractIds: string[];
  failedContractIds: string[];
  namedEncounters: Record<string, NamedEncounterState>;
  lastDailyCommissionRefreshDay: number;
}
```

And added to `GameState`:

```ts
commission: CommissionState;
```

#### 4.4.2 Action Design (`state/actions.ts`)
The reducer API should keep encounter logic and contract progress explicit.

```ts
| { type: 'REFRESH_DAILY_CONTRACTS' }
| { type: 'OFFER_SPECIAL_CONTRACT'; payload: { mercenaryId: string; contractId: string; source: ContractSource } }
| { type: 'ACCEPT_CONTRACT'; payload: { contractId: string } }
| { type: 'DECLINE_CONTRACT'; payload: { contractId: string } }
| { type: 'SUBMIT_CONTRACT_ITEMS'; payload: { contractId: string; items: { itemId: string; quantity: number; inventoryItemIds?: string[] }[] } }
| { type: 'COMPLETE_CONTRACT'; payload: { contractId: string } }
| { type: 'FAIL_CONTRACT'; payload: { contractId: string; reason: 'DEADLINE' | 'MANUAL' | 'INVALID_STATE' } }
| { type: 'MARK_NAMED_ENCOUNTER_ELIGIBLE'; payload: { mercenaryId: string; currentDay: number } }
| { type: 'TRIGGER_NAMED_ENCOUNTER_CHECK'; payload: { source: ContractSource; currentDay: number } }
| { type: 'UNLOCK_RECRUITMENT'; payload: { mercenaryId: string; contractId: string } }
```

#### 4.4.3 Reducer Responsibilities
-   `state/reducer/mercenary.ts`
    -   Handles the final `UNLOCK_RECRUITMENT` state transition.
    -   Prevents named mercenaries from being hired before special contract completion.
-   `state/reducer/shop.ts`
    -   Can trigger general contract refreshes or shop-origin encounter checks.
    -   Supports contract hand-in if the active customer is the contract issuer.
-   `state/reducer/sleep.ts`
    -   Advances deadlines.
    -   Expires overdue general contracts.
    -   Rolls named encounter guarantee windows forward.
-   `state/reducer/inventory.ts`
    -   Validates submission requirements.
    -   Removes delivered items only on successful submission.
-   `state/reducer/events.ts`
    -   Opens special contract dialogue events and follow-up narrative scenes.

#### 4.4.4 Runtime Flow
1.  Day advances in `sleep.ts`.
2.  `REFRESH_DAILY_CONTRACTS` fills open general contract slots if needed.
3.  Progress checks evaluate whether any named encounter should become eligible.
4.  Entering Shop, Tavern, or Market dispatches `TRIGGER_NAMED_ENCOUNTER_CHECK`.
5.  If the roll succeeds or the guarantee day is reached, `OFFER_SPECIAL_CONTRACT` fires.
6.  Once accepted, the contract is stored in `commission.activeContracts`.
7.  Submission validates inventory and quality.
8.  `COMPLETE_CONTRACT` applies rewards.
9.  If the reward includes `UNLOCK_RECRUIT`, the mercenary becomes recruitable through normal hire flow.

#### 4.4.5 Seeded Randomness Rules
-   General contract generation should use the shared seeded RNG utility.
-   Named encounter appearance checks should also use seeded RNG, but must respect the guarantee day override.
-   Encounter checks should be performed once per valid location entry, not every render.
-   Contract generation should avoid duplicate special contracts if the mercenary is already recruitable or hired.

## 5. UI/UX Patterns
-   **Responsive Design**: Mobile-first approach with Tailwind's `px-safe` and flex/grid layouts.
-   **SfxButton**: A wrapper for standard buttons that integrates sound effects.
-   **Modals**: Managed via state flags (e.g., `showSleepModal`) for immersive overlays.

## 6. Performance Considerations
-   Extensive use of `useMemo` and `useCallback` to prevent unnecessary re-renders in the complex game state.
-   Asset management via `AssetManager` for preloading critical images.

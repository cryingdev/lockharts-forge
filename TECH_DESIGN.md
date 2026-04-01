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
export type GeneralContractKind = 'CRAFT' | 'TURN_IN' | 'HUNT' | 'EXPLORE';
export type ContractStatus = 'OFFERED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
export type ContractSource = 'SHOP' | 'TAVERN' | 'MARKET' | 'SYSTEM';
export type ContractRewardType = 'GOLD' | 'AFFINITY' | 'ITEM' | 'UNLOCK_RECRUIT';

export interface ContractItemRequirement {
  itemId: string;
  quantity: number;
  minQuality?: number;
  acceptedTags?: string[];
}

export interface ContractObjectiveRequirement {
  objectiveId: string;
  targetCount: number;
  currentCount?: number;
  targetType: 'KILL' | 'FLOOR_REACHED' | 'NODE_DISCOVERED' | 'NPC_RESCUED' | 'ITEM_RECOVERED';
  targetId?: string;
  floorNumber?: number;
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
  kind?: GeneralContractKind;
  title: string;
  clientName: string;
  mercenaryId?: string;
  source: ContractSource;
  description: string;
  requirements: ContractItemRequirement[];
  objectives?: ContractObjectiveRequirement[];
  rewards: ContractReward[];
  deadlineDay: number;
  status: ContractStatus;
  encounterRule?: ContractEncounterRule;
  chainId?: string;
  unique?: boolean;
}
```

Recommended interpretation:

-   `type`
    -   High-level category: `GENERAL` or `SPECIAL`
-   `kind`
    -   Gameplay subtype for repeatable contracts:
        -   `CRAFT`: submit crafted equipment
        -   `TURN_IN`: submit stackable loot or gathered materials
        -   `HUNT`: progress from kill tracking or combat results
        -   `EXPLORE`: progress from dungeon exploration milestones
-   `requirements`
    -   Inventory-backed submission requirements
-   `objectives`
    -   Runtime-tracked goals that can progress without immediate inventory submission

#### 4.4.1.1 General Contract Kind Mapping
| `kind` | Uses `requirements` | Uses `objectives` | Primary completion mode | Typical source |
| :--- | :--- | :--- | :--- | :--- |
| `CRAFT` | Yes | Optional | Submit crafted item(s) | `SHOP`, `TAVERN`, `SYSTEM` |
| `TURN_IN` | Yes | No | Submit material stack(s) | `SHOP`, `MARKET`, `SYSTEM` |
| `HUNT` | Optional | Yes | Auto-progress from combat results, then claim | `TAVERN`, `SYSTEM` |
| `EXPLORE` | Optional | Yes | Auto-progress from exploration state, then claim | `TAVERN`, `SYSTEM` |

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
  trackedObjectiveProgress: Record<string, Record<string, number>>;
}
```

And added to `GameState`:

```ts
commission: CommissionState;
```

`trackedObjectiveProgress` is keyed as:

```ts
trackedObjectiveProgress[contractId][objectiveId] = currentProgress;
```

This allows `HUNT` and `EXPLORE` contracts to update incrementally from combat and dungeon reducers without mutating the original contract template shape.

#### 4.4.2 Action Design (`state/actions.ts`)
The reducer API should keep encounter logic and contract progress explicit.

```ts
| { type: 'REFRESH_DAILY_CONTRACTS' }
| { type: 'OFFER_SPECIAL_CONTRACT'; payload: { mercenaryId: string; contractId: string; source: ContractSource } }
| { type: 'ACCEPT_CONTRACT'; payload: { contractId: string } }
| { type: 'DECLINE_CONTRACT'; payload: { contractId: string } }
| { type: 'SUBMIT_CONTRACT_ITEMS'; payload: { contractId: string; items: { itemId: string; quantity: number; inventoryItemIds?: string[] }[] } }
| { type: 'UPDATE_CONTRACT_OBJECTIVE_PROGRESS'; payload: { contractId: string; objectiveId: string; amount: number } }
| { type: 'CLAIM_OBJECTIVE_CONTRACT'; payload: { contractId: string } }
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
-   `state/reducer/combat.ts`
    -   Increments `HUNT` contract objectives when matching enemies are defeated.
-   `state/reducer/dungeon.ts`
    -   Increments `EXPLORE` contract objectives for floor reach, node discovery, rescues, and recovery events.
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
7.  `CRAFT` and `TURN_IN` contracts complete through inventory submission and requirement validation.
8.  `HUNT` and `EXPLORE` contracts update progress passively through combat and dungeon reducers.
9.  Once objective progress reaches all targets, the contract becomes claimable.
10. `COMPLETE_CONTRACT` applies rewards.
11. If the reward includes `UNLOCK_RECRUIT`, the mercenary becomes recruitable through normal hire flow.

#### 4.4.5 Seeded Randomness Rules
-   General contract generation should use the shared seeded RNG utility.
-   Named encounter appearance checks should also use seeded RNG, but must respect the guarantee day override.
-   Encounter checks should be performed once per valid location entry, not every render.
-   Contract generation should avoid duplicate special contracts if the mercenary is already recruitable or hired.

#### 4.4.6 Commission Board UI Flow
The Commission Board should present public contracts as a stateful management screen rather than a flat list of buttons.

Suggested view model:

```ts
type CommissionBoardTab = 'AVAILABLE' | 'ACCEPTED' | 'READY' | 'EXPIRED';

interface CommissionBoardViewModel {
  available: ContractDefinition[];
  accepted: ContractDefinition[];
  ready: ContractDefinition[];
  expired: ContractDefinition[];
  selectedContractId?: string;
}
```

Board grouping rules:

-   `AVAILABLE`
    -   `status === 'OFFERED'`
    -   Source should generally be public-facing contracts only
-   `ACCEPTED`
    -   `status === 'ACTIVE'`
    -   At least one requirement or objective remains incomplete
-   `READY`
    -   `status === 'ACTIVE'`
    -   All submission requirements satisfied or all objective progress complete
-   `EXPIRED`
    -   `status === 'FAILED' || status === 'EXPIRED'`
    -   Optional short-lived UI bucket for recent feedback

Recommended UI actions by state:

```ts
AVAILABLE -> ACCEPT_CONTRACT
ACCEPTED  -> DECLINE_CONTRACT | OPEN_CONTRACT_DETAIL
READY     -> SUBMIT_CONTRACT_ITEMS | CLAIM_OBJECTIVE_CONTRACT
EXPIRED   -> DISMISS_EXPIRED_NOTICE
```

Status derivation notes:

-   `CRAFT`
    -   `READY` requires matching item presence and quality validation
-   `TURN_IN`
    -   `READY` requires matching material counts in inventory
-   `HUNT`
    -   `READY` requires objective progress target met
-   `EXPLORE`
    -   `READY` requires objective progress target met and any event flags satisfied

Detail panel expectations:

-   Selected contract detail should display:
    -   Type and source
    -   Issuer name
    -   Deadline and urgency state
    -   Reward breakdown
    -   Requirement list and live progress
    -   Current available actions
-   The detail panel should be the single place where `Accept`, `Abandon`, `Submit`, or `Claim` actions are executed.

Reducer and selector guidance:

-   Use selectors to derive `ready` state from inventory plus tracked objective progress rather than storing a second redundant status flag.
-   `CommissionBoard` should consume:
    -   `commission.activeContracts`
    -   `commission.trackedObjectiveProgress`
    -   inventory state
    -   current day for deadline urgency
-   Expiration should still be authoritative in reducers; the Board only reflects current state.

#### 4.4.7 Board Issuer Profiles And Implementation Order
To make the Board feel like a public town contract system rather than a generic quest list, each Board contract should come from a defined issuer profile.

Canonical issuer set:

```ts
type BoardIssuerId =
  | 'TOWN_GUARD'
  | 'ASHFIELD_TRADERS'
  | 'CHAPEL_OF_EMBER'
  | 'ADVENTURERS_GUILD';

interface BoardIssuerProfile {
  id: BoardIssuerId;
  displayName: string;
  favoredKinds: GeneralContractKind[];
  rewardBias: 'GOLD' | 'REPUTATION' | 'UTILITY' | 'DUNGEON';
  urgencyBias: 'LOW' | 'MEDIUM' | 'HIGH';
  flavorTone: string;
  source: 'BOARD';
}
```

Recommended defaults:

```ts
const BOARD_ISSUER_PROFILES: BoardIssuerProfile[] = [
  {
    id: 'TOWN_GUARD',
    displayName: 'Town Guard',
    favoredKinds: ['CRAFT', 'HUNT', 'EXPLORE'],
    rewardBias: 'REPUTATION',
    urgencyBias: 'HIGH',
    flavorTone: 'Practical, defensive, and urgent',
    source: 'BOARD',
  },
  {
    id: 'ASHFIELD_TRADERS',
    displayName: 'Ashfield Traders',
    favoredKinds: ['CRAFT', 'TURN_IN'],
    rewardBias: 'GOLD',
    urgencyBias: 'MEDIUM',
    flavorTone: 'Commercial, deadline-aware, and transactional',
    source: 'BOARD',
  },
  {
    id: 'CHAPEL_OF_EMBER',
    displayName: 'Chapel of Ember',
    favoredKinds: ['TURN_IN', 'CRAFT', 'HUNT', 'EXPLORE'],
    rewardBias: 'UTILITY',
    urgencyBias: 'MEDIUM',
    flavorTone: 'Protective, solemn, and recovery-focused',
    source: 'BOARD',
  },
  {
    id: 'ADVENTURERS_GUILD',
    displayName: 'Adventurers\\' Guild',
    favoredKinds: ['HUNT', 'EXPLORE', 'CRAFT', 'TURN_IN'],
    rewardBias: 'DUNGEON',
    urgencyBias: 'MEDIUM',
    flavorTone: 'Risk-tolerant, field-oriented, and opportunistic',
    source: 'BOARD',
  },
];
```

Implementation goal:

-   A Board contract should always be traceable back to an issuer profile.
-   Issuer profile should influence:
    -   Which contract kinds are likely to appear.
    -   Reward composition.
    -   Deadline urgency.
    -   Contract title and flavor text.
-   Issuer profile should not directly alter core completion rules. Completion logic still belongs to contract kind and objective definitions.

Recommended implementation order for AI-assisted coding:

1.  Add issuer profile types and registry.
    -   Files:
        -   `types/game-state.ts`
        -   `data/contracts/boardIssuers.ts` (new)
    -   Tasks:
        -   Add `BoardIssuerId`.
        -   Add `BoardIssuerProfile`.
        -   Add `issuerId?: BoardIssuerId` and `issuerName?: string` to `ContractDefinition`.
    -   Done when:
        -   Every Board contract can store an issuer identifier without breaking existing named or non-Board contracts.

2.  Attach issuer selection to Board contract generation.
    -   Files:
        -   `state/reducer/commission.ts`
        -   optional helper: `utils/contracts/boardContractGenerator.ts` (new)
    -   Tasks:
        -   During `REFRESH_DAILY_CONTRACTS`, pick an issuer first.
        -   Use `favoredKinds` and the current progression tier to choose a valid contract kind.
        -   Populate `issuerId`, `issuerName`, and flavor text fields on generated contracts.
    -   Done when:
        -   Freshly generated Board contracts always display a valid issuer and contract kind that matches that issuer profile.

3.  Bias rewards and deadlines using issuer profile.
    -   Files:
        -   `state/reducer/commission.ts`
        -   optional helper: `utils/contracts/contractRewardUtils.ts` (new)
    -   Tasks:
        -   Map `rewardBias` to reward tables:
            -   `GOLD`: higher payout, lower utility rewards
            -   `REPUTATION`: moderate gold, more district or issuer trust value
            -   `UTILITY`: recovery items, supplies, small gold
            -   `DUNGEON`: rarer materials, supply crates, moderate gold
        -   Map `urgencyBias` to deadline range.
    -   Done when:
        -   Guard contracts feel shorter and more urgent than trader contracts.
        -   Chapel and Guild contracts produce meaningfully different reward shapes.

4.  Generate issuer-specific titles and flavor text.
    -   Files:
        -   `data/contracts/boardTextTemplates.ts` (new)
        -   `state/reducer/commission.ts`
    -   Tasks:
        -   Add template pools keyed by `issuerId` and `GeneralContractKind`.
        -   Build contract titles and one-line summaries from template data rather than generic strings.
    -   Done when:
        -   A player can distinguish Guard, Traders, Chapel, and Guild postings by text alone.

5.  Surface issuer identity in Board UI.
    -   Files:
        -   `components/tabs/tavern/ui/CommissionBoard.tsx`
        -   optional selector updates in `state/selectors/commissionSelectors.ts`
    -   Tasks:
        -   Show issuer name prominently on every card.
        -   Keep reward summary and time remaining near the issuer label.
        -   Optionally tint or badge cards per issuer, but keep the first pass simple and text-led.
    -   Done when:
        -   Contract cards read as public notices from recognizable town factions instead of anonymous jobs.

6.  Add balancing safeguards.
    -   Files:
        -   `state/reducer/commission.ts`
        -   optional config file: `config/board-contract-config.ts` (new)
    -   Tasks:
        -   Prevent the Board from filling with only one issuer.
        -   Prevent duplicate contract kinds from the same issuer if better variety exists.
        -   Keep early-game Board output biased toward `CRAFT` and `TURN_IN`.
    -   Done when:
        -   Daily Board refreshes feel varied and readable.

Recommended low-risk delivery sequence:

1.  Data layer only: issuer types, registry, and `ContractDefinition` fields.
2.  Generation layer: assign `issuerId` and `issuerName` to all newly created Board contracts.
3.  Reward/deadline bias layer.
4.  Text template layer.
5.  UI layer.
6.  Variety and balancing pass.

Notes for implementation:

-   Keep Board issuer logic separate from named contract issuer logic. Named encounters are character-driven, not public-faction driven.
-   Avoid coupling issuer identity to exact item ids. Issuers should prefer categories and contract kinds, then resolve concrete items through the normal progression-aware generator.
-   If implementation scope must stay small, complete steps 1, 2, and 5 first. That is the minimum version that makes the Board feel authored rather than generic.

### 4.5 Tavern Reputation System
`Tavern Reputation` should be modeled as a Tavern-level progression value that affects recruit quality, not recruit affinity.

-   Primary purpose:
    -   Improve the quality of candidates returned by Tavern recruitment interactions such as `Invite`.
    -   Expand the class pool and level band available from the Tavern.
    -   Gate some Tavern-based named encounter eligibility.
-   Explicit non-goals:
    -   Do not modify starting affinity.
    -   Do not reduce hiring cost by default.
    -   Do not guarantee agreement, loyalty, or immediate relationship benefits.

#### 4.5.1 Data Modeling (`types/`)
Recommended additions to `/types/game-state.ts`:

```ts
export interface TavernState {
  reputation: number;
  lastInviteDay: number;
  inviteCountToday: number;
}
```

And added to `GameState`:

```ts
tavern: TavernState;
```

#### 4.5.2 Recruit Quality Effects
Tavern Reputation should drive recruit generation through weighted bounds rather than direct stat gifts.

-   Suggested effects:
    -   Increase the minimum and maximum level range for random Tavern recruits.
    -   Increase weight for uncommon classes such as Mage and Cleric.
    -   Increase the chance to roll higher-value traits or advanced recruit templates.
    -   Unlock specific named encounter checks once minimum reputation thresholds are met.
-   Suggested non-effects:
    -   No starting affinity bonus.
    -   No automatic hire price discount.
    -   No bypass of named contract completion.

#### 4.5.3 Integration Points
-   `utils/mercenaryGenerator.ts`
    -   Accept Tavern Reputation as an input when generating Tavern invite candidates.
    -   Derive recruit level band and class weights from reputation buckets.
-   `state/reducer/tavern.ts` or Tavern interaction handler
    -   Increment Tavern Reputation from successful Tavern-origin commissions, positive social events, and high-value recruit outcomes.
    -   Apply daily limits or diminishing returns if repeated invites are spammed.
-   `state/reducer/commission.ts`
    -   Use Tavern Reputation as an optional unlock requirement for Tavern-based named encounters.
-   `components/tabs/tavern/`
    -   Show Tavern Reputation and a lightweight explanation of what higher reputation improves.

#### 4.5.4 Suggested Reputation Buckets
| Reputation | Recruit Level Effect | Class Pool Effect | Named Encounter Effect |
| :--- | :--- | :--- | :--- |
| `0-19` | Base low-level pool | Mostly common martial classes | Early Tavern encounters only |
| `20-39` | Slightly wider level band | Rogue/support weight increases | Mid-early encounters may unlock |
| `40-59` | Veteran recruits appear | Mage/Cleric weight rises | Most Tavern named encounters eligible |
| `60+` | High-end candidate band | Rare classes/traits more common | Late Tavern named encounters can appear |

## 5. UI/UX Patterns
-   **Responsive Design**: Mobile-first approach with Tailwind's `px-safe` and flex/grid layouts.
-   **SfxButton**: A wrapper for standard buttons that integrates sound effects.
-   **Modals**: Managed via state flags (e.g., `showSleepModal`) for immersive overlays.

## 6. Performance Considerations
-   Extensive use of `useMemo` and `useCallback` to prevent unnecessary re-renders in the complex game state.
-   Asset management via `AssetManager` for preloading critical images.

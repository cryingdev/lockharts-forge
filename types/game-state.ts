import { InventoryItem } from './inventory';
import { GameEvent } from './events';
import { ShopCustomer } from './shop';
import { Mercenary, MercenaryTemperament, MercenaryVoice } from '../models/Mercenary';
import { Expedition } from '../models/Dungeon';
import { Monster } from '../models/Monster';

export type RoomType = 'EMPTY' | 'ENTRANCE' | 'BOSS' | 'KEY' | 'WALL' | 'NPC' | 'GOLD' | 'TRAP' | 'STAIRS' | 'ENEMY' | 'RESOURCE';

export type ContractType = 'GENERAL' | 'SPECIAL';
export type GeneralContractKind = 'CRAFT' | 'TURN_IN' | 'HUNT' | 'EXPLORE' | 'BOSS';
export type ContractStatus = 'OFFERED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export type ContractSource = 'SHOP' | 'TAVERN' | 'MARKET' | 'SYSTEM' | 'BOARD';
export type ContractRewardType = 'GOLD' | 'AFFINITY' | 'ITEM' | 'UNLOCK_RECRUIT' | 'ISSUER_AFFINITY';
export type ContractObjectiveType = 'KILL' | 'FLOOR_REACHED' | 'NODE_DISCOVERED' | 'NPC_RESCUED' | 'ITEM_RECOVERED' | 'TURN_IN';

export type TavernTalkOutcome = 'FLAVOR' | 'RUMOR' | 'MINOR_CONTRACT' | 'OPPORTUNITY';
export type TavernTalkTone = 'COLD' | 'NEUTRAL' | 'WARM';
export type TavernTalkConditionJob = 'Fighter' | 'Mage' | 'Rogue' | 'Cleric' | 'Novice' | 'ANY';
export type DialogueProgressStage = 'EARLY' | 'MID' | 'LATE';
export type NamedConversationEventTag = 'INJURY' | 'RETREAT' | 'BOSS_CLEAR' | 'SHOP_GROWTH' | 'MORALITY' | 'TRUST' | 'PAYMENT';
export type Language = 'en' | 'ko';

export interface TavernTalkEntry {
  id: string;
  outcome: TavernTalkOutcome;
  speakerJob: TavernTalkConditionJob;
  minAffinity?: number;
  maxAffinity?: number;
  minTier?: number;
  requiresHired?: boolean;
  requiresVisitor?: boolean;
  temperament?: MercenaryTemperament | 'ANY';
  voice?: MercenaryVoice | 'ANY';
  minProgressStage?: DialogueProgressStage;
  maxProgressStage?: DialogueProgressStage;
  weight: number;
  text?: string;
  textKey?: string;
  followupText?: string;
  followupTextKey?: string;
  rumorTag?: string;
  contractTemplateId?: string;
  unlockNamedId?: string;
}

export interface TavernMinorContractTemplate {
  id: string;
  title?: string;
  titleKey?: string;
  kind: GeneralContractKind;
  description?: string;
  descriptionKey?: string;
  requirements: ContractItemRequirement[];
  rewardGold: number;
  rewardAffinity: number;
  deadlineDays: number;
}

export interface NamedConversationPromptOption {
  id: string;
  textKey: string;
  responseTextKey: string;
  affinityDelta: number;
  tavernReputationDelta?: number;
  followupTextKey?: string;
}

export interface NamedConversationPrompt {
  id: string;
  mercenaryId: string;
  eventTag: NamedConversationEventTag;
  once?: boolean;
  minAffinity?: number;
  minProgressStage?: DialogueProgressStage;
  textKey: string;
  options: NamedConversationPromptOption[];
}

export type BoardIssuerId =
  | 'TOWN_GUARD'
  | 'ASHFIELD_TRADERS'
  | 'CHAPEL_OF_EMBER'
  | 'ADVENTURERS_GUILD';

export type BoardRewardBias = 'GOLD' | 'REPUTATION' | 'UTILITY' | 'DUNGEON';
export type BoardUrgencyBias = 'LOW' | 'MEDIUM' | 'HIGH';

export interface BoardIssuerProfile {
  id: BoardIssuerId;
  displayName: string;
  favoredKinds: GeneralContractKind[];
  rewardBias: BoardRewardBias;
  urgencyBias: BoardUrgencyBias;
  flavorTone: string;
}

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
  targetType: ContractObjectiveType;
  label: string;
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
  issuerId?: BoardIssuerId;
  issuerAffinity?: number;
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
  issuer?: string;
  issuerId?: BoardIssuerId;
  issuerName?: string;
  urgency?: 'NORMAL' | 'HIGH' | 'URGENT';
  mercenaryId?: string;
  source: ContractSource;
  description: string;
  requirements: ContractItemRequirement[];
  objectives?: ContractObjectiveRequirement[];
  rewards: ContractReward[];
  deadlineDay: number;
  daysRemaining?: number;
  status: ContractStatus;
  encounterRule?: ContractEncounterRule;
  chainId?: string;
  unique?: boolean;
}

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
    requiredDungeonIds?: string[];
    requireInjuredMercenary?: boolean;
    requireRecoveryFlowSeen?: boolean;
  };
  encounterRule: ContractEncounterRule;
  requirements: ContractItemRequirement[];
  rewards: ContractReward[];
  daysRemaining?: number;
  encounterDialogue: {
    text?: string;
    speaker: string;
    textKey?: string;
  };
}

export interface NamedEncounterState {
  mercenaryId: string;
  unlocked: boolean;
  daysEligible?: number;
  declinedUntilDay?: number;
  firstEligibleDay?: number;
  guaranteeDay?: number;
  hasAppeared: boolean;
  specialContractId?: string;
  recruitUnlocked: boolean;
}

export interface CommissionState {
  activeContracts: ContractDefinition[];
  expiredContracts: ContractDefinition[];
  completedContractIds: string[];
  failedContractIds: string[];
  namedEncounters: Record<string, NamedEncounterState>;
  trackedObjectiveProgress: Record<string, Record<string, number>>;
  lastDailyCommissionRefreshDay: number;
  lastEncounterCheckDayByLocation?: Partial<Record<ContractSource, number>>;
  issuerAffinity: Partial<Record<BoardIssuerId, number>>;
  hasSeenRecoveryFlow?: boolean; // New: Track if player has seen the recovery tutorial/flow
  hasHadInjuredMercenary?: boolean; // New: Track if player has ever had an injured mercenary
}

export interface ManualDungeonSession {
    dungeonId: string;
    partyIds: string[];
    grid: RoomType[][];
    visited: boolean[][]; // Fog of war
    playerPos: { x: number, y: number };
    pathHistory: { x: number, y: number }[]; // 이동 경로 기록
    hasKey: boolean;
    isBossLocked: boolean;
    isBossDefeated?: boolean; 
    enemies?: Monster[]; 
    npcFound?: boolean; 
    rescuedNpcId?: string; 
    goldCollected: number; 
    collectedLoot: { id: string; count: number; name: string }[]; // New: Real-time loot tracking
    sessionXp: Record<string, number>; // New: Track XP gained during this session for result screen
    encounterStatus: 'NONE' | 'ENCOUNTERED' | 'BATTLE' | 'VICTORY' | 'DEFEAT' | 'STAIRS';
    currentEnemyHp?: number;
    lastActionMessage?: string; 
    currentFloor: number;
    maxFloors: number;
    floorBoost: number; // New: 5% stackable boost per consecutive floor
}

export interface DailyFinancials {
  incomeShop: number;
  incomeInventory: number;
  incomeDungeon: number;
  incomeRepair: number;
  expenseMarket: number;
  expenseWages: number;
  expenseScout: number;
}

export interface PlayerStats {
  gold: number;
  energy: number;
  maxEnergy: number;
  day: number;
  tierLevel: number; 
  smithingExp: number; 
  workbenchExp: number; 
  inviteCount: number; // New: Track number of invites today
  totalSalesCount: number; // New: Track total items sold in shop
  dailyFinancials: DailyFinancials; 
}

export interface ForgeStatus {
  hasFurnace: boolean;
  hasWorkbench: boolean;
  hasResearchTable: boolean;
  anvilLevel: number;
  isShopOpen: boolean;
}

export interface DungeonResult {
    dungeonName: string;
    rewards: { id: string; name: string; count: number }[];
    goldGained?: number;
    mercenaryResults: {
        id: string;
        name: string;
        job: string;
        levelBefore: number;
        levelAfter: number;
        xpGained: number;
        currentXp: number;
        xpToNext: number;
        statusChange?: 'NONE' | 'INJURED' | 'DEAD';
    }[];
    rescuedMercenary?: Mercenary; 
    isDefeat?: boolean;
}

export interface GameToast {
    message: string;
    visible: boolean;
}

export interface DialogueOption {
  label: string;
  action?: (() => void) | { type: string; payload?: any };
  variant?: 'primary' | 'danger' | 'neutral' | 'secondary';
  disabled?: boolean;
  targetTab?: string;
}

export interface DialogueState {
  speaker: string;
  text: string;
  avatar?: string;
  options: DialogueOption[];
}

export interface CommissionRewardPreviewLine {
  type: 'GOLD' | 'ISSUER_AFFINITY' | 'AFFINITY' | 'UNLOCK_RECRUIT';
  label: string;
  beforeText?: string;
  afterText?: string;
  deltaText?: string;
}

export interface CommissionRewardPreviewState {
  contractTitle: string;
  lines: CommissionRewardPreviewLine[];
}

export interface TavernState {
  reputation: number;
  lastInviteDay: number;
  inviteCountToday: number;
  lodgingLevel: number;
}

export type TutorialSceneMode = 'PROLOGUE' | 'FURNACE_RESTORED' | 'MARKET' | 'SMITHING';

export interface AudioSettings {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    masterEnabled: boolean;
    musicEnabled: boolean;
    sfxEnabled: boolean;
}

export interface GameSettings {
    showLogTicker: boolean;
    inventoryViewMode: 'GRID' | 'LIST';
    language: Language;
    playerName: string;
    forgeName?: string;
    audio: AudioSettings;
}

export interface GameState {
  stats: PlayerStats;
  inventory: InventoryItem[];
  forge: ForgeStatus;
  activeEvent: GameEvent | null;
  logs: string[]; 
  knownMercenaries: Mercenary[]; 
  
  activeCustomer: null | ShopCustomer; 
  songQueue?: any; // Deprecated or unused but kept for compatibility if needed
  shopQueue: ShopCustomer[]; 
  visitorsToday: string[]; 
  talkedToToday: string[]; 
  boughtDrinkToday: string[]; 
  namedConversationHistory: Record<string, string[]>;
  namedConversationAlignment: Record<string, number>;
  namedConversationRewarded: Record<string, boolean>;
  tavern: TavernState;

  marketStock: Record<string, number>; 
  garrickAffinity: number;
  talkedToGarrickToday: boolean;

  isCrafting: boolean; 
  isResearchOpen: boolean;
  showSleepModal: boolean; 
  showJournal: boolean; 
  showTutorialCompleteModal: boolean; 
  toast: GameToast | null; 
  toastQueue: string[]; 
  
  craftingMastery: Record<string, number>; 
  unlockedRecipes: string[]; 
  unlockedTabs: string[]; 
  unlockedTierPopup: { type: 'FORGE' | 'WORKBENCH'; tier: number } | null; 
  
  tutorialStep: 
    | 'PROLOGUE_DIALOG_GUIDE'
    | 'MARKET_POI_GUIDE' 
    | 'BROWSE_GOODS_GUIDE' 
    | 'FURNACE_GUIDE' 
    | 'PAY_NOW_GUIDE' 
    | 'GARRICK_AFTER_PURCHASE_DIALOG_GUIDE' 
    | 'GARRICK_EXIT_DIALOG_GUIDE'
    | 'LEAVE_MARKET_GUIDE'
    | 'REPLACE_FURNACE_GUIDE'
    | 'IGNITE_FURNACE_GUIDE'
    | 'PUMP_FURNACE_GUIDE'
    | 'FORGE_POI_GUIDE' 
    | 'OPEN_RECIPE_GUIDE'
    | 'SELECT_SWORD_GUIDE' 
    | 'START_FORGING_GUIDE' 
    | 'SMITHING_INTRO_DIALOG_GUIDE'
    | 'SMITHING_TOUCH_TO_START_GUIDE'
    | 'SMITHING_MINIGAME_HIT_GUIDE'
    | 'FIRST_HIT_DIALOG_GUIDE' 
    | 'FINALIZE_FORGE_GUIDE' 
    | 'OPEN_SHOP_SIGN_GUIDE'
    | 'SELL_ITEM_GUIDE' 
    | 'CRAFT_FIRST_SWORD_GUIDE'
    | 'CRAFT_FIRST_SWORD_DIALOG_GUIDE'
    | 'PIP_RETURN_DIALOG_GUIDE'
    | 'PIP_RETURN_GUIDE'
    | 'CRAFT_RESULT_DIALOG_GUIDE'
    | 'SHOP_INTRO_DIALOG_GUIDE'
    | 'PIP_PRAISE_DIALOG_GUIDE'
    | 'TUTORIAL_FINISH_DIALOG_GUIDE'
    | 'TUTORIAL_END_DIALOG_GUIDE'
    | null;
    
  activeTutorialScene: TutorialSceneMode | null;
  hasCompletedPrologue: boolean;

  forgeTemperature: number; 
  lastForgeTime: number; 

  activeExpeditions: Expedition[];
  dungeonClearCounts: Record<string, number>; 
  maxFloorReached: Record<string, number>; // New: Track progress per dungeon area
  dungeonResult: DungeonResult | null; 
  activeManualDungeon: ManualDungeonSession | null; 
  showManualDungeonOverlay: boolean; 

  lastCraftedItem: null | InventoryItem;

  commission: CommissionState;

  activeDialogue: DialogueState | null;
  commissionRewardPreview: CommissionRewardPreviewState | null;

  uiEffects: {
    energyHighlight: boolean;
  };

  settings: GameSettings;
  seed: number;
}

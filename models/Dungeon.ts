export interface DungeonReward {
  itemId: string;
  minQuantity: number;
  maxQuantity: number;
  chance: number; // 0.0 to 1.0
}

export interface DungeonDefinition {
  id: string;
  name: string;
  tier: number;
  description: string;
  durationMinutes: number;
  requiredPower: number;
  energyCost: number; // For Auto Expedition
  
  // Manual Expedition Settings
  maxFloors: number; // New: Total depth of this dungeon area
  gridWidth: number;
  gridHeight: number;
  moveEnergy: number; 
  bossEnergy: number;
  isBossLocked?: boolean;

  rewards: DungeonReward[];
  goldReward?: number; // Fixed gold reward upon completion
  bossUnlockReq?: number; // Number of clears to unlock boss variant
  bossVariantId?: string;
  baseXp: number; // XP gained per mercenary
  maxPartySize?: number; // Maximum allowed party size for this dungeon
}

export type ExpeditionStatus = 'ACTIVE' | 'COMPLETED';

export interface Expedition {
  id: string;
  dungeonId: string;
  partyIds: string[];
  startTime: number;
  endTime: number;
  status: ExpeditionStatus;
}
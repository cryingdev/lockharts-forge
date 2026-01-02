
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
  energyCost: number; // Applied to each mercenary
  rewards: DungeonReward[];
  bossUnlockReq?: number; // Number of clears to unlock boss variant
  bossVariantId?: string;
  baseXp: number; // XP gained per mercenary
}

export type ExpeditionStatus = 'ACTIVE' | 'COMPLETED';

export interface Expedition {
  id: string;
  dungeonId: string;
  partyIds: string[];
  startTime: number;
  endTime: number;
  status: ExpeditionStatus;
  // notifiedReady removed - we use status transition to COMPLETED instead
}

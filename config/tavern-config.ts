export const TAVERN_BASE_LODGING_CAPACITY = 6;
export const TAVERN_LODGING_CAPACITY_LEVELS = [8, 16, 24, 32] as const;
export const TAVERN_LODGING_UPGRADE_COSTS = [1200, 3500, 8000, 16000] as const;

export const TAVERN_INVITE_BASE_MAX_LEVEL = 4;
export const TAVERN_INVITE_MAX_LEVEL_BY_LODGING = [6, 10, 14, 18] as const;

export const getTavernInviteMaxLevelFromLodging = (lodgingLevel: number): number => {
  if (lodgingLevel <= 0) return TAVERN_INVITE_BASE_MAX_LEVEL;
  return TAVERN_INVITE_MAX_LEVEL_BY_LODGING[Math.min(lodgingLevel - 1, TAVERN_INVITE_MAX_LEVEL_BY_LODGING.length - 1)];
};

export const getTavernInviteMaxLevelFromReputation = (reputation: number): number => {
  if (reputation >= 60) return 16;
  if (reputation >= 40) return 12;
  if (reputation >= 20) return 8;
  return TAVERN_INVITE_BASE_MAX_LEVEL;
};

export const getTavernInviteMaxLevel = (lodgingLevel: number, reputation: number): number =>
  Math.max(
    getTavernInviteMaxLevelFromLodging(lodgingLevel),
    getTavernInviteMaxLevelFromReputation(reputation)
  );

export const getTavernLodgingCapacity = (lodgingLevel: number): number => {
  if (lodgingLevel <= 0) return TAVERN_BASE_LODGING_CAPACITY;
  return TAVERN_LODGING_CAPACITY_LEVELS[Math.min(lodgingLevel - 1, TAVERN_LODGING_CAPACITY_LEVELS.length - 1)];
};

export const getNextTavernLodgingCapacity = (lodgingLevel: number): number | null => {
  if (lodgingLevel >= TAVERN_LODGING_CAPACITY_LEVELS.length) return null;
  return TAVERN_LODGING_CAPACITY_LEVELS[lodgingLevel];
};

export const getTavernLodgingUpgradeCost = (lodgingLevel: number): number | null => {
  if (lodgingLevel >= TAVERN_LODGING_UPGRADE_COSTS.length) return null;
  return TAVERN_LODGING_UPGRADE_COSTS[lodgingLevel];
};

export const isTavernLodgingMaxed = (lodgingLevel: number): boolean =>
  lodgingLevel >= TAVERN_LODGING_CAPACITY_LEVELS.length;

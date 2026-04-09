export const TAVERN_BASE_LODGING_CAPACITY = 6;
export const TAVERN_LODGING_CAPACITY_LEVELS = [8, 16, 24, 32] as const;
export const TAVERN_LODGING_UPGRADE_COSTS = [1200, 3500, 8000, 16000] as const;

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

export interface BossTrophyDefinition {
  bossId: string;
  itemId: string;
  trophyName: string;
  bossName: string;
  tier: number;
}

export const BOSS_TROPHIES: BossTrophyDefinition[] = [
  {
    bossId: 'plague_rat_king',
    itemId: 'trophy_rat_king',
    trophyName: "Rat King's Crown Shard",
    bossName: 'Plague Rat King',
    tier: 1,
  },
  {
    bossId: 'goblin_king',
    itemId: 'trophy_goblin_king',
    trophyName: "Goblin King's Scepter",
    bossName: 'Goblin King',
    tier: 2,
  },
  {
    bossId: 'brood_mother',
    itemId: 'trophy_brood_mother',
    trophyName: "Brood Mother's Eye",
    bossName: 'Brood Mother',
    tier: 2,
  },
  {
    bossId: 'werewolf',
    itemId: 'trophy_werewolf',
    trophyName: "Werewolf's Alpha Pelt",
    bossName: 'Werewolf',
    tier: 2,
  },
  {
    bossId: 'kobold_foreman',
    itemId: 'trophy_kobold_foreman',
    trophyName: "Foreman's Golden Pickaxe",
    bossName: 'Kobold Foreman',
    tier: 2,
  },
];

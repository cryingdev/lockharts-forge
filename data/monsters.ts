import { Monster } from '../models/Monster';
/**
 * Monster combat stats are "DerivedStats" snapshots.
 * Drops are separated to avoid touching Monster model & combat systems.
 */
export const MONSTERS: Record<string, Monster> = {
  // =========================
  // BAND 1 (Cellar / Vermin) - 9
  // =========================
  giant_rat: {
    id: 'giant_rat',
    name: 'Giant Rat',
    level: 1,
    icon: '🐀',
    sprite: 'giant_rat.png',
    description: 'A bloated cellar rat with needle teeth.',
    currentHp: 90,
    rewardXp: 55,
    stats: {
      maxHp: 90, maxMp: 0,
      physicalAttack: 18, physicalDefense: 10, physicalReduction: 0.06,
      magicalAttack: 0, magicalDefense: 8, magicalReduction: 0.05,
      critChance: 3, critDamage: 150,
      accuracy: 95, evasion: 6, speed: 118
    }
  },
  sewer_slime: {
    id: 'sewer_slime',
    name: 'Sewer Slime',
    level: 1,
    icon: '🟢',
    sprite: 'sewer_slime.png',
    description: 'A wobbling mass that dissolves metal and cloth.',
    currentHp: 120,
    rewardXp: 60,
    stats: {
      maxHp: 120, maxMp: 0,
      physicalAttack: 14, physicalDefense: 16, physicalReduction: 0.10,
      magicalAttack: 6, magicalDefense: 12, magicalReduction: 0.07,
      critChance: 2, critDamage: 150,
      accuracy: 92, evasion: 2, speed: 95
    }
  },
  cave_bat: {
    id: 'cave_bat',
    name: 'Cave Bat',
    level: 2,
    icon: '🦇',
    sprite: 'cave_bat.png',
    description: 'A screeching flier that strikes from the dark.',
    currentHp: 80,
    rewardXp: 75,
    stats: {
      maxHp: 80, maxMp: 0,
      physicalAttack: 20, physicalDefense: 8, physicalReduction: 0.05,
      magicalAttack: 0, magicalDefense: 10, magicalReduction: 0.06,
      critChance: 6, critDamage: 155,
      accuracy: 98, evasion: 18, speed: 140
    }
  },
  rat_man: {
    id: 'rat_man',
    name: 'Rat Man',
    level: 2,
    icon: '🐀',
    sprite: 'rat_man.png',
    description: 'A mutated, semi-intelligent scavenger hiding in the depths.',
    currentHp: 150,
    rewardXp: 100,
    stats: {
      maxHp: 150, maxMp: 0,
      physicalAttack: 30, physicalDefense: 20, physicalReduction: 0.10,
      magicalAttack: 0, magicalDefense: 20, magicalReduction: 0.10,
      critChance: 5, critDamage: 150,
      accuracy: 90, evasion: 5, speed: 115
    }
  },
  mold_sporeling: {
    id: 'mold_sporeling',
    name: 'Mold Sporeling',
    level: 2,
    icon: '🍄',
    sprite: 'mold_sporeling.png',
    description: 'A fungus-creature that spreads choking spores.',
    currentHp: 140,
    rewardXp: 95,
    stats: {
      maxHp: 140, maxMp: 25,
      physicalAttack: 12, physicalDefense: 18, physicalReduction: 0.11,
      magicalAttack: 18, magicalDefense: 16, magicalReduction: 0.10,
      critChance: 4, critDamage: 150,
      accuracy: 94, evasion: 6, speed: 108
    }
  },
  carrion_beetle: {
    id: 'carrion_beetle',
    name: 'Carrion Beetle',
    level: 3,
    icon: '🪲',
    sprite: 'carrion_beetle.png',
    description: 'Hard-shelled scavenger. Its chitin takes a polish.',
    currentHp: 220,
    rewardXp: 130,
    stats: {
      maxHp: 220, maxMp: 0,
      physicalAttack: 24, physicalDefense: 34, physicalReduction: 0.18,
      magicalAttack: 0, magicalDefense: 18, magicalReduction: 0.11,
      critChance: 4, critDamage: 150,
      accuracy: 96, evasion: 8, speed: 105
    }
  },
  ember_beetle: {
    id: 'ember_beetle',
    name: 'Ember Beetle',
    level: 3,
    icon: '🔥',
    sprite: 'ember_beetle.png',
    description: 'A heat-fed beetle that glows faintly like embers in the dark.',
    currentHp: 240,
    rewardXp: 140,
    stats: {
      maxHp: 240, maxMp: 0,
      physicalAttack: 22, physicalDefense: 30, physicalReduction: 0.16,
      magicalAttack: 26, magicalDefense: 16, magicalReduction: 0.10,
      critChance: 5, critDamage: 155,
      accuracy: 92, evasion: 10, speed: 112
    }
  },
  sewer_thief: {
    id: 'sewer_thief',
    name: 'Sewer Thief',
    level: 3,
    icon: '🗡️',
    sprite: 'sewer_thief.png',
    description: 'A desperate cutpurse hiding among the vermin.',
    currentHp: 180,
    rewardXp: 140,
    stats: {
      maxHp: 180, maxMp: 0,
      physicalAttack: 32, physicalDefense: 18, physicalReduction: 0.10,
      magicalAttack: 0, magicalDefense: 14, magicalReduction: 0.09,
      critChance: 9, critDamage: 160,
      accuracy: 102, evasion: 22, speed: 145
    }
  },
  plague_rat_king: {
    id: 'plague_rat_king',
    name: 'Plague Rat King',
    level: 3,
    icon: '👑',
    sprite: 'rat_king.png',
    description: 'A bloated, intelligent rodent ruling over the filth of the cellar.',
    currentHp: 450,
    rewardXp: 250,
    stats: {
      maxHp: 450, maxMp: 0,
      physicalAttack: 28, physicalDefense: 45, physicalReduction: 0.23,
      magicalAttack: 0, magicalDefense: 20, magicalReduction: 0.12,
      critChance: 10, critDamage: 150,
      accuracy: 85, evasion: 15, speed: 120
    }
  },

  // =========================
  // BAND 2 (Goblins / Bandits / Wolves) - 10
  // =========================
  goblin_grunt: {
    id: 'goblin_grunt',
    name: 'Goblin Grunt',
    level: 4,
    icon: '👺',
    sprite: 'goblin_grunt.png',
    description: 'A small raider with sharp instincts and rusty blades.',
    currentHp: 380,
    rewardXp: 230,
    stats: {
      maxHp: 380, maxMp: 0,
      physicalAttack: 42, physicalDefense: 28, physicalReduction: 0.16,
      magicalAttack: 0, magicalDefense: 20, magicalReduction: 0.12,
      critChance: 6, critDamage: 155,
      accuracy: 98, evasion: 16, speed: 125
    }
  },
  goblin_slinger: {
    id: 'goblin_slinger',
    name: 'Goblin Slinger',
    level: 4,
    icon: '🏹',
    sprite: 'goblin_slinger.png',
    description: 'Keeps distance and peppers targets with scrap-shot.',
    currentHp: 310,
    rewardXp: 240,
    stats: {
      maxHp: 310, maxMp: 0,
      physicalAttack: 46, physicalDefense: 20, physicalReduction: 0.12,
      magicalAttack: 0, magicalDefense: 18, magicalReduction: 0.11,
      critChance: 8, critDamage: 160,
      accuracy: 110, evasion: 20, speed: 135
    }
  },
  goblin_shaman: {
    id: 'goblin_shaman',
    name: 'Goblin Shaman',
    level: 5,
    icon: '🪄',
    sprite: 'goblin_shaman.png',
    description: 'A crude spellcaster using fetishes and dirty mana.',
    currentHp: 420,
    rewardXp: 310,
    stats: {
      maxHp: 420, maxMp: 90,
      physicalAttack: 20, physicalDefense: 22, physicalReduction: 0.13,
      magicalAttack: 55, magicalDefense: 32, magicalReduction: 0.18,
      critChance: 6, critDamage: 155,
      accuracy: 98, evasion: 12, speed: 118
    }
  },
  dire_wolf: {
    id: 'dire_wolf',
    name: 'Dire Wolf',
    level: 5,
    icon: '🐺',
    sprite: 'dire_wolf.png',
    description: 'A massive gray wolf with eyes that glint with predatory intelligence.',
    currentHp: 580,
    rewardXp: 280,
    stats: {
      maxHp: 580, maxMp: 0,
      physicalAttack: 52, physicalDefense: 24, physicalReduction: 0.14,
      magicalAttack: 0, magicalDefense: 18, magicalReduction: 0.11,
      critChance: 8, critDamage: 160,
      accuracy: 102, evasion: 18, speed: 142
    }
  },
  goblin_brute: {
    id: 'goblin_brute',
    name: 'Goblin Brute',
    level: 5,
    icon: '💪',
    sprite: 'goblin_brute.png',
    description: 'A thick-skinned bully wielding a heavy club.',
    currentHp: 620,
    rewardXp: 320,
    stats: {
      maxHp: 620, maxMp: 0,
      physicalAttack: 60, physicalDefense: 42, physicalReduction: 0.22,
      magicalAttack: 0, magicalDefense: 22, magicalReduction: 0.13,
      critChance: 5, critDamage: 150,
      accuracy: 96, evasion: 6, speed: 105
    }
  },
  scavenger_hyena: {
    id: 'scavenger_hyena',
    name: 'Scavenger Hyena',
    level: 5,
    icon: '🐕',
    sprite: 'scavenger_hyena.png',
    description: 'A laughing predator drawn to wounded prey.',
    currentHp: 520,
    rewardXp: 300,
    stats: {
      maxHp: 520, maxMp: 0,
      physicalAttack: 58, physicalDefense: 26, physicalReduction: 0.15,
      magicalAttack: 0, magicalDefense: 20, magicalReduction: 0.12,
      critChance: 10, critDamage: 165,
      accuracy: 104, evasion: 18, speed: 138
    }
  },
  werewolf: {
    id: 'werewolf',
    name: 'Werewolf',
    level: 6,
    icon: '🐺',
    sprite: 'werewolf.png',
    description: 'A cursed beast of the full moon. Its fangs are legendary and lethal.',
    currentHp: 850,
    rewardXp: 450,
    stats: {
      maxHp: 850, maxMp: 50,
      physicalAttack: 82, physicalDefense: 38, physicalReduction: 0.20,
      magicalAttack: 10, magicalDefense: 30, magicalReduction: 0.16,
      critChance: 15, critDamage: 180,
      accuracy: 115, evasion: 25, speed: 155
    }
  },
  bandit_cutthroat: {
    id: 'bandit_cutthroat',
    name: 'Bandit Cutthroat',
    level: 6,
    icon: '🩸',
    sprite: 'bandit_cutthroat.png',
    description: 'A ruthless fighter who aims for arteries.',
    currentHp: 680,
    rewardXp: 380,
    stats: {
      maxHp: 680, maxMp: 0,
      physicalAttack: 74, physicalDefense: 34, physicalReduction: 0.18,
      magicalAttack: 0, magicalDefense: 26, magicalReduction: 0.15,
      critChance: 12, critDamage: 170,
      accuracy: 108, evasion: 22, speed: 142
    }
  },
  bandit_archer: {
    id: 'bandit_archer',
    name: 'Bandit Archer',
    level: 6,
    icon: '🏹',
    sprite: 'bandit_archer.png',
    description: 'Disciplined aim from a fortified position.',
    currentHp: 540,
    rewardXp: 370,
    stats: {
      maxHp: 540, maxMp: 0,
      physicalAttack: 78, physicalDefense: 26, physicalReduction: 0.15,
      magicalAttack: 0, magicalDefense: 22, magicalReduction: 0.13,
      critChance: 14, critDamage: 175,
      accuracy: 120, evasion: 18, speed: 135
    }
  },
  goblin_king: {
    id: 'goblin_king',
    name: 'Goblin King',
    level: 7,
    icon: '👑',
    sprite: 'goblin_king.png',
    description: 'A cunning tyrant crowned with stolen gold.',
    currentHp: 1200,
    rewardXp: 650,
    stats: {
      maxHp: 1200, maxMp: 60,
      physicalAttack: 92, physicalDefense: 62, physicalReduction: 0.29,
      magicalAttack: 35, magicalDefense: 42, magicalReduction: 0.22,
      critChance: 10, critDamage: 165,
      accuracy: 108, evasion: 14, speed: 120
    }
  },

  // =========================
  // BAND 3 (Mines / Kobolds) - 9
  // =========================
  kobold_miner: {
    id: 'kobold_miner',
    name: 'Kobold Miner',
    level: 7,
    icon: '⛏️',
    sprite: 'kobold_miner.png',
    description: 'Tunnel-dweller with a pickaxe and a bad temper.',
    currentHp: 980,
    rewardXp: 520,
    stats: {
      maxHp: 980, maxMp: 0,
      physicalAttack: 88, physicalDefense: 54, physicalReduction: 0.27,
      magicalAttack: 0, magicalDefense: 34, magicalReduction: 0.19,
      critChance: 8, critDamage: 160,
      accuracy: 104, evasion: 12, speed: 118
    }
  },
  kobold_trapper: {
    id: 'kobold_trapper',
    name: 'Kobold Trapper',
    level: 8,
    icon: '🪤',
    sprite: 'kobold_trapper.png',
    description: 'Sets snares and fights dirty in tight corridors.',
    currentHp: 920,
    rewardXp: 580,
    stats: {
      maxHp: 920, maxMp: 0,
      physicalAttack: 96, physicalDefense: 42, physicalReduction: 0.22,
      magicalAttack: 0, magicalDefense: 30, magicalReduction: 0.17,
      critChance: 14, critDamage: 175,
      accuracy: 112, evasion: 26, speed: 140
    }
  },
  kobold_pyro: {
    id: 'kobold_pyro',
    name: 'Kobold Pyro',
    level: 8,
    icon: '🔥',
    sprite: 'kobold_pyro.png',
    description: 'Throws volatile powders that ignite on contact.',
    currentHp: 860,
    rewardXp: 610,
    stats: {
      maxHp: 860, maxMp: 120,
      physicalAttack: 40, physicalDefense: 38, physicalReduction: 0.20,
      magicalAttack: 115, magicalDefense: 52, magicalReduction: 0.26,
      critChance: 10, critDamage: 165,
      accuracy: 105, evasion: 14, speed: 125
    }
  },
  cave_spider: {
    id: 'cave_spider',
    name: 'Cave Spider',
    level: 8,
    icon: '🕷️',
    sprite: 'cave_spider.png',
    description: 'Spins thick silk and injects numbing venom.',
    currentHp: 780,
    rewardXp: 590,
    stats: {
      maxHp: 780, maxMp: 0,
      physicalAttack: 102, physicalDefense: 36, physicalReduction: 0.19,
      magicalAttack: 0, magicalDefense: 28, magicalReduction: 0.16,
      critChance: 16, critDamage: 180,
      accuracy: 110, evasion: 30, speed: 150
    }
  },
  frost_wolf: {
    id: 'frost_wolf',
    name: 'Frost Wolf',
    level: 9,
    icon: '🐺',
    sprite: 'frost_wolf.png',
    description: 'A wolf with fur like ice crystals, found in the frozen depths of the mines.',
    currentHp: 1100,
    rewardXp: 720,
    stats: {
      maxHp: 1100, maxMp: 40,
      physicalAttack: 98, physicalDefense: 62, physicalReduction: 0.29,
      magicalAttack: 45, magicalDefense: 50, magicalReduction: 0.25,
      critChance: 10, critDamage: 170,
      accuracy: 112, evasion: 22, speed: 138
    }
  },
  brood_mother: {
    id: 'brood_mother',
    name: 'Brood Mother',
    level: 9,
    icon: '🕸️',
    sprite: 'brood_mother.png',
    description: 'An enormous spider that guards her egg clutch.',
    currentHp: 1550,
    rewardXp: 820,
    stats: {
      maxHp: 1550, maxMp: 0,
      physicalAttack: 125, physicalDefense: 72, physicalReduction: 0.33,
      magicalAttack: 0, magicalDefense: 40, magicalReduction: 0.21,
      critChance: 12, critDamage: 175,
      accuracy: 108, evasion: 18, speed: 125
    }
  },
  stone_golemlet: {
    id: 'stone_golemlet',
    name: 'Stone Golemlet',
    level: 9,
    icon: '🪨',
    sprite: 'stone_golemlet.png',
    description: 'A small construct of rock and ore veins.',
    currentHp: 1700,
    rewardXp: 860,
    stats: {
      maxHp: 1700, maxMp: 0,
      physicalAttack: 110, physicalDefense: 110, physicalReduction: 0.42,
      magicalAttack: 0, magicalDefense: 55, magicalReduction: 0.27,
      critChance: 4, critDamage: 150,
      accuracy: 96, evasion: 4, speed: 90
    }
  },
  crystal_lurker: {
    id: 'crystal_lurker',
    name: 'Crystal Lurker',
    level: 10,
    icon: '💎',
    sprite: 'crystal_lurker.png',
    description: 'A shard-covered predator that refracts light.',
    currentHp: 1550,
    rewardXp: 950,
    stats: {
      maxHp: 1550, maxMp: 80,
      physicalAttack: 105, physicalDefense: 78, physicalReduction: 0.34,
      magicalAttack: 85, magicalDefense: 80, magicalReduction: 0.35,
      critChance: 12, critDamage: 175,
      accuracy: 108, evasion: 14, speed: 118
    }
  },
  kobold_foreman: {
    id: 'kobold_foreman',
    name: 'Kobold Foreman',
    level: 10,
    icon: '📣',
    sprite: 'kobold_foreman.png',
    description: 'Barks orders; fights with reinforced mining gear.',
    currentHp: 2100,
    rewardXp: 1100,
    stats: {
      maxHp: 2100, maxMp: 40,
      physicalAttack: 140, physicalDefense: 96, physicalReduction: 0.39,
      magicalAttack: 35, magicalDefense: 62, magicalReduction: 0.29,
      critChance: 10, critDamage: 170,
      accuracy: 105, evasion: 10, speed: 110
    }
  },

  // =========================
  // BAND 4 (Undead / Ruins / Shadows) - 8
  // =========================
  skeleton_soldier: {
    id: 'skeleton_soldier',
    name: 'Skeleton Soldier',
    level: 11,
    icon: '💀',
    sprite: 'skeleton_soldier.png',
    description: 'Animated bones with ancient weapon drills.',
    currentHp: 2300,
    rewardXp: 1250,
    stats: {
      maxHp: 2300, maxMp: 0,
      physicalAttack: 165, physicalDefense: 120, physicalReduction: 0.44,
      magicalAttack: 0, magicalDefense: 55, magicalReduction: 0.27,
      critChance: 8, critDamage: 165,
      accuracy: 110, evasion: 10, speed: 115
    }
  },
  skeleton_archer: {
    id: 'skeleton_archer',
    name: 'Skeleton Archer',
    level: 11,
    icon: '🏹',
    sprite: 'skeleton_archer.png',
    description: 'Silent volleys from the collapsed hallways.',
    currentHp: 1850,
    rewardXp: 1250,
    stats: {
      maxHp: 1850, maxMp: 0,
      physicalAttack: 185, physicalDefense: 88, physicalReduction: 0.37,
      magicalAttack: 0, magicalDefense: 50, magicalReduction: 0.25,
      critChance: 14, critDamage: 180,
      accuracy: 125, evasion: 14, speed: 125
    }
  },
  zombie: {
    id: 'zombie',
    name: 'Rotting Zombie',
    level: 12,
    icon: '🧟',
    sprite: 'zombie.png',
    description: 'Slow, relentless, and dangerously infectious.',
    currentHp: 3200,
    rewardXp: 1450,
    stats: {
      maxHp: 3200, maxMp: 0,
      physicalAttack: 160, physicalDefense: 130, physicalReduction: 0.46,
      magicalAttack: 0, magicalDefense: 62, magicalReduction: 0.29,
      critChance: 6, critDamage: 160,
      accuracy: 98, evasion: 4, speed: 92
    }
  },
  shadow_wolf: {
    id: 'shadow_wolf',
    name: 'Shadow Wolf',
    level: 12,
    icon: '🐺',
    sprite: 'shadow_wolf.png',
    description: 'A specter-like wolf that slips through physical barriers.',
    currentHp: 1950,
    rewardXp: 1350,
    stats: {
      maxHp: 1950, maxMp: 120,
      physicalAttack: 140, physicalDefense: 80, physicalReduction: 0.35,
      magicalAttack: 95, magicalDefense: 110, magicalReduction: 0.42,
      critChance: 16, critDamage: 185,
      accuracy: 122, evasion: 35, speed: 162
    }
  },
  wraith: {
    id: 'wraith',
    name: 'Wraith',
    level: 12,
    icon: '👻',
    sprite: 'wraith.png',
    description: 'A specter that slips through armor and sanity.',
    currentHp: 2100,
    rewardXp: 1500,
    stats: {
      maxHp: 2100, maxMp: 160,
      physicalAttack: 60, physicalDefense: 70, physicalReduction: 0.32,
      magicalAttack: 210, magicalDefense: 120, magicalReduction: 0.44,
      critChance: 12, critDamage: 175,
      accuracy: 112, evasion: 28, speed: 135
    }
  },
  necromancer_acolyte: {
    id: 'necromancer_acolyte',
    name: 'Necromancer Acolyte',
    level: 13,
    icon: '📜',
    sprite: 'necromancer_acolyte.png',
    description: 'Channels death magic to animate the fallen.',
    currentHp: 2400,
    rewardXp: 1750,
    stats: {
      maxHp: 2400, maxMp: 240,
      physicalAttack: 70, physicalDefense: 92, physicalReduction: 0.38,
      magicalAttack: 235, magicalDefense: 145, magicalReduction: 0.49,
      critChance: 10, critDamage: 170,
      accuracy: 110, evasion: 14, speed: 118
    }
  },
  haunted_armor: {
    id: 'haunted_armor',
    name: 'Haunted Armor',
    level: 13,
    icon: '🛡️',
    sprite: 'haunted_armor.png',
    description: 'An empty suit that moves with cursed momentum.',
    currentHp: 3600,
    rewardXp: 1850,
    stats: {
      maxHp: 3600, maxMp: 0,
      physicalAttack: 190, physicalDefense: 190, physicalReduction: 0.56,
      magicalAttack: 0, magicalDefense: 95, magicalReduction: 0.39,
      critChance: 6, critDamage: 160,
      accuracy: 105, evasion: 8, speed: 102
    }
  },
  lich_apprentice: {
    id: 'lich_apprentice',
    name: 'Lich Apprentice',
    level: 14,
    icon: '🧿',
    sprite: 'lich_apprentice.png',
    description: 'A half-failed lich experiment with volatile mana.',
    currentHp: 3000,
    rewardXp: 2100,
    stats: {
      maxHp: 3000, maxMp: 320,
      physicalAttack: 80, physicalDefense: 110, physicalReduction: 0.42,
      magicalAttack: 280, magicalDefense: 170, magicalReduction: 0.53,
      critChance: 12, critDamage: 180,
      accuracy: 112, evasion: 16, speed: 115
    }
  },

  // =========================
  // BAND 5 (Cult / Elemental) - 8
  // =========================
  cultist_blade: {
    id: 'cultist_blade',
    name: 'Cultist Blade',
    level: 15,
    icon: '🔪',
    sprite: 'cultist_blade.png',
    description: 'A fanatic assassin devoted to forbidden rites.',
    currentHp: 3600,
    rewardXp: 2400,
    stats: {
      maxHp: 3600, maxMp: 60,
      physicalAttack: 255, physicalDefense: 150, physicalReduction: 0.50,
      magicalAttack: 80, magicalDefense: 110, magicalReduction: 0.42,
      critChance: 18, critDamage: 190,
      accuracy: 125, evasion: 30, speed: 145
    }
  },
  cultist_pyromancer: {
    id: 'cultist_pyromancer',
    name: 'Cultist Pyromancer',
    level: 16,
    icon: '🔥',
    sprite: 'cultist_pyromancer.png',
    description: 'Ignites the air with ritual flame.',
    currentHp: 3400,
    rewardXp: 2750,
    stats: {
      maxHp: 3400, maxMp: 420,
      physicalAttack: 95, physicalDefense: 135, physicalReduction: 0.47,
      magicalAttack: 340, magicalDefense: 210, magicalReduction: 0.58,
      critChance: 14, critDamage: 185,
      accuracy: 115, evasion: 16, speed: 120
    }
  },
  shadow_hound: {
    id: 'shadow_hound',
    name: 'Shadow Hound',
    level: 16,
    icon: '🐺',
    sprite: 'shadow_hound.png',
    description: 'A beast formed from smoke and malice.',
    currentHp: 4200,
    rewardXp: 2800,
    stats: {
      maxHp: 4200, maxMp: 120,
      physicalAttack: 290, physicalDefense: 155, physicalReduction: 0.51,
      magicalAttack: 120, magicalDefense: 160, magicalReduction: 0.52,
      critChance: 16, critDamage: 190,
      accuracy: 120, evasion: 26, speed: 150
    }
  },
  ember_elemental: {
    id: 'ember_elemental',
    name: 'Ember Elemental',
    level: 17,
    icon: '🌋',
    sprite: 'ember_elemental.png',
    description: 'A walking furnace that spits embers.',
    currentHp: 5200,
    rewardXp: 3200,
    stats: {
      maxHp: 5200, maxMp: 260,
      physicalAttack: 220, physicalDefense: 220, physicalReduction: 0.59,
      magicalAttack: 260, magicalDefense: 220, magicalReduction: 0.59,
      critChance: 10, critDamage: 175,
      accuracy: 110, evasion: 10, speed: 105
    }
  },
  frost_elemental: {
    id: 'frost_elemental',
    name: 'Frost Elemental',
    level: 17,
    icon: '❄️',
    sprite: 'frost_elemental.png',
    description: 'Cold incarnate. Armor becomes brittle near it.',
    currentHp: 5000,
    rewardXp: 3200,
    stats: {
      maxHp: 5000, maxMp: 260,
      physicalAttack: 190, physicalDefense: 210, physicalReduction: 0.58,
      magicalAttack: 300, magicalDefense: 235, magicalReduction: 0.61,
      critChance: 12, critDamage: 180,
      accuracy: 112, evasion: 12, speed: 110
    }
  },
  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    level: 18,
    icon: '🦅',
    sprite: 'phoenix.png',
    description: 'A legendary bird of eternal flame. It can rise from its own ashes once when defeated.',
    currentHp: 4800,
    rewardXp: 4500,
    stats: {
      maxHp: 4800, maxMp: 500,
      physicalAttack: 150, physicalDefense: 120, physicalReduction: 0.40,
      magicalAttack: 420, magicalDefense: 350, magicalReduction: 0.65,
      critChance: 20, critDamage: 200,
      accuracy: 135, evasion: 45, speed: 175
    }
  },
  storm_sprite: {
    id: 'storm_sprite',
    name: 'Storm Sprite',
    level: 18,
    icon: '⚡',
    sprite: 'storm_sprite.png',
    description: 'Fast, crackling mana being. Hard to pin down.',
    currentHp: 3800,
    rewardXp: 3600,
    stats: {
      maxHp: 3800, maxMp: 380,
      physicalAttack: 120, physicalDefense: 145, physicalReduction: 0.49,
      magicalAttack: 380, magicalDefense: 250, magicalReduction: 0.63,
      critChance: 18, critDamage: 190,
      accuracy: 125, evasion: 40, speed: 165
    }
  },
  demon_vanguard: {
    id: 'demon_vanguard',
    name: 'Demon Vanguard',
    level: 19,
    icon: '😈',
    sprite: 'demon_vanguard.png',
    description: 'A heavy infantry demon wielding hell-forged metal.',
    currentHp: 7200,
    rewardXp: 4200,
    stats: {
      maxHp: 7200, maxMp: 180,
      physicalAttack: 360, physicalDefense: 290, physicalReduction: 0.66,
      magicalAttack: 180, magicalDefense: 210, magicalReduction: 0.58,
      critChance: 12, critDamage: 185,
      accuracy: 118, evasion: 10, speed: 112
    }
  },

  // =========================
  // BAND 6 (Dragon Domain) - 8
  // =========================
  drake_whelp: {
    id: 'drake_whelp',
    name: 'Drake Whelp',
    level: 20,
    icon: '🐉',
    sprite: 'drake_whelp.png',
    description: 'A young drake; already too hot to handle.',
    currentHp: 8200,
    rewardXp: 4800,
    stats: {
      maxHp: 8200, maxMp: 220,
      physicalAttack: 410, physicalDefense: 320, physicalReduction: 0.68,
      magicalAttack: 240, magicalDefense: 250, magicalReduction: 0.62,
      critChance: 12, critDamage: 185,
      accuracy: 118, evasion: 12, speed: 120
    }
  },
  fire_drake: {
    id: 'fire_drake',
    name: 'Fire Drake',
    level: 21,
    icon: '🔥',
    sprite: 'fire_drake.png',
    description: 'Breathes fire in short bursts; scales resist blades.',
    currentHp: 9800,
    rewardXp: 5500,
    stats: {
      maxHp: 9800, maxMp: 320,
      physicalAttack: 460, physicalDefense: 380, physicalReduction: 0.72,
      magicalAttack: 320, magicalDefense: 310, magicalReduction: 0.67,
      critChance: 14, critDamage: 190,
      accuracy: 120, evasion: 14, speed: 125
    }
  },
  obsidian_guardian: {
    id: 'obsidian_guardian',
    name: 'Obsidian Guardian',
    level: 22,
    icon: '🗿',
    sprite: 'obsidian_guardian.png',
    description: 'A living wall of black glass-stone.',
    currentHp: 13500,
    rewardXp: 6500,
    stats: {
      maxHp: 13500, maxMp: 0,
      physicalAttack: 420, physicalDefense: 520, physicalReduction: 0.78,
      magicalAttack: 0, magicalDefense: 320, magicalReduction: 0.68,
      critChance: 8, critDamage: 175,
      accuracy: 112, evasion: 6, speed: 95
    }
  },
  magma_troll: {
    id: 'magma_troll',
    name: 'Magma Troll',
    level: 23,
    icon: '🧌',
    sprite: 'magma_troll.png',
    description: 'Regenerates through heat; hates cold metal.',
    currentHp: 15000,
    rewardXp: 7200,
    stats: {
      maxHp: 15000, maxMp: 120,
      physicalAttack: 520, physicalDefense: 440, physicalReduction: 0.75,
      magicalAttack: 180, magicalDefense: 280, magicalReduction: 0.65,
      critChance: 10, critDamage: 180,
      accuracy: 115, evasion: 8, speed: 102
    }
  },
  dragon_cult_priest: {
    id: 'dragon_cult_priest',
    name: 'Dragon Cult Priest',
    level: 24,
    icon: '🕯️',
    sprite: 'dragon_cult_priest.png',
    description: 'Blesses drakes and curses intruders with ash sigils.',
    currentHp: 11000,
    rewardXp: 8200,
    stats: {
      maxHp: 11000, maxMp: 650,
      physicalAttack: 220, physicalDefense: 320, physicalReduction: 0.68,
      magicalAttack: 620, magicalDefense: 480, magicalReduction: 0.76,
      critChance: 14, critDamage: 190,
      accuracy: 120, evasion: 18, speed: 118
    }
  },
  ancient_treant: {
    id: 'ancient_treant',
    name: 'Ancient Treant',
    level: 25,
    icon: '🌳',
    sprite: 'ancient_treant.png',
    description: 'A massive, sentient tree with hide harder than ironwood.',
    currentHp: 22000,
    rewardXp: 9500,
    stats: {
      maxHp: 22000, maxMp: 200,
      physicalAttack: 380, physicalDefense: 650, physicalReduction: 0.81,
      magicalAttack: 150, magicalDefense: 520, magicalReduction: 0.78,
      critChance: 5, critDamage: 150,
      accuracy: 110, evasion: 4, speed: 85
    }
  },
  ancient_wyvern: {
    id: 'ancient_wyvern',
    name: 'Ancient Wyvern',
    level: 26,
    icon: '🪽',
    sprite: 'ancient_wyvern.png',
    description: 'A sky-terror that dives faster than you can blink.',
    currentHp: 18000,
    rewardXp: 11000,
    stats: {
      maxHp: 18000, maxMp: 380,
      physicalAttack: 680, physicalDefense: 520, physicalReduction: 0.78,
      magicalAttack: 420, magicalDefense: 420, magicalReduction: 0.74,
      critChance: 18, critDamage: 200,
      accuracy: 130, evasion: 24, speed: 160
    }
  },
  red_dragon: {
    id: 'red_dragon',
    name: 'Red Dragon',
    level: 30,
    icon: '🐲',
    sprite: 'red_dragon.png',
    description: 'The final tyrant. Fire and ruin made flesh.',
    currentHp: 42000,
    rewardXp: 30000,
    stats: {
      maxHp: 42000, maxMp: 1200,
      physicalAttack: 1200, physicalDefense: 900, physicalReduction: 0.86,
      magicalAttack: 1100, magicalDefense: 820, magicalReduction: 0.85,
      critChance: 22, critDamage: 210,
      accuracy: 140, evasion: 22, speed: 155
    }
  },
};
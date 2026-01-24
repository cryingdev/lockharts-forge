export interface MonsterDropEntry {
  itemId: string;
  minQuantity: number;
  maxQuantity: number;
  chance: number; // 0.0 ~ 1.0
}

/**
 * MONSTER_DROPS
 * Defines loot tables for each monster type across all dungeon bands.
 * Matches with IDs in materials.ts.
 */
export const MONSTER_DROPS: Record<string, MonsterDropEntry[]> = {
  // ===== BAND 1: The Sewer Cellars =====
  giant_rat: [
    { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 2, chance: 0.55 },
    { itemId: 'charcoal', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'rat_hide_patch', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
    { itemId: 'vermin_fang', minQuantity: 1, maxQuantity: 2, chance: 0.18 },
  ],
  sewer_slime: [
    { itemId: 'slime_gel', minQuantity: 1, maxQuantity: 2, chance: 0.80 },
    { itemId: 'copper_ore', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'slime_coagulum', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
  ],
  cave_bat: [
    { itemId: 'wool_cloth', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
    { itemId: 'bat_wing_membrane', minQuantity: 1, maxQuantity: 1, chance: 0.28 },
    { itemId: 'bat_sonar_gland', minQuantity: 1, maxQuantity: 1, chance: 0.10 },
  ],
  rat_man: [
    { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 3, chance: 0.75 },
    { itemId: 'copper_ore', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'rat_hide_patch', minQuantity: 1, maxQuantity: 2, chance: 0.30 },
    { itemId: 'sewer_buckle', minQuantity: 1, maxQuantity: 1, chance: 0.14 },
  ],
  mold_sporeling: [
    { itemId: 'oak_log', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'mold_spore_sac', minQuantity: 1, maxQuantity: 1, chance: 0.30 },
    { itemId: 'slime_gel', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
  ],
  carrion_beetle: [
    { itemId: 'beetle_carapace_shard', minQuantity: 1, maxQuantity: 2, chance: 0.32 },
    { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 2, chance: 0.40 },
    { itemId: 'copper_ore', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
  ],
  sewer_thief: [
    { itemId: 'copper_ore', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'tin_ore', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'sewer_buckle', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
    { itemId: 'vermin_ring_core', minQuantity: 1, maxQuantity: 1, chance: 0.08 },
  ],
  plague_rat_king: [
    { itemId: 'leather_strips', minQuantity: 2, maxQuantity: 4, chance: 1.00 },
    { itemId: 'copper_ore', minQuantity: 1, maxQuantity: 3, chance: 0.40 },
    { itemId: 'rat_king_molar', minQuantity: 1, maxQuantity: 1, chance: 0.35 },
    { itemId: 'plague_sac', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
    { itemId: 'vermin_ring_core', minQuantity: 1, maxQuantity: 1, chance: 0.15 },
  ],

  // ===== BAND 2: The Goblin Plains =====
  goblin_grunt: [
    { itemId: 'copper_ore', minQuantity: 1, maxQuantity: 2, chance: 0.40 },
    { itemId: 'tin_ore', minQuantity: 1, maxQuantity: 2, chance: 0.30 },
    { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'goblin_scrap_buckle', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],
  goblin_slinger: [
    { itemId: 'oak_log', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'goblin_sling_pouch', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
  ],
  goblin_shaman: [
    { itemId: 'tin_ore', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'wool_cloth', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'fetish_totem_shard', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
  ],
  goblin_brute: [
    { itemId: 'copper_ore', minQuantity: 1, maxQuantity: 3, chance: 0.45 },
    { itemId: 'hard_leather', minQuantity: 1, maxQuantity: 1, chance: 0.12 },
    { itemId: 'brute_tendon', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
  ],
  scavenger_hyena: [
    { itemId: 'wolf_fang', minQuantity: 1, maxQuantity: 2, chance: 0.30 },
    { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 2, chance: 0.45 },
    { itemId: 'hyena_pelt_strip', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
  ],
  bandit_cutthroat: [
    { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 3, chance: 0.45 },
    { itemId: 'hard_leather', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'bandit_emblem_ring', minQuantity: 1, maxQuantity: 1, chance: 0.10 },
    { itemId: 'sharpened_shiv_fragment', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],
  bandit_archer: [
    { itemId: 'oak_log', minQuantity: 1, maxQuantity: 3, chance: 0.35 },
    { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 2, chance: 0.30 },
    { itemId: 'bowstring_bundle', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
  ],
  goblin_king: [
    { itemId: 'tin_ore', minQuantity: 2, maxQuantity: 4, chance: 0.85 },
    { itemId: 'copper_ore', minQuantity: 2, maxQuantity: 5, chance: 1.00 },
    { itemId: 'goblin_scrap_buckle', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'crown_gilded_shard', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
    { itemId: 'king_blood_seal', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],

  // ===== BAND 3: The Deep Mines =====
  kobold_miner: [
    { itemId: 'iron_ore', minQuantity: 1, maxQuantity: 3, chance: 0.55 },
    { itemId: 'coal', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'kobold_scale', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
  ],
  kobold_trapper: [
    { itemId: 'iron_ore', minQuantity: 1, maxQuantity: 2, chance: 0.45 },
    { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'trap_spring_coil', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
  ],
  kobold_pyro: [
    { itemId: 'coal', minQuantity: 1, maxQuantity: 3, chance: 0.55 },
    { itemId: 'iron_ore', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'ember_powder', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
  ],
  cave_spider: [
    { itemId: 'spider_silk_bundle', minQuantity: 1, maxQuantity: 2, chance: 0.40 },
    { itemId: 'venom_sac', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
    { itemId: 'hard_leather', minQuantity: 1, maxQuantity: 1, chance: 0.10 },
  ],
  brood_mother: [
    { itemId: 'spider_silk_bundle', minQuantity: 2, maxQuantity: 4, chance: 0.85 },
    { itemId: 'venom_sac', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'brood_chitin_plate', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
    { itemId: 'queen_thread_spool', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],
  stone_golemlet: [
    { itemId: 'iron_ore', minQuantity: 1, maxQuantity: 3, chance: 0.50 },
    { itemId: 'silver_ore', minQuantity: 1, maxQuantity: 1, chance: 0.12 },
    { itemId: 'runestone_fragment', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
    { itemId: 'sunstone_shard', minQuantity: 1, maxQuantity: 1, chance: 0.12 },
  ],
  crystal_lurker: [
    { itemId: 'silver_ore', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'crystal_shard', minQuantity: 1, maxQuantity: 2, chance: 0.28 },
    { itemId: 'runestone_fragment', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
  ],
  kobold_foreman: [
    { itemId: 'iron_ore', minQuantity: 2, maxQuantity: 5, chance: 1.00 },
    { itemId: 'coal', minQuantity: 2, maxQuantity: 4, chance: 0.75 },
    { itemId: 'foreman_badge', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
    { itemId: 'tempered_claw', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],

  // ===== BAND 4: The Cursed Ruins =====
  skeleton_soldier: [
    { itemId: 'iron_ore', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'bone_fragment', minQuantity: 1, maxQuantity: 3, chance: 0.55 },
    { itemId: 'ancient_rivet', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],
  skeleton_archer: [
    { itemId: 'bone_fragment', minQuantity: 1, maxQuantity: 2, chance: 0.45 },
    { itemId: 'oak_log', minQuantity: 1, maxQuantity: 2, chance: 0.20 },
    { itemId: 'etched_arrowhead', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
  ],
  zombie: [
    { itemId: 'hard_leather', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'rotting_hide', minQuantity: 1, maxQuantity: 2, chance: 0.30 },
    { itemId: 'grave_wax', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
  ],
  wraith: [
    { itemId: 'ectoplasm', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'silver_ore', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
    { itemId: 'haunt_sigil', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'shade_ichor', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],
  necromancer_acolyte: [
    { itemId: 'silver_ore', minQuantity: 1, maxQuantity: 2, chance: 0.28 },
    { itemId: 'cursed_ink', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
    { itemId: 'bone_fragment', minQuantity: 1, maxQuantity: 3, chance: 0.35 },
  ],
  haunted_armor: [
    { itemId: 'cursed_iron_fragment', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'iron_ore', minQuantity: 1, maxQuantity: 3, chance: 0.30 },
    { itemId: 'spirit_buckle', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],
  lich_apprentice: [
    { itemId: 'silver_ore', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'mana_crystal_dust', minQuantity: 1, maxQuantity: 2, chance: 0.22 },
    { itemId: 'cursed_ink', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
  ],

  // ===== BAND 5: The Cult Bastion =====
  cultist_blade: [
    { itemId: 'gold_ore', minQuantity: 1, maxQuantity: 1, chance: 0.08 },
    { itemId: 'bloodsteel_flake', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
    { itemId: 'sigil_thread', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],
  cultist_pyromancer: [
    { itemId: 'fire_essence', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'ember_powder', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'ashen_sigil', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
    { itemId: 'sunstone_shard', minQuantity: 1, maxQuantity: 1, chance: 0.15 },
    { itemId: 'phoenix_ash', minQuantity: 1, maxQuantity: 1, chance: 0.12 },
  ],
  shadow_hound: [
    { itemId: 'shadow_pelt', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
    { itemId: 'wolf_fang', minQuantity: 1, maxQuantity: 2, chance: 0.18 },
    { itemId: 'night_essence', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'shade_ichor', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
  ],
  ember_elemental: [
    { itemId: 'fire_essence', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'molten_core', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
    { itemId: 'coal', minQuantity: 2, maxQuantity: 4, chance: 0.50 },
    { itemId: 'sunstone_shard', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
  ],
  frost_elemental: [
    { itemId: 'frost_shard', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'silver_ore', minQuantity: 1, maxQuantity: 2, chance: 0.20 },
    { itemId: 'mana_crystal_dust', minQuantity: 1, maxQuantity: 2, chance: 0.18 },
  ],
  storm_sprite: [
    { itemId: 'storm_spark', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'gold_ore', minQuantity: 1, maxQuantity: 1, chance: 0.10 },
    { itemId: 'mana_crystal_dust', minQuantity: 1, maxQuantity: 2, chance: 0.22 },
    { itemId: 'storm_core', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
  ],
  demon_vanguard: [
    { itemId: 'gold_ore', minQuantity: 1, maxQuantity: 2, chance: 0.18 },
    { itemId: 'hellforged_scrap', minQuantity: 1, maxQuantity: 2, chance: 0.22 },
    { itemId: 'sigil_thread', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
    { itemId: 'ancient_rune_plate', minQuantity: 1, maxQuantity: 1, chance: 0.15 },
  ],

  // ===== BAND 6: Dragon Domain =====
  drake_whelp: [
    { itemId: 'fire_essence', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
    { itemId: 'drake_scale', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'drake_claw', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'wyvern_membrane', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],
  fire_drake: [
    { itemId: 'fire_essence', minQuantity: 1, maxQuantity: 2, chance: 0.28 },
    { itemId: 'drake_scale', minQuantity: 1, maxQuantity: 3, chance: 0.30 },
    { itemId: 'heated_scale_plate', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'phoenix_ash', minQuantity: 1, maxQuantity: 1, chance: 0.15 },
  ],
  obsidian_guardian: [
    { itemId: 'mithril_ore', minQuantity: 1, maxQuantity: 1, chance: 0.12 },
    { itemId: 'obsidian_shard', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'runestone_fragment', minQuantity: 1, maxQuantity: 2, chance: 0.20 },
    { itemId: 'titan_bone_plate', minQuantity: 1, maxQuantity: 1, chance: 0.10 },
  ],
  magma_troll: [
    { itemId: 'gold_ore', minQuantity: 1, maxQuantity: 1, chance: 0.12 },
    { itemId: 'molten_core', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
    { itemId: 'troll_heartstone', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
    { itemId: 'titan_bone_plate', minQuantity: 1, maxQuantity: 1, chance: 0.10 },
  ],
  dragon_cult_priest: [
    { itemId: 'fire_essence', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'ashen_sigil', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
    { itemId: 'wyrm_blessing_seal', minQuantity: 1, maxQuantity: 1, chance: 0.18 },
  ],
  ancient_wyvern: [
    { itemId: 'mithril_ore', minQuantity: 1, maxQuantity: 2, chance: 0.18 },
    { itemId: 'wyvern_talon', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
    { itemId: 'skyhide_panel', minQuantity: 1, maxQuantity: 1, chance: 0.22 },
    { itemId: 'wyvern_membrane', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
    { itemId: 'dragon_scale_fragment', minQuantity: 1, maxQuantity: 1, chance: 0.20 },
  ],
  red_dragon: [
    { itemId: 'mithril_ore', minQuantity: 2, maxQuantity: 4, chance: 0.40 },
    { itemId: 'gold_ore', minQuantity: 2, maxQuantity: 5, chance: 0.55 },
    { itemId: 'fire_essence', minQuantity: 2, maxQuantity: 4, chance: 0.80 },
    { itemId: 'dragon_scale', minQuantity: 2, maxQuantity: 6, chance: 0.65 },
    { itemId: 'dragon_heart', minQuantity: 1, maxQuantity: 1, chance: 0.35 },
    { itemId: 'ancient_flame_gland', minQuantity: 1, maxQuantity: 1, chance: 0.30 },
    { itemId: 'phoenix_ash', minQuantity: 1, maxQuantity: 2, chance: 0.30 },
    { itemId: 'dragon_scale_fragment', minQuantity: 1, maxQuantity: 2, chance: 0.40 },
    { itemId: 'stardust_powder', minQuantity: 1, maxQuantity: 2, chance: 0.35 },
    { itemId: 'void_ichor', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
  ],
};
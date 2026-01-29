import { ItemType } from '../types/inventory';

export interface MaterialDefinition {
    id: string;
    name: string;
    type: ItemType;
    category?: 'METAL' | 'WOOD' | 'LEATHER' | 'CLOTH' | 'FUEL' | 'MONSTER_PART' | 'GEM' | 'POTION' | 'TOOL' | 'SCROLL' | 'KEY_ITEM' | 'VENDOR_TRASH';
    tier?: number;
    description: string;
    baseValue: number; // Single source of truth for item value (Buy/Sell base)
    icon?: string;
    image?: string;
}

export const materials: Record<string, MaterialDefinition> = {
    // --- 1. METALS ---
    copper_ore: {
        id: 'copper_ore', name: 'Copper Ore', type: 'RESOURCE', category: 'METAL', tier: 1,
        description: 'A soft, reddish metal. Good for beginners.', baseValue: 80
    },
    tin_ore: {
        id: 'tin_ore', name: 'Tin Ore', type: 'RESOURCE', category: 'METAL', tier: 1,
        description: 'Used to make bronze alloy.', baseValue: 100
    },
    iron_ore: {
        id: 'iron_ore', name: 'Iron Ore', type: 'RESOURCE', category: 'METAL', tier: 2,
        description: 'Standard metal for weaponry.', baseValue: 180
    },
    silver_ore: {
        id: 'silver_ore', name: 'Silver Ore', type: 'RESOURCE', category: 'METAL', tier: 2,
        description: 'Shiny and conductive to magic.', baseValue: 400
    },
    gold_ore: {
        id: 'gold_ore', name: 'Gold Ore', type: 'RESOURCE', category: 'METAL', tier: 3,
        description: 'Soft but extremely valuable.', baseValue: 750
    },
    mithril_ore: {
        id: 'mithril_ore', name: 'Mithril Ore', type: 'RESOURCE', category: 'METAL', tier: 4,
        description: 'Light as a feather, hard as dragon bone.', baseValue: 1500
    },

    // --- 2. WOOD ---
    oak_log: {
        id: 'oak_log', name: 'Oak Log', type: 'RESOURCE', category: 'WOOD', tier: 1,
        description: 'Sturdy wood for handles.', baseValue: 60
    },
    ironwood_log: {
        id: 'ironwood_log', name: 'Ironwood', type: 'RESOURCE', category: 'WOOD', tier: 3,
        description: 'Wood that dulls axes.', baseValue: 280
    },

    // --- 3. LEATHER & CLOTH ---
    leather_strips: {
        id: 'leather_strips', name: 'Leather Strips', type: 'RESOURCE', category: 'LEATHER', tier: 1,
        description: 'Basic binding material.', baseValue: 75
    },
    hard_leather: {
        id: 'hard_leather', name: 'Hard Leather', type: 'RESOURCE', category: 'LEATHER', tier: 2,
        description: 'Boiled and toughened hide.', baseValue: 220
    },
    wool_cloth: {
        id: 'wool_cloth', name: 'Wool Cloth', type: 'RESOURCE', category: 'CLOTH', tier: 1,
        description: 'Soft fabric for padding and linings.', baseValue: 90
    },

    // --- 4. FUELS ---
    charcoal: {
        id: 'charcoal', name: 'Charcoal', type: 'RESOURCE', category: 'FUEL', tier: 1,
        description: 'Standard forge fuel.', baseValue: 35
    },
    coal: {
        id: 'coal', name: 'Coal', type: 'RESOURCE', category: 'FUEL', tier: 2,
        description: 'Burns hotter than charcoal.', baseValue: 85
    },

    // --- 5. MONSTER PARTS & GEMS --
    fire_essence: {
        id: 'fire_essence', name: 'Fire Essence', type: 'RESOURCE', category: 'GEM', tier: 3,
        description: 'Warm to the touch. Glows faintly.', baseValue: 900
    },

    // ===== BAND 1: The Sewer Cellars =====
    // giant_rat
    vermin_fang: {
        id: 'vermin_fang', name: 'Vermin Fang', type: 'RESOURCE', category: 'VENDOR_TRASH', tier: 1,
        description: 'A grimy vermin fang. Traders buy them as proof of pest control.', baseValue: 70, icon: '🦷'
    },
    hide_patch: {
        id: 'hide_patch', name: 'Hide Patch', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'A tough patch cut from rat hide. Good for light armor seams.', baseValue: 140, icon: '🧷'
    },
    // sewer_slime
    slime_gel: {
        id: 'slime_gel', name: 'Slime Gel', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'Sticky goo. Useful for coating.', baseValue: 80
    },
    acidic_slime_core: {
        id: 'acidic_slime_core', name: 'Acidic Slime Core', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'A pulsing core that correodes metal. Used for edge coating and poisons.', baseValue: 240, icon: '🧪'
    },
    // cave_bat
    bat_sonar_gland: {
        id: 'bat_sonar_gland', name: 'Bat Sonar Gland', type: 'RESOURCE', category: 'VENDOR_TRASH', tier: 1,
        description: 'A strange gland that still twitches. Alchemists will pay a little for it.', baseValue: 180, icon: '👂'
    },
    cave_moss_pad: {
        id: 'cave_moss_pad', name: 'Cave Moss Pad', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'A damp cushion-like moss. Helps reduce friction and impact.', baseValue: 120, icon: '🌿'
    },
    // rat_man
    sewer_buckle: {
        id: 'sewer_buckle', name: 'Sewer Buckle', type: 'RESOURCE', category: 'VENDOR_TRASH', tier: 1,
        description: 'A rusted buckle pulled from the muck. Worth a few coins as scrap.', baseValue: 120, icon: '🪝'
    },
    // mold_sporeling
    mold_spore_sac: {
        id: 'mold_spore_sac', name: 'Mold Spore Sac', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'A swollen sac packed with caustic spores. Handle with care.', baseValue: 45, icon: '🍄'
    },
    // carrion_beetle
    beetle_carapace_shard: {
        id: 'beetle_carapace_shard', name: 'Carapace Shard', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'A hard carapace shard. Tough, but not yet refined into usable plates.', baseValue: 40, icon: '🪲'
    },
    // ember_beetle
    ember_beetle_gland: {
        id: 'ember_beetle_gland', name: 'Ember Beetle Gland', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'A warm gland from ember beetles. Adds minor heat resistance.', baseValue: 260, icon: '🔥'
    },
    // sewer_thief
    rusty_amulet_fragment: {
        id: 'rusty_amulet_fragment', name: 'Rusty Amulet Fragment', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'A fragment of a cursed trinket. Useful for simple rings and charms.', baseValue: 200, icon: '🧿'
    },
    // plague_rat_king
    rat_king_crown_shard: {
        id: 'rat_king_crown_shard', name: 'Rat King Crown Shard', type: 'RESOURCE', category: 'VENDOR_TRASH', tier: 1, 
        description: 'A jagged piece of the Rat King’s crown. Proof of a filthy victory.', baseValue: 600, icon: '👑'    
    },
    scrap_mace_head: {
        id: 'scrap_mace_head', name: 'Scrap Mace Head', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'A crude mace head bolted from sewer scrap. Heavy, dented, and valuable as salvage.', baseValue: 75, icon: '🔩'
    },

    // ===== BAND 2: The Goblin Plains =====
    // goblin_grunt: 'copper_ore','tin_ore', 'leather_strips'
    // goblin_slinger
    goblin_sling_pouch: {
        id: 'goblin_sling_pouch', name: 'Goblin Sling Pouch', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'A leather pouch used by slingers. Handy for belt accessory slots.', baseValue: 340, icon: '👑'
    },
    // goblin_shaman
    fetish_totem_shard: {
        id: 'fetish_totem_shard', name: 'Totem Shard', type: 'RESOURCE', category: 'GEM', tier: 2,
        description: 'A shard of a goblin shaman\'s focus. Resonates with minor spells.', baseValue: 380, icon: '🪵'
    },
    // goblin_brute
    brute_sinew: {
        id: 'brute_sinew', name: 'Brute Sinew', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'Incredibly tough sinew. Ideal for heavy-duty reinforcement.', baseValue: 400, icon: '🎗️'
    },
    // scavenger_hyena
    hyena_pelt_strip: {
        id: 'hyena_pelt_strip', name: 'Hyena Pelt Strip', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'Coarse fur strip. Used for warm armor linings.', baseValue: 370, icon: '🐕'
    },
    // dire_wolf
    wolf_fang: {
        id: 'wolf_fang', name: 'Wolf Fang', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'Sharp fang used for jagged edges.', baseValue: 120
    },
    // werewolf : wolf_fang, hard_leather
    // bandit_cutthroat: 'wool_cloth', 'leather_strips', 'hard_leather', 'rusty_amulet_fragment'
    // bandit_archer
    bowstring_bundle: {
        id: 'bowstring_bundle', name: 'Bowstring Bundle', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'High-tension strings. Excellent for DEX-focused equipment.', baseValue: 410, icon: '🧵'
    },
    // goblin_king
    goblin_crown_gilded_shard: {
        id: 'goblin_crown_gilded_shard', name: 'Gilded Crown Shard', type: 'RESOURCE', category: 'GEM', tier: 2,
        description: 'A piece of the Goblin King\'s crown. Highly sought by collectors.', baseValue: 600, icon: '👑'
    },
    goblin_scrap_buckle: {
        id: 'goblin_scrap_buckle', name: 'Goblin Scrap Buckle', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'A crude but sturdy buckle. Perfect for belts and straps.', baseValue: 160, icon: '🪝'
    },
    // ===== BAND 3: The Deep Mines =====
    kobold_scale: {
        id: 'kobold_scale', name: 'Kobold Scale', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'A rough scale from tunnel kobolds. Great for flexible armor plates.', baseValue: 320, icon: '🟫'
    },
    trap_spring_coil: {
        id: 'trap_spring_coil', name: 'Trap Spring Coil', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'A compact spring coil. Used for belts and mechanisms.', baseValue: 360, icon: '🌀'
    },
    venom_sac: {
        id: 'venom_sac', name: 'Venom Sac', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'A dangerous sack of venom. Enables poison edge coatings.', baseValue: 420, icon: '☠️'
    },
    brood_chitin_plate: {
        id: 'brood_chitin_plate', name: 'Brood Chitin Plate', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'A thick chitin plate. Excellent reinforcement for armor.', baseValue: 480, icon: '🛡️'
    },
    runestone_fragment: {
        id: 'runestone_fragment', name: 'Runestone Fragment', type: 'RESOURCE', category: 'GEM', tier: 2,
        description: 'A fragment that faintly hums. Used as a base for rings.', baseValue: 520, icon: '🪨'
    },
    crystal_shard: {
        id: 'crystal_shard', name: 'Crystal Shard', type: 'RESOURCE', category: 'GEM', tier: 2,
        description: 'A sharp crystal shard. Used for focus cores and rings.', baseValue: 560, icon: '💎'
    },
    foreman_badge: {
        id: 'foreman_badge', name: 'Foreman Badge', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'A heavy badge taken from a kobold foreman.', baseValue: 450, icon: '🎖️'
    },
    tempered_claw: {
        id: 'tempered_claw', name: 'Tempered Claw', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'A claw hardened by heat and stone dust.', baseValue: 500, icon: '🦴'
    },
    ember_powder: {
        id: 'ember_powder', name: 'Ember Powder', type: 'RESOURCE', category: 'GEM', tier: 2,
        description: 'A warm powder that sparks when shaken.', baseValue: 420, icon: '✨'
    },
    queen_thread_spool: {
        id: 'queen_thread_spool', name: 'Queen\'s Thread', type: 'RESOURCE', category: 'MONSTER_PART', tier: 2,
        description: 'Luminous thread from the Brood Mother. Increases rarity chances.', baseValue: 580, icon: '🧶'
    },
    // ===== BAND 3: The Deep Mines =====
    // cave_spider
    spider_silk_bundle: {
        id: 'spider_silk_bundle', name: 'Spider Silk Bundle', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'Fine silk thread. Used to reinforce cloth and bindings.', baseValue: 220, icon: '🕸️'
    },

    // ===== BAND 4: The Cursed Ruins =====
    // skeleton_soldier
    bone_splint: {
        id: 'bone_splint', name: 'Bone Splint', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'Small bones shaped as splints. Good for reinforcing leggings and boots.', baseValue: 150, icon: '🦴'
    },

    // --- TIER 3 SPECIAL & DROPS ---
    etched_arrowhead: {
        id: 'etched_arrowhead', name: 'Etched Arrowhead', type: 'RESOURCE', category: 'MONSTER_PART', tier: 3,
        description: 'A bone arrowhead etched with accuracy runes.', baseValue: 680, icon: '🏹'
    },
    rotting_hide: {
        id: 'rotting_hide', name: 'Rotting Hide', type: 'RESOURCE', category: 'MONSTER_PART', tier: 3,
        description: 'Foul-smelling but magically resistant hide.', baseValue: 640, icon: '🤢'
    },
    cursed_iron_fragment: {
        id: 'cursed_iron_fragment', name: 'Cursed Iron Fragment', type: 'RESOURCE', category: 'MONSTER_PART', tier: 3,
        description: 'Shattered metal from haunted armor. Retains defensive malice.', baseValue: 720, icon: '🔗'
    },
    bone_fragment: {
        id: 'bone_fragment', name: 'Bone Fragment', type: 'RESOURCE', category: 'MONSTER_PART', tier: 3,
        description: 'Ancient bone shards. Reinforces undead-themed gear.', baseValue: 620, icon: '🦴'
    },
    ancient_rivet: {
        id: 'ancient_rivet', name: 'Ancient Rivet', type: 'RESOURCE', category: 'MONSTER_PART', tier: 3,
        description: 'A rivet from old armor. Used for plated joints.', baseValue: 700, icon: '📌'
    },
    ectoplasm: {
        id: 'ectoplasm', name: 'Ectoplasm', type: 'RESOURCE', category: 'GEM', tier: 3,
        description: 'Cold residue from spirits. Used for magic rings.', baseValue: 820, icon: '👻'
    },
    cursed_ink: {
        id: 'cursed_ink', name: 'Cursed Ink', type: 'RESOURCE', category: 'GEM', tier: 3,
        description: 'Ink infused with malice. Used for inscriptions.', baseValue: 880, icon: '🖋️'
    },
    mana_crystal_dust: {
        id: 'mana_crystal_dust', name: 'Mana Crystal Dust', type: 'RESOURCE', category: 'GEM', tier: 3,
        description: 'Fine glittering dust. Used for mana enhancements.', baseValue: 920, icon: '🧊'
    },
    haunted_iron_fragment: {
        id: 'haunted_iron_fragment', name: 'Haunted Iron Fragment', type: 'RESOURCE', category: 'MONSTER_PART', tier: 3,
        description: 'Iron that remembers fear. Great for shields and helms.', baseValue: 980, icon: '🧲'
    },
    spirit_buckle: {
        id: 'spirit_buckle', name: 'Spirit Buckle', type: 'RESOURCE', category: 'MONSTER_PART', tier: 3,
        description: 'A buckle that feels weightless. Used for accessory frames.', baseValue: 1050, icon: '🪝'
    },
    haunt_sigil: {
        id: 'haunt_sigil', name: 'Haunt Sigil', type: 'RESOURCE', category: 'GEM', tier: 3,
        description: 'A spectral sigil. Enables wraith-like passives.', baseValue: 1100, icon: '🧿'
    },
    grave_wax: {
        id: 'grave_wax', name: 'Grave Wax', type: 'RESOURCE', category: 'MONSTER_PART', tier: 3,
        description: 'Wax scraped from old tomb candles.', baseValue: 780, icon: '🕯️'
    },
    sunstone_shard: {
        id: 'sunstone_shard', name: 'Sunstone Shard', type: 'RESOURCE', category: 'GEM', tier: 3,
        description: 'A radiant shard that glows like the morning sun.', baseValue: 1150, icon: '🌞'
    },
    storm_core: {
        id: 'storm_core', name: 'Storm Core', type: 'RESOURCE', category: 'GEM', tier: 3,
        description: 'A pulsing core that crackles with static energy.', baseValue: 1200, icon: '⚡'
    },
    shade_ichor: {
        id: 'shade_ichor', name: 'Shade Ichor', type: 'RESOURCE', category: 'MONSTER_PART', tier: 3,
        description: 'Viscous dark fluid that seems to absorb surrounding light.', baseValue: 1050, icon: '🌑'
    },
    phoenix_ash: {
        id: 'phoenix_ash', name: 'Phoenix Ash', type: 'RESOURCE', category: 'GEM', tier: 3,
        description: 'Undying residue that smolders with eternal heat.', baseValue: 1350, icon: '🔥'
    },
    wyvern_membrane: {
        id: 'wyvern_membrane', name: 'Wyvern Membrane', type: 'RESOURCE', category: 'MONSTER_PART', tier: 3,
        description: 'Leathery membrane from a wyvern\'s wing. Extremely tough and springy.', baseValue: 1100, icon: '🪽'
    },

    // --- TIER 4 SPECIAL & DROPS ---
    shadow_pelt: {
        id: 'shadow_pelt', name: 'Shadow Pelt', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'Fur that seems to absorb light. Ideal for stealthy leggings.', baseValue: 1600, icon: '🌑'
    },
    frost_shard: {
        id: 'frost_shard', name: 'Frost Shard', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'A shard of eternal ice. Used for cold resistance charms.', baseValue: 1550, icon: '❄️'
    },
    storm_spark: {
        id: 'storm_spark', name: 'Storm Spark', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'A crackling spark of lightning. Boosts speed and crit.', baseValue: 1580, icon: '⚡'
    },
    heated_scale_plate: {
        id: 'heated_scale_plate', name: 'Heated Scale Plate', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'A glowing plate from a Fire Drake. Essential for high-rarity gear.', baseValue: 2100, icon: '🔥'
    },
    bloodsteel_flake: {
        id: 'bloodsteel_flake', name: 'Bloodsteel Flake', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'Pulsing metal flake. Used for bleed-like affixes.', baseValue: 1650, icon: '🩸'
    },
    sigil_thread: {
        id: 'sigil_thread', name: 'Sigil Thread', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'Thread woven with ritual marks.', baseValue: 1500, icon: '🧵'
    },
    night_essence: {
        id: 'night_essence', name: 'Night Essence', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'Dark mana condensed into a drop.', baseValue: 1750, icon: '🌑'
    },
    molten_core: {
        id: 'molten_core', name: 'Molten Core', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'A dense core of elemental heat.', baseValue: 1900, icon: '🌋'
    },
    ashen_sigil: {
        id: 'ashen_sigil', name: 'Ashen Sigil', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'A sigil burned into stone.', baseValue: 2000, icon: '⚱️'
    },
    hellforged_scrap: {
        id: 'hellforged_scrap', name: 'Hellforged Scrap', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'A scrap of infernal metal.', baseValue: 2100, icon: '⛓️'
    },
    drake_scale: {
        id: 'drake_scale', name: 'Drake Scale', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'A scale from drakes. Excellent for heat resistance.', baseValue: 2200, icon: '🐉'
    },
    drake_claw: {
        id: 'drake_claw', name: 'Drake Claw', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'A sharp drake claw. Used for high piercing weapons.', baseValue: 2350, icon: '🦴'
    },
    obsidian_shard: {
        id: 'obsidian_shard', name: 'Obsidian Shard', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'Black volcanic glass. Reinforces defenses.', baseValue: 1850, icon: '🖤'
    },
    troll_heartstone: {
        id: 'troll_heartstone', name: 'Troll Heartstone', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'A warm stone-like organ from magma trolls.', baseValue: 2100, icon: '❤️‍🔥'
    },
    wyrm_blessing_seal: {
        id: 'wyrm_blessing_seal', name: 'Wyrm Blessing Seal', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'A sacred seal. Increases rarity outcome significantly.', baseValue: 2400, icon: '🜁'
    },
    wyvern_talon: {
        id: 'wyvern_talon', name: 'Wyvern Talon', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'A razor talon. Used for top-end blades.', baseValue: 2600, icon: '🪽'
    },
    skyhide_panel: {
        id: 'skyhide_panel', name: 'Skyhide Panel', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'Tough hide from aerial predators.', baseValue: 2450, icon: '🧷'
    },
    dragon_scale: {
        id: 'dragon_scale', name: 'Dragon Scale', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'A true dragon scale. Ultimate reinforcement.', baseValue: 3200, icon: '🐲'
    },
    dragon_heart: {
        id: 'dragon_heart', name: 'Dragon Heart', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'A burning heart that never cools.', baseValue: 4500, icon: '❤️'
    },
    ancient_flame_gland: {
        id: 'ancient_flame_gland', name: 'Ancient Flame Gland', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'A gland that produces eternal flame.', baseValue: 3800, icon: '🔥'
    },
    stardust_powder: {
        id: 'stardust_powder', name: 'Stardust Powder', type: 'RESOURCE', category: 'GEM', tier: 4,
        description: 'Finely ground celestial remnants. Resonates with cosmic energy.', baseValue: 2800, icon: '✨'
    },
    dragon_scale_fragment: {
        id: 'dragon_scale_fragment', name: 'Dragon Scale Fragment', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'A hardened fragment of a true dragon\'s hide.', baseValue: 3200, icon: '🐉'
    },
    ancient_heartwood_core: {
        id: 'ancient_heartwood_core', name: 'Ancient Heartwood Core', type: 'RESOURCE', category: 'WOOD', tier: 4,
        description: 'The dense, pulsing core of a millennia-old ironwood tree.', baseValue: 2500, icon: '🌳'
    },
    titan_bone_plate: {
        id: 'titan_bone_plate', name: 'Titan Bone Plate', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'A massive fossilized bone plate from an ancient titan.', baseValue: 3000, icon: '🦴'
    },
    void_ichor: {
        id: 'void_ichor', name: 'Void Ichor', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'A shimmering, reality-warping fluid found in shadow realms.', baseValue: 2900, icon: '🕳️'
    },
    ancient_rune_plate: {
        id: 'ancient_rune_plate', name: 'Ancient Rune Plate', type: 'RESOURCE', category: 'MONSTER_PART', tier: 4,
        description: 'A metal plate etched with forgotten power runes.', baseValue: 3400, icon: '📜'
    },

    // --- 6. POTIONS & SUPPLIES ---
    potion_health_small: { id: 'potion_health_small', name: 'Small HP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 1, description: 'Restores 50 HP.', baseValue: 120 },
    potion_health_medium: { id: 'potion_health_medium', name: 'Medium HP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 2, description: 'Restores 150 HP.', baseValue: 300 },
    potion_health_large: { id: 'potion_health_large', name: 'Large HP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 3, description: 'Restores 400 HP.', baseValue: 750 },
    potion_health_huge: { id: 'potion_health_huge', name: 'Huge HP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 4, description: 'Fully restores HP.', baseValue: 1800 },

    potion_mana_small: { id: 'potion_mana_small', name: 'Small MP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 1, description: 'Restores 30 MP.', baseValue: 120 },
    potion_mana_medium: { id: 'potion_mana_medium', name: 'Medium MP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 2, description: 'Restores 100 MP.', baseValue: 300 },
    potion_mana_large: { id: 'potion_mana_large', name: 'Large MP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 3, description: 'Restores 250 MP.', baseValue: 750 },
    potion_mana_huge: { id: 'potion_mana_huge', name: 'Huge MP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 4, description: 'Fully restores MP.', baseValue: 1800 },

    potion_stamina_small: { id: 'potion_stamina_small', name: 'Small Stamina Potion', type: 'CONSUMABLE', category: 'POTION', tier: 1, description: 'Restores 25 Stamina.', baseValue: 100 },
    potion_stamina_medium: { id: 'potion_stamina_medium', name: 'Medium Stamina Potion', type: 'CONSUMABLE', category: 'POTION', tier: 2, description: 'Restores 50 Stamina.', baseValue: 250 },
    potion_stamina_large: { id: 'potion_stamina_large', name: 'Large Stamina Potion', type: 'CONSUMABLE', category: 'POTION', tier: 3, description: 'Restores 75 Stamina.', baseValue: 600 },
    potion_stamina_huge: { id: 'potion_stamina_huge', name: 'Huge Stamina Potion', type: 'CONSUMABLE', category: 'POTION', tier: 4, description: 'Restores 100 Stamina.', baseValue: 1500 },

    potion_energy_small: { id: 'potion_energy_small', name: 'Small Energy Potion', type: 'CONSUMABLE', category: 'POTION', tier: 1, description: 'Restores 20 HP and 20 MP for a mercenary.', baseValue: 100 },
    potion_energy_medium: { id: 'potion_energy_medium', name: 'Medium Energy Potion', type: 'CONSUMABLE', category: 'POTION', tier: 2, description: 'Restores 45 HP and 45 MP for a mercenary.', baseValue: 250 },
    potion_energy_large: { id: 'potion_energy_large', name: 'Large Energy Potion', type: 'CONSUMABLE', category: 'POTION', tier: 3, description: 'Restores 75 HP and 75 MP for a mercenary.', baseValue: 600 },
    potion_energy_huge: { id: 'potion_energy_huge', name: 'Huge Energy Potion', type: 'CONSUMABLE', category: 'POTION', tier: 4, description: 'Restores 100 HP and 100 MP for a mercenary.', baseValue: 1500 },

    // Facilities & Key Items
    furnace: { id: 'furnace', name: 'Furnace', type: 'KEY_ITEM', category: 'KEY_ITEM', description: 'Required for smelting metal ores.', baseValue: 0 },
    workbench: { id: 'workbench', name: 'Workbench', type: 'KEY_ITEM', category: 'KEY_ITEM', description: 'Required for leatherworking and woodworking.', baseValue: 300 },
    research_table: { id: 'research_table', name: 'Research Table', type: 'KEY_ITEM', category: 'KEY_ITEM', description: 'Experiment with materials to rediscover lost techniques.', baseValue: 800, image: 'research_table.png' },
    scroll_t2: { id: 'scroll_t2', name: 'Upgrade Scroll (Tier 2)', type: 'SCROLL', category: 'SCROLL', tier: 1, description: 'Enhances equipment quality techniques.', baseValue: 1200, image: 'scroll_contract.png' },
    scroll_t3: { id: 'scroll_t3', name: 'Upgrade Scroll (Tier 3)', type: 'SCROLL', category: 'SCROLL', tier: 2, description: 'Unlock expert craftsmanship techniques.', baseValue: 3000, image: 'scroll_contract.png' },
    
    hammer: { id: 'hammer', name: 'Blacksmith Hammer', type: 'TOOL', category: 'TOOL', description: 'Your trusty tool.', baseValue: 0 },
    anvil: { id: 'anvil', name: 'Old Anvil', type: 'TOOL', category: 'TOOL', description: 'Heavy and reliable.', baseValue: 0 },

    affinity_debug_gift: {
        id: 'affinity_debug_gift', name: 'Sparkling Heart', type: 'GIFT', category: 'GEM', tier: 1,
        description: 'A magical debug item that increases affinity by 50.', baseValue: 500
    },
    emergency_gold: {
        id: 'emergency_gold', name: 'Emergency Fund', type: 'RESOURCE', category: 'METAL', tier: 1,
        description: 'A hidden pouch of gold.', baseValue: 10000
    },
} as const;

export const MATERIALS = {
    // --- 1. METALS (금속) ---
    COPPER_ORE: {
        id: 'copper_ore', name: 'Copper Ore', type: 'RESOURCE', category: 'METAL', tier: 1,
        description: 'A soft, reddish metal. Good for beginners.', baseValue: 50
    },
    TIN_ORE: {
        id: 'tin_ore', name: 'Tin Ore', type: 'RESOURCE', category: 'METAL', tier: 1,
        description: 'Used to make bronze alloy.', baseValue: 80
    },
    IRON_ORE: {
        id: 'iron_ore', name: 'Iron Ore', type: 'RESOURCE', category: 'METAL', tier: 2,
        description: 'Standard metal for weaponry.', baseValue: 100
    },
    SILVER_ORE: {
        id: 'silver_ore', name: 'Silver Ore', type: 'RESOURCE', category: 'METAL', tier: 2,
        description: 'Shiny and conductive to magic.', baseValue: 300
    },
    GOLD_ORE: {
        id: 'gold_ore', name: 'Gold Ore', type: 'RESOURCE', category: 'METAL', tier: 3,
        description: 'Soft but extremely valuable.', baseValue: 500
    },
    MITHRIL_ORE: {
        id: 'mithril_ore', name: 'Mithril Ore', type: 'RESOURCE', category: 'METAL', tier: 4,
        description: 'Light as a feather, hard as dragon bone.', baseValue: 1000
    },

    // --- 2. WOOD & TIMBER (목재) ---
    OAK_LOG: {
        id: 'oak_log', name: 'Oak Log', type: 'RESOURCE', category: 'WOOD', tier: 1,
        description: 'Sturdy wood for handles.', baseValue: 50
    },
    IRONWOOD_LOG: {
        id: 'ironwood_log', name: 'Ironwood', type: 'RESOURCE', category: 'WOOD', tier: 3,
        description: 'Wood that dulls axes.', baseValue: 150
    },

    // --- 3. LEATHER & CLOTH (가죽/천) ---
    LEATHER_STRIPS: {
        id: 'leather_strips', name: 'Leather Strips', type: 'RESOURCE', category: 'LEATHER', tier: 1,
        description: 'Basic binding material.', baseValue: 50
    },
    HARD_LEATHER: {
        id: 'hard_leather', name: 'Hard Leather', type: 'RESOURCE', category: 'LEATHER', tier: 2,
        description: 'Boiled and toughened hide.', baseValue: 100
    },
    WOOL_CLOTH: {
        id: 'wool_cloth', name: 'Wool Cloth', type: 'RESOURCE', category: 'CLOTH', tier: 1,
        description: 'Soft fabric for padding and linings.', baseValue: 75
    },

    // --- 4. FUELS (연료) ---
    CHARCOAL: {
        id: 'charcoal', name: 'Charcoal', type: 'RESOURCE', category: 'FUEL', tier: 1,
        description: 'Standard forge fuel.', baseValue: 25
    },
    COAL: {
        id: 'coal', name: 'Coal', type: 'RESOURCE', category: 'FUEL', tier: 2,
        description: 'Burns hotter than charcoal.', baseValue: 50
    },

    // --- 5. MONSTER PARTS & GEMS (특수 재료) ---
    SLIME_GEL: {
        id: 'slime_gel', name: 'Slime Gel', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'Sticky goo. Useful for coating.', baseValue: 80
    },
    WOLF_FANG: {
        id: 'wolf_fang', name: 'Wolf Fang', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'Sharp fang used for jagged edges.', baseValue: 120
    },
    FIRE_ESSENCE: {
        id: 'fire_essence', name: 'Fire Essence', type: 'RESOURCE', category: 'GEM', tier: 3,
        description: 'Warm to the touch. Glows faintly.', baseValue: 1500
    },

    // --- 6. CONSUMABLES ---
    ENERGY_POTION: {
        id: 'energy_potion', name: 'Energy Potion', type: 'CONSUMABLE', category: 'POTION', tier: 1,
        description: 'Restores 25 Energy.', baseValue: 50 
    },

    // --- 7. TOOLS & OTHERS ---
    HAMMER: { id: 'hammer', name: 'Blacksmith Hammer', type: 'TOOL', description: 'Your trusty tool.', baseValue: 0 },
    ANVIL: { id: 'anvil', name: 'Old Anvil', type: 'TOOL', description: 'Heavy and reliable.', baseValue: 0 },
    FURNACE: { id: 'furnace', name: 'Furnace', type: 'KEY_ITEM', description: 'Required for smelting.', baseValue: 500 },
    SCROLL_T2: { id: 'scroll_t2', name: 'Upgrade Scroll (Tier 2)', type: 'SCROLL', description: 'Enhances equipment quality.', baseValue: 1250 },
    SCROLL_T3: { id: 'scroll_t3', name: 'Upgrade Scroll (Tier 3)', type: 'SCROLL', description: 'Unlock expert craftsmanship.', baseValue: 2500 },
} as const;

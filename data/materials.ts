import { ItemType } from '../types/inventory';

export interface MaterialDefinition {
    id: string;
    name: string;
    type: ItemType;
    category?: 'METAL' | 'WOOD' | 'LEATHER' | 'CLOTH' | 'FUEL' | 'MONSTER_PART' | 'GEM' | 'POTION' | 'TOOL' | 'SCROLL' | 'KEY_ITEM';
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

    // --- 5. MONSTER PARTS & GEMS ---
    slime_gel: {
        id: 'slime_gel', name: 'Slime Gel', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'Sticky goo. Useful for coating.', baseValue: 80
    },
    wolf_fang: {
        id: 'wolf_fang', name: 'Wolf Fang', type: 'RESOURCE', category: 'MONSTER_PART', tier: 1,
        description: 'Sharp fang used for jagged edges.', baseValue: 120
    },
    fire_essence: {
        id: 'fire_essence', name: 'Fire Essence', type: 'RESOURCE', category: 'GEM', tier: 3,
        description: 'Warm to the touch. Glows faintly.', baseValue: 900
    },

    // --- 6. POTIONS & SUPPLIES ---
    // Health Potions
    potion_health_small: { id: 'potion_health_small', name: 'Small HP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 1, description: 'Restores 50 HP.', baseValue: 120 },
    potion_health_medium: { id: 'potion_health_medium', name: 'Medium HP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 2, description: 'Restores 150 HP.', baseValue: 300 },
    potion_health_large: { id: 'potion_health_large', name: 'Large HP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 3, description: 'Restores 400 HP.', baseValue: 750 },
    potion_health_huge: { id: 'potion_health_huge', name: 'Huge HP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 4, description: 'Fully restores HP.', baseValue: 1800 },

    // Mana Potions
    potion_mana_small: { id: 'potion_mana_small', name: 'Small MP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 1, description: 'Restores 30 MP.', baseValue: 120 },
    potion_mana_medium: { id: 'potion_mana_medium', name: 'Medium MP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 2, description: 'Restores 100 MP.', baseValue: 300 },
    potion_mana_large: { id: 'potion_mana_large', name: 'Large MP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 3, description: 'Restores 250 MP.', baseValue: 750 },
    potion_mana_huge: { id: 'potion_mana_huge', name: 'Huge MP Potion', type: 'CONSUMABLE', category: 'POTION', tier: 4, description: 'Fully restores MP.', baseValue: 1800 },

    // Stamina Potions (Mercenary)
    potion_stamina_small: { id: 'potion_stamina_small', name: 'Small Stamina Potion', type: 'CONSUMABLE', category: 'POTION', tier: 1, description: 'Restores 25 Stamina.', baseValue: 100 },
    potion_stamina_medium: { id: 'potion_stamina_medium', name: 'Medium Stamina Potion', type: 'CONSUMABLE', category: 'POTION', tier: 2, description: 'Restores 50 Stamina.', baseValue: 250 },
    potion_stamina_large: { id: 'potion_stamina_large', name: 'Large Stamina Potion', type: 'CONSUMABLE', category: 'POTION', tier: 3, description: 'Restores 75 Stamina.', baseValue: 600 },
    potion_stamina_huge: { id: 'potion_stamina_huge', name: 'Huge Stamina Potion', type: 'CONSUMABLE', category: 'POTION', tier: 4, description: 'Restores 100 Stamina.', baseValue: 1500 },

    // Energy Potions (Blacksmith)
    potion_energy_small: { id: 'potion_energy_small', name: 'Small Energy Potion', type: 'CONSUMABLE', category: 'POTION', tier: 1, description: 'Restores 20 Energy.', baseValue: 100 },
    potion_energy_medium: { id: 'potion_energy_medium', name: 'Medium Energy Potion', type: 'CONSUMABLE', category: 'POTION', tier: 2, description: 'Restores 45 Energy.', baseValue: 250 },
    potion_energy_large: { id: 'potion_energy_large', name: 'Large Energy Potion', type: 'CONSUMABLE', category: 'POTION', tier: 3, description: 'Restores 75 Energy.', baseValue: 600 },
    potion_energy_huge: { id: 'potion_energy_huge', name: 'Huge Energy Potion', type: 'CONSUMABLE', category: 'POTION', tier: 4, description: 'Restores 100 Energy.', baseValue: 1500 },

    // Facilities & Key Items
    furnace: { id: 'furnace', name: 'Furnace', type: 'KEY_ITEM', category: 'KEY_ITEM', description: 'Required for smelting metal ores.', baseValue: 0 },
    workbench: { id: 'workbench', name: 'Workbench', type: 'KEY_ITEM', category: 'KEY_ITEM', description: 'Required for leatherworking and woodworking.', baseValue: 300 },
    scroll_t2: { id: 'scroll_t2', name: 'Upgrade Scroll (Tier 2)', type: 'SCROLL', category: 'SCROLL', tier: 1, description: 'Enhances equipment quality techniques.', baseValue: 1200, image: 'scroll_contract.png' },
    scroll_t3: { id: 'scroll_t3', name: 'Upgrade Scroll (Tier 3)', type: 'SCROLL', category: 'SCROLL', tier: 2, description: 'Unlock expert craftsmanship techniques.', baseValue: 3000, image: 'scroll_contract.png' },
    
    // Others
    hammer: { id: 'hammer', name: 'Blacksmith Hammer', type: 'TOOL', category: 'TOOL', description: 'Your trusty tool.', baseValue: 0 },
    anvil: { id: 'anvil', name: 'Old Anvil', type: 'TOOL', category: 'TOOL', description: 'Heavy and reliable.', baseValue: 0 },
    recipe_scroll_bronze_longsword: {
        id: 'recipe_scroll_bronze_longsword', name: 'Scroll: Bronze Longsword', type: 'SCROLL', category: 'SCROLL',
        description: 'An ancient parchment detailing techniques for a Bronze Longsword.', baseValue: 0
    },
    affinity_debug_gift: {
        id: 'affinity_debug_gift', name: 'Sparkling Heart', type: 'RESOURCE', category: 'GEM', tier: 1,
        description: 'A magical debug item that increases affinity by 50.', baseValue: 500
    },
    emergency_gold: {
        id: 'emergency_gold', name: 'Emergency Fund', type: 'RESOURCE', category: 'METAL', tier: 1,
        description: 'A hidden pouch of gold.', baseValue: 10000
    },
} as const;
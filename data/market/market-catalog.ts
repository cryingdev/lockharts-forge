
export const MARKET_CATALOG = [
  // --- KEY ITEMS (One-time) ---
  { id: 'furnace', price: 500, maxStock: 1 },
  { id: 'workbench', price: 300, maxStock: 1 },

  // --- CONSUMABLES ---
  { id: 'energy_potion', price: 100, maxStock: 5 },
  { id: 'stamina_potion', price: 100, maxStock: 5 },
  { id: 'affinity_debug_gift', price: 500, maxStock: 2 },

  // --- TIER 1 MATERIALS (Max Stock: 20) ---
  { id: 'charcoal', price: 25, maxStock: 20 },
  { id: 'copper_ore', price: 80, maxStock: 20 },
  { id: 'tin_ore', price: 100, maxStock: 20 },
  { id: 'oak_log', price: 50, maxStock: 20 },
  { id: 'leather_strips', price: 60, maxStock: 20 },
  { id: 'wool_cloth', price: 80, maxStock: 20 },

  // --- TIER 2 MATERIALS (Max Stock: 20) ---
  { id: 'coal', price: 60, maxStock: 20 },
  { id: 'iron_ore', price: 150, maxStock: 20 },
  { id: 'silver_ore', price: 350, maxStock: 20 },
  { id: 'hard_leather', price: 150, maxStock: 20 },

  // --- SPECIAL (One-time per tier) ---
  { id: 'scroll_t2', price: 1000, maxStock: 1 },
  { id: 'scroll_t3', price: 2500, maxStock: 1 },
];


export const MARKET_CATALOG = [
  // --- KEY ITEMS (One-time) ---
  { id: 'furnace', price: 500, maxStock: 1 },
  { id: 'workbench', price: 300, maxStock: 1 },

  // --- CONSUMABLES ---
  { id: 'energy_potion', price: 100, maxStock: 5 },
  { id: 'stamina_potion', price: 100, maxStock: 5 },
  { id: 'affinity_debug_gift', price: 500, maxStock: 2 },

  // --- TIER 1 MATERIALS (Max Stock: 20) ---
  { id: 'charcoal',      price: 35,  maxStock: 20 }, // 25 -> 35 (연료 레버 강화)
  { id: 'copper_ore',    price: 80,  maxStock: 20 },
  { id: 'tin_ore',       price: 100, maxStock: 20 },
  { id: 'oak_log',       price: 55,  maxStock: 20 }, // 50 -> 55 (목재가 너무 싸서 반복제작 최적해 방지)
  { id: 'leather_strips',price: 65,  maxStock: 20 }, // 60 -> 65
  { id: 'wool_cloth',    price: 85,  maxStock: 20 }, // 80 -> 85

  // --- TIER 2 MATERIALS (Max Stock: 20) ---
  { id: 'coal',          price: 70,  maxStock: 20 }, // 60 -> 70 (T2 연료)
  { id: 'iron_ore',      price: 150, maxStock: 20 },
  { id: 'silver_ore',    price: 350, maxStock: 20 },
  { id: 'hard_leather',  price: 170, maxStock: 20 }, // 150 -> 170 (가공품 프리미엄)

  // --- TIER 3 MATERIALS (Max Stock: 15) --- (현재 장비에서 이미 사용중)
  { id: 'gold_ore',      price: 600, maxStock: 15 },
  { id: 'ironwood_log',  price: 200, maxStock: 15 },
  { id: 'fire_essence',  price: 700, maxStock: 15 },

  // --- TIER 4 MATERIALS (Max Stock: 10) --- (현재 장비에서 이미 사용중)
  { id: 'mithril_ore',   price: 1200, maxStock: 10 },

  // --- SPECIAL (One-time per tier) ---
  { id: 'scroll_t2', price: 1000, maxStock: 1 },
  { id: 'scroll_t3', price: 2500, maxStock: 1 },
];

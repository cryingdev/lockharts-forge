export type MarketItemType = 'RESOURCE' | 'SUPPLY' | 'FACILITY' | 'TECHNIQUE';

export interface MarketItemConfig {
  id: string;
  maxStock: number;
  type: MarketItemType;
}

export const MARKET_CATALOG: MarketItemConfig[] = [
  // --- KEY ITEMS ---
  { id: 'furnace', maxStock: 1, type: 'FACILITY' }, 
  { id: 'workbench', maxStock: 1, type: 'FACILITY' },

  // --- SUPPLIES: Potions & More ---
  { id: 'potion_health_small',  maxStock: 5, type: 'SUPPLY' },
  { id: 'potion_mana_small',    maxStock: 5, type: 'SUPPLY' },
  { id: 'potion_stamina_small', maxStock: 5, type: 'SUPPLY' },
  { id: 'potion_energy_small',  maxStock: 5, type: 'SUPPLY' },
  
  { id: 'potion_health_medium',  maxStock: 3, type: 'SUPPLY' },
  { id: 'potion_mana_medium',    maxStock: 3, type: 'SUPPLY' },
  { id: 'potion_stamina_medium', maxStock: 3, type: 'SUPPLY' },
  { id: 'potion_energy_medium',  maxStock: 3, type: 'SUPPLY' },

  { id: 'potion_health_large',  maxStock: 2, type: 'SUPPLY' },
  { id: 'potion_mana_large',    maxStock: 2, type: 'SUPPLY' },
  { id: 'potion_stamina_large', maxStock: 2, type: 'SUPPLY' },
  { id: 'potion_energy_large',  maxStock: 2, type: 'SUPPLY' },

  { id: 'potion_health_huge',  maxStock: 1, type: 'SUPPLY' },
  { id: 'potion_mana_huge',    maxStock: 1, type: 'SUPPLY' },
  { id: 'potion_stamina_huge', maxStock: 1, type: 'SUPPLY' },
  { id: 'potion_energy_huge',  maxStock: 1, type: 'SUPPLY' },

  { id: 'affinity_debug_gift', maxStock: 2, type: 'SUPPLY' },

  // --- TIER 1 ---
  { id: 'charcoal',      maxStock: 20, type: 'RESOURCE' },
  { id: 'copper_ore',    maxStock: 20, type: 'RESOURCE' },
  { id: 'tin_ore',       maxStock: 20, type: 'RESOURCE' },
  { id: 'oak_log',       maxStock: 20, type: 'RESOURCE' },
  { id: 'leather_strips',maxStock: 20, type: 'RESOURCE' },
  { id: 'wool_cloth',    maxStock: 20, type: 'RESOURCE' },

  // --- TIER 2 ---
  { id: 'coal',          maxStock: 20, type: 'RESOURCE' },
  { id: 'iron_ore',      maxStock: 20, type: 'RESOURCE' },
  { id: 'silver_ore',    maxStock: 20, type: 'RESOURCE' },
  { id: 'hard_leather',  maxStock: 20, type: 'RESOURCE' },

  // --- TIER 3 ---
  { id: 'gold_ore',      maxStock: 15, type: 'RESOURCE' },
  { id: 'ironwood_log',  maxStock: 15, type: 'RESOURCE' },
  { id: 'fire_essence',  maxStock: 15, type: 'RESOURCE' },

  // --- TIER 4 ---
  { id: 'mithril_ore',   maxStock: 10, type: 'RESOURCE' },

  // --- SPECIAL ---
  { id: 'scroll_t2', maxStock: 1, type: 'TECHNIQUE' },
  { id: 'scroll_t3', maxStock: 1, type: 'TECHNIQUE' },
];
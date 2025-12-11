import { EquipmentCategory, EquipmentSubCategory, EquipmentItem } from '../types';

export const EQUIPMENT_CATEGORIES: { id: EquipmentCategory; name: string }[] = [
  { id: 'WEAPON', name: 'Weapons' },
  { id: 'ARMOR', name: 'Armor' },
];

export const EQUIPMENT_SUBCATEGORIES: EquipmentSubCategory[] = [
  // Weapons
  { id: 'SWORD', name: 'Swords', categoryId: 'WEAPON' },
  { id: 'AXE', name: 'Axes', categoryId: 'WEAPON' },
  { id: 'MACE', name: 'Maces', categoryId: 'WEAPON' },
  { id: 'STAFF', name: 'Staffs', categoryId: 'WEAPON' },
  { id: 'DAGGER', name: 'Daggers', categoryId: 'WEAPON' },
  // Armor
  { id: 'HELMET', name: 'Helmets', categoryId: 'ARMOR' },
  { id: 'CHESTPLATE', name: 'Chestplates', categoryId: 'ARMOR' },
  { id: 'SHIELD', name: 'Shields', categoryId: 'ARMOR' },
  { id: 'BOOTS', name: 'Boots', categoryId: 'ARMOR' },
];

// --- 장비(레시피) 리스트 ---
export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  // =================================================================
  // TIER 1: BRONZE AGE & ROOKIE (초급)
  // 재료: Copper, Tin, Oak, Leather, Wool
  // =================================================================
  
  // [DAGGER] Copper Dagger
  // Cost: ~100 / Value: 200
  {
    id: 'dagger_copper_t1',
    name: 'Copper Dagger',
    tier: 1,
    icon: '🗡️',
    description: 'Cheap and easy to conceal. Favorite of street thugs.',
    subCategoryId: 'DAGGER',
    baseValue: 200,
    requirements: [
      { id: 'copper_ore', count: 1 },
      { id: 'leather_strips', count: 1 }
    ],
    baseStats: { physicalAttack: 6, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  },

  // [SWORD] Bronze Shortsword
  // Cost: ~230 / Value: 450
  {
    id: 'sword_bronze_t1',
    name: 'Bronze Shortsword',
    tier: 1,
    icon: '⚔️',
    description: 'A solid alloy blade. Reliable for beginners.',
    subCategoryId: 'SWORD',
    baseValue: 450,
    requirements: [
      { id: 'copper_ore', count: 2 },
      { id: 'tin_ore', count: 1 },
      { id: 'oak_log', count: 1 }
    ],
    baseStats: { physicalAttack: 14, physicalDefense: 1, magicalAttack: 0, magicalDefense: 0 }
  },

  // [MACE] Wooden Club (Training Weapon)
  // Cost: ~100 / Value: 180
  {
    id: 'mace_wood_t1',
    name: 'Reinforced Club',
    tier: 1,
    icon: '🪵',
    description: 'An oak branch studded with copper nails.',
    subCategoryId: 'MACE',
    baseValue: 180,
    requirements: [
      { id: 'oak_log', count: 2 }
    ],
    baseStats: { physicalAttack: 10, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  },

  // [AXE] Woodcutter's Axe
  // Cost: ~200 / Value: 400
  {
    id: 'axe_01_t1',
    name: 'Woodcutter\'s Axe',
    tier: 1,
    icon: '🪓',
    description: 'More tool than weapon, but it hurts.',
    subCategoryId: 'AXE',
    baseValue: 400,
    requirements: [
      { id: 'copper_ore', count: 2 }, // Changed from Iron to Copper for Tier 1 consistency
      { id: 'oak_log', count: 2 }
    ],
    baseStats: { physicalAttack: 12, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  },

  // [STAFF] Oak Staff
  // Cost: ~150 / Value: 300
  {
    id: 'staff_oak_t1',
    name: 'Apprentice Staff',
    tier: 1,
    icon: '🦯',
    description: 'Helps channel basic magical energy.',
    subCategoryId: 'STAFF',
    baseValue: 300,
    requirements: [
      { id: 'oak_log', count: 2 },
      { id: 'copper_ore', count: 1 } // 도관 역할
    ],
    baseStats: { physicalAttack: 5, physicalDefense: 0, magicalAttack: 8, magicalDefense: 2 }
  },

  // [CHEST] Leather Tunic
  // Cost: ~225 / Value: 420
  {
    id: 'armor_leather_t1',
    name: 'Leather Tunic',
    tier: 1,
    icon: '👕',
    description: 'Lightweight protection for scouts.',
    subCategoryId: 'CHESTPLATE',
    baseValue: 420,
    requirements: [
      { id: 'leather_strips', count: 3 },
      { id: 'wool_cloth', count: 1 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 6, magicalAttack: 0, magicalDefense: 0 }
  },

  // [SHIELD] Wooden Buckler
  // Cost: ~150 / Value: 300
  {
    id: 'shield_wood_t1',
    name: 'Oak Buckler',
    tier: 1,
    icon: '🛡️',
    description: 'Good for deflecting light blows.',
    subCategoryId: 'SHIELD',
    baseValue: 300,
    requirements: [
      { id: 'oak_log', count: 2 },
      { id: 'leather_strips', count: 1 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 8, magicalAttack: 0, magicalDefense: 0 }
  },

  // [HELMET] Iron Pot Helm (Using Copper for T1)
  {
    id: 'helm_01_t1',
    name: 'Copper Pot Helm',
    tier: 1,
    icon: '🥣',
    description: 'Better than nothing. Barely.',
    subCategoryId: 'HELMET',
    baseValue: 350,
    requirements: [
      { id: 'copper_ore', count: 3 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 5, magicalAttack: 0, magicalDefense: 0 }
  },

  // =================================================================
  // TIER 2: IRON AGE & SOLDIER (중급)
  // 재료: Iron, Silver, Hard Leather, Coal
  // =================================================================

  // [SWORD] Iron Longsword
  // Cost: ~400 / Value: 750
  {
    id: 'sword_iron_t2',
    name: 'Iron Longsword',
    tier: 2,
    icon: '🗡️',
    description: 'Standard issue for the royal guard.',
    subCategoryId: 'SWORD',
    baseValue: 750,
    requirements: [
      { id: 'iron_ore', count: 3 },
      { id: 'oak_log', count: 1 },
      { id: 'leather_strips', count: 1 }
    ],
    baseStats: { physicalAttack: 25, physicalDefense: 2, magicalAttack: 0, magicalDefense: 0 }
  },

  // [AXE] Iron Battle Axe
  // Cost: ~400 / Value: 800
  {
    id: 'axe_iron_t2',
    name: 'Iron Battle Axe',
    tier: 2,
    icon: '🪓',
    description: 'Heavy cleaving power. Breaks shields.',
    subCategoryId: 'AXE',
    baseValue: 800,
    requirements: [
      { id: 'iron_ore', count: 3 },
      { id: 'oak_log', count: 2 }
    ],
    baseStats: { physicalAttack: 32, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 }
  },

  // [SWORD] Silver Rapier (특수: 마법 저항/공격)
  // Cost: ~950 / Value: 1800
  {
    id: 'sword_silver_t2',
    name: 'Silver Rapier',
    tier: 2,
    icon: '🤺',
    description: 'Effective against spirits and undead.',
    subCategoryId: 'SWORD',
    baseValue: 1800,
    requirements: [
      { id: 'silver_ore', count: 3 },
      { id: 'oak_log', count: 1 }
    ],
    baseStats: { physicalAttack: 18, physicalDefense: 0, magicalAttack: 15, magicalDefense: 5 }
  },

  // [CHEST] Hard Leather Armor
  // Cost: ~475 / Value: 950
  {
    id: 'armor_hard_leather_t2',
    name: 'Reinforced Leather',
    tier: 2,
    icon: '🥋',
    description: 'Boiled leather offering decent mobility.',
    subCategoryId: 'CHESTPLATE',
    baseValue: 950,
    requirements: [
      { id: 'hard_leather', count: 4 },
      { id: 'wool_cloth', count: 1 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 14, magicalAttack: 0, magicalDefense: 2 }
  },

  // [HELMET] Iron Great Helm
  // Cost: ~400 / Value: 850
  {
    id: 'helm_iron_t2',
    name: 'Iron Great Helm',
    tier: 2,
    icon: '🪖',
    description: 'Full face protection. Slightly limits vision.',
    subCategoryId: 'HELMET',
    baseValue: 850,
    requirements: [
      { id: 'iron_ore', count: 4 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 12, magicalAttack: 0, magicalDefense: 0 }
  },

  // [BOOTS] Plated Boots
  // Cost: ~300 / Value: 600
  {
    id: 'boots_iron_t2',
    name: 'Iron Plated Boots',
    tier: 2,
    icon: '👢',
    description: 'Heavy footsteps, solid stance.',
    subCategoryId: 'BOOTS',
    baseValue: 600,
    requirements: [
      { id: 'iron_ore', count: 2 },
      { id: 'leather_strips', count: 2 }
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 5, magicalAttack: 0, magicalDefense: 0 }
  },

  // =================================================================
  // TIER 3: VETERAN & MAGICAL (고급)
  // 재료: Gold, Ironwood, Fire Essence, Mithril(Rare)
  // =================================================================

  // [AXE] Gilded War Axe (장식용 + 전투용)
  // Cost: ~1350 / Value: 3000
  {
    id: 'axe_gold_t3',
    name: 'Gilded War Axe',
    tier: 3,
    icon: '✨',
    description: 'A weapon fit for a king. Beautiful and deadly.',
    subCategoryId: 'AXE',
    baseValue: 3000,
    requirements: [
      { id: 'gold_ore', count: 2 },
      { id: 'iron_ore', count: 2 },
      { id: 'ironwood_log', count: 1 }
    ],
    baseStats: { physicalAttack: 38, physicalDefense: 0, magicalAttack: 5, magicalDefense: 0 }
  },

  // [MACE] Ironwood Maul (재료 특성 활용: 매우 단단한 나무)
  // Cost: ~450 (Ironwood) + ~200 (Iron) = 650 / Value: 1400
  {
    id: 'mace_ironwood_t3',
    name: 'Ironwood Maul',
    tier: 3,
    icon: '🔨',
    description: 'A massive log of ironwood bound with iron bands.',
    subCategoryId: 'MACE',
    baseValue: 1400,
    requirements: [
      { id: 'ironwood_log', count: 3 },
      { id: 'iron_ore', count: 2 }
    ],
    baseStats: { physicalAttack: 45, physicalDefense: 5, magicalAttack: 0, magicalDefense: 0 }
  },

  // [STAFF] Staff of Fire (속성 무기)
  // Cost: ~1500(Essence) + ~150(Ironwood) = 1650 / Value: 3500
  {
    id: 'staff_fire_t3',
    name: 'Ignis Staff',
    tier: 3,
    icon: '🔥',
    description: 'Humming with the heat of the volcano.',
    subCategoryId: 'STAFF',
    baseValue: 3500,
    requirements: [
      { id: 'ironwood_log', count: 1 },
      { id: 'fire_essence', count: 1 },
      { id: 'gold_ore', count: 1 } // 전도체
    ],
    baseStats: { physicalAttack: 10, physicalDefense: 0, magicalAttack: 40, magicalDefense: 10 }
  },

  // =================================================================
  // TIER 4: LEGENDARY (전설)
  // 재료: Mithril, Dragon Parts, etc.
  // =================================================================

  // [CHEST] Mithril Mail
  // Cost: ~3000 (Mithril*3) + ... / Value: 7000
  {
    id: 'armor_mithril_t4',
    name: 'Mithril Chainmail',
    tier: 4,
    icon: '💠',
    description: 'Light as a feather, harder than dragon scales.',
    subCategoryId: 'CHESTPLATE',
    baseValue: 7000,
    requirements: [
      { id: 'mithril_ore', count: 3 },
      { id: 'wool_cloth', count: 2 } // 안감
    ],
    baseStats: { physicalAttack: 0, physicalDefense: 40, magicalAttack: 0, magicalDefense: 15 }
  },
  
  // [SWORD] Mithril Blade
  // Cost: ~3000 / Value: 7500
  {
    id: 'sword_mithril_t4',
    name: 'Elven Mithril Blade',
    tier: 4,
    icon: '🌟',
    description: 'A blade that never dulls.',
    subCategoryId: 'SWORD',
    baseValue: 7500,
    requirements: [
      { id: 'mithril_ore', count: 3 },
      { id: 'gold_ore', count: 1 } // 장식
    ],
    baseStats: { physicalAttack: 55, physicalDefense: 5, magicalAttack: 10, magicalDefense: 5 }
  },
];
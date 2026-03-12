import { NamedContractRegistryEntry } from '../../types/game-state';

export const NAMED_CONTRACT_REGISTRY: NamedContractRegistryEntry[] = [
  {
    mercenaryId: 'pip_green',
    displayName: 'Pip the Green',
    contractId: 'contract_named_pip_bronze_blade',
    unlockRule: {
      tutorialCompleted: true,
      minDay: 3,
    },
    encounterRule: {
      location: 'SHOP',
      encounterWindowDays: 3,
      appearanceChance: 0.4,
      guaranteeAfterDays: 3,
    },
    requirements: [
      { itemId: 'sword_bronze_t1', quantity: 1, minQuality: 70 },
    ],
    rewards: [
      { type: 'UNLOCK_RECRUIT', mercenaryId: 'pip_green' },
      { type: 'GOLD', gold: 120 },
      { type: 'AFFINITY', affinity: 5, mercenaryId: 'pip_green' },
    ],
    encounterDialogue: {
      speaker: 'Pip the Green',
      text: "Hey there! I've heard your forge produces some fine blades. I'm looking for a Bronze Shortsword that won't break on the first swing. Can you help a traveler out?",
    },
  },
  {
    mercenaryId: 'adeline_shield',
    displayName: 'Adeline Ashford',
    contractId: 'contract_named_adeline_frontline_set',
    unlockRule: {
      minTier: 1,
      requiredRecipeIds: ['shield_wood_t1'],
      requiredSalesCount: 5,
    },
    encounterRule: {
      location: 'TAVERN',
      encounterWindowDays: 3,
      appearanceChance: 0.4,
      guaranteeAfterDays: 3,
    },
    requirements: [
      { itemId: 'sword_bronze_t1', quantity: 1, minQuality: 70 },
      { itemId: 'shield_wood_t1', quantity: 1, minQuality: 70 },
    ],
    rewards: [
      { type: 'UNLOCK_RECRUIT', mercenaryId: 'adeline_shield' },
    ],
    encounterDialogue: {
      speaker: 'Adeline Ashford',
      text: "The roads are getting dangerous. I need a proper set of equipment—a sturdy shield and a sharp blade. If you can provide them, I'd be honored to join your cause.",
    },
  },
  {
    mercenaryId: 'elara_flame',
    displayName: 'Elara of the Flame',
    contractId: 'contract_named_elara_flame_focus',
    unlockRule: {
      requiredItemIds: ['fire_essence'],
      requiredRecipeIds: ['staff_oak_t1'],
    },
    encounterRule: {
      location: 'MARKET',
      encounterWindowDays: 3,
      appearanceChance: 0.4,
      guaranteeAfterDays: 3,
    },
    requirements: [
      { itemId: 'fire_essence', quantity: 1 },
      { itemId: 'staff_oak_t1', quantity: 1, acceptedTags: ['MAGIC'], minQuality: 70 },
    ],
    rewards: [
      { type: 'UNLOCK_RECRUIT', mercenaryId: 'elara_flame' },
    ],
    encounterDialogue: {
      speaker: 'Elara of the Flame',
      text: "Fire is my element, but even I need a focus to channel it. Bring me some Fire Essence and a well-crafted Oak Staff, and I shall show you the true power of the flame.",
    },
  },
  {
    mercenaryId: 'sister_aria',
    displayName: 'Sister Aria',
    contractId: 'contract_named_aria_recovery_kit',
    unlockRule: {
      requireInjuredMercenary: true,
      requireRecoveryFlowSeen: true,
    },
    encounterRule: {
      location: 'SHOP',
      encounterWindowDays: 3,
      appearanceChance: 0.4,
      guaranteeAfterDays: 3,
    },
    requirements: [
      { itemId: 'potion_health_small', quantity: 1, acceptedTags: ['HEALING'] },
      { itemId: 'mace_wood_t1', quantity: 1, acceptedTags: ['CLERIC'], minQuality: 70 },
    ],
    rewards: [
      { type: 'UNLOCK_RECRUIT', mercenaryId: 'sister_aria' },
    ],
    encounterDialogue: {
      speaker: 'Sister Aria',
      text: "I've seen many wounded warriors pass through here. I wish to help them, but I lack the tools. A small health potion and a solid mace would allow me to protect and heal those in need.",
    },
  },
];

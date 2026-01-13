
import { DungeonDefinition } from '../models/Dungeon';

export const DUNGEONS: DungeonDefinition[] = [
    // --- TIER 1 ---
    {
        id: 'dungeon_t1_rats',
        name: 'Rat Cellar',
        tier: 1,
        description: 'The damp basement of an abandoned inn. Overrun by giant rats.',
        durationMinutes: 1,
        requiredPower: 35,
        energyCost: 20,
        baseXp: 50,
        gridWidth: 3,
        gridHeight: 3,
        moveEnergy: 3,
        bossEnergy: 5,
        isBossLocked: false,
        goldReward: 100,
        maxPartySize: 1,
        rewards: [
             { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
             { itemId: 'copper_ore', minQuantity: 1, maxQuantity: 2, chance: 0.4 },
             { itemId: 'oak_log', minQuantity: 1, maxQuantity: 2, chance: 0.3 }
        ]
    },
    {
        id: 'dungeon_t1_goblins',
        name: 'Goblin Scavenger Camp',
        tier: 1,
        description: 'A small settlement of goblins hoarding stolen supplies.',
        durationMinutes: 5,
        requiredPower: 105,
        energyCost: 25,
        baseXp: 80,
        gridWidth: 4,
        gridHeight: 4,
        moveEnergy: 4,
        bossEnergy: 6,
        isBossLocked: true,
        rewards: [
             { itemId: 'copper_ore', minQuantity: 2, maxQuantity: 4, chance: 1.0 },
             { itemId: 'tin_ore', minQuantity: 1, maxQuantity: 3, chance: 0.8 },
             { itemId: 'leather_strips', minQuantity: 1, maxQuantity: 2, chance: 0.5 }
        ],
        bossUnlockReq: 10,
        bossVariantId: 'dungeon_t1_goblin_king'
    },
    
    // --- TIER 2 ---
    {
        id: 'dungeon_t2_mines',
        name: 'Collapsed Iron Mine',
        tier: 2,
        description: 'Dark tunnels filled with hostile kobolds and rich veins.',
        durationMinutes: 10,
        requiredPower: 150,
        energyCost: 35,
        baseXp: 150,
        gridWidth: 4,
        gridHeight: 5,
        moveEnergy: 5,
        bossEnergy: 8,
        isBossLocked: true,
        rewards: [
             { itemId: 'iron_ore', minQuantity: 2, maxQuantity: 5, chance: 1.0 },
             { itemId: 'coal', minQuantity: 2, maxQuantity: 4, chance: 0.8 },
             { itemId: 'silver_ore', minQuantity: 1, maxQuantity: 2, chance: 0.3 }
        ]
    },
    {
        id: 'dungeon_t2_bandits',
        name: 'Bandit Outpost',
        tier: 2,
        description: 'A fortified hill where bandits store their loot.',
        durationMinutes: 15,
        requiredPower: 220,
        energyCost: 40,
        baseXp: 250,
        gridWidth: 5,
        gridHeight: 5,
        moveEnergy: 6,
        bossEnergy: 10,
        isBossLocked: true,
        rewards: [
             { itemId: 'hard_leather', minQuantity: 2, maxQuantity: 4, chance: 1.0 },
             { itemId: 'iron_ore', minQuantity: 2, maxQuantity: 4, chance: 0.6 },
             { itemId: 'gold_ore', minQuantity: 1, maxQuantity: 1, chance: 0.1 }
        ],
        bossUnlockReq: 20,
        bossVariantId: 'dungeon_t2_bandit_leader'
    }
];

import { DungeonDefinition } from '../models/Dungeon';

export const DUNGEONS: DungeonDefinition[] = [
    // --- TIER 1 ---
    {
        id: 'dungeon_t1_sewers',
        name: 'The Sewer Cellars',
        tier: 1,
        image: 'dungeon_sewer.jpeg',
        description: 'Dark, humid passages beneath the village. Overrun by plague-ridden vermin.',
        durationMinutes: 1,
        requiredPower: 45,
        energyCost: 20,
        baseXp: 120,
        maxFloors: 5,
        gridWidth: 5,
        gridHeight: 5,
        moveEnergy: 3,
        bossEnergy: 10,
        isBossLocked: true,
        goldReward: 50,
        maxPartySize: 4,
        bossUnlockReq: 1,
        bossVariantId: 'plague_rat_king',
        rescueMercenaryId: 'tilly_footloose',
        monsterPools: [
            { minFloor: 1, maxFloor: 2, monsterIds: ['giant_rat', 'sewer_slime', 'cave_bat'] },
            { minFloor: 3, maxFloor: 4, monsterIds: ['rat_man', 'mold_sporeling', 'carrion_beetle', 'ember_beetle'] },
            { minFloor: 5, maxFloor: 5, monsterIds: ['sewer_thief'] }
        ],
        rewards: [] // Rewards moved to floor-based monster drops
    },
    {
        id: 'dungeon_t1_goblins',
        name: 'Goblin Scavenger Camp',
        tier: 1,
        image: 'dungeon_goblin.jpeg',
        description: 'A small settlement of goblins hoarding stolen supplies.',
        durationMinutes: 5,
        requiredPower: 105,
        energyCost: 25,
        baseXp: 80,
        maxFloors: 2,
        gridWidth: 4,
        gridHeight: 4,
        moveEnergy: 4,
        bossEnergy: 6,
        isBossLocked: true,
        bossUnlockReq: 10,
        bossVariantId: 'goblin_king',
        monsterPools: [
            { minFloor: 1, maxFloor: 1, monsterIds: ['goblin_grunt', 'scavenger_hyena'] },
            { minFloor: 2, maxFloor: 2, monsterIds: ['goblin_slinger', 'goblin_shaman'] }
        ],
        rewards: []
    },
    
    // --- TIER 2 ---
    {
        id: 'dungeon_t2_mines',
        name: 'Collapsed Iron Mine',
        tier: 2,
        image: 'dungeon_mine.jpeg',
        description: 'Dark tunnels filled with hostile kobolds and rich veins.',
        durationMinutes: 10,
        requiredPower: 150,
        energyCost: 35,
        baseXp: 150,
        maxFloors: 3,
        gridWidth: 4,
        gridHeight: 5,
        moveEnergy: 5,
        bossEnergy: 8,
        isBossLocked: true,
        monsterPools: [
            { minFloor: 1, maxFloor: 1, monsterIds: ['kobold_miner', 'cave_spider'] },
            { minFloor: 2, maxFloor: 2, monsterIds: ['kobold_trapper', 'frost_wolf'] },
            { minFloor: 3, maxFloor: 3, monsterIds: ['kobold_pyro', 'kobold_foreman'] }
        ],
        rewards: []
    },
    {
        id: 'dungeon_t2_bandits',
        name: 'Bandit Outpost',
        tier: 2,
        image: 'dungeon_bandit.jpeg',
        description: 'A fortified hill where bandits store their loot.',
        durationMinutes: 15,
        requiredPower: 220,
        energyCost: 40,
        baseXp: 250,
        maxFloors: 2,
        gridWidth: 5,
        gridHeight: 5,
        moveEnergy: 6,
        bossEnergy: 10,
        isBossLocked: true,
        bossUnlockReq: 20,
        bossVariantId: 'werewolf',
        monsterPools: [
            { minFloor: 1, maxFloor: 1, monsterIds: ['bandit_cutthroat', 'dire_wolf'] },
            { minFloor: 2, maxFloor: 2, monsterIds: ['bandit_archer'] }
        ],
        rewards: []
    }
];
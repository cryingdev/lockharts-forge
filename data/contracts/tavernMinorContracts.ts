import { TavernMinorContractTemplate } from '../../types/game-state';

export const TAVERN_MINOR_CONTRACT_TEMPLATES: TavernMinorContractTemplate[] = [
    {
        id: 'tavern_gloves_request_t1',
        title: 'A Sturdy Pair of Gloves',
        kind: 'TURN_IN',
        description: "I'm heading out at dawn. A decent pair of gloves would help protect my hands from the cold and the grit.",
        requirements: [
            { itemId: 'gloves_leather_t1', quantity: 1, minQuality: 1 }
        ],
        rewardGold: 120,
        rewardAffinity: 5,
        deadlineDays: 3
    },
    {
        id: 'tavern_potion_request_t1',
        title: 'Emergency Supplies',
        kind: 'TURN_IN',
        description: "My last expedition was a close call. I need some healing potions before I even think about going back.",
        requirements: [
            { itemId: 'potion_health_small', quantity: 2 }
        ],
        rewardGold: 80,
        rewardAffinity: 4,
        deadlineDays: 2
    },
    {
        id: 'tavern_sword_request_t1',
        title: 'Blade Upgrade',
        kind: 'TURN_IN',
        description: "My current sword is more of a club now. I need something sharp and reliable for the next floor.",
        requirements: [
            { itemId: 'sword_bronze_t1', quantity: 1, minQuality: 2 }
        ],
        rewardGold: 250,
        rewardAffinity: 6,
        deadlineDays: 4
    },
    {
        id: 'tavern_shield_request_t1',
        title: 'Better Defense',
        kind: 'TURN_IN',
        description: "Those skeletons in the crypt hit harder than they look. A solid shield would be a lifesaver.",
        requirements: [
            { itemId: 'shield_wood_t1', quantity: 1, minQuality: 2 }
        ],
        rewardGold: 180,
        rewardAffinity: 5,
        deadlineDays: 3
    },
    {
        id: 'tavern_boots_request_t1',
        title: 'Long Walk Ahead',
        kind: 'TURN_IN',
        description: "The deeper floors are damp and rough. My boots are falling apart.",
        requirements: [
            { itemId: 'boots_leather_t1', quantity: 1, minQuality: 1 }
        ],
        rewardGold: 140,
        rewardAffinity: 4,
        deadlineDays: 3
    },
    {
        id: 'tavern_ring_request_t1',
        title: 'A Bit of Luck',
        kind: 'TURN_IN',
        description: "I've heard some rings can ward off the darkness. Do you have anything like that?",
        requirements: [
            { itemId: 'ring_copper_t1', quantity: 1 }
        ],
        rewardGold: 300,
        rewardAffinity: 7,
        deadlineDays: 5
    },
    {
        id: 'tavern_rare_opportunity_t1',
        title: 'The Smith\'s Legacy',
        kind: 'TURN_IN',
        description: "I've found a map to a hidden workshop. If you help me prepare, I'll share what I find.",
        requirements: [
            { itemId: 'potion_health_small', quantity: 3 },
            { itemId: 'sword_bronze_t1', quantity: 1, minQuality: 3 }
        ],
        rewardGold: 500,
        rewardAffinity: 15,
        deadlineDays: 7
    }
];

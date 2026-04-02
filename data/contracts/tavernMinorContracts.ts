import { TavernMinorContractTemplate } from '../../types/game-state';

export const TAVERN_MINOR_CONTRACT_TEMPLATES: TavernMinorContractTemplate[] = [
    {
        id: 'tavern_gloves_request_t1',
        titleKey: 'tavernContracts.tavern_gloves_request_t1.title',
        kind: 'TURN_IN',
        descriptionKey: 'tavernContracts.tavern_gloves_request_t1.description',
        requirements: [
            { itemId: 'gloves_leather_t1', quantity: 1, minQuality: 1 }
        ],
        rewardGold: 120,
        rewardAffinity: 5,
        deadlineDays: 3
    },
    {
        id: 'tavern_potion_request_t1',
        titleKey: 'tavernContracts.tavern_potion_request_t1.title',
        kind: 'TURN_IN',
        descriptionKey: 'tavernContracts.tavern_potion_request_t1.description',
        requirements: [
            { itemId: 'potion_health_small', quantity: 2 }
        ],
        rewardGold: 80,
        rewardAffinity: 4,
        deadlineDays: 2
    },
    {
        id: 'tavern_sword_request_t1',
        titleKey: 'tavernContracts.tavern_sword_request_t1.title',
        kind: 'TURN_IN',
        descriptionKey: 'tavernContracts.tavern_sword_request_t1.description',
        requirements: [
            { itemId: 'sword_bronze_t1', quantity: 1, minQuality: 2 }
        ],
        rewardGold: 250,
        rewardAffinity: 6,
        deadlineDays: 4
    },
    {
        id: 'tavern_shield_request_t1',
        titleKey: 'tavernContracts.tavern_shield_request_t1.title',
        kind: 'TURN_IN',
        descriptionKey: 'tavernContracts.tavern_shield_request_t1.description',
        requirements: [
            { itemId: 'shield_wood_t1', quantity: 1, minQuality: 2 }
        ],
        rewardGold: 180,
        rewardAffinity: 5,
        deadlineDays: 3
    },
    {
        id: 'tavern_boots_request_t1',
        titleKey: 'tavernContracts.tavern_boots_request_t1.title',
        kind: 'TURN_IN',
        descriptionKey: 'tavernContracts.tavern_boots_request_t1.description',
        requirements: [
            { itemId: 'boots_leather_t1', quantity: 1, minQuality: 1 }
        ],
        rewardGold: 140,
        rewardAffinity: 4,
        deadlineDays: 3
    },
    {
        id: 'tavern_ring_request_t1',
        titleKey: 'tavernContracts.tavern_ring_request_t1.title',
        kind: 'TURN_IN',
        descriptionKey: 'tavernContracts.tavern_ring_request_t1.description',
        requirements: [
            { itemId: 'ring_copper_t1', quantity: 1 }
        ],
        rewardGold: 300,
        rewardAffinity: 7,
        deadlineDays: 5
    },
    {
        id: 'tavern_rare_opportunity_t1',
        titleKey: 'tavernContracts.tavern_rare_opportunity_t1.title',
        kind: 'TURN_IN',
        descriptionKey: 'tavernContracts.tavern_rare_opportunity_t1.description',
        requirements: [
            { itemId: 'potion_health_small', quantity: 3 },
            { itemId: 'sword_bronze_t1', quantity: 1, minQuality: 3 }
        ],
        rewardGold: 500,
        rewardAffinity: 15,
        deadlineDays: 7
    }
];

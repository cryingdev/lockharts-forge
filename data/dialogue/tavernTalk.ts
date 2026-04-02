import { TavernTalkEntry } from '../../types/game-state';

export const TAVERN_TALK_ENTRIES: TavernTalkEntry[] = [
    // --- FIGHTER ---
    {
        id: 'fighter_low_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Fighter',
        minAffinity: 0,
        maxAffinity: 19,
        weight: 10,
        textKey: 'tavernTalk.fighter_low_flavor_01'
    },
    {
        id: 'fighter_mid_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Fighter',
        minAffinity: 20,
        weight: 10,
        textKey: 'tavernTalk.fighter_mid_flavor_01'
    },
    {
        id: 'fighter_rumor_01',
        outcome: 'RUMOR',
        speakerJob: 'Fighter',
        minAffinity: 10,
        weight: 5,
        textKey: 'tavernTalk.fighter_rumor_01',
        rumorTag: 'GOBLIN_ACTIVITY'
    },

    // --- MAGE ---
    {
        id: 'mage_low_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Mage',
        minAffinity: 0,
        maxAffinity: 19,
        weight: 10,
        textKey: 'tavernTalk.mage_low_flavor_01'
    },
    {
        id: 'mage_mid_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Mage',
        minAffinity: 20,
        weight: 10,
        textKey: 'tavernTalk.mage_mid_flavor_01'
    },
    {
        id: 'mage_rumor_01',
        outcome: 'RUMOR',
        speakerJob: 'Mage',
        minAffinity: 15,
        weight: 5,
        textKey: 'tavernTalk.mage_rumor_01',
        rumorTag: 'MAGICAL_ANOMALY'
    },

    // --- ROGUE ---
    {
        id: 'rogue_low_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Rogue',
        minAffinity: 0,
        maxAffinity: 19,
        weight: 10,
        textKey: 'tavernTalk.rogue_low_flavor_01'
    },
    {
        id: 'rogue_mid_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Rogue',
        minAffinity: 20,
        weight: 10,
        textKey: 'tavernTalk.rogue_mid_flavor_01'
    },
    {
        id: 'rogue_rumor_bats_01',
        outcome: 'RUMOR',
        speakerJob: 'Rogue',
        minAffinity: 10,
        weight: 6,
        textKey: 'tavernTalk.rogue_rumor_bats_01',
        rumorTag: 'CAVE_BAT_ACTIVITY'
    },

    // --- CLERIC ---
    {
        id: 'cleric_low_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Cleric',
        minAffinity: 0,
        maxAffinity: 19,
        weight: 10,
        textKey: 'tavernTalk.cleric_low_flavor_01'
    },
    {
        id: 'cleric_mid_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Cleric',
        minAffinity: 20,
        weight: 10,
        textKey: 'tavernTalk.cleric_mid_flavor_01'
    },
    {
        id: 'cleric_rumor_01',
        outcome: 'RUMOR',
        speakerJob: 'Cleric',
        minAffinity: 15,
        weight: 5,
        textKey: 'tavernTalk.cleric_rumor_01',
        rumorTag: 'UNDEAD_ACTIVITY'
    },

    // --- ANY / GENERAL ---
    {
        id: 'any_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        weight: 5,
        textKey: 'tavernTalk.any_flavor_01'
    },
    {
        id: 'any_flavor_02',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        weight: 5,
        textKey: 'tavernTalk.any_flavor_02'
    },

    // --- MINOR CONTRACTS ---
    {
        id: 'visitor_minor_contract_gloves',
        outcome: 'MINOR_CONTRACT',
        speakerJob: 'ANY',
        requiresVisitor: true,
        minAffinity: 10,
        weight: 4,
        textKey: 'tavernTalk.visitor_minor_contract_gloves',
        contractTemplateId: 'tavern_gloves_request_t1'
    },
    {
        id: 'visitor_minor_contract_potion',
        outcome: 'MINOR_CONTRACT',
        speakerJob: 'ANY',
        requiresVisitor: true,
        minAffinity: 10,
        weight: 4,
        textKey: 'tavernTalk.visitor_minor_contract_potion',
        contractTemplateId: 'tavern_potion_request_t1'
    },
    {
        id: 'fighter_minor_contract_sword',
        outcome: 'MINOR_CONTRACT',
        speakerJob: 'Fighter',
        minAffinity: 15,
        weight: 3,
        textKey: 'tavernTalk.fighter_minor_contract_sword',
        contractTemplateId: 'tavern_sword_request_t1'
    },
    {
        id: 'cleric_minor_contract_shield',
        outcome: 'MINOR_CONTRACT',
        speakerJob: 'Cleric',
        minAffinity: 15,
        weight: 3,
        textKey: 'tavernTalk.cleric_minor_contract_shield',
        contractTemplateId: 'tavern_shield_request_t1'
    },

    // --- OPPORTUNITIES ---
    {
        id: 'opportunity_named_01',
        outcome: 'OPPORTUNITY',
        speakerJob: 'ANY',
        minAffinity: 25,
        weight: 1,
        textKey: 'tavernTalk.opportunity_named_01',
        followupTextKey: 'tavernTalk.opportunity_named_01_followup',
        contractTemplateId: 'tavern_rare_opportunity_t1'
    }
];

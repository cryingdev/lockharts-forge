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
    {
        id: 'bold_early_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        temperament: 'bold',
        maxProgressStage: 'EARLY',
        weight: 6,
        textKey: 'tavernTalk.bold_early_flavor_01'
    },
    {
        id: 'cautious_early_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        temperament: 'cautious',
        maxProgressStage: 'EARLY',
        weight: 6,
        textKey: 'tavernTalk.cautious_early_flavor_01'
    },
    {
        id: 'greedy_mid_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        temperament: 'greedy',
        minProgressStage: 'MID',
        weight: 6,
        textKey: 'tavernTalk.greedy_mid_flavor_01'
    },
    {
        id: 'kind_mid_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        temperament: 'kind',
        minProgressStage: 'MID',
        weight: 6,
        textKey: 'tavernTalk.kind_mid_flavor_01'
    },
    {
        id: 'stoic_late_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        temperament: 'stoic',
        minProgressStage: 'LATE',
        weight: 6,
        textKey: 'tavernTalk.stoic_late_flavor_01'
    },
    {
        id: 'fighter_bold_mid_01',
        outcome: 'FLAVOR',
        speakerJob: 'Fighter',
        temperament: 'bold',
        minProgressStage: 'MID',
        weight: 6,
        textKey: 'tavernTalk.fighter_bold_mid_01'
    },
    {
        id: 'mage_cautious_mid_01',
        outcome: 'FLAVOR',
        speakerJob: 'Mage',
        temperament: 'cautious',
        minProgressStage: 'MID',
        weight: 6,
        textKey: 'tavernTalk.mage_cautious_mid_01'
    },
    {
        id: 'rogue_greedy_mid_01',
        outcome: 'FLAVOR',
        speakerJob: 'Rogue',
        temperament: 'greedy',
        minProgressStage: 'MID',
        weight: 6,
        textKey: 'tavernTalk.rogue_greedy_mid_01'
    },
    {
        id: 'cleric_kind_late_01',
        outcome: 'FLAVOR',
        speakerJob: 'Cleric',
        temperament: 'kind',
        minProgressStage: 'LATE',
        weight: 6,
        textKey: 'tavernTalk.cleric_kind_late_01'
    },
    {
        id: 'any_mid_reputation_01',
        outcome: 'RUMOR',
        speakerJob: 'ANY',
        minProgressStage: 'MID',
        weight: 4,
        textKey: 'tavernTalk.any_mid_reputation_01'
    },
    {
        id: 'any_late_growth_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        minProgressStage: 'LATE',
        weight: 5,
        textKey: 'tavernTalk.any_late_growth_01'
    },
    {
        id: 'voice_formal_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        voice: 'formal',
        weight: 5,
        textKey: 'tavernTalk.voice_formal_flavor_01'
    },
    {
        id: 'voice_formal_mid_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        voice: 'formal',
        minProgressStage: 'MID',
        weight: 5,
        textKey: 'tavernTalk.voice_formal_mid_01'
    },
    {
        id: 'voice_blunt_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        voice: 'blunt',
        weight: 5,
        textKey: 'tavernTalk.voice_blunt_flavor_01'
    },
    {
        id: 'voice_blunt_mid_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        voice: 'blunt',
        minProgressStage: 'MID',
        weight: 5,
        textKey: 'tavernTalk.voice_blunt_mid_01'
    },
    {
        id: 'voice_cheerful_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        voice: 'cheerful',
        weight: 5,
        textKey: 'tavernTalk.voice_cheerful_flavor_01'
    },
    {
        id: 'voice_cheerful_late_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        voice: 'cheerful',
        minProgressStage: 'LATE',
        weight: 5,
        textKey: 'tavernTalk.voice_cheerful_late_01'
    },
    {
        id: 'voice_dry_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        voice: 'dry',
        weight: 5,
        textKey: 'tavernTalk.voice_dry_flavor_01'
    },
    {
        id: 'voice_dry_mid_01',
        outcome: 'RUMOR',
        speakerJob: 'ANY',
        voice: 'dry',
        minProgressStage: 'MID',
        weight: 4,
        textKey: 'tavernTalk.voice_dry_mid_01'
    },
    {
        id: 'fighter_late_flavor_02',
        outcome: 'FLAVOR',
        speakerJob: 'Fighter',
        minProgressStage: 'LATE',
        weight: 6,
        textKey: 'tavernTalk.fighter_late_flavor_02'
    },
    {
        id: 'mage_late_flavor_02',
        outcome: 'FLAVOR',
        speakerJob: 'Mage',
        minProgressStage: 'LATE',
        weight: 6,
        textKey: 'tavernTalk.mage_late_flavor_02'
    },
    {
        id: 'rogue_late_rumor_02',
        outcome: 'RUMOR',
        speakerJob: 'Rogue',
        minProgressStage: 'LATE',
        weight: 5,
        textKey: 'tavernTalk.rogue_late_rumor_02'
    },
    {
        id: 'cleric_mid_flavor_02',
        outcome: 'FLAVOR',
        speakerJob: 'Cleric',
        minProgressStage: 'MID',
        weight: 6,
        textKey: 'tavernTalk.cleric_mid_flavor_02'
    },
    {
        id: 'bold_mid_flavor_02',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        temperament: 'bold',
        minProgressStage: 'MID',
        weight: 5,
        textKey: 'tavernTalk.bold_mid_flavor_02'
    },
    {
        id: 'cautious_late_flavor_02',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        temperament: 'cautious',
        minProgressStage: 'LATE',
        weight: 5,
        textKey: 'tavernTalk.cautious_late_flavor_02'
    },
    {
        id: 'kind_early_flavor_02',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        temperament: 'kind',
        maxProgressStage: 'EARLY',
        weight: 5,
        textKey: 'tavernTalk.kind_early_flavor_02'
    },
    {
        id: 'stoic_mid_flavor_02',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        temperament: 'stoic',
        minProgressStage: 'MID',
        weight: 5,
        textKey: 'tavernTalk.stoic_mid_flavor_02'
    },
    {
        id: 'voice_formal_late_02',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        voice: 'formal',
        minProgressStage: 'LATE',
        weight: 5,
        textKey: 'tavernTalk.voice_formal_late_02'
    },
    {
        id: 'voice_cheerful_mid_02',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        voice: 'cheerful',
        minProgressStage: 'MID',
        weight: 5,
        textKey: 'tavernTalk.voice_cheerful_mid_02'
    },
    {
        id: 'voice_dry_late_02',
        outcome: 'RUMOR',
        speakerJob: 'ANY',
        voice: 'dry',
        minProgressStage: 'LATE',
        weight: 4,
        textKey: 'tavernTalk.voice_dry_late_02'
    },
    {
        id: 'any_reputation_high_02',
        outcome: 'RUMOR',
        speakerJob: 'ANY',
        minProgressStage: 'MID',
        minAffinity: 15,
        weight: 4,
        textKey: 'tavernTalk.any_reputation_high_02'
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

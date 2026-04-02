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
        text: "A solid shield saves more lives than a sharp tongue."
    },
    {
        id: 'fighter_mid_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Fighter',
        minAffinity: 20,
        weight: 10,
        text: "The forge's heat is like the heat of battle. It tempers the soul."
    },
    {
        id: 'fighter_rumor_01',
        outcome: 'RUMOR',
        speakerJob: 'Fighter',
        minAffinity: 10,
        weight: 5,
        text: "Heard the goblins are gathering in the lower caves. Watch your back.",
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
        text: "Magic is a precise art. One wrong word and... well, let's just say it's messy."
    },
    {
        id: 'mage_mid_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Mage',
        minAffinity: 20,
        weight: 10,
        text: "Your forge hums with a peculiar resonance. It's quite fascinating."
    },
    {
        id: 'mage_rumor_01',
        outcome: 'RUMOR',
        speakerJob: 'Mage',
        minAffinity: 15,
        weight: 5,
        text: "The ley lines are shifting. Expect more magical anomalies in the ruins.",
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
        text: "In the shadows, the only thing you can trust is your own blade."
    },
    {
        id: 'rogue_mid_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Rogue',
        minAffinity: 20,
        weight: 10,
        text: "You've got a good eye for detail. Most people don't see the small things."
    },
    {
        id: 'rogue_rumor_bats_01',
        outcome: 'RUMOR',
        speakerJob: 'Rogue',
        minAffinity: 10,
        weight: 6,
        text: "Heard the Sewer Cellars are thick with bats tonight.",
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
        text: "Faith is the strongest armor one can wear."
    },
    {
        id: 'cleric_mid_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'Cleric',
        minAffinity: 20,
        weight: 10,
        text: "May your work bring light to the darkness of these lands."
    },
    {
        id: 'cleric_rumor_01',
        outcome: 'RUMOR',
        speakerJob: 'Cleric',
        minAffinity: 15,
        weight: 5,
        text: "The undead are restless in the old crypt. We must be vigilant.",
        rumorTag: 'UNDEAD_ACTIVITY'
    },

    // --- ANY / GENERAL ---
    {
        id: 'any_flavor_01',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        weight: 5,
        text: "Another day, another dungeon. At least the ale here is decent."
    },
    {
        id: 'any_flavor_02',
        outcome: 'FLAVOR',
        speakerJob: 'ANY',
        weight: 5,
        text: "The road is long, but a warm fire and good company make it shorter."
    },

    // --- MINOR CONTRACTS ---
    {
        id: 'visitor_minor_contract_gloves',
        outcome: 'MINOR_CONTRACT',
        speakerJob: 'ANY',
        requiresVisitor: true,
        minAffinity: 10,
        weight: 4,
        text: "I'm heading out at dawn. A decent pair of gloves would help.",
        contractTemplateId: 'tavern_gloves_request_t1'
    },
    {
        id: 'visitor_minor_contract_potion',
        outcome: 'MINOR_CONTRACT',
        speakerJob: 'ANY',
        requiresVisitor: true,
        minAffinity: 10,
        weight: 4,
        text: "I'm low on supplies. Do you have any spare potions?",
        contractTemplateId: 'tavern_potion_request_t1'
    },
    {
        id: 'fighter_minor_contract_sword',
        outcome: 'MINOR_CONTRACT',
        speakerJob: 'Fighter',
        minAffinity: 15,
        weight: 3,
        text: "My blade is dull. I need a new iron shortsword before my next hunt.",
        contractTemplateId: 'tavern_sword_request_t1'
    },
    {
        id: 'cleric_minor_contract_shield',
        outcome: 'MINOR_CONTRACT',
        speakerJob: 'Cleric',
        minAffinity: 15,
        weight: 3,
        text: "The darkness is growing. I need a sturdy shield to protect the innocent.",
        contractTemplateId: 'tavern_shield_request_t1'
    },

    // --- OPPORTUNITIES ---
    {
        id: 'opportunity_named_01',
        outcome: 'OPPORTUNITY',
        speakerJob: 'ANY',
        minAffinity: 25,
        weight: 1,
        text: "I've heard whispers of a legendary smith who once lived in these parts. Maybe you can find their lost techniques.",
        followupText: "They say the entrance to their hidden workshop is somewhere in the Whispering Woods."
    }
];

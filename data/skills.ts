import { Skill } from '../models/Skill';

export const SKILLS: Record<string, Skill> = {
    hard_attack: {
        id: 'hard_attack',
        name: 'Hard Attack',
        description: 'A powerful strike dealing 125% physical damage.',
        mpCost: 25,
        multiplier: 1.25,
        type: 'PHYSICAL'
    },
    phoenix_rebirth: {
        id: 'phoenix_rebirth',
        name: 'Eternal Rebirth',
        description: 'Upon death, the phoenix rises from its ashes once with full health.',
        mpCost: 0,
        multiplier: 0,
        type: 'MAGICAL'
    }
};
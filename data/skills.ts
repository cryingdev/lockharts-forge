import { Skill } from '../models/Skill';

export const SKILLS: Record<string, Skill> = {
    hard_attack: {
        id: 'hard_attack',
        name: 'Hard Attack',
        description: 'A powerful strike dealing 125% physical damage.',
        mpCost: 25,
        multiplier: 1.25,
        type: 'PHYSICAL'
    }
};
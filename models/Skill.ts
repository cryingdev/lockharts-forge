export type SkillType = 'PHYSICAL' | 'MAGICAL';

export interface Skill {
    id: string;
    name: string;
    description: string;
    mpCost: number;
    multiplier: number;
    type: SkillType;
}
import type { Mercenary } from '../../../models/Mercenary';

export type ArenaDifficultyTag = 'LOW' | 'STANDARD' | 'HIGH' | 'ELITE';

export interface ArenaMilestoneViewModel {
    threshold: number;
    rewardLabel: string;
    claimed: boolean;
    claimable?: boolean;
}

export interface ArenaOpponentViewModel {
    id: string;
    displayName: string;
    rating: number;
    rankLabel: string;
    difficultyTag: ArenaDifficultyTag;
    winPoints: number;
    lossPoints: number;
    party: Mercenary[];
}

export interface ArenaBattleResultViewModel {
    opponentName: string;
    outcome: 'WIN' | 'LOSS';
    pointsDelta: number;
    ratingAfter: number;
    peakRating: number;
    unlockedMilestone?: ArenaMilestoneViewModel;
    playerMvp?: {
        mercenary: Mercenary;
        kills: number;
        damageDealt: number;
        damageTaken: number;
    };
    battleSummary?: {
        durationTicks: number;
        attacksFor: number;
        attacksAgainst: number;
        critsFor: number;
        critsAgainst: number;
        evasionsFor: number;
        evasionsAgainst: number;
        damageFor: number;
        damageAgainst: number;
        maxHitFor: number;
    };
}

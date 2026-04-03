import { DialogueProgressStage, GameState, TavernTalkEntry, TavernTalkOutcome } from '../../types/game-state';
import { Mercenary } from '../../models/Mercenary';
import { TAVERN_TALK_ENTRIES } from '../../data/dialogue/tavernTalk';
import { rng } from '../../utils/random';

const clampWeight = (value: number, min = 0) => Math.max(min, value);

const getOutcomeWeights = (state: GameState) => {
    const reputation = state.tavern.reputation || 0;
    const activeTavernContracts = state.commission.activeContracts.filter(c => c.source === 'TAVERN').length;

    const weights: Record<TavernTalkOutcome, number> = {
        FLAVOR: 60,
        RUMOR: 25,
        MINOR_CONTRACT: 12,
        OPPORTUNITY: 3,
    };

    const reputationTier = Math.floor(reputation / 10);
    weights.FLAVOR = clampWeight(weights.FLAVOR - (reputationTier * 3), 35);
    weights.RUMOR += reputationTier * 2;
    weights.MINOR_CONTRACT += reputationTier;
    weights.OPPORTUNITY += Math.floor(reputation / 20);

    if (activeTavernContracts >= 1) {
        weights.MINOR_CONTRACT = clampWeight(weights.MINOR_CONTRACT - 3);
        weights.OPPORTUNITY = clampWeight(weights.OPPORTUNITY - 1);
        weights.FLAVOR += 2;
        weights.RUMOR += 2;
    }

    if (activeTavernContracts >= 2) {
        weights.MINOR_CONTRACT = clampWeight(weights.MINOR_CONTRACT - 5);
        weights.OPPORTUNITY = clampWeight(weights.OPPORTUNITY - 1);
        weights.FLAVOR += 4;
        weights.RUMOR += 2;
    }

    if (activeTavernContracts >= 3) {
        weights.MINOR_CONTRACT = 0;
        weights.OPPORTUNITY = 0;
        weights.FLAVOR += 6;
    }

    return weights;
};

const pickOutcome = (weights: Record<TavernTalkOutcome, number>): TavernTalkOutcome => {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    let roll = rng.next() * totalWeight;

    for (const outcome of ['FLAVOR', 'RUMOR', 'MINOR_CONTRACT', 'OPPORTUNITY'] as TavernTalkOutcome[]) {
        roll -= weights[outcome];
        if (roll <= 0) return outcome;
    }

    return 'FLAVOR';
};

const PROGRESS_ORDER: DialogueProgressStage[] = ['EARLY', 'MID', 'LATE'];

export const getDialogueProgressStage = (state: GameState): DialogueProgressStage => {
    if (state.stats.tierLevel >= 3 || state.stats.day >= 16) return 'LATE';
    if (state.stats.tierLevel >= 2 || state.stats.day >= 7 || state.stats.totalSalesCount >= 10) return 'MID';
    return 'EARLY';
};

const isStageAtLeast = (current: DialogueProgressStage, minimum: DialogueProgressStage) =>
    PROGRESS_ORDER.indexOf(current) >= PROGRESS_ORDER.indexOf(minimum);

const isStageAtMost = (current: DialogueProgressStage, maximum: DialogueProgressStage) =>
    PROGRESS_ORDER.indexOf(current) <= PROGRESS_ORDER.indexOf(maximum);

export const resolveTavernTalkOutcome = (state: GameState, mercenary: Mercenary): TavernTalkEntry => {
    const affinity = mercenary.affinity || 0;
    const isHired = ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(mercenary.status);
    const isVisitor = mercenary.status === 'VISITOR';
    const tier = state.stats.tierLevel;
    const progressStage = getDialogueProgressStage(state);

    // Base outcome weights are adjusted by Tavern reputation and current tavern contract load.
    const selectedOutcome = pickOutcome(getOutcomeWeights(state));

    // 2. Filter available entries based on outcome, job, affinity, etc.
    const availableEntries = TAVERN_TALK_ENTRIES.filter(entry => {
        // Outcome match
        if (entry.outcome !== selectedOutcome) return false;

        // Job match
        if (entry.speakerJob !== 'ANY' && entry.speakerJob !== mercenary.job) return false;

        // Affinity match
        if (entry.minAffinity !== undefined && affinity < entry.minAffinity) return false;
        if (entry.maxAffinity !== undefined && affinity > entry.maxAffinity) return false;

        // Tier match
        if (entry.minTier !== undefined && tier < entry.minTier) return false;

        // Hired/Visitor status
        if (entry.requiresHired && !isHired) return false;
        if (entry.requiresVisitor && !isVisitor) return false;

        // Temperament / voice match
        if (entry.temperament && entry.temperament !== 'ANY' && entry.temperament !== mercenary.temperament) return false;
        if (entry.voice && entry.voice !== 'ANY' && entry.voice !== mercenary.voice) return false;

        // Progress stage match
        if (entry.minProgressStage && !isStageAtLeast(progressStage, entry.minProgressStage)) return false;
        if (entry.maxProgressStage && !isStageAtMost(progressStage, entry.maxProgressStage)) return false;

        return true;
    });

    // 3. If no entries for the selected outcome, fallback to FLAVOR
    if (availableEntries.length === 0) {
        const fallbackEntries = TAVERN_TALK_ENTRIES.filter(entry => 
            entry.outcome === 'FLAVOR' && 
            (entry.speakerJob === 'ANY' || entry.speakerJob === mercenary.job) &&
            (!entry.temperament || entry.temperament === 'ANY' || entry.temperament === mercenary.temperament) &&
            (!entry.voice || entry.voice === 'ANY' || entry.voice === mercenary.voice) &&
            (!entry.minProgressStage || isStageAtLeast(progressStage, entry.minProgressStage)) &&
            (!entry.maxProgressStage || isStageAtMost(progressStage, entry.maxProgressStage))
        );
        return rng.pick(fallbackEntries);
    }

    // 4. Weighted random selection from available entries
    const totalWeight = availableEntries.reduce((sum, entry) => sum + entry.weight, 0);
    let weightedRoll = rng.next() * totalWeight;

    for (const entry of availableEntries) {
        weightedRoll -= entry.weight;
        if (weightedRoll <= 0) return entry;
    }

    return availableEntries[0];
};

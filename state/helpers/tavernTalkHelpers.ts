import { GameState, TavernTalkEntry, TavernTalkOutcome } from '../../types/game-state';
import { Mercenary } from '../../models/Mercenary';
import { TAVERN_TALK_ENTRIES } from '../../data/dialogue/tavernTalk';
import { rng } from '../../utils/random';

export const resolveTavernTalkOutcome = (state: GameState, mercenary: Mercenary): TavernTalkEntry => {
    const affinity = mercenary.affinity || 0;
    const isHired = ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(mercenary.status);
    const isVisitor = mercenary.status === 'VISITOR';
    const tier = state.stats.tierLevel;

    // 1. Determine the outcome type based on probabilities
    // Base probabilities: FLAVOR 60%, RUMOR 25%, MINOR_CONTRACT 12%, OPPORTUNITY 3%
    const roll = rng.next() * 100;
    let selectedOutcome: TavernTalkOutcome = 'FLAVOR';

    if (roll < 3) {
        selectedOutcome = 'OPPORTUNITY';
    } else if (roll < 15) {
        selectedOutcome = 'MINOR_CONTRACT';
    } else if (roll < 40) {
        selectedOutcome = 'RUMOR';
    } else {
        selectedOutcome = 'FLAVOR';
    }

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

        return true;
    });

    // 3. If no entries for the selected outcome, fallback to FLAVOR
    if (availableEntries.length === 0) {
        const fallbackEntries = TAVERN_TALK_ENTRIES.filter(entry => 
            entry.outcome === 'FLAVOR' && 
            (entry.speakerJob === 'ANY' || entry.speakerJob === mercenary.job)
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

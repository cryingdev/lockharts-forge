import { NAMED_CONVERSATION_PROMPTS } from '../../data/dialogue/namedConversationPrompts';
import { Mercenary } from '../../models/Mercenary';
import { GameState, NamedConversationPrompt } from '../../types/game-state';
import { getDialogueProgressStage } from './tavernTalkHelpers';

const STAGE_ORDER = ['EARLY', 'MID', 'LATE'] as const;

const isStageAtLeast = (current: string, minimum: string) =>
    STAGE_ORDER.indexOf(current as typeof STAGE_ORDER[number]) >= STAGE_ORDER.indexOf(minimum as typeof STAGE_ORDER[number]);

export const getNextNamedConversationPrompt = (
    state: GameState,
    mercenary: Mercenary
): NamedConversationPrompt | null => {
    if (!mercenary.isUnique) return null;

    const history = state.namedConversationHistory[mercenary.id] || [];
    const progressStage = getDialogueProgressStage(state);
    const affinity = mercenary.affinity || 0;

    const prompt = NAMED_CONVERSATION_PROMPTS.find(entry => {
        if (entry.mercenaryId !== mercenary.id) return false;
        if (entry.once !== false && history.includes(entry.id)) return false;
        if (entry.minAffinity !== undefined && affinity < entry.minAffinity) return false;
        if (entry.minProgressStage && !isStageAtLeast(progressStage, entry.minProgressStage)) return false;
        return true;
    });

    return prompt || null;
};

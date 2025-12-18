
import { GameState } from '../../types/index';
import { GameEvent } from '../../types/events';

export const handleTriggerEvent = (state: GameState, event: GameEvent): GameState => {
    return { ...state, activeEvent: event };
};

export const handleCloseEvent = (state: GameState): GameState => {
    return { ...state, activeEvent: null };
};

export const handleToggleJournal = (state: GameState): GameState => {
    return { ...state, showJournal: !state.showJournal };
};

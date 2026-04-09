import { GameState } from '../../types';
import { t } from '../../utils/i18n';
import { getNextTavernLodgingCapacity, getTavernLodgingUpgradeCost, isTavernLodgingMaxed } from '../../config/tavern-config';

export const handleExpandTavernLodging = (state: GameState): GameState => {
    const language = state.settings.language;
    const { lodgingLevel } = state.tavern;
    const nextCapacity = getNextTavernLodgingCapacity(lodgingLevel);
    const cost = getTavernLodgingUpgradeCost(lodgingLevel);

    if (isTavernLodgingMaxed(lodgingLevel) || nextCapacity === null || cost === null) {
        return {
            ...state,
            logs: [t(language, 'tavern.lodging_already_maxed'), ...state.logs],
        };
    }

    if (state.stats.gold < cost) {
        return {
            ...state,
            logs: [t(language, 'tavern.lodging_not_enough_gold', { cost }), ...state.logs],
        };
    }

    return {
        ...state,
        stats: {
            ...state.stats,
            gold: state.stats.gold - cost,
            dailyFinancials: {
                ...state.stats.dailyFinancials,
                expenseMarket: state.stats.dailyFinancials.expenseMarket + cost,
            },
        },
        tavern: {
            ...state.tavern,
            lodgingLevel: lodgingLevel + 1,
            reputation: Math.min(100, state.tavern.reputation + 2),
        },
        logs: [t(language, 'tavern.lodging_upgraded', { cap: nextCapacity, cost }), ...state.logs],
    };
};

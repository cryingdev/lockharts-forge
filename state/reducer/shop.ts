
import { GameState } from '../../types/index';
import { ShopCustomer } from '../../types/shop';
import { GAME_CONFIG } from '../../config/game-config';
import { t } from '../../utils/i18n';

export const handleToggleShop = (state: GameState): GameState => {
    const willOpen = !state.forge.isShopOpen;
    const language = state.settings.language;
    
    if (willOpen && state.activeManualDungeon) {
        return { ...state, logs: [t(language, 'logs.shop_exploring_blocked'), ...state.logs] };
    }

    let newLogs = [t(language, willOpen ? 'tutorial.shop_opened' : 'tutorial.shop_closed'), ...state.logs];
    
    // Pip이 떠날 때 특별 로그 (튜토리얼 단계 확인)
    if (!willOpen && state.tutorialStep === 'CRAFT_FIRST_SWORD_GUIDE') {
        newLogs = [t(language, 'tutorial.pip_waiting_forge'), ...newLogs];
    }

    return {
        ...state,
        forge: { ...state.forge, isShopOpen: willOpen },
        activeCustomer: willOpen ? state.activeCustomer : null,
        shopQueue: willOpen ? state.shopQueue : [],
        logs: newLogs
    };
};

export const handleEnqueueCustomer = (state: GameState, customer: ShopCustomer): GameState => {
    if (state.showTutorialCompleteModal) {
        return state;
    }

    const language = state.settings.language;
    return {
        ...state,
        shopQueue: [...state.shopQueue, customer],
        visitorsToday: [...state.visitorsToday, customer.mercenary.id], 
        logs: [t(language, 'logs.customer_entered', { name: customer.mercenary.name }), ...state.logs]
    };
};

export const handleNextCustomer = (state: GameState): GameState => {
    if (state.shopQueue.length === 0) return state;
    const [next, ...remaining] = state.shopQueue;
    return { ...state, shopQueue: remaining, activeCustomer: next };
};

export const handleDismissCustomer = (state: GameState): GameState => {
    const logEntry = state.activeCustomer ? [`${state.activeCustomer.mercenary.name} left the shop.`] : [];
    return {
        ...state,
        activeCustomer: null,
        logs: [...logEntry, ...state.logs]
    };
};

export const handleRefuseCustomer = (state: GameState, payload: { mercenaryId: string; affinityLoss: number }): GameState => {
    const { mercenaryId, affinityLoss } = payload;
    
    let newKnownMercenaries = [...state.knownMercenaries];
    let newActiveCustomer = state.activeCustomer;

    const mercIdx = newKnownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIdx > -1) {
        const merc = { ...newKnownMercenaries[mercIdx] };
        merc.affinity = Math.max(0, (merc.affinity || 0) - affinityLoss);
        newKnownMercenaries[mercIdx] = merc;
        
        // Sync to active customer for HUD
        if (newActiveCustomer && newActiveCustomer.mercenary.id === mercenaryId) {
            newActiveCustomer = {
                ...newActiveCustomer,
                mercenary: merc
            };
        }
    }

    const logMessage = affinityLoss > 0 
        ? `${newKnownMercenaries[mercIdx]?.name} was disappointed. Affinity dropped by ${affinityLoss}.`
        : `${newKnownMercenaries[mercIdx]?.name} accepted the refusal politely.`;

    return {
        ...state,
        knownMercenaries: newKnownMercenaries,
        activeCustomer: newActiveCustomer,
        logs: [logMessage, ...state.logs]
    };
};

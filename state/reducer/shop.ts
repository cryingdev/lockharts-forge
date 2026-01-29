
import { GameState } from '../../types/index';
import { ShopCustomer } from '../../types/shop';
import { GAME_CONFIG } from '../../config/game-config';

export const handleToggleShop = (state: GameState): GameState => {
    const willOpen = !state.forge.isShopOpen;
    
    // 에너지 소모 로직 제거: 누구나 언제든 상점을 열고 닫을 수 있음
    return {
        ...state,
        forge: { ...state.forge, isShopOpen: willOpen },
        activeCustomer: willOpen ? state.activeCustomer : null,
        shopQueue: willOpen ? state.shopQueue : [],
        logs: [willOpen ? 'Shop is now OPEN.' : 'Shop is now CLOSED.', ...state.logs]
    };
};

export const handleEnqueueCustomer = (state: GameState, customer: ShopCustomer): GameState => {
    return {
        ...state,
        shopQueue: [...state.shopQueue, customer],
        visitorsToday: [...state.visitorsToday, customer.mercenary.id], 
        logs: [`${customer.mercenary.name} has entered the shop.`, ...state.logs]
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

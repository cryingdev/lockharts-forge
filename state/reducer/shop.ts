
import { GameState } from '../../types/index';
import { ShopCustomer } from '../../types/shop';
import { GAME_CONFIG } from '../../config/game-config';

export const handleToggleShop = (state: GameState): GameState => {
    if (state.stats.energy < GAME_CONFIG.ENERGY_COST.OPEN_SHOP && !state.forge.isShopOpen) {
        return { ...state, logs: ['Not enough energy to prepare the shop.', ...state.logs] };
    }
    const willOpen = !state.forge.isShopOpen;
    const shopCost = willOpen ? GAME_CONFIG.ENERGY_COST.OPEN_SHOP : 0;
    
    // When closing, kick everyone out and clear the active customer
    return {
        ...state,
        stats: { ...state.stats, energy: state.stats.energy - shopCost },
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

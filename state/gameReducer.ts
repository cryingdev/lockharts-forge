import { GameState } from '../types/index';
import { GameAction } from './actions';

// Import Handlers
import { handleRepairWork } from './reducer/repair';
import { handleSleep, handleConfirmSleep } from './reducer/sleep';
import { handleTriggerEvent, handleCloseEvent, handleToggleJournal } from './reducer/events';
import { handleAcquireItem, handlePayCost, handleBuyMarketItems, handleInstallFurnace, handleSellItem, handleUseItem } from './reducer/inventory';
import { handleStartCrafting, handleCancelCrafting, handleFinishCrafting, handleSetCrafting, handleUpdateForgeStatus } from './reducer/crafting';
import { handleToggleShop, handleEnqueueCustomer, handleNextCustomer, handleDismissCustomer } from './reducer/shop';
import { handleAddKnownMercenary, handleHireMercenary, handleFireMercenary, handleAllocateStat, handleUpdateMercenaryStats, handleGiveGift } from './reducer/mercenary';
import { handleStartExpedition, handleCompleteExpedition, handleClaimExpedition, handleDismissDungeonResult } from './reducer/expedition';
import { handleEquipItem, handleUnequipItem } from './reducer/equipment';

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    // Repair
    case 'REPAIR_WORK': return handleRepairWork(state);

    // Sleep
    case 'SLEEP': return handleSleep(state);
    case 'CONFIRM_SLEEP': return handleConfirmSleep(state);

    // Events
    case 'TRIGGER_EVENT': return handleTriggerEvent(state, action.payload);
    case 'CLOSE_EVENT': return handleCloseEvent(state);
    case 'TOGGLE_JOURNAL': return handleToggleJournal(state);

    // Inventory & Market
    case 'ACQUIRE_ITEM': return handleAcquireItem(state, action.payload);
    case 'PAY_COST': return handlePayCost(state, action.payload);
    case 'BUY_MARKET_ITEMS': return handleBuyMarketItems(state, action.payload);
    case 'INSTALL_FURNACE': return handleInstallFurnace(state);
    case 'SELL_ITEM': return handleSellItem(state, action.payload);
    case 'USE_ITEM': return handleUseItem(state, action.payload);

    // Crafting
    case 'START_CRAFTING': return handleStartCrafting(state, action.payload);
    case 'CANCEL_CRAFTING': return handleCancelCrafting(state, action.payload);
    case 'FINISH_CRAFTING': return handleFinishCrafting(state, action.payload);
    case 'DISMISS_CRAFTING_RESULT': return { ...state, lastCraftedItem: null };
    case 'SET_CRAFTING': return handleSetCrafting(state, action.payload);
    case 'UPDATE_FORGE_STATUS': return handleUpdateForgeStatus(state, action.payload);

    // Shop
    case 'TOGGLE_SHOP': return handleToggleShop(state);
    case 'ENQUEUE_CUSTOMER': return handleEnqueueCustomer(state, action.payload);
    case 'NEXT_CUSTOMER': return handleNextCustomer(state);
    case 'DISMISS_CUSTOMER': return handleDismissCustomer(state);

    // Mercenaries
    case 'ADD_KNOWN_MERCENARY': return handleAddKnownMercenary(state, action.payload);
    case 'HIRE_MERCENARY': return handleHireMercenary(state, action.payload);
    case 'FIRE_MERCENARY': return handleFireMercenary(state, action.payload);
    case 'GIVE_GIFT': return handleGiveGift(state, action.payload);
    case 'ALLOCATE_STAT': return handleAllocateStat(state, action.payload);
    case 'UPDATE_MERCENARY_STATS': return handleUpdateMercenaryStats(state, action.payload);

    // Expedition
    case 'START_EXPEDITION': return handleStartExpedition(state, action.payload);
    case 'COMPLETE_EXPEDITION': return handleCompleteExpedition(state, action.payload);
    case 'CLAIM_EXPEDITION': return handleClaimExpedition(state, action.payload);
    case 'DISMISS_DUNGEON_RESULT': return handleDismissDungeonResult(state);

    // Equipment
    case 'EQUIP_ITEM': return handleEquipItem(state, action.payload);
    case 'UNEQUIP_ITEM': return handleUnequipItem(state, action.payload);

    // UI Effects
    case 'SET_UI_EFFECT':
        return {
            ...state,
            uiEffects: {
                ...state.uiEffects,
                [action.payload.effect]: action.payload.value
            }
        };

    default:
      return state;
  }
};
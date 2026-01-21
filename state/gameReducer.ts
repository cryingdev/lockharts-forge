
import { GameState } from '../types/index';
import { GameAction } from './actions';

// Import Handlers
import { handleRepairWork } from './reducer/repair';
import { handleSleep, handleConfirmSleep } from './reducer/sleep';
import { handleTriggerEvent, handleCloseEvent, handleToggleJournal } from './reducer/events';
import { handleAcquireItem, handlePayCost, handleBuyMarketItems, handleInstallFurnace, handleSellItem, handleUseItem, handleToggleLockItem } from './reducer/inventory';
import { handleStartCrafting, handleCancelCrafting, handleFinishCrafting, handleSetCrafting, handleUpdateForgeStatus } from './reducer/crafting';
import { handleToggleShop, handleEnqueueCustomer, handleNextCustomer, handleDismissCustomer, handleRefuseCustomer } from './reducer/shop';
import { handleAddKnownMercenary, handleScoutMercenary, handleHireMercenary, handleFireMercenary, handleAllocateStat, handleUpdateMercenaryStats, handleGiveGift, handleTalkMercenary } from './reducer/mercenary';
import { handleStartExpedition, handleCompleteExpedition, handleClaimExpedition, handleAbortExpedition, handleDismissDungeonResult } from './reducer/expedition';
import { handleEquipItem, handleUnequipItem } from './reducer/equipment';
import { handleStartManualDungeon, handleMoveManualDungeon, handleFinishManualDungeon, handleRescueNPC, handleRetreatManualDungeon, handleStartCombatManual, handleResolveCombatManual } from './reducer/manualDungeon';
import { handleTalkGarrick, handleGiftGarrick } from './reducer/market-affinity';

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    // Save & Load
    case 'LOAD_GAME': return action.payload;

    // Repair
    case 'REPAIR_WORK': return handleRepairWork(state);

    // Sleep
    case 'SLEEP': return handleSleep(state);
    case 'CONFIRM_SLEEP': return handleConfirmSleep(state);
    case 'CLOSE_SLEEP_MODAL': return { ...state, showSleepModal: false };

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
    case 'TOGGLE_LOCK_ITEM': return handleToggleLockItem(state, action.payload);

    // Crafting
    case 'START_CRAFTING': return handleStartCrafting(state, action.payload);
    case 'CANCEL_CRAFTING': return handleCancelCrafting(state, action.payload);
    case 'FINISH_CRAFTING': return handleFinishCrafting(state, action.payload);
    case 'DISMISS_CRAFTING_RESULT': return { ...state, lastCraftedItem: null };
    case 'DISMISS_TIER_UNLOCK': return { ...state, unlockedTierPopup: null };
    case 'SET_CRAFTING': return handleSetCrafting(state, action.payload);
    case 'UPDATE_FORGE_STATUS': return handleUpdateForgeStatus(state, action.payload);

    // Shop
    case 'TOGGLE_SHOP': return handleToggleShop(state);
    case 'ENQUEUE_CUSTOMER': return handleEnqueueCustomer(state, action.payload);
    case 'NEXT_CUSTOMER': return handleNextCustomer(state);
    case 'DISMISS_CUSTOMER': return handleDismissCustomer(state);
    case 'REFUSE_CUSTOMER': return handleRefuseCustomer(state, action.payload);

    // Mercenaries
    case 'ADD_KNOWN_MERCENARY': return handleAddKnownMercenary(state, action.payload);
    case 'SCOUT_MERCENARY': return handleScoutMercenary(state, action.payload);
    case 'HIRE_MERCENARY': return handleHireMercenary(state, action.payload);
    case 'FIRE_MERCENARY': return handleFireMercenary(state, action.payload);
    case 'GIVE_GIFT': return handleGiveGift(state, action.payload);
    case 'TALK_MERCENARY': return handleTalkMercenary(state, action.payload);
    case 'ALLOCATE_STAT': return handleAllocateStat(state, action.payload);
    case 'UPDATE_MERCENARY_STATS': return handleUpdateMercenaryStats(state, action.payload);

    // Garrick Market
    case 'TALK_GARRICK': return handleTalkGarrick(state);
    case 'GIFT_GARRICK': return handleGiftGarrick(state, action.payload);

    // Expedition
    case 'START_EXPEDITION': return handleStartExpedition(state, action.payload);
    case 'COMPLETE_EXPEDITION': return handleCompleteExpedition(state, action.payload);
    case 'CLAIM_EXPEDITION': return handleClaimExpedition(state, action.payload);
    case 'ABORT_EXPEDITION': return handleAbortExpedition(state, action.payload);
    case 'DISMISS_DUNGEON_RESULT': return handleDismissDungeonResult(state);

    // Equipment
    case 'EQUIP_ITEM': return handleEquipItem(state, action.payload);
    case 'UNEQUIP_ITEM': return handleUnequipItem(state, action.payload);

    // Manual Dungeon
    case 'START_MANUAL_DUNGEON': return handleStartManualDungeon(state, action.payload);
    case 'MOVE_MANUAL_DUNGEON': return handleMoveManualDungeon(state, action.payload);
    case 'FINISH_MANUAL_DUNGEON': return handleFinishManualDungeon(state);
    case 'RETREAT_MANUAL_DUNGEON': return handleRetreatManualDungeon(state);
    case 'TOGGLE_MANUAL_DUNGEON_OVERLAY': return { ...state, showManualDungeonOverlay: action.payload };
    case 'RESCUE_NPC': return handleRescueNPC(state, action.payload);
    case 'START_COMBAT_MANUAL': return handleStartCombatManual(state);
    case 'RESOLVE_COMBAT_MANUAL': return handleResolveCombatManual(state, action.payload);

    // Tutorial & Prologue
    case 'SET_TUTORIAL_STEP': return { ...state, tutorialStep: action.payload };
    case 'SET_ACTIVE_TUTORIAL_SCENE': return { ...state, activeTutorialScene: action.payload };
    case 'COMPLETE_PROLOGUE': 
        return { 
            ...state, 
            hasCompletedPrologue: true,
            activeTutorialScene: null,
            tutorialStep: 'MARKET_GUIDE' 
        };
    case 'COMPLETE_TUTORIAL':
        const finalTabs = ['FORGE', 'MARKET', 'INVENTORY', 'SHOP', 'TAVERN', 'DUNGEON', 'SIMULATION'];
        return {
            ...state,
            tutorialStep: null,
            activeTutorialScene: null,
            unlockedTabs: finalTabs,
            stats: {
                ...state.stats,
                tierLevel: Math.max(state.stats.tierLevel, 1) 
            },
            forge: { ...state.forge, hasFurnace: true }, 
            showTutorialCompleteModal: true,
            logs: ["Tutorial completed. Lockhart's Forge is fully operational.", ...state.logs]
        };
    case 'DISMISS_TUTORIAL_COMPLETE':
        return { ...state, showTutorialCompleteModal: false };

    // User Preferences
    case 'UPDATE_SETTINGS':
        return {
            ...state,
            settings: { ...state.settings, ...action.payload }
        };

    // Toast Notifications
    case 'SHOW_TOAST':
        // 현재 노출 중인 메시지와 동일하면 무시
        if (state.toast?.visible && state.toast.message === action.payload) {
            return state;
        }
        // 큐의 마지막 메시지와 동일하면 무시
        if (state.toastQueue.length > 0 && state.toastQueue[state.toastQueue.length - 1] === action.payload) {
            return state;
        }
        return {
            ...state,
            toastQueue: [...state.toastQueue, action.payload]
        };

    case 'POP_NEXT_TOAST':
        if (state.toastQueue.length === 0) return state;
        const [nextMessage, ...remainingQueue] = state.toastQueue;
        return {
            ...state,
            toast: { message: nextMessage, visible: true },
            toastQueue: remainingQueue
        };

    case 'HIDE_TOAST':
        return {
            ...state,
            toast: state.toast ? { ...state.toast, visible: false } : null
        };

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

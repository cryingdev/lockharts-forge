
import React, { createContext, useContext, useReducer, useMemo, useEffect, useRef } from 'react';
import { GameContextType, GameState } from '../types/index';
import { gameReducer } from '../state/gameReducer';
import { createInitialGameState } from '../state/initial-game-state';
import { EquipmentItem, EquipmentSlotType } from '../types/inventory';
import { ShopCustomer } from '../types/shop';
import { Mercenary } from '../models/Mercenary';
import { PrimaryStats } from '../models/Stats';
import { GAME_CONFIG } from '../config/game-config';
import { getEnergyCost } from '../utils/craftingLogic';
import { GameEvent } from '../types/events';
import { saveToSlot } from '../utils/saveSystem';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
    initialSlotIndex?: number;
    children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children, initialSlotIndex = 0 }) => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  
  const currentSlotRef = useRef(initialSlotIndex);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const prevDayRef = useRef(state.stats.day);
  useEffect(() => {
    if (state.stats.day === prevDayRef.current + 1) {
      saveToSlot(currentSlotRef.current, state);
    }
    prevDayRef.current = state.stats.day;
  }, [state.stats.day, state]);

  const triggerEnergyHighlight = () => {
      dispatch({ type: 'SET_UI_EFFECT', payload: { effect: 'energyHighlight', value: true } });
      setTimeout(() => {
          dispatch({ type: 'SET_UI_EFFECT', payload: { effect: 'energyHighlight', value: false } });
      }, 3000);
  };

  const showToast = (message: string) => {
      dispatch({ type: 'SHOW_TOAST', payload: message });
      setTimeout(() => {
          dispatch({ type: 'HIDE_TOAST' });
      }, 3000);
  };

  const actions = useMemo(() => ({
    repairItem: () => {
        if (stateRef.current.stats.energy < GAME_CONFIG.ENERGY_COST.REPAIR) {
            triggerEnergyHighlight();
            return;
        }
        dispatch({ type: 'REPAIR_WORK' });
    },
    rest: () => dispatch({ type: 'SLEEP' }),
    confirmSleep: () => dispatch({ type: 'CONFIRM_SLEEP' }),
    category: () => dispatch({ type: 'CLOSE_SLEEP_MODAL' }), // Note: Fix typo if intended, kept as per source
    closeRest: () => dispatch({ type: 'CLOSE_SLEEP_MODAL' }),
    
    triggerEvent: (event: GameEvent) => dispatch({ type: 'TRIGGER_EVENT', payload: event }),
    handleEventOption: (action: () => void) => {
      action();
      dispatch({ type: 'CLOSE_EVENT' });
    },
    closeEvent: () => dispatch({ type: 'CLOSE_EVENT' }),

    saveGame: (slotIndex?: number) => {
        const targetSlot = slotIndex !== undefined ? slotIndex : currentSlotRef.current;
        const success = saveToSlot(targetSlot, stateRef.current);
        if (success) {
            currentSlotRef.current = targetSlot;
            showToast(`Progress saved to Slot ${targetSlot + 1}.`);
        }
    },
    loadGame: (loadedState: GameState) => {
        dispatch({ type: 'LOAD_GAME', payload: loadedState });
    },

    startCrafting: (item: EquipmentItem) => {
        const masteryCount = stateRef.current.craftingMastery[item.id] || 0;
        const energyCost = getEnergyCost(item, masteryCount);
        if (stateRef.current.stats.energy < energyCost) {
            triggerEnergyHighlight();
            return;
        }
        dispatch({ type: 'START_CRAFTING', payload: { item } });
    },
    cancelCrafting: (item: EquipmentItem) => dispatch({ type: 'CANCEL_CRAFTING', payload: { item } }),
    finishCrafting: (item: EquipmentItem, quality: number, bonus?: number, masteryGain?: number) => dispatch({ type: 'FINISH_CRAFTING', payload: { item, quality, bonus, masteryGain } }),
    craftItem: (item: EquipmentItem, quality: number) => dispatch({ type: 'FINISH_CRAFTING', payload: { item, quality } }),
    dismissCraftingResult: () => dispatch({ type: 'DISMISS_CRAFTING_RESULT' }),

    buyItems: (items: { id: string; count: number }[], totalCost: number) => dispatch({ type: 'BUY_MARKET_ITEMS', payload: { items, totalCost } }),
    sellItem: (itemId: string, count: number, price: number, equipmentInstanceId?: string, customer?: Mercenary) =>
        dispatch({ type: 'SELL_ITEM', payload: { itemId, count, price, equipmentInstanceId, customer } }),
    toggleShop: () => {
        if (!stateRef.current.forge.isShopOpen && stateRef.current.stats.energy < GAME_CONFIG.ENERGY_COST.OPEN_SHOP) {
            triggerEnergyHighlight();
            return;
        }
        dispatch({ type: 'TOGGLE_SHOP' });
    },
    addMercenary: (merc: Mercenary) => dispatch({ type: 'ADD_KNOWN_MERCENARY', payload: merc }),
    scoutMercenary: (merc: Mercenary, cost: number) => dispatch({ type: 'SCOUT_MERCENARY', payload: { mercenary: merc, cost } }),

    consumeItem: (id: string, count: number) => dispatch({ type: 'PAY_COST', payload: { items: [{ id, count }] } }),

    enqueueCustomer: (customer: ShopCustomer) => dispatch({ type: 'ENQUEUE_CUSTOMER', payload: customer }),
    nextCustomer: () => dispatch({ type: 'NEXT_CUSTOMER' }),
    dismissCustomer: () => dispatch({ type: 'DISMISS_CUSTOMER' }),
    refuseCustomer: (mercenaryId: string, affinityLoss: number) => dispatch({ type: 'REFUSE_CUSTOMER', payload: { mercenaryId, affinityLoss } }),

    setCrafting: (isCrafting: boolean) => dispatch({ type: 'SET_CRAFTING', payload: isCrafting }),
    updateForgeStatus: (temp: number) => dispatch({ type: 'UPDATE_FORGE_STATUS', payload: { temp } }),
    updateMercenaryStats: (mercenaryId: string, stats: PrimaryStats) => dispatch({ type: 'UPDATE_MERCENARY_STATS', payload: { mercenaryId, stats } }),
    toggleJournal: () => dispatch({ type: 'TOGGLE_JOURNAL' }),

    hireMercenary: (mercenaryId: string, cost: number) => dispatch({ type: 'HIRE_MERCENARY', payload: { mercenaryId, cost } }),
    fireMercenary: (mercenaryId: string) => dispatch({ type: 'FIRE_MERCENARY', payload: { mercenaryId } }),
    giveGift: (mercenaryId: string, itemId: string) => dispatch({ type: 'GIVE_GIFT', payload: { mercenaryId, itemId } }),
    talkMercenary: (mercenaryId: string) => dispatch({ type: 'TALK_MERCENARY', payload: { mercenaryId } }),

    startExpedition: (dungeonId: string, partyIds: string[]) => dispatch({ type: 'START_EXPEDITION', payload: { dungeonId, partyIds } }),
    completeExpedition: (expeditionId: string) => dispatch({ type: 'COMPLETE_EXPEDITION', payload: { expeditionId } }),
    // Added missing abortExpedition implementation
    abortExpedition: (expeditionId: string) => dispatch({ type: 'ABORT_EXPEDITION', payload: { expeditionId } }),
    claimExpedition: (expeditionId: string) => dispatch({ type: 'CLAIM_EXPEDITION', payload: { expeditionId } }),
    dismissDungeonResult: () => dispatch({ type: 'DISMISS_DUNGEON_RESULT' }),

    equipItem: (mercenaryId: string, inventoryItemId: string) => dispatch({ type: 'EQUIP_ITEM', payload: { mercenaryId, inventoryItemId } }),
    unequipItem: (mercenaryId: string, slot: EquipmentSlotType) => dispatch({ type: 'UNEQUIP_ITEM', payload: { mercenaryId, slot } }),

    useItem: (itemId: string) => dispatch({ type: 'USE_ITEM', payload: { itemId } }),
    allocateStat: (mercenaryId: string, stat: keyof PrimaryStats) => dispatch({ type: 'ALLOCATE_STAT', payload: { mercenaryId, stat } }),

    startManualAssault: (dungeonId: string, partyIds: string[]) => 
        dispatch({ type: 'START_MANUAL_DUNGEON', payload: { dungeonId, partyIds } }),
    moveInManualDungeon: (dx: number, dy: number) => 
        dispatch({ type: 'MOVE_MANUAL_DUNGEON', payload: { x: dx, y: dy } }),
    finishManualAssault: () =>
        dispatch({ type: 'FINISH_MANUAL_DUNGEON' }),
    retreatFromManualDungeon: () => 
        dispatch({ type: 'RETREAT_MANUAL_DUNGEON' }),
    
    toggleManualDungeonOverlay: (show: boolean) => 
        dispatch({ type: 'TOGGLE_MANUAL_DUNGEON_OVERLAY', payload: show }),

    rescueMercenary: (npcId: string) => 
        dispatch({ type: 'RESCUE_NPC', payload: { npcId } }),

    updateSettings: (settings: Partial<GameState['settings']>) => 
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),

    triggerEnergyHighlight,
    showToast,
    hideToast: () => dispatch({ type: 'HIDE_TOAST' }),
    setTutorialStep: (step: GameState['tutorialStep']) => dispatch({ type: 'SET_TUTORIAL_STEP', payload: step }),
    setTutorialScene: (mode: GameState['activeTutorialScene']) => dispatch({ type: 'SET_ACTIVE_TUTORIAL_SCENE', payload: mode }),
    completePrologue: () => dispatch({ type: 'COMPLETE_PROLOGUE' }),
    // Added missing completeTutorial implementation
    completeTutorial: () => dispatch({ type: 'COMPLETE_TUTORIAL' })
  }), [dispatch]); 

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
};

export { GameContext };

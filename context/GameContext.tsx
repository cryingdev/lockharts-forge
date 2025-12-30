import React, { createContext, useContext, useReducer, useMemo, useEffect, useRef } from 'react';
import { GameContextType } from '../types/index';
import { gameReducer } from '../state/gameReducer';
import { createInitialGameState } from '../state/initial-game-state';
import { EquipmentItem, EquipmentSlotType } from '../types/inventory';
import { ShopCustomer } from '../types/shop';
import { Mercenary } from '../models/Mercenary';
import { PrimaryStats } from '../models/Stats';
import { GAME_CONFIG } from '../config/game-config';
import { getEnergyCost } from '../utils/craftingLogic';
import { GameEvent } from '../types/events';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);

  // --- Helper Trigger ---
  const triggerEnergyHighlight = () => {
      dispatch({ type: 'SET_UI_EFFECT', payload: { effect: 'energyHighlight', value: true } });
      setTimeout(() => {
          dispatch({ type: 'SET_UI_EFFECT', payload: { effect: 'energyHighlight', value: false } });
      }, 3000);
  };

  // --- ACTIONS ---
  const actions = useMemo(() => ({
    repairItem: () => {
        if (state.stats.energy < GAME_CONFIG.ENERGY_COST.REPAIR) {
            triggerEnergyHighlight();
            return;
        }
        dispatch({ type: 'REPAIR_WORK' });
    },
    rest: () => dispatch({ type: 'SLEEP' }),
    confirmSleep: () => dispatch({ type: 'CONFIRM_SLEEP' }),
    
    triggerEvent: (event: GameEvent) => dispatch({ type: 'TRIGGER_EVENT', payload: event }),
    handleEventOption: (action: () => void) => {
      action();
      dispatch({ type: 'CLOSE_EVENT' });
    },
    closeEvent: () => dispatch({ type: 'CLOSE_EVENT' }),

    // Crafting
    startCrafting: (item: EquipmentItem) => {
        const masteryCount = state.craftingMastery[item.id] || 0;
        const energyCost = getEnergyCost(item, masteryCount);
        if (state.stats.energy < energyCost) {
            triggerEnergyHighlight();
            return;
        }
        dispatch({ type: 'START_CRAFTING', payload: { item } });
    },
    cancelCrafting: (item: EquipmentItem) => dispatch({ type: 'CANCEL_CRAFTING', payload: { item } }),
    finishCrafting: (item: EquipmentItem, quality: number, bonus?: number) => dispatch({ type: 'FINISH_CRAFTING', payload: { item, quality, bonus } }),
    craftItem: (item: EquipmentItem, quality: number) => dispatch({ type: 'FINISH_CRAFTING', payload: { item, quality } }),
    dismissCraftingResult: () => dispatch({ type: 'DISMISS_CRAFTING_RESULT' }),

    buyItems: (items: { id: string; count: number }[], totalCost: number) => dispatch({ type: 'BUY_MARKET_ITEMS', payload: { items, totalCost } }),
    sellItem: (itemId: string, count: number, price: number, equipmentInstanceId?: string, customer?: Mercenary) =>
        dispatch({ type: 'SELL_ITEM', payload: { itemId, count, price, equipmentInstanceId, customer } }),
    toggleShop: () => {
        if (!state.forge.isShopOpen && state.stats.energy < GAME_CONFIG.ENERGY_COST.OPEN_SHOP) {
            triggerEnergyHighlight();
            return;
        }
        dispatch({ type: 'TOGGLE_SHOP' });
    },
    addMercenary: (merc: Mercenary) => dispatch({ type: 'ADD_KNOWN_MERCENARY', payload: merc }),

    consumeItem: (id: string, count: number) => dispatch({ type: 'PAY_COST', payload: { items: [{ id, count }] } }),

    enqueueCustomer: (customer: ShopCustomer) => dispatch({ type: 'ENQUEUE_CUSTOMER', payload: customer }),
    nextCustomer: () => dispatch({ type: 'NEXT_CUSTOMER' }),
    dismissCustomer: () => dispatch({ type: 'DISMISS_CUSTOMER' }),

    setCrafting: (isCrafting: boolean) => dispatch({ type: 'SET_CRAFTING', payload: isCrafting }),
    updateForgeStatus: (temp: number) => dispatch({ type: 'UPDATE_FORGE_STATUS', payload: { temp } }),
    updateMercenaryStats: (mercenaryId: string, stats: PrimaryStats) => dispatch({ type: 'UPDATE_MERCENARY_STATS', payload: { mercenaryId, stats } }),
    toggleJournal: () => dispatch({ type: 'TOGGLE_JOURNAL' }),

    hireMercenary: (mercenaryId: string, cost: number) => dispatch({ type: 'HIRE_MERCENARY', payload: { mercenaryId, cost } }),
    fireMercenary: (mercenaryId: string) => dispatch({ type: 'FIRE_MERCENARY', payload: { mercenaryId } }),
    giveGift: (mercenaryId: string, itemId: string) => dispatch({ type: 'GIVE_GIFT', payload: { mercenaryId, itemId } }),

    startExpedition: (dungeonId: string, partyIds: string[]) => dispatch({ type: 'START_EXPEDITION', payload: { dungeonId, partyIds } }),
    completeExpedition: (expeditionId: string) => dispatch({ type: 'COMPLETE_EXPEDITION', payload: { expeditionId } }),
    claimExpedition: (expeditionId: string) => dispatch({ type: 'CLAIM_EXPEDITION', payload: { expeditionId } }),
    dismissDungeonResult: () => dispatch({ type: 'DISMISS_DUNGEON_RESULT' }),

    // Equipment Actions
    equipItem: (mercenaryId: string, inventoryItemId: string) => dispatch({ type: 'EQUIP_ITEM', payload: { mercenaryId, inventoryItemId } }),
    unequipItem: (mercenaryId: string, slot: EquipmentSlotType) => dispatch({ type: 'UNEQUIP_ITEM', payload: { mercenaryId, slot } }),

    // Item Actions
    useItem: (itemId: string) => dispatch({ type: 'USE_ITEM', payload: { itemId } }),

    // Stat Actions
    allocateStat: (mercenaryId: string, stat: keyof PrimaryStats) => dispatch({ type: 'ALLOCATE_STAT', payload: { mercenaryId, stat } }),

    triggerEnergyHighlight

  }), [state.stats.energy, state.craftingMastery, state.forge.isShopOpen, state.activeEvent, state.knownMercenaries]);

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
};

export { GameContext };
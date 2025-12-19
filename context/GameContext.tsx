
import React, { createContext, useContext, useReducer, useMemo, useEffect, useRef } from 'react';
import { GameContextType } from '../types/index';
import { gameReducer } from '../state/gameReducer';
import { createInitialGameState } from '../state/initial-game-state';
import { EquipmentItem, EquipmentSlotType } from '../types/inventory';
import { ShopCustomer } from '../types/shop';
import { Mercenary } from '../models/Mercenary';
import { generateShopRequest } from '../utils/shopUtils';
import { calculateMaxHp, calculateMaxMp, PrimaryStats } from '../models/Stats';
import { SHOP_CONFIG } from '../config/shop-config';

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

  // --- ACTIONS ---
  const actions = useMemo(() => ({
    repairItem: () => dispatch({ type: 'REPAIR_WORK' }),
    rest: () => dispatch({ type: 'SLEEP' }),
    confirmSleep: () => dispatch({ type: 'CONFIRM_SLEEP' }),
    handleEventOption: (action: () => void) => {
      action();
      dispatch({ type: 'CLOSE_EVENT' });
    },
    closeEvent: () => dispatch({ type: 'CLOSE_EVENT' }),

    // Crafting
    startCrafting: (item: EquipmentItem) => dispatch({ type: 'START_CRAFTING', payload: { item } }),
    cancelCrafting: (item: EquipmentItem) => dispatch({ type: 'CANCEL_CRAFTING', payload: { item } }),
    finishCrafting: (item: EquipmentItem, quality: number) => dispatch({ type: 'FINISH_CRAFTING', payload: { item, quality } }),
    craftItem: (item: EquipmentItem, quality: number) => dispatch({ type: 'FINISH_CRAFTING', payload: { item, quality } }),

    buyItems: (items: { id: string; count: number }[], totalCost: number) => dispatch({ type: 'BUY_MARKET_ITEMS', payload: { items, totalCost } }),
    sellItem: (itemId: string, count: number, price: number, equipmentInstanceId?: string, customer?: Mercenary) =>
        dispatch({ type: 'SELL_ITEM', payload: { itemId, count, price, equipmentInstanceId, customer } }),
    toggleShop: () => dispatch({ type: 'TOGGLE_SHOP' }),
    addMercenary: (merc: Mercenary) => dispatch({ type: 'ADD_KNOWN_MERCENARY', payload: merc }),

    consumeItem: (id: string, count: number) => dispatch({ type: 'PAY_COST', payload: { items: [{ id, count }] } }),

    enqueueCustomer: (customer: ShopCustomer) => dispatch({ type: 'ENQUEUE_CUSTOMER', payload: customer }),
    nextCustomer: () => dispatch({ type: 'NEXT_CUSTOMER' }),
    dismissCustomer: () => dispatch({ type: 'DISMISS_CUSTOMER' }),

    setCrafting: (isCrafting: boolean) => dispatch({ type: 'SET_CRAFTING', payload: isCrafting }),
    updateForgeStatus: (temp: number) => dispatch({ type: 'UPDATE_FORGE_STATUS', payload: { temp } }),
    toggleJournal: () => dispatch({ type: 'TOGGLE_JOURNAL' }),

    hireMercenary: (mercenaryId: string, cost: number) => dispatch({ type: 'HIRE_MERCENARY', payload: { mercenaryId, cost } }),
    fireMercenary: (mercenaryId: string) => dispatch({ type: 'FIRE_MERCENARY', payload: { mercenaryId } }),

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

  }), []);

  // --- SIDE EFFECTS (GAME LOOP) ---
  // arrivals, queue, patience, expeditions...
  // (Left out unchanged repetitive logic for brevity)
  
  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
};

export { GameContext };

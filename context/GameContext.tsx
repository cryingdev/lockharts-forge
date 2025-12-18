
import React, { createContext, useContext, useReducer, useMemo, useEffect, useRef } from 'react';
import { GameContextType } from '../types/index';
import { gameReducer } from '../state/gameReducer';
import { createInitialGameState } from '../state/initial-game-state';
import { EquipmentItem, EquipmentSlotType } from '../types/inventory';
import { ShopCustomer } from '../types/shop';
import { Mercenary } from '../models/Mercenary';
import { generateShopRequest } from '../utils/shopUtils';
import { calculateMaxHp, calculateMaxMp } from '../models/Stats';
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

  }), []);

  // --- SIDE EFFECTS (GAME LOOP) ---

  // 1. Shop Service
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patienceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isShopOpen } = state.forge;
  const { activeCustomer, shopQueue } = state;

  // Arrival Logic
  useEffect(() => {
      if (!isShopOpen) {
          if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
          return;
      }

      const scheduleNextArrival = () => {
          const interval = Math.random() * SHOP_CONFIG.ARRIVAL.VARIANCE_MS + SHOP_CONFIG.ARRIVAL.MIN_INTERVAL_MS;
          arrivalTimerRef.current = setTimeout(() => {
              // Ensure we use the latest state for filtering
              // Note: In a real tick loop, we might need a ref to state or more careful dependency management.
              // Here we depend on knownMercenaries and visitorsToday which update relatively infrequently.
              const validCandidates = state.knownMercenaries.filter(m =>
                  !state.visitorsToday.includes(m.id) &&
                  !['ON_EXPEDITION', 'INJURED', 'DEAD'].includes(m.status)
              );

              if (validCandidates.length > 0) {
                  const selectedMerc = validCandidates[Math.floor(Math.random() * validCandidates.length)];
                  const maxHp = calculateMaxHp(selectedMerc.stats, selectedMerc.level);
                  const maxMp = calculateMaxMp(selectedMerc.stats, selectedMerc.level);
                  const visitingMerc = { ...selectedMerc, currentHp: maxHp, currentMp: maxMp, maxHp, maxMp };
                  const customer = generateShopRequest(visitingMerc);
                  
                  actions.enqueueCustomer(customer);
              }
              scheduleNextArrival();
          }, interval);
      };
      scheduleNextArrival();
      return () => { if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current); };
  }, [isShopOpen, state.knownMercenaries, state.visitorsToday, actions]);

  // Queue Logic
  useEffect(() => {
      if (isShopOpen && !activeCustomer && shopQueue.length > 0) {
          const t = setTimeout(() => actions.nextCustomer(), SHOP_CONFIG.QUEUE_PROCESS_DELAY_MS);
          return () => clearTimeout(t);
      }
  }, [isShopOpen, activeCustomer, shopQueue.length, actions]);

  // Patience Logic
  useEffect(() => {
      if (!activeCustomer) {
          if (patienceTimerRef.current) clearTimeout(patienceTimerRef.current);
          return;
      }
      patienceTimerRef.current = setTimeout(() => actions.dismissCustomer(), SHOP_CONFIG.PATIENCE_MS);
      return () => { if (patienceTimerRef.current) clearTimeout(patienceTimerRef.current); };
  }, [activeCustomer, actions]);


  // 2. Dungeons Service
  const { activeExpeditions } = state;
  useEffect(() => {
      const hasActive = activeExpeditions.some(e => e.status === 'ACTIVE');
      if (!hasActive) return;

      const interval = setInterval(() => {
          const now = Date.now();
          const finishedExpeditions = activeExpeditions.filter(
              exp => exp.status === 'ACTIVE' && now >= exp.endTime
          );
          finishedExpeditions.forEach(exp => actions.completeExpedition(exp.id));
      }, 1000);

      return () => clearInterval(interval);
  }, [activeExpeditions, actions]);


  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
};

export { GameContext };

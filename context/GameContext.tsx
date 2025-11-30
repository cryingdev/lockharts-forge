import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { GameState, GameContextType, TimeOfDay, InventoryItem, GameEvent } from '../types';
import { INITIAL_STATE, GAME_CONFIG, ITEMS } from '../constants';

const GameContext = createContext<GameContextType | undefined>(undefined);

type Action =
  | { type: 'CLEAN_RUBBLE' }
  | { type: 'REPAIR_WORK' }
  | { type: 'ADVANCE_TIME' }
  | { type: 'TRIGGER_EVENT'; payload: GameEvent }
  | { type: 'CLOSE_EVENT' }
  | { type: 'ACQUIRE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'PAY_COST'; payload: { gold?: number; items?: { id: string; count: number }[] } }
  | { type: 'INSTALL_FURNACE' };

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'CLEAN_RUBBLE': {
      if (state.stats.energy < GAME_CONFIG.ENERGY_COST.CLEAN) return state;
      if (state.forge.rubbleCleared >= GAME_CONFIG.RUBBLE_MAX) return state;

      // Logic: Gain Scrap Metal
      const existingScrap = state.inventory.find(i => i.id === ITEMS.SCRAP_METAL.id);
      const newInventory = existingScrap
        ? state.inventory.map(i => i.id === ITEMS.SCRAP_METAL.id ? { ...i, quantity: i.quantity + 2 } : i)
        : [...state.inventory, { ...ITEMS.SCRAP_METAL, type: 'RESOURCE', quantity: 2 } as InventoryItem];

      return {
        ...state,
        stats: { ...state.stats, energy: state.stats.energy - GAME_CONFIG.ENERGY_COST.CLEAN },
        inventory: newInventory,
        forge: { ...state.forge, rubbleCleared: state.forge.rubbleCleared + 1 },
        logs: [`Cleared some rubble. Found Scrap Metal x2. Energy -${GAME_CONFIG.ENERGY_COST.CLEAN}.`, ...state.logs],
      };
    }

    case 'REPAIR_WORK': {
      // "Cold Forging" / Repairing creates small gold
      if (state.stats.energy < GAME_CONFIG.ENERGY_COST.REPAIR) return state;
      
      return {
        ...state,
        stats: { 
          ...state.stats, 
          energy: state.stats.energy - GAME_CONFIG.ENERGY_COST.REPAIR,
          gold: state.stats.gold + 15
        },
        logs: [` performed cold repairs for a neighbor. Gold +15. Energy -${GAME_CONFIG.ENERGY_COST.REPAIR}.`, ...state.logs],
      };
    }

    case 'ADVANCE_TIME': {
      let nextTime = state.stats.time;
      let nextDay = state.stats.day;
      let energyRefill = 0;

      if (state.stats.time === TimeOfDay.MORNING) nextTime = TimeOfDay.AFTERNOON;
      else if (state.stats.time === TimeOfDay.AFTERNOON) nextTime = TimeOfDay.EVENING;
      else {
        nextTime = TimeOfDay.MORNING;
        nextDay += 1;
        energyRefill = state.stats.maxEnergy; // Full restore on sleep
      }

      return {
        ...state,
        stats: {
          ...state.stats,
          time: nextTime,
          day: nextDay,
          energy: energyRefill > 0 ? energyRefill : state.stats.energy,
        },
        logs: energyRefill > 0 
          ? [`You slept through the night. Day ${nextDay} begins.`, ...state.logs]
          : [`Time passes... It is now ${nextTime}.`, ...state.logs]
      };
    }

    case 'TRIGGER_EVENT':
      return { ...state, activeEvent: action.payload };

    case 'CLOSE_EVENT':
      return { ...state, activeEvent: null };

    case 'ACQUIRE_ITEM': {
      const { id, quantity } = action.payload;
      // Simplified: Assume item exists in definitions for now
      const itemDef = Object.values(ITEMS).find(i => i.id === id);
      if (!itemDef) return state;

      const existingItem = state.inventory.find(i => i.id === id);
      const newInventory = existingItem
        ? state.inventory.map(i => i.id === id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...state.inventory, { ...itemDef, quantity } as InventoryItem];

      return {
        ...state,
        inventory: newInventory,
        logs: [`Acquired ${itemDef.name} x${quantity}.`, ...state.logs],
      };
    }

    case 'PAY_COST': {
        const { gold, items } = action.payload;
        let newGold = state.stats.gold;
        let newInventory = [...state.inventory];

        if (gold) newGold -= gold;
        
        if (items) {
            items.forEach(costItem => {
                newInventory = newInventory.map(invItem => {
                    if (invItem.id === costItem.id) {
                        return { ...invItem, quantity: invItem.quantity - costItem.count };
                    }
                    return invItem;
                }).filter(i => i.quantity > 0);
            });
        }

        return {
            ...state,
            stats: { ...state.stats, gold: newGold },
            inventory: newInventory
        }
    }

    case 'INSTALL_FURNACE':
      return {
        ...state,
        forge: { ...state.forge, hasFurnace: true },
        logs: ['The Furnace has been installed! The forge comes alive.', ...state.logs]
      };

    default:
      return state;
  }
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  // Merchant Logic Trigger
  useEffect(() => {
    // Only trigger if no active event, we haven't met the merchant (checked by furnace), and rubble condition met
    if (
      !state.activeEvent && 
      !state.forge.hasFurnace && 
      state.forge.rubbleCleared >= GAME_CONFIG.MERCHANT_TRIGGER_RUBBLE
    ) {
      const merchantEvent: GameEvent = {
        id: 'MERCHANT_ARRIVAL',
        title: 'The Wandering Merchant',
        description: "A cloaked figure approaches your ruined forge. 'Ah, I see potential here,' he croaks. 'I have a furnace, old but functional.'",
        options: [
          {
            label: "Buy Furnace (100 Gold)",
            cost: { gold: 100 },
            action: () => {
              dispatch({ type: 'PAY_COST', payload: { gold: 100 } });
              dispatch({ type: 'INSTALL_FURNACE' });
              dispatch({ type: 'CLOSE_EVENT' });
            }
          },
          {
            label: "Trade Scrap (50 Scrap)",
            cost: { items: [{ id: 'scrap', count: 50 }] },
             action: () => {
              dispatch({ type: 'PAY_COST', payload: { items: [{ id: 'scrap', count: 50 }] } });
              dispatch({ type: 'INSTALL_FURNACE' });
              dispatch({ type: 'CLOSE_EVENT' });
            }
          },
           {
            label: "Beg for help (Need 10 Iron Ore)",
            cost: { items: [{ id: 'iron_ore', count: 10 }] },
             action: () => {
              dispatch({ type: 'PAY_COST', payload: { items: [{ id: 'iron_ore', count: 10 }] } });
              dispatch({ type: 'INSTALL_FURNACE' });
              dispatch({ type: 'CLOSE_EVENT' });
            }
          },
          {
            label: "Leave",
            action: () => dispatch({ type: 'CLOSE_EVENT' })
          }
        ]
      };
      
      // Delay slightly for effect
      const timer = setTimeout(() => {
          dispatch({ type: 'TRIGGER_EVENT', payload: merchantEvent });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.forge.rubbleCleared, state.stats.gold, state.activeEvent, state.forge.hasFurnace]);


  const actions = {
    cleanRubble: () => dispatch({ type: 'CLEAN_RUBBLE' }),
    repairItem: () => dispatch({ type: 'REPAIR_WORK' }),
    rest: () => dispatch({ type: 'ADVANCE_TIME' }),
    handleEventOption: (action: () => void) => action(),
    closeEvent: () => dispatch({ type: 'CLOSE_EVENT' }),
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
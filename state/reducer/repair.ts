import { GameState } from '../../types/index';
import { GAME_CONFIG } from '../../config/game-config';

export const handleRepairWork = (state: GameState): GameState => {
  if (state.stats.energy < GAME_CONFIG.ENERGY_COST.REPAIR) return state;
  
  const earn = 15;
  return {
    ...state,
    stats: { 
      ...state.stats, 
      energy: state.stats.energy - GAME_CONFIG.ENERGY_COST.REPAIR,
      gold: state.stats.gold + earn,
      dailyFinancials: {
          ...state.stats.dailyFinancials,
          incomeRepair: state.stats.dailyFinancials.incomeRepair + earn
      }
    },
    logs: [`Performed cold repairs for a neighbor. Gold +${earn}. Energy -${GAME_CONFIG.ENERGY_COST.REPAIR}.`, ...state.logs],
  };
};
import { GameState } from '../../types/index';
import { GAME_CONFIG } from '../../config/game-config';
import { t } from '../../utils/i18n';

export const handleRepairWork = (state: GameState): GameState => {
  if (state.stats.energy < GAME_CONFIG.ENERGY_COST.REPAIR) return state;
  
  const earn = 15;
  let newUnlockedTabs = [...state.unlockedTabs];
  let logPrefix = "";
  const language = state.settings.language;

  if (!newUnlockedTabs.includes('INVENTORY')) {
    newUnlockedTabs.push('INVENTORY');
    logPrefix = `${t(language, 'tutorial.inventory_restored')} `;
  }

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
    unlockedTabs: newUnlockedTabs,
    logs: [`${logPrefix}Performed cold repairs for a neighbor. Gold +${earn}. Energy -${GAME_CONFIG.ENERGY_COST.REPAIR}.`, ...state.logs],
  };
};

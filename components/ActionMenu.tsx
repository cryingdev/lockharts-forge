import React from 'react';
import { useGame } from '../context/GameContext';
import { Hammer, Brush, Store, BedDouble } from 'lucide-react';
import { GAME_CONFIG } from '../constants';

const ActionMenu = () => {
  const { state, actions } = useGame();
  const { energy } = state.stats;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto mt-6">
      
      {/* Clean Button */}
      <button
        onClick={actions.cleanRubble}
        disabled={energy < GAME_CONFIG.ENERGY_COST.CLEAN || state.forge.rubbleCleared >= 10}
        className="flex flex-col items-center justify-center p-4 bg-stone-800 rounded-lg border-2 border-stone-700 hover:border-emerald-500 hover:bg-stone-700 transition-all disabled:opacity-40 disabled:hover:border-stone-700"
      >
        <Brush className="w-6 h-6 text-emerald-400 mb-2" />
        <span className="font-bold text-stone-200">Clean Up</span>
        <span className="text-xs text-stone-400 mt-1">-{GAME_CONFIG.ENERGY_COST.CLEAN} Energy</span>
      </button>

      {/* Repair/Work Button */}
      <button
        onClick={actions.repairItem}
        disabled={energy < GAME_CONFIG.ENERGY_COST.REPAIR}
        className="flex flex-col items-center justify-center p-4 bg-stone-800 rounded-lg border-2 border-stone-700 hover:border-amber-500 hover:bg-stone-700 transition-all disabled:opacity-40 disabled:hover:border-stone-700"
      >
        <Hammer className="w-6 h-6 text-amber-400 mb-2" />
        <span className="font-bold text-stone-200">Cold Work</span>
        <span className="text-xs text-stone-400 mt-1">-{GAME_CONFIG.ENERGY_COST.REPAIR} Energy</span>
      </button>

      {/* Shop Button (Locked initially) */}
      <button
        disabled={!state.forge.hasFurnace}
        className="flex flex-col items-center justify-center p-4 bg-stone-800 rounded-lg border-2 border-stone-700 hover:border-blue-500 hover:bg-stone-700 transition-all disabled:opacity-40 disabled:grayscale"
      >
        <Store className="w-6 h-6 text-blue-400 mb-2" />
        <span className="font-bold text-stone-200">Open Shop</span>
        {!state.forge.hasFurnace ? (
           <span className="text-xs text-red-400 mt-1">Need Furnace</span>
        ) : (
           <span className="text-xs text-stone-400 mt-1">Wait for customers</span>
        )}
      </button>

      {/* Rest Button */}
      <button
        onClick={actions.rest}
        className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg border-2 border-slate-700 hover:border-indigo-500 hover:bg-slate-700 transition-all"
      >
        <BedDouble className="w-6 h-6 text-indigo-400 mb-2" />
        <span className="font-bold text-slate-200">Rest</span>
        <span className="text-xs text-slate-400 mt-1">Advance Time</span>
      </button>

    </div>
  );
};

export default ActionMenu;
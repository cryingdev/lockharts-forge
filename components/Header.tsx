import React from 'react';
import { useGame } from '../context/GameContext';
import { Coins, Zap, Calendar, Sun, Moon, Sunset, BedDouble } from 'lucide-react';

const Header = () => {
  const { state, actions } = useGame();
  const { gold, energy, maxEnergy, day, time } = state.stats;

  const getTimeIcon = () => {
    switch (time) {
      case 'Morning': return <Sun className="w-5 h-5 text-yellow-400" />;
      case 'Afternoon': return <Sunset className="w-5 h-5 text-orange-400" />;
      case 'Evening': return <Moon className="w-5 h-5 text-indigo-400" />;
      default: return <Sun className="w-5 h-5" />;
    }
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-700 p-3 shadow-lg shrink-0 z-20">
      <div className="max-w-6xl mx-auto flex justify-between items-center text-slate-100">
        
        {/* Left: Time & Day */}
        <div className="flex items-center space-x-3 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-sm">Day {day}</span>
          <div className="h-3 w-px bg-slate-600 mx-1"></div>
          <div className="flex items-center space-x-1">
            {getTimeIcon()}
            <span className="text-xs uppercase tracking-wide text-slate-300">{time}</span>
          </div>
        </div>

        {/* Right: Resources & Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Energy Bar */}
          <div className="hidden sm:flex flex-col w-32">
            <div className="flex justify-between text-[10px] mb-1 text-slate-300 uppercase tracking-wider font-bold">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Energy</span>
              <span>{energy}/{maxEnergy}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 border border-slate-700">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${energy < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                style={{ width: `${(energy / maxEnergy) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Gold */}
          <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 min-w-[100px] justify-end">
            <span className="font-mono text-lg text-amber-400 font-bold">{gold}</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>

          {/* Rest Button (Moved from ActionMenu) */}
          <button
            onClick={actions.rest}
            className="flex items-center space-x-2 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 px-3 py-1.5 rounded-lg border border-indigo-700/50 transition-colors"
            title="Rest (Advance Time)"
          >
            <BedDouble className="w-4 h-4" />
            <span className="text-sm font-bold hidden sm:inline">Rest</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
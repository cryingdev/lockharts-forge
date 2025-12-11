
import React from 'react';
import { useGame } from '../context/GameContext';
import { Coins, Zap, Calendar, BedDouble, Store, Users } from 'lucide-react';

interface HeaderProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { state, actions } = useGame();
  const { gold, energy, maxEnergy, day } = state.stats;
  const { isShopOpen } = state.forge;
  const { shopQueue } = state;

  const handleShopClick = () => {
      if (activeTab === 'SHOP') {
          actions.toggleShop();
      } else {
          onTabChange('SHOP');
      }
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-700 p-3 shadow-lg shrink-0 z-20">
      <div className="max-w-6xl mx-auto flex justify-between items-center text-slate-100">
        
        {/* Left: Day Indicator */}
        <div className="flex items-center space-x-3 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-sm tracking-wide">Day {day}</span>
        </div>

        {/* Right: Resources & Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Shop Toggle / Status */}
          <button
             onClick={handleShopClick}
             className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                 isShopOpen 
                 ? 'bg-emerald-900/50 border-emerald-500 text-emerald-100 hover:bg-emerald-800' 
                 : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
             }`}
          >
              <Store className={`w-4 h-4 ${isShopOpen ? 'text-emerald-400' : 'text-stone-500'}`} />
              <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Shop</span>
                  <span className={`text-xs font-bold ${isShopOpen ? 'text-emerald-400' : 'text-stone-500'}`}>
                      {isShopOpen ? 'OPEN' : 'CLOSED'}
                  </span>
              </div>
              
              {/* Queue Badge */}
              {shopQueue.length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border border-stone-900 shadow-sm animate-in zoom-in">
                      {shopQueue.length}
                  </div>
              )}
          </button>

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

          {/* Rest Button */}
          <button
            onClick={actions.rest}
            className="flex items-center space-x-2 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 px-3 py-1.5 rounded-lg border border-indigo-700/50 transition-colors"
            title="End the Day"
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

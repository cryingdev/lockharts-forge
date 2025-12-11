
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Coins, Zap, Calendar, BedDouble, Store, BookOpen } from 'lucide-react';

interface HeaderProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
}

// Internal component for the Typewriter Ticker
const LogTicker = ({ message }: { message: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    // Reset when message changes
    setDisplayedText('');
    
    if (!message) return;

    let index = 0;
    const speed = 20; // ms per char (Fast typing)

    const timer = setInterval(() => {
      if (index < message.length) {
        setDisplayedText(prev => message.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="hidden md:flex items-center ml-3 px-3 py-1.5 bg-slate-900/50 rounded-lg border border-slate-800/50 max-w-sm lg:max-w-md overflow-hidden animate-in fade-in slide-in-from-left-2">
        <span className="text-amber-500 mr-2 text-[10px] shrink-0">▶</span>
        <span className="text-xs font-mono text-slate-400 whitespace-nowrap truncate min-w-0">
            {displayedText}
            <span className="animate-pulse text-amber-500 font-bold ml-0.5">_</span>
        </span>
    </div>
  );
};

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
        
        {/* Left: Day Indicator & Journal & Ticker */}
        <div className="flex items-center space-x-3 flex-1 min-w-0 mr-4">
             <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shrink-0">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-sm tracking-wide">Day {day}</span>
            </div>

            <button 
                onClick={actions.toggleJournal}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 p-1.5 rounded-lg border border-slate-700 transition-colors shrink-0"
                title="Open Journal"
            >
                <BookOpen className="w-4 h-4" />
            </button>

            {/* Log Ticker (Desktop Only) */}
            <LogTicker message={state.logs[0] || ''} />
        </div>

        {/* Right: Resources & Actions */}
        <div className="flex items-center space-x-4 shrink-0">
          
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

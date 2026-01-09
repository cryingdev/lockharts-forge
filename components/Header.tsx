
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Coins, Zap, Calendar, BedDouble, BookOpen, Settings } from 'lucide-react';

interface HeaderProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
    onSettingsClick: () => void;
}

const LogTicker = ({ message }: { message: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!message) {
      setDisplayedText('The forge is quiet...');
      return;
    }
    
    setDisplayedText('');
    let index = 0;
    const speed = 25;
    const timer = setInterval(() => {
      if (index < message.length) {
        setDisplayedText(message.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [message]);

  return (
    <div className="flex items-center min-w-0 w-full overflow-hidden h-full">
        <span className="text-amber-600 mr-1.5 md:mr-2 text-[10px] shrink-0 animate-pulse">»</span>
        <span className="text-[10px] md:text-xs font-mono text-stone-400 whitespace-nowrap truncate w-full text-left tracking-tight">
            {displayedText}
            <span className="animate-pulse text-amber-500 font-bold ml-0.5">_</span>
        </span>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onSettingsClick }) => {
  const { state, actions } = useGame();
  const { gold, energy, maxEnergy, day } = state.stats;
  const { uiEffects, settings } = state;

  return (
    <header className="w-full bg-stone-950 border-b border-stone-800 shadow-[0_4px_20px_rgba(0,0,0,0.5)] shrink-0 z-20 flex flex-col">
      
      {/* Top Line: Stats and System Buttons */}
      <div className="w-full flex items-center justify-between p-1.5 md:p-3 px-2 md:px-4 gap-2">
        
        {/* Left: Day info */}
        <div className="flex items-center space-x-1 md:space-x-2 bg-stone-900 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-stone-800 shrink-0 shadow-inner group">
            <Calendar className="w-3 h-3 md:w-4 md:h-4 text-stone-500 group-hover:text-amber-500 transition-colors" />
            <span className="font-black text-[10px] md:text-sm tracking-widest uppercase font-serif">D{day}</span>
        </div>

        {/* Right: Stats & System */}
        <div className="flex items-center space-x-1.5 md:space-x-4 shrink-0">
          {/* Energy Bar */}
          <div className={`flex flex-col w-12 md:w-28 p-0.5 rounded-lg transition-all ease-out ${
              uiEffects.energyHighlight 
              ? 'ring-2 ring-yellow-400 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.4)] bg-amber-400/10 z-30 animate-shake-hard' 
              : 'ring-0 ring-transparent duration-[2000ms] scale-100 bg-transparent z-10'
          }`}>
            <div className="flex justify-between items-center text-[6px] md:text-[9px] mb-0.5 text-stone-400 uppercase tracking-widest font-black">
              <Zap className={`w-2 h-2 md:w-3 md:h-3 transition-all ${
                  uiEffects.energyHighlight ? 'text-yellow-300 scale-125' : 'text-blue-500'
              }`} /> 
              <span className="font-mono">{energy}</span>
            </div>
            <div className="w-full bg-stone-900 rounded-full h-1 md:h-1.5 border border-stone-800 shadow-inner overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${energy < 20 ? 'bg-red-500' : 'bg-blue-600'} ${uiEffects.energyHighlight ? 'brightness-150' : ''}`} 
                style={{ width: `${(energy / maxEnergy) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Gold Display */}
          <div className="flex items-center space-x-1 md:space-x-2 bg-stone-900 px-1.5 md:px-3 py-1 md:py-1.5 rounded-lg border border-stone-800 min-w-[50px] md:min-w-[90px] justify-end shadow-inner">
            <span className="font-mono text-[10px] md:text-lg text-amber-500 font-black tracking-tighter">
                {gold >= 10000 ? `${(gold/1000).toFixed(1)}k` : gold.toLocaleString()}
            </span>
            <Coins className="w-2.5 h-2.5 md:w-4 md:h-4 text-amber-600" />
          </div>

          {/* Rest Button */}
          <button
            onClick={actions.rest}
            className="flex items-center space-x-1 md:space-x-2 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-indigo-900/30 transition-all shadow-lg active:scale-95"
            title="End the Day"
          >
            <BedDouble className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-[8px] md:text-xs font-black hidden xs:inline uppercase tracking-widest font-serif italic">Rest</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="p-1 md:p-2 text-stone-500 hover:text-stone-200 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-lg transition-all shadow-lg active:rotate-90 duration-300"
            title="System Settings"
          >
            <Settings className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Line: Log Ticker / Journal Button (Conditional based on settings) */}
      {settings.showLogTicker && (
          <div className="w-full bg-black/20 px-2 pb-1.5 pt-0.5 md:pb-2 md:pt-1">
              <button 
                  onClick={actions.toggleJournal}
                  className="w-full flex items-center gap-2 md:gap-3 px-3 py-1 bg-stone-900/40 hover:bg-stone-900 rounded-md md:rounded-lg border border-stone-800/30 hover:border-stone-700 transition-all group text-left h-6 md:h-8"
                  title="Open Forge Ledger"
              >
                  <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-stone-600 group-hover:text-amber-400 shrink-0 transition-colors" />
                  <div className="flex-1 min-w-0 h-full">
                      <LogTicker message={state.logs[0] || ''} />
                  </div>
              </button>
          </div>
      )}
    </header>
  );
};

export default Header;

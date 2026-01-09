import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Coins, Zap, Calendar, BedDouble, BookOpen, Settings, MessageSquare } from 'lucide-react';

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
        <span className="text-amber-600 mr-2 text-[10px] shrink-0 animate-pulse">»</span>
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
  const { uiEffects } = state;

  return (
    <header className="w-full bg-stone-950 border-b border-stone-800 p-2 md:p-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)] shrink-0 z-20">
      <div className="w-full flex items-center justify-between text-stone-100 gap-2 md:gap-4 px-1 md:px-2">
        
        {/* Left: Date info */}
        <div className="flex items-center space-x-1.5 md:space-x-2 bg-stone-900 px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl border border-stone-800 shrink-0 shadow-inner group">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-500 group-hover:text-amber-500 transition-colors" />
            <span className="font-black text-xs md:text-sm tracking-widest uppercase font-serif">Day {day}</span>
        </div>

        {/* Center: Flexible Journal/Ticker */}
        <button 
            onClick={actions.toggleJournal}
            className="flex-1 min-w-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-black/40 hover:bg-stone-900 rounded-xl border border-stone-800/50 hover:border-stone-700 transition-all group text-left overflow-hidden h-9 md:h-11"
            title="Open Forge Ledger"
        >
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-stone-600 group-hover:text-amber-400 shrink-0 transition-colors" />
            <div className="hidden xs:block flex-1 min-w-0 h-full">
                <LogTicker message={state.logs[0] || ''} />
            </div>
            <div className="xs:hidden flex items-center gap-1">
                <span className="text-[9px] text-stone-500 font-black uppercase tracking-tighter">Logs</span>
                {state.logs.length > 0 && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>}
            </div>
        </button>

        {/* Right: Stats & System */}
        <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
          {/* Energy Bar */}
          <div className={`flex flex-col w-20 md:w-32 p-1 rounded-lg transition-all ease-out ${
              uiEffects.energyHighlight 
              ? 'ring-2 ring-yellow-400 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.4)] bg-amber-400/10 z-30 animate-shake-hard' 
              : 'ring-0 ring-transparent duration-[2000ms] scale-100 bg-transparent z-10'
          }`}>
            <div className="flex justify-between items-center text-[8px] md:text-[10px] mb-1 text-stone-400 uppercase tracking-widest font-black">
              <Zap className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-all ${
                  uiEffects.energyHighlight ? 'text-yellow-300 scale-125' : 'text-blue-500'
              }`} /> 
              <span className="font-mono">{energy}/{maxEnergy}</span>
            </div>
            <div className="w-full bg-stone-900 rounded-full h-1.5 border border-stone-800 shadow-inner overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${energy < 20 ? 'bg-red-500' : 'bg-blue-600'} ${uiEffects.energyHighlight ? 'brightness-150' : ''}`} 
                style={{ width: `${(energy / maxEnergy) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Gold Display */}
          <div className="flex items-center space-x-1.5 md:space-x-2 bg-stone-900 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-stone-800 min-w-[75px] md:min-w-[110px] justify-end shadow-inner">
            <span className="font-mono text-sm md:text-xl text-amber-500 font-black tracking-tighter">{gold.toLocaleString()}</span>
            <Coins className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
          </div>

          {/* Rest Button */}
          <button
            onClick={actions.rest}
            className="flex items-center space-x-1.5 md:space-x-2 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl border border-indigo-900/30 transition-all shadow-lg active:scale-95"
            title="End the Day"
          >
            <BedDouble className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm font-black hidden sm:inline uppercase tracking-widest font-serif italic">Rest</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="p-1.5 md:p-2.5 text-stone-500 hover:text-stone-200 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition-all shadow-lg active:rotate-90 duration-300"
            title="System Settings"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
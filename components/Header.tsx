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
    setDisplayedText('');
    if (!message) return;
    let index = 0;
    const speed = 20;
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
    <div className="flex items-center min-w-0 w-full overflow-hidden">
        <span className="text-amber-500 mr-2 text-[10px] shrink-0">▶</span>
        <span className="text-[10px] md:text-xs font-mono text-slate-400 whitespace-nowrap truncate w-full text-left">
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
    <header className="w-full bg-slate-900 border-b border-slate-700 p-2 md:p-3 shadow-lg shrink-0 z-20">
      <div className="max-w-7xl mx-auto flex justify-between items-center text-slate-100 gap-2 md:gap-4">
        
        <div className="flex items-center flex-1 min-w-0 gap-2 md:gap-3">
             <div className="flex items-center space-x-1 md:space-x-2 bg-slate-800 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-slate-700 shrink-0">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                <span className="font-bold text-xs md:text-sm tracking-wide">Day {day}</span>
            </div>

            <button 
                onClick={actions.toggleJournal}
                className="flex-1 flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1 md:py-1.5 bg-slate-900/50 hover:bg-slate-800 rounded-lg border border-slate-800/50 hover:border-slate-600 transition-all group min-w-0 text-left"
                title="Open Journal / View Logs"
            >
                <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-slate-500 group-hover:text-amber-400 shrink-0 transition-colors" />
                <div className="hidden sm:block flex-1 min-w-0">
                    <LogTicker message={state.logs[0] || ''} />
                </div>
                <span className="sm:hidden text-[10px] text-slate-500 font-mono truncate">
                    {state.logs[0] ? 'Log...' : 'Journal'}
                </span>
            </button>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
          <div className={`flex flex-col w-20 md:w-28 p-1 rounded-md transition-all ease-out ${
              uiEffects.energyHighlight 
              ? 'ring-2 ring-yellow-300 scale-105 md:scale-110 shadow-[0_0_15px_rgba(253,224,71,0.8)] bg-yellow-400/20 duration-150 z-30 animate-shake-hard' 
              : 'ring-0 ring-transparent duration-[3000ms] scale-100 bg-transparent z-10'
          }`}>
            <div className="flex justify-between items-center text-[8px] md:text-[10px] mb-0.5 md:mb-1 text-slate-300 uppercase tracking-wider font-bold">
              <Zap className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-all ease-out ${
                  uiEffects.energyHighlight 
                  ? 'text-yellow-200 scale-125 duration-150 drop-shadow-[0_0_8px_rgba(250,204,21,1)]' 
                  : 'text-emerald-400 duration-[3000ms] scale-100 drop-shadow-none'
              }`} /> 
              <span className={`font-mono transition-all ease-out ${
                  uiEffects.energyHighlight 
                  ? 'text-white font-black scale-105 duration-150 drop-shadow-[0_0_10px_rgba(255,255,255,1)]' 
                  : 'text-slate-300 duration-[3000ms] scale-100'
              }`}>
                {energy}/{maxEnergy}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 md:h-1.5 border border-slate-700 shadow-inner overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${energy < 20 ? 'bg-red-500' : 'bg-emerald-500'} ${uiEffects.energyHighlight ? 'brightness-200 saturate-200' : ''}`} 
                style={{ width: `${(energy / maxEnergy) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center space-x-1 md:space-x-2 bg-slate-800 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-slate-700 min-w-[70px] md:min-w-[100px] justify-end">
            <span className="font-mono text-sm md:text-lg text-amber-400 font-bold">{gold}</span>
            <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
          </div>

          <button
            onClick={actions.rest}
            className="flex items-center space-x-1 md:space-x-2 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-indigo-700/50 transition-colors"
            title="End the Day"
          >
            <BedDouble className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-[10px] md:text-sm font-bold hidden xs:inline">Rest</span>
          </button>

          <button
            onClick={onSettingsClick}
            className="p-1.5 md:p-2 text-stone-400 hover:text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-all"
            title="System Menu"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
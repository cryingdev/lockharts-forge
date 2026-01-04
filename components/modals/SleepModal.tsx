
import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { Moon, BedDouble, ChevronRight, X, TrendingUp, Users } from 'lucide-react';
import { calculateDailyWage } from '../../config/contract-config';

const SleepModal = () => {
  const { state, actions } = useGame();
  const { gold, incomeToday } = state.stats;

  const { totalWages, hiredCount } = useMemo(() => {
      const hired = state.knownMercenaries.filter(m => 
        ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status)
      );
      const wages = hired.reduce((acc, merc) => acc + calculateDailyWage(merc.level, merc.job), 0);
      return { totalWages: wages, hiredCount: hired.length };
  }, [state.knownMercenaries]);

  const netChange = incomeToday - totalWages;
  const projectedBalance = gold - totalWages;
  const isDebt = projectedBalance < 0;

  if (!state.showSleepModal) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-1000 overflow-hidden">
      <div className="relative z-10 p-5 md:p-10 max-w-md w-full max-h-[95vh] flex flex-col items-center text-center animate-in zoom-in-95 duration-700 overflow-y-auto custom-scrollbar">
        
        {/* Close Button - Top Left */}
        <button 
            onClick={actions.closeRest}
            className="absolute top-4 left-4 p-2 bg-stone-900/50 hover:bg-stone-800 rounded-full text-stone-500 hover:text-stone-300 transition-colors z-20 border border-stone-800"
            title="Cancel"
        >
            <X className="w-5 h-5" />
        </button>

        {/* Moon Icon - hidden on extremely short screens to save space */}
        <div className="relative mb-4 md:mb-6 shrink-0 hidden xs:block">
            <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full"></div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-950 rounded-full flex items-center justify-center border-2 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)] relative z-10">
                <Moon className="w-8 h-8 md:w-10 md:h-10 text-indigo-300" />
            </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-indigo-100 font-serif mb-1 md:mb-2 tracking-wide shrink-0">End of Day Report</h2>
        <p className="text-indigo-200/60 mb-6 md:mb-8 text-xs md:text-sm font-light shrink-0">
            Review your finances before resting.
        </p>

        {/* Financial Summary Card */}
        <div className="w-full bg-indigo-950/50 border border-indigo-800/50 rounded-xl p-4 mb-6 md:mb-8 space-y-3 shadow-inner shrink-0">
            <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-indigo-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Income Today
                </span>
                <span className="font-mono text-emerald-400 font-bold">+{incomeToday} G</span>
            </div>

            <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-indigo-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" />
                    Daily Wages ({hiredCount})
                </span>
                <span className="font-mono text-red-400 font-bold">-{totalWages} G</span>
            </div>

            <div className="w-full h-px bg-indigo-800/50 my-1"></div>

            <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-indigo-300">Net Profit</span>
                <span className={`font-mono font-bold ${netChange >= 0 ? 'text-indigo-100' : 'text-red-300'}`}>
                    {netChange > 0 ? '+' : ''}{netChange} G
                </span>
            </div>
            
            <div className="w-full h-px bg-indigo-800/50 my-1"></div>

            <div className="flex justify-between items-center pt-1">
                <span className="text-indigo-100 font-bold text-sm md:text-base">Projected Balance</span>
                <div className="flex flex-col items-end">
                    <span className={`font-mono font-bold text-base md:text-lg ${isDebt ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
                        {projectedBalance} G
                    </span>
                    {isDebt && <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Debt!</span>}
                </div>
            </div>
        </div>

        <button 
            onClick={actions.confirmSleep}
            className="group w-full py-3 md:py-4 bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-700/50 hover:border-indigo-500 text-indigo-100 font-bold rounded-xl shadow-lg hover:shadow-indigo-900/40 transition-all flex items-center justify-center gap-3 shrink-0"
        >
            <BedDouble className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 group-hover:text-indigo-200 transition-colors" />
            <span className="text-base md:text-lg">Process Payment & Sleep</span>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default SleepModal;

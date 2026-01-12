
import React, { useMemo, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { Moon, BedDouble, ChevronRight, X, Coins, ShoppingBag, Users, Map } from 'lucide-react';
import { calculateDailyWage } from '../../config/contract-config';

const SleepModal = () => {
  const { state, actions } = useGame();
  const { gold, dailyFinancials, day } = state.stats;

  // 1. 모든 훅은 조건부 반환문(Early Return)보다 앞에 정의되어야 합니다.
  const initialDayRef = useRef(day);

  const { totalWages } = useMemo(() => {
      const hired = state.knownMercenaries.filter(m => ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status));
      const wages = hired.reduce((acc, merc) => acc + calculateDailyWage(merc.level, merc.job), 0);
      return { totalWages: wages };
  }, [state.knownMercenaries]);

  // 2. 훅 정의가 끝난 후 조건부 반환을 수행합니다.
  if (!state.showSleepModal) {
      initialDayRef.current = day; // 닫혀있을 때는 현재 날짜 동기화
      return null;
  }

  const isTransitioning = day > initialDayRef.current;

  const totalIncome = dailyFinancials.incomeShop + dailyFinancials.incomeInventory + dailyFinancials.incomeDungeon + dailyFinancials.incomeRepair;
  const totalExpenses = dailyFinancials.expenseMarket + totalWages + dailyFinancials.expenseScout;
  const netChange = totalIncome - totalExpenses;

  const FinancialRow = ({ label, value, icon: Icon, isNegative = false, isSub = false }: { label: string, value: number, icon: any, isNegative?: boolean, isSub?: boolean }) => (
    <div className={`flex justify-between items-center gap-8 text-[10px] md:text-sm ${isSub ? 'pl-6 border-l border-indigo-900/30 ml-2 py-0.5' : 'py-1'}`}>
        <span className={`flex items-center gap-2 ${isSub ? 'text-indigo-400' : 'text-indigo-200 font-bold'}`}>
            <Icon className={`w-3 h-3 ${isSub ? 'opacity-40' : isNegative ? 'text-red-400' : 'text-emerald-400'}`} />
            {label}
        </span>
        <span className={`font-mono font-black shrink-0 ${isNegative ? 'text-red-500' : 'text-emerald-400'}`}>
            {isNegative ? '-' : '+'}{value} G
        </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-md px-[10%] py-[15%] animate-in fade-in duration-700 overflow-hidden">
      <div className={`relative w-fit max-w-[500px] h-fit max-h-full min-h-[200px] min-w-[280px] bg-indigo-950/20 border-2 border-indigo-500/30 rounded-3xl shadow-[0_0_60px_rgba(55,48,163,0.2)] flex flex-col overflow-hidden transition-all duration-300 mx-auto ${isTransitioning ? 'opacity-0 scale-95 pointer-events-none' : 'animate-in zoom-in-95 duration-500'}`}>
        
        {/* Header */}
        <div className="bg-indigo-950/40 p-5 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-900 rounded-2xl flex items-center justify-center border border-indigo-500/50 shadow-lg">
                    <Moon className="w-5 h-5 text-indigo-300" />
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-indigo-100 font-serif tracking-wide uppercase">End of Day</h2>
            </div>
            <button onClick={actions.closeRest} className="p-2 hover:bg-indigo-900 rounded-full text-indigo-400 transition-colors ml-4"><X className="w-6 h-6" /></button>
        </div>

        {/* Content - Summary */}
        <div className="flex-1 p-5 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
            <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-2xl p-5 md:p-7 space-y-4">
                <div className="space-y-1">
                    <h3 className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Revenue Streams</h3>
                    <FinancialRow label="Shop Sales" value={dailyFinancials.incomeShop} icon={Coins} isSub />
                    <FinancialRow label="Dungeon Rewards" value={dailyFinancials.incomeDungeon} icon={Map} isSub />
                </div>
                <div className="space-y-1">
                    <h3 className="text-[10px] md:text-xs font-black text-red-500 uppercase tracking-widest mb-2">Daily Costs</h3>
                    <FinancialRow label="Market Spending" value={dailyFinancials.expenseMarket} icon={ShoppingBag} isNegative isSub />
                    <FinancialRow label="Mercenary Wages" value={totalWages} icon={Users} isNegative isSub />
                </div>
                <div className="pt-4 border-t border-indigo-500/20 flex justify-between items-center gap-8">
                    <span className="text-xs md:text-sm font-black text-indigo-200 uppercase tracking-widest">Net Profit</span>
                    <span className={`text-lg md:text-2xl font-mono font-black shrink-0 ${netChange >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                        {netChange > 0 ? '+' : ''}{netChange} G
                    </span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-5 md:p-7 bg-indigo-950/40 border-t border-indigo-500/20 shrink-0">
            <button 
                onClick={actions.confirmSleep}
                className="w-full py-3.5 md:py-5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl md:rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 border-b-4 border-amber-800 group text-[11px] md:text-base uppercase tracking-[0.2em]"
            >
                <BedDouble className="w-5 h-5 md:w-7 md:h-7 text-amber-100 group-hover:animate-bounce" />
                <span className="font-serif italic">Rest for the Day</span>
                <ChevronRight className="w-4 h-4 md:w-6 md:h-6 opacity-50 hidden xs:block" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default SleepModal;

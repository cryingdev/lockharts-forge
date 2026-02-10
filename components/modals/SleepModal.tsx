
import React, { useMemo, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { Moon, BedDouble, ChevronRight, X, Coins, ShoppingBag, Users, Map } from 'lucide-react';
import { calculateDailyWage } from '../../config/contract-config';
import { UI_MODAL_LAYOUT } from '../../config/ui-config';
import { SfxButton } from '../common/ui/SfxButton';

const SleepModal = () => {
  const { state, actions } = useGame();
  const { dailyFinancials, day } = state.stats;

  const initialDayRef = useRef(day);

  const { totalWages } = useMemo(() => {
      const hired = state.knownMercenaries.filter(m => ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status));
      const wages = hired.reduce((acc, merc) => acc + calculateDailyWage(merc.level, merc.job), 0);
      return { totalWages: wages };
  }, [state.knownMercenaries]);

  if (!state.showSleepModal) {
      initialDayRef.current = day; 
      return null;
  }

  const isTransitioning = day > initialDayRef.current;

  const totalIncome = dailyFinancials.incomeShop + dailyFinancials.incomeInventory + dailyFinancials.incomeDungeon + dailyFinancials.incomeRepair;
  const totalExpenses = dailyFinancials.expenseMarket + totalWages + dailyFinancials.expenseScout;
  const netChange = totalIncome - totalExpenses;

  const FinancialRow = ({ label, value, icon: Icon, isNegative = false, isSub = false }: { label: string, value: number, icon: any, isNegative?: boolean, isSub?: boolean }) => (
    <div className={`flex justify-between items-center gap-4 text-[9px] md:text-sm ${isSub ? 'pl-4 md:pl-6 border-l border-indigo-900/30 ml-1.5 md:ml-2 py-0.5' : 'py-1'}`}>
        <span className={`flex items-center gap-1.5 md:gap-2 ${isSub ? 'text-indigo-400' : 'text-indigo-200 font-bold'}`}>
            <Icon className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${isSub ? 'opacity-40' : isNegative ? 'text-red-400' : 'text-emerald-400'}`} />
            {label}
        </span>
        <span className={`font-mono font-black shrink-0 ${isNegative ? 'text-red-500' : 'text-emerald-400'}`}>
            {isNegative ? '-' : '+'}{value} G
        </span>
    </div>
  );

  return (
    <div className={`${UI_MODAL_LAYOUT.OVERLAY} ${UI_MODAL_LAYOUT.Z_INDEX.SLEEP} animate-in fade-in duration-700 bg-black/95`}>
      <div className={`${UI_MODAL_LAYOUT.CONTAINER} border-indigo-500/30 shadow-[0_0_60px_rgba(55,48,163,0.2)] transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95 pointer-events-none' : 'animate-in zoom-in-95 duration-500'}`}>
        
        {/* Header - Height optimized */}
        <div className="bg-indigo-950/40 p-3 md:p-5 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-indigo-900 rounded-xl flex items-center justify-center border border-indigo-500/50 shadow-lg shrink-0">
                    <Moon className="w-4 h-4 md:w-5 md:h-5 text-indigo-300" />
                </div>
                <h2 className="text-base md:text-2xl font-bold text-indigo-100 font-serif tracking-wide uppercase leading-none">End of Day</h2>
            </div>
            <SfxButton onClick={actions.closeRest} className="p-1.5 hover:bg-indigo-900 rounded-full text-indigo-400 transition-colors ml-2"><X className="w-5 h-5 md:w-6 md:h-6" /></SfxButton>
        </div>

        {/* Content - Summary with scrolling */}
        <div className="flex-1 p-3 md:p-6 overflow-y-auto custom-scrollbar space-y-4 md:space-y-6">
            <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4 shadow-inner">
                <div className="space-y-0.5">
                    <h3 className="text-[7px] md:text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 md:mb-2">Revenue Streams</h3>
                    <FinancialRow label="Shop Sales" value={dailyFinancials.incomeShop} icon={Coins} isSub />
                    <FinancialRow label="Dungeon Rewards" value={dailyFinancials.incomeDungeon} icon={Map} isSub />
                </div>
                <div className="space-y-0.5">
                    <h3 className="text-[7px] md:text-[9px] font-black text-red-500 uppercase tracking-widest mb-1.5 md:mb-2">Daily Costs</h3>
                    <FinancialRow label="Market Spending" value={dailyFinancials.expenseMarket} icon={ShoppingBag} isNegative isSub />
                    <FinancialRow label="Mercenary Wages" value={totalWages} icon={Users} isNegative isSub />
                </div>
                <div className="pt-3 md:pt-4 border-t border-indigo-500/20 flex justify-between items-center gap-4">
                    <span className="text-[8px] md:text-xs font-black text-indigo-200 uppercase tracking-widest">Net Profit</span>
                    <span className={`text-base md:text-2xl font-mono font-black shrink-0 ${netChange >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                        {netChange > 0 ? '+' : ''}{netChange} G
                    </span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-3 md:p-5 bg-indigo-950/40 border-t border-indigo-500/20 shrink-0">
            <SfxButton 
                onClick={actions.confirmSleep}
                className="w-full py-2.5 md:py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl md:rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-95 border-b-4 border-amber-800 group text-[10px] md:text-base uppercase tracking-[0.2em]"
            >
                <BedDouble className="w-4 h-4 md:w-6 md:h-6 text-amber-100 group-hover:animate-bounce" />
                <span className="font-serif italic">Rest for the Day</span>
                <ChevronRight className="w-3 h-3 md:w-5 md:h-5 opacity-50 hidden xs:block" />
            </SfxButton>
        </div>
      </div>
    </div>
  );
};

export default SleepModal;

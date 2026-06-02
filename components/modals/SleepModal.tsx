
import React, { useMemo, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { BedDouble, X, Coins, ShoppingBag, Users, Map, BookOpen, Package, Hammer, Search } from 'lucide-react';
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

  const formatGold = (value: number, isExpense = false) => {
    if (value === 0) return '0 G';
    return `${isExpense ? '-' : '+'}${value.toLocaleString()} G`;
  };

  const FinancialRow = ({ label, value, icon: Icon, isExpense = false }: { label: string, value: number, icon: React.ElementType, isExpense?: boolean }) => (
    <div className="flex items-center justify-between gap-3 py-1.5 text-[12px] md:text-sm">
        <span className="flex min-w-0 items-center gap-2 font-bold text-[#3f3327]">
            <Icon className={`h-3.5 w-3.5 shrink-0 md:h-4 md:w-4 ${isExpense ? 'text-red-800/70' : 'text-emerald-900/70'}`} />
            <span className="truncate">{label}</span>
        </span>
        <span className={`shrink-0 font-mono text-[13px] font-black md:text-base ${isExpense ? 'text-red-800' : 'text-emerald-900'}`}>
            {formatGold(value, isExpense)}
        </span>
    </div>
  );

  return (
    <div className={`fixed inset-0 flex items-center justify-center overflow-hidden bg-stone-950/48 px-5 py-6 backdrop-blur-[1px] ${UI_MODAL_LAYOUT.Z_INDEX.SLEEP} animate-in fade-in duration-300`}>
      <div className={`relative flex max-h-[88vh] w-full max-w-[410px] flex-col overflow-hidden border-2 border-[#8a633a] bg-[#ead7ad] text-stone-900 shadow-[0_22px_70px_rgba(0,0,0,0.42)] transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95 pointer-events-none' : 'animate-in zoom-in-95 duration-300'}`}>
        <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_20%_12%,rgba(255,246,213,0.7),transparent_32%),linear-gradient(180deg,rgba(255,248,220,0.42),rgba(142,96,48,0.12))]" />
        <div className="pointer-events-none absolute inset-[7px] border border-[#9a7040]/45" />

        <div className="relative flex items-start justify-between gap-3 border-b border-[#8a633a]/40 px-5 pb-4 pt-5 md:px-6 md:pt-6">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#684622] bg-[#3a2819] text-amber-100 shadow-[3px_3px_0_rgba(83,52,24,0.24)] md:h-11 md:w-11">
                    <BookOpen className="h-5 w-5 md:h-5 md:w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6d5539] md:text-[10px]">Forge Ledger</p>
                    <h2 className="mt-1 font-serif text-[24px] font-black uppercase leading-none tracking-[0.02em] text-[#21170f] md:text-[28px]">End of Day</h2>
                    <p className="mt-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#6d5539] md:text-xs">Day {initialDayRef.current}</p>
                </div>
            </div>
            <SfxButton onClick={actions.closeRest} className="shrink-0 p-1.5 text-[#5d4730] transition-colors hover:bg-[#3a2819] hover:text-amber-100">
                <X className="h-5 w-5 md:h-6 md:w-6" />
            </SfxButton>
        </div>

        <div className="relative flex-1 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
            <div className="border-b border-[#8a633a]/35 pb-3">
                <p className="mb-1.5 font-serif text-base font-black uppercase tracking-[0.08em] text-emerald-950 md:text-lg">Revenue</p>
                <FinancialRow label="Shop Sales" value={dailyFinancials.incomeShop} icon={Coins} />
                <FinancialRow label="Inventory Sales" value={dailyFinancials.incomeInventory} icon={Package} />
                <FinancialRow label="Dungeon Rewards" value={dailyFinancials.incomeDungeon} icon={Map} />
                <FinancialRow label="Repair Income" value={dailyFinancials.incomeRepair} icon={Hammer} />
            </div>

            <div className="border-b border-[#8a633a]/35 py-3">
                <p className="mb-1.5 font-serif text-base font-black uppercase tracking-[0.08em] text-red-950 md:text-lg">Costs</p>
                <FinancialRow label="Market Spending" value={dailyFinancials.expenseMarket} icon={ShoppingBag} isExpense />
                <FinancialRow label="Mercenary Wages" value={totalWages} icon={Users} isExpense />
                <FinancialRow label="Scout Fees" value={dailyFinancials.expenseScout} icon={Search} isExpense />
            </div>

            <div className="flex items-end justify-between gap-4 py-4">
                <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#6d5539] md:text-[10px]">Total Income</p>
                    <p className="mt-1 font-mono text-base font-black text-emerald-900 md:text-lg">{formatGold(totalIncome)}</p>
                </div>
                <div className="text-right">
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#6d5539] md:text-[10px]">Net Profit</p>
                    <p className={`mt-1 font-mono text-2xl font-black leading-none md:text-3xl ${netChange >= 0 ? 'text-emerald-900' : 'text-red-800'}`}>
                        {netChange === 0 ? '0' : `${netChange > 0 ? '+' : ''}${netChange.toLocaleString()}`} G
                    </p>
                </div>
            </div>
        </div>

        <div className="relative border-t border-[#8a633a]/40 px-5 py-4 md:px-6">
            <SfxButton 
                onClick={actions.confirmSleep}
                className="flex w-full items-center justify-center gap-2.5 border border-[#70451d] bg-[#9b541f] px-4 py-3 text-[12px] font-black uppercase tracking-[0.13em] text-amber-50 shadow-[0_3px_0_#5a2f11,0_8px_14px_rgba(83,45,18,0.18)] transition-all hover:bg-[#ab6226] active:translate-y-0.5 active:shadow-[0_1px_0_#5a2f11,0_5px_10px_rgba(83,45,18,0.16)] md:text-sm"
            >
                <BedDouble className="h-5 w-5 text-amber-100 md:h-6 md:w-6" />
                <span className="font-serif">Rest for the Day</span>
            </SfxButton>
        </div>
      </div>
    </div>
  );
};

export default SleepModal;

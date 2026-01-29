
import React from 'react';
import { useGame } from '../../context/GameContext';
import { User, XCircle, CheckCircle, Flame, AlertCircle } from 'lucide-react';
import { SfxButton } from '../common/ui/SfxButton';

const EventModal = () => {
  const { state, actions } = useGame();
  const { activeEvent, inventory, stats } = state;

  if (!activeEvent) return null;

  const canAfford = (option: typeof activeEvent.options[0]) => {
    if (!option.cost) return true;
    if (option.cost.gold && stats.gold < option.cost.gold) return false;
    if (option.cost.items) {
      for (const costItem of option.cost.items) {
        const invItem = inventory.find(i => i.id === costItem.id);
        if (!invItem || invItem.quantity < costItem.count) return false;
      }
    }
    return true;
  };

  const getIcon = () => {
      const title = activeEvent.title.toLowerCase();
      if (title.includes('forge') || title.includes('furnace')) return <Flame className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />;
      if (title.includes('warning') || title.includes('attention')) return <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />;
      return <User className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />;
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-md px-[10%] py-[15%] overflow-hidden">
      <div className="relative w-fit max-w-[500px] h-fit max-h-full min-h-[200px] min-w-[280px] bg-stone-900 border-2 border-amber-600/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 mx-auto">
        
        {/* Header */}
        <div className="bg-stone-850 p-4 md:p-6 border-b border-stone-800 flex items-center space-x-4 shrink-0">
          <div className="bg-amber-900/30 p-2 rounded-xl border border-amber-700/30 shrink-0">
            {getIcon()}
          </div>
          <h2 className="text-sm md:text-xl font-serif text-amber-100 font-black tracking-tight uppercase leading-none truncate pr-4">{activeEvent.title}</h2>
        </div>

        {/* Body */}
        <div className="p-5 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <p className="text-stone-300 text-xs md:text-lg leading-relaxed italic border-l-4 border-stone-700 pl-4">
            "{activeEvent.description}"
          </p>

          <div className="space-y-2 md:space-y-3 pb-2">
            {activeEvent.options.map((option, idx) => {
              const affordable = canAfford(option);
              return (
                <SfxButton
                  key={idx}
                  onClick={() => {
                      if (affordable) {
                          actions.handleEventOption(option.action);
                      }
                  }}
                  disabled={!affordable}
                  className={`w-full text-left p-3 md:p-5 rounded-xl border transition-all flex justify-between items-center group ${
                    affordable 
                      ? 'bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-750 text-stone-100 shadow-xl' 
                      : 'bg-stone-900/50 border-stone-800 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <span className="font-black text-[10px] md:text-sm uppercase tracking-widest mr-4">{option.label}</span>
                  {affordable ? (
                     <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-stone-600 group-hover:text-amber-500 shrink-0" />
                  ) : (
                     <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-900 shrink-0" />
                  )}
                </SfxButton>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-4 py-2 border-t border-stone-800 text-[8px] md:text-[10px] text-stone-600 uppercase font-black tracking-[0.3em] text-right shrink-0">
            Lockhart's Chronicles
        </div>
      </div>
    </div>
  );
};

export default EventModal;

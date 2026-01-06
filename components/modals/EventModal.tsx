
import React from 'react';
import { useGame } from '../../context/GameContext';
import { User, XCircle, CheckCircle, Flame, AlertCircle } from 'lucide-react';

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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-[10%] py-[5%]">
      <div className="bg-stone-900 border-2 border-amber-600/50 rounded-2xl max-w-md w-full max-h-[95dvh] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-stone-850 p-3 md:p-5 border-b border-stone-800 flex items-center space-x-3 shrink-0">
          <div className="bg-amber-900/20 p-1.5 md:p-2.5 rounded-full border border-amber-700/30">
            {getIcon()}
          </div>
          <h2 className="text-lg md:text-xl font-serif text-amber-100 truncate font-black tracking-tight">{activeEvent.title}</h2>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <p className="text-stone-300 text-sm md:text-base leading-relaxed italic border-l-2 border-stone-700 pl-3">
            "{activeEvent.description}"
          </p>

          {/* Options */}
          <div className="space-y-2 md:space-y-3 pb-2">
            {activeEvent.options.map((option, idx) => {
              const affordable = canAfford(option);
              return (
                <button
                  key={idx}
                  onClick={() => affordable && actions.handleEventOption(option.action)}
                  disabled={!affordable}
                  className={`w-full text-left p-3 md:p-4 rounded-xl border transition-all flex justify-between items-center group ${
                    affordable 
                      ? 'bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-750 text-stone-100 shadow-sm' 
                      : 'bg-stone-900/50 border-stone-800 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <span className="font-bold text-xs md:text-sm group-hover:text-amber-400 transition-colors uppercase tracking-wide">{option.label}</span>
                  {affordable ? (
                     <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-stone-600 group-hover:text-amber-500 shrink-0" />
                  ) : (
                     <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-900 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950/50 px-4 py-1.5 border-t border-stone-800/50 text-[8px] md:text-[10px] text-stone-600 uppercase font-black tracking-widest text-right shrink-0">
            Forge Event
        </div>
      </div>
    </div>
  );
};

export default EventModal;

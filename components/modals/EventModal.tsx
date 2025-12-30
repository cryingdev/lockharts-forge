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
      if (title.includes('forge') || title.includes('furnace')) return <Flame className="w-8 h-8 text-amber-500" />;
      if (title.includes('warning') || title.includes('attention')) return <AlertCircle className="w-8 h-8 text-amber-500" />;
      return <User className="w-8 h-8 text-amber-500" />;
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border-2 border-amber-600 rounded-xl max-w-lg w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header - Compact for mobile */}
        <div className="bg-stone-800 p-4 md:p-6 border-b border-stone-700 flex items-center space-x-4 shrink-0">
          <div className="bg-amber-900/30 p-2 md:p-3 rounded-full border border-amber-700">
            {getIcon()}
          </div>
          <h2 className="text-xl md:text-2xl font-serif text-amber-100 truncate">{activeEvent.title}</h2>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <p className="text-stone-300 text-base md:text-lg leading-relaxed italic">
            "{activeEvent.description}"
          </p>

          {/* Options */}
          <div className="space-y-3 pb-2">
            {activeEvent.options.map((option, idx) => {
              const affordable = canAfford(option);
              return (
                <button
                  key={idx}
                  onClick={() => affordable && actions.handleEventOption(option.action)}
                  disabled={!affordable}
                  className={`w-full text-left p-3 md:p-4 rounded-lg border transition-all flex justify-between items-center group ${
                    affordable 
                      ? 'bg-stone-800 border-stone-600 hover:border-amber-500 hover:bg-stone-750 text-stone-100' 
                      : 'bg-stone-900/50 border-stone-800 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <span className="font-medium text-sm md:text-base group-hover:text-amber-400 transition-colors">{option.label}</span>
                  {affordable ? (
                     <CheckCircle className="w-5 h-5 text-stone-500 group-hover:text-amber-500 shrink-0" />
                  ) : (
                     <XCircle className="w-5 h-5 text-red-900 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EventModal;
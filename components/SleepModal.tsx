
import React from 'react';
import { useGame } from '../context/GameContext';
import { Moon, BedDouble, ChevronRight } from 'lucide-react';

const SleepModal = () => {
  const { state, actions } = useGame();

  if (!state.showSleepModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-1000">
      <div className="relative z-10 p-10 max-w-md w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-700">
        
        {/* Moon Icon with Glow */}
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full"></div>
            <div className="w-24 h-24 bg-indigo-950 rounded-full flex items-center justify-center border-2 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)] relative z-10">
                <Moon className="w-12 h-12 text-indigo-300" />
            </div>
        </div>

        <h2 className="text-4xl font-bold text-indigo-100 font-serif mb-4 tracking-wide">The Night Has Come</h2>
        <p className="text-indigo-200/60 mb-10 text-lg font-light leading-relaxed">
            The forge grows cold and the streets are empty.<br/>
            It is time to rest and recover your energy for tomorrow.
        </p>

        <button 
            onClick={actions.confirmSleep}
            className="group w-full py-4 bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-700/50 hover:border-indigo-500 text-indigo-100 font-bold rounded-xl shadow-lg hover:shadow-indigo-900/40 transition-all flex items-center justify-center gap-3"
        >
            <BedDouble className="w-6 h-6 text-indigo-400 group-hover:text-indigo-200 transition-colors" />
            <span className="text-lg">Sleep</span>
            <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="mt-6 text-sm text-indigo-900/40 font-mono uppercase tracking-widest">
            Game Saved Automatically
        </div>
      </div>
    </div>
  );
};

export default SleepModal;

import React, { useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { X, BookOpen, Scroll } from 'lucide-react';

const JournalModal = () => {
    const { state, actions } = useGame();
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!state.showJournal) return null;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 backdrop-blur-md px-[10%] py-[15%] animate-in fade-in duration-200 overflow-hidden">
            <div className="relative w-fit max-w-[600px] h-fit max-h-full min-h-[300px] min-w-[280px] bg-stone-900 border-2 border-stone-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 mx-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-850 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-stone-800 p-2 rounded-xl border border-stone-700 shadow-inner">
                            < BookOpen className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-stone-100 font-serif tracking-widest uppercase">Forge Ledger</h2>
                    </div>
                    <button 
                        onClick={actions.toggleJournal}
                        className="p-2 hover:bg-stone-800 rounded-full text-stone-500 transition-colors ml-4"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body - Logs */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-stone-925 custom-scrollbar min-h-0" ref={scrollRef}>
                    {state.logs.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-stone-700 italic opacity-50 space-y-4">
                            <Scroll className="w-12 h-12" />
                            <p className="text-sm tracking-[0.2em] uppercase font-black">History is blank...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {state.logs.map((log, i) => (
                                <div key={i} className="flex gap-4 md:gap-6 group">
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className={`w-2.5 h-2.5 rounded-full border-2 ${i === 0 ? 'bg-amber-500 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-stone-800 border-stone-700'} mt-1`}></div>
                                        {i !== state.logs.length - 1 && <div className="w-0.5 h-full bg-stone-800/50 my-1"></div>}
                                    </div>
                                    <div className="pb-1 min-w-0 flex-1">
                                        <p className={`text-[10px] md:text-sm leading-relaxed ${i === 0 ? 'text-amber-100 font-bold' : 'text-stone-500 font-medium'}`}>
                                            {log}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-800 bg-stone-950 text-center shrink-0">
                    <span className="text-[10px] text-stone-600 font-mono uppercase tracking-[0.4em]">Chronicles of Day {state.stats.day}</span>
                </div>
            </div>
        </div>
    );
};

export default JournalModal;
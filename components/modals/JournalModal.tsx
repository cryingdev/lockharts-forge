
import React, { useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { X, BookOpen, Scroll } from 'lucide-react';

const JournalModal = () => {
    const { state, actions } = useGame();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to top when opening? Or preserve? Logs order is newest first, so top is correct.
    
    if (!state.showJournal) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl h-[80vh] bg-stone-900 border-2 border-stone-700 rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-850 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-stone-800 p-2 rounded-full border border-stone-700">
                            <BookOpen className="w-5 h-5 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-bold text-stone-200 font-serif tracking-wide">Journal</h2>
                    </div>
                    <button 
                        onClick={actions.toggleJournal}
                        className="p-2 hover:bg-stone-800 rounded-full text-stone-500 hover:text-stone-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Log Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-stone-925" ref={scrollRef}>
                    {state.logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-600 italic opacity-60">
                            <Scroll className="w-12 h-12 mb-4" />
                            <p>No entries yet...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {state.logs.map((log, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-stone-700 group-first:bg-amber-500 mt-2"></div>
                                        {i !== state.logs.length - 1 && <div className="w-0.5 h-full bg-stone-800 my-1"></div>}
                                    </div>
                                    <div className="pb-2">
                                        <p className={`text-sm leading-relaxed ${i === 0 ? 'text-amber-100 font-medium' : 'text-stone-400'}`}>
                                            {log}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-stone-800 bg-stone-850 rounded-b-xl text-center">
                    <span className="text-xs text-stone-500 font-mono">Day {state.stats.day} - {state.stats.gold} Gold</span>
                </div>
            </div>
        </div>
    );
};

export default JournalModal;

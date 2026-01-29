
import React, { useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { X, BookOpen, Scroll, History, Sparkles } from 'lucide-react';
import { SfxButton } from '../common/ui/SfxButton';

const JournalModal = () => {
    const { state, actions } = useGame();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (state.showJournal && scrollRef.current) {
            // 저널 오픈 시 최상단(최신 로그)으로 스크롤
            scrollRef.current.scrollTop = 0;
        }
    }, [state.showJournal]);

    if (!state.showJournal) return null;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 backdrop-blur-md px-[5%] py-[10%] md:px-[10%] md:py-[15%] animate-in fade-in duration-300 overflow-hidden">
            <div className="relative w-full max-w-2xl h-full max-h-[700px] bg-stone-900 border-2 border-stone-700 rounded-[2rem] shadow-[0_30px_90px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 mx-auto">
                
                {/* Decorative Pattern Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {/* Header */}
                <div className="relative flex items-center justify-between p-6 md:p-8 border-b border-stone-800 bg-stone-900/80 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-900/20 p-3 rounded-2xl border border-amber-900/30 shadow-inner">
                            <BookOpen className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-3xl font-black text-stone-100 font-serif tracking-tighter uppercase leading-none">Forge Ledger</h2>
                            <p className="text-[10px] md:text-xs text-stone-500 font-black uppercase tracking-[0.2em] mt-1">Chronicles of the Lockhart Lineage</p>
                        </div>
                    </div>
                    <SfxButton 
                        onClick={actions.toggleJournal}
                        className="p-2.5 bg-stone-800 hover:bg-red-900/40 border border-stone-700 rounded-full text-stone-500 hover:text-red-200 transition-all active:scale-90"
                    >
                        <X className="w-6 h-6" />
                    </SfxButton>
                </div>

                {/* Body - Logs */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-stone-925/50 custom-scrollbar relative" ref={scrollRef}>
                    {state.logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-700 italic space-y-4 opacity-40">
                            <Scroll className="w-16 h-16 mb-2" />
                            <p className="text-lg tracking-[0.3em] uppercase font-black font-serif italic">The ledger remains empty...</p>
                        </div>
                    ) : (
                        <div className="space-y-8 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-amber-600/30 via-stone-800 to-transparent hidden xs:block"></div>

                            {state.logs.map((log, i) => (
                                <div key={i} className="flex gap-4 md:gap-8 group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 30}ms` }}>
                                    <div className="flex flex-col items-center shrink-0 mt-1.5 hidden xs:flex">
                                        <div className={`w-3 h-3 rounded-full border-2 transition-all duration-700 ${
                                            i === 0 
                                            ? 'bg-amber-500 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-110' 
                                            : 'bg-stone-800 border-stone-700 group-hover:border-stone-500'
                                        }`}></div>
                                    </div>
                                    <div className={`pb-2 min-w-0 flex-1 relative ${i === 0 ? 'bg-amber-950/10 p-4 rounded-2xl border border-amber-900/20 shadow-inner' : ''}`}>
                                        {i === 0 && (
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Sparkles className="w-3 h-3 text-amber-500" />
                                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Latest Record</span>
                                            </div>
                                        )}
                                        <p className={`text-xs md:text-lg leading-relaxed font-medium transition-colors ${
                                            i === 0 ? 'text-amber-50' : 'text-stone-400 group-hover:text-stone-200'
                                        }`}>
                                            {log}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                                            <div className="h-px flex-1 bg-stone-800"></div>
                                            <History className="w-3 h-3 text-stone-600" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-stone-800 bg-stone-900 text-center shrink-0">
                    <div className="flex justify-center items-center gap-3">
                        <div className="h-px w-8 md:w-12 bg-stone-800"></div>
                        <span className="text-[10px] md:text-xs text-stone-600 font-mono font-bold uppercase tracking-[0.5em]">
                            Day {state.stats.day} • Entries: {state.logs.length}
                        </span>
                        <div className="h-px w-8 md:w-12 bg-stone-800"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JournalModal;

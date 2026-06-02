
import React, { useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { X, BookOpen, Scroll, History, Sparkles } from 'lucide-react';
import { SfxButton } from '../common/ui/SfxButton';
import { t } from '../../utils/i18n';
import { getForgeName } from '../../utils/gameText';

const JournalModal = () => {
    const { state, actions } = useGame();
    const language = state.settings.language;
    const forgeName = getForgeName(state);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (state.showJournal && scrollRef.current) {
            // 저널 오픈 시 최상단(최신 로그)으로 스크롤
            scrollRef.current.scrollTop = 0;
        }
    }, [state.showJournal]);

    if (!state.showJournal) return null;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-stone-950/48 backdrop-blur-[1px] px-5 py-6 animate-in fade-in duration-300 overflow-hidden">
            <div className="relative flex max-h-[88vh] w-full max-w-[430px] flex-col overflow-hidden border-2 border-[#8a633a] bg-[#ead7ad] text-stone-900 shadow-[0_22px_70px_rgba(0,0,0,0.42)] animate-in zoom-in-95 duration-300 mx-auto">
                <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_20%_12%,rgba(255,246,213,0.7),transparent_32%),linear-gradient(180deg,rgba(255,248,220,0.42),rgba(142,96,48,0.12))]" />
                <div className="pointer-events-none absolute inset-[7px] border border-[#9a7040]/45" />

                {/* Header */}
                <div className="relative flex items-start justify-between gap-3 border-b border-[#8a633a]/40 px-5 pb-4 pt-5 md:px-6 md:pt-6 shrink-0">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#684622] bg-[#3a2819] text-amber-100 shadow-[3px_3px_0_rgba(83,52,24,0.24)] md:h-11 md:w-11">
                            <BookOpen className="h-5 w-5 md:h-5 md:w-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-serif text-[24px] font-black uppercase leading-none tracking-[0.02em] text-[#21170f] md:text-[28px]">{t(language, 'journal.title')}</h2>
                            <p className="mt-1.5 text-[9px] md:text-[10px] text-[#6d5539] font-black uppercase tracking-[0.18em] leading-relaxed">{t(language, 'journal.subtitle', { forgeName })}</p>
                        </div>
                    </div>
                    <SfxButton 
                        onClick={actions.toggleJournal}
                        className="shrink-0 p-1.5 text-[#5d4730] transition-colors hover:bg-[#3a2819] hover:text-amber-100 active:scale-90"
                    >
                        <X className="h-5 w-5 md:h-6 md:w-6" />
                    </SfxButton>
                </div>

                {/* Body - Logs */}
                <div className="relative flex-1 overflow-y-auto px-5 py-4 md:px-6 md:py-5 custom-scrollbar" ref={scrollRef}>
                    {state.logs.length === 0 ? (
                        <div className="flex min-h-[300px] flex-col items-center justify-center text-[#7a5b36] italic space-y-3 opacity-70">
                            <Scroll className="h-12 w-12" />
                            <p className="font-serif text-base tracking-[0.2em] uppercase font-black italic">{t(language, 'journal.empty')}</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {state.logs.map((log, i) => (
                                <div
                                    key={i}
                                    className={`group animate-in slide-in-from-left-4 duration-500 ${
                                        i === 0
                                            ? 'mb-2 border border-[#9a7040]/45 bg-[#fff3cf]/38 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]'
                                            : 'border-b border-[#8a633a]/25 py-3'
                                    }`}
                                    style={{ animationDelay: `${i * 25}ms` }}
                                >
                                    {i === 0 && (
                                        <div className="mb-2 flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                                            <span className="text-[9px] font-black text-amber-800 uppercase tracking-[0.16em]">{t(language, 'journal.latest_record')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <p className={`min-w-0 flex-1 text-[13px] md:text-sm leading-relaxed font-bold transition-colors ${
                                            i === 0 ? 'text-[#21170f]' : 'text-[#4d4032] group-hover:text-[#21170f]'
                                        }`}>
                                            {log}
                                        </p>
                                        <History className="mt-1 h-3.5 w-3.5 shrink-0 text-[#8a633a]/45 group-hover:text-[#8a633a]/75" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="relative border-t border-[#8a633a]/40 px-5 py-3 text-center shrink-0">
                    <div className="flex justify-center items-center gap-2">
                        <div className="h-px w-8 bg-[#8a633a]/35"></div>
                        <span className="text-[9px] md:text-[10px] text-[#6d5539] font-mono font-black uppercase tracking-[0.28em]">
                            {t(language, 'journal.footer', { day: state.stats.day, count: state.logs.length })}
                        </span>
                        <div className="h-px w-8 bg-[#8a633a]/35"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JournalModal;

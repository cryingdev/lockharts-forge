import React, { useEffect, useState } from 'react';
import { BedDouble, Settings } from 'lucide-react';
import { SfxButton } from '../../common/ui/SfxButton';
import { UI_COLORS } from '../../../config/ui-config';
import { getImageUrl } from '../../../utils';
import { t } from '../../../utils/i18n';

interface MainHudProps {
    day: number;
    energy: number;
    maxEnergy: number;
    gold: number;
    energyHighlighted: boolean;
    showLogTicker: boolean;
    latestLog: string;
    language: 'en' | 'ko';
    onRest: () => void;
    onSettingsClick: () => void;
    onToggleJournal: () => void;
}

const LogTicker = ({ message, language }: { message: string; language: 'en' | 'ko' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const targetMessage = message || t(language, 'header.quiet');

    useEffect(() => {
        setCurrentIndex(0);
        let index = 0;
        const speed = 25;
        const timer = setInterval(() => {
            if (index < targetMessage.length) {
                index++;
                setCurrentIndex(index);
            } else {
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [targetMessage]);

    return (
        <div className="flex h-full min-w-0 w-full items-center overflow-hidden">
            <span className="mr-2 shrink-0 animate-pulse text-[12px] text-amber-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.65)] md:mr-2.5 md:text-[13px]">»</span>
            <span className="w-full truncate whitespace-nowrap text-left font-mono text-[12px] font-black tracking-tight text-stone-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.72)] md:text-sm">
                <span>{targetMessage.slice(0, currentIndex)}</span>
                <span className="opacity-0">{targetMessage.slice(currentIndex)}</span>
            </span>
        </div>
    );
};

const hudShellClass = "min-w-0 relative overflow-visible rounded";
const hudDividerClass = "shrink-0 h-7 md:h-8 w-px rounded-full bg-gradient-to-b from-transparent via-amber-900/28 to-transparent";
const hudActionButtonClass = "h-[38px] md:h-[42px] rounded-[7px] border-2 backdrop-blur-lg transition-all active:scale-95 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_12px_rgba(0,0,0,0.2)]";
const getMainImageUrl = (filename: string) => getImageUrl(filename, 'main');
const flagDaySrc = getMainImageUrl('flag_day.png');
const energyIconSrc = getMainImageUrl('icon_energy.png');
const cornerIconSrc = getMainImageUrl('icon_corner.png');
const coinIconSrc = getMainImageUrl('icon_coin.png');
const flagJournalSrc = getMainImageUrl('flag_journal.png');

const hudFrameGradient = `linear-gradient(135deg, ${UI_COLORS.COPPER_DARK} 0%, #E0A15A 18%, ${UI_COLORS.COPPER} 42%, #7A3F1E 68%, #D08A45 86%, #5C2E16 100%)`;

const hudShellStyle: React.CSSProperties = {
    boxShadow: [
        '0 8px 18px rgba(30,41,59,0.13)',
        '0 12px 28px rgba(0,0,0,0.28)',
    ].join(', '),
};

const hudFrameStyle: React.CSSProperties = {
    background: hudFrameGradient,
};

const hudPanelStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(238, 238, 238, 0.2) 0%, rgba(214, 214, 214, 0.2) 54%, rgba(244, 244, 244, 0.2) 100%)',
    boxShadow: [
        'inset 0 1px 0 rgba(255,238,220,0.26)',
        'inset 0 -1px 0 rgba(92,46,22,0.72)',
    ].join(', '),
};

const journalSurfaceStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(244, 232, 197, 0.96) 0%, rgba(222, 202, 153, 0.93) 100%)',
    borderColor: UI_COLORS.GOLD,
    backdropFilter: 'blur(6px) saturate(1.05)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.54), inset 0 -2px 0 rgba(86,55,22,0.22), 0 10px 20px rgba(0,0,0,0.2)',
};

const restButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(52, 44, 31, 0.94) 0%, rgba(25, 22, 18, 0.96) 100%)',
};

const settingsButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(238, 226, 195, 0.76) 0%, rgba(213, 194, 150, 0.56) 100%)',
};

const formatHudGold = (gold: number) => {
    const wholeGold = Math.max(0, Math.floor(gold));
    if (wholeGold < 1000) return wholeGold.toLocaleString();

    const suffix = wholeGold >= 1000000 ? 'M' : 'K';
    const divisor = wholeGold >= 1000000 ? 1000000 : 1000;
    const compactValue = wholeGold / divisor;
    const formatted = compactValue >= 100
        ? Math.floor(compactValue).toString()
        : compactValue.toFixed(1).replace(/\.0$/, '');

    return `${formatted}${suffix}`;
};

const HudCorner = ({ className, rotation }: { className: string; rotation: string }) => (
    <img
        src={cornerIconSrc}
        alt=""
        className={`pointer-events-none absolute z-10 h-[15px] w-auto select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.32)] md:h-[18px] ${className}`}
        style={{ transform: rotation }}
        draggable={false}
        aria-hidden="true"
    />
);

const DayFlag = ({ day }: { day: number }) => (
    <div className="relative z-10 h-full w-[34px] shrink-0 md:w-[40px]" aria-label={`Day ${day}`}>
        <div className="absolute left-[-11px] top-[-7px] h-[82px] w-[60px] md:left-[-13px] md:top-[-7px] md:h-[92px] md:w-[67px]">
        <img
            src={flagDaySrc}
            alt=""
            className="pointer-events-none h-full w-full select-none object-contain drop-shadow-[0_7px_11px_rgba(0,0,0,0.42)]"
            draggable={false}
            aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-[14px] top-[36%] flex -translate-y-1/2 flex-col items-center leading-none md:inset-x-[15px]">
            <span className="font-serif text-[9px] font-black uppercase tracking-[0.15em] text-[#2f2114] [text-shadow:0_1px_0_rgba(255,255,255,0.75),0_2px_3px_rgba(55,35,18,0.45)] md:text-[10px]">Day</span>
            <span className="mt-0.5 font-serif text-[21px] font-black text-[#1c130b] [text-shadow:0_1px_0_rgba(255,255,255,0.78),0_3px_5px_rgba(55,35,18,0.48)] md:text-[25px]">{day}</span>
        </div>
        </div>
    </div>
);

const MainHud: React.FC<MainHudProps> = ({
    day,
    energy,
    maxEnergy,
    gold,
    energyHighlighted,
    showLogTicker,
    latestLog,
    language,
    onRest,
    onSettingsClick,
    onToggleJournal,
}) => (
    <div className="absolute top-3 inset-x-3 md:top-4 md:inset-x-6 z-[60] flex flex-col gap-3 md:gap-4 pointer-events-none">
        <div className={`${hudShellClass} pointer-events-auto h-[56px] md:h-[62px] w-full`} style={hudShellStyle}>
            <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t" style={hudFrameStyle} aria-hidden="true" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-b" style={hudFrameStyle} aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-[2px] left-0 top-[2px] w-[2px]" style={hudFrameStyle} aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-[2px] right-0 top-[2px] w-[2px]" style={hudFrameStyle} aria-hidden="true" />
            <HudCorner className="left-[-1px] top-[-1px]" rotation="none" />
            <HudCorner className="right-[-1px] top-[-1px]" rotation="rotate(90deg)" />
            <HudCorner className="right-[-1px] bottom-[-1px]" rotation="rotate(180deg)" />
            <HudCorner className="left-[1px] bottom-[-2px]" rotation="rotate(270deg)" />

            <div className="absolute inset-[2px] flex items-center gap-1 md:gap-1.5 rounded-sm pl-[17px] pr-3 md:pl-[21px] md:pr-4" style={hudPanelStyle}>
            <span className="pointer-events-none absolute inset-x-1 top-1 h-px bg-white/42" aria-hidden="true" />
            <span className="pointer-events-none absolute inset-x-1 bottom-1 h-px bg-orange-950/28" aria-hidden="true" />

            <DayFlag day={day} />
            <span className={hudDividerClass} aria-hidden="true" />

            <div className="relative min-w-0 flex flex-1 items-center gap-2 md:gap-3">
                <div className={`shrink-0 flex w-[55px] md:w-[138px] items-center gap-1 md:gap-[5px] ${energyHighlighted ? 'animate-shake-hard' : ''}`}>
                    <img
                        src={energyIconSrc}
                        alt=""
                        className={`hidden h-14 w-auto shrink-0 select-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.65)] md:block md:h-16 ${energyHighlighted ? 'brightness-125' : ''}`}
                        draggable={false}
                        aria-hidden="true"
                    />
                    <div className="relative min-w-0 flex-1">
                        <div className="w-full rounded-full h-5 md:h-6 border overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.48),0_1px_0_rgba(255,255,255,0.38)]" style={{ backgroundColor: UI_COLORS.DARK_GREEN, borderColor: UI_COLORS.COPPER }}>
                            <div
                                className="h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(1,50,32,0.45)]"
                                style={{
                                    width: `${(energy / maxEnergy) * 100}%`,
                                    backgroundColor: energy < 20 ? UI_COLORS.MUTED_RED : UI_COLORS.DARK_GREEN,
                                }}
                            />
                        </div>
                        <span className="absolute inset-0 flex items-center justify-center gap-1 font-mono text-[12px] md:text-[14px] font-black tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                            <img
                                src={energyIconSrc}
                                alt=""
                                className="h-5 w-auto select-none md:hidden"
                                draggable={false}
                                aria-hidden="true"
                            />
                            {energy}
                        </span>
                    </div>
                </div>
                <span className={hudDividerClass} aria-hidden="true" />
                <div className="min-w-[96px] flex flex-1 items-center justify-end gap-1 pr-[5px] md:gap-2">
                    <img
                        src={coinIconSrc}
                        alt=""
                        className="h-5 w-auto shrink-0 select-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] md:h-6"
                        draggable={false}
                        aria-hidden="true"
                    />
                    <div className="shrink-0 whitespace-nowrap text-right text-xl md:text-2xl font-serif font-black tracking-wide text-black [text-shadow:0_1px_0_rgba(255,255,255,0.78),0_2px_2px_rgba(74,42,14,0.38),0_4px_7px_rgba(0,0,0,0.28)]">
                        {formatHudGold(gold)}
                    </div>
                </div>
            </div>

            <span className={hudDividerClass} aria-hidden="true" />
            <div className="relative flex items-center gap-2 shrink-0">
                <SfxButton onClick={onRest} className={`${hudActionButtonClass} px-2.5 md:px-3 bg-gradient-to-b from-indigo-800/92 to-indigo-950/96 hover:from-indigo-700/95 hover:to-indigo-900/98 text-amber-100 border-amber-700/48 gap-1.5`} style={{ ...restButtonStyle, borderColor: 'rgba(238, 226, 194, 0.78)' }}>
                    <BedDouble className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="hidden xl:inline font-serif text-[10px] font-black uppercase tracking-[0.16em]">Rest</span>
                </SfxButton>
                <SfxButton onClick={onSettingsClick} className={`${hudActionButtonClass} px-2.5 md:px-3 bg-gradient-to-b from-stone-800/92 to-stone-950/96 hover:from-stone-700/95 hover:to-stone-900/98 text-stone-900 border-amber-800/32 active:rotate-90 duration-300 gap-1.5`} style={{ ...settingsButtonStyle, borderColor: 'rgba(122, 91, 48, 0.58)' }}>
                    <Settings className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="hidden xl:inline font-serif text-[10px] font-black uppercase tracking-[0.16em]">Settings</span>
                </SfxButton>
            </div>
            </div>
        </div>

        {showLogTicker && (
            <SfxButton onClick={onToggleJournal} className="relative w-[calc(100%-16px)] md:w-fit md:max-w-[84%] ml-4 mr-0 md:mx-auto flex items-center gap-3 px-4 py-2 pl-[40px] md:px-5 md:py-2.5 md:pl-[40px] backdrop-blur-xl rounded-[3px] border-2 hover:brightness-105 transition-all group pointer-events-auto shadow-[0_10px_20px_rgba(0,0,0,0.22)] min-h-[44px]" style={journalSurfaceStyle}>
                <img
                    src={flagJournalSrc}
                    alt=""
                    className="pointer-events-none absolute -left-5 top-[-4px] h-[57px] w-auto select-none drop-shadow-[0_7px_12px_rgba(0,0,0,0.36)] md:-left-6 md:h-[57px]"
                    draggable={false}
                    aria-hidden="true"
                />
                <div className="min-w-0"><LogTicker message={latestLog} language={language} /></div>
            </SfxButton>
        )}
    </div>
);

export default React.memo(MainHud);

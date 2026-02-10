
import React from 'react';
// Added missing Lock import as LockIcon
import { Trophy, Timer, CheckCircle, Ban, User, XCircle, AlertTriangle, Skull, AlertCircle, Gamepad2, Lock as LockIcon } from 'lucide-react';
import { SfxButton } from '../../../common/ui/SfxButton';
import { Mercenary } from '../../../../models/Mercenary';
import { MercenaryPortrait } from '../../../common/ui/MercenaryPortrait';

interface SquadActionPanelProps {
    hasActiveMission: boolean;
    isOngoingManual: boolean;
    currentExpedition: any;
    timeLeft: string;
    party: string[];
    maxPartySize: number;
    hiredMercs: Mercenary[];
    failedMercs: string[];
    lowHpMercs: string[];
    isFloorCleared: boolean;
    onClaim: () => void;
    onRecall: () => void;
    onToggleMercenary: (id: string) => void;
    onOpenPicker: () => void;
    onStartAuto: () => void;
    onStartManual: () => void;
}

export const SquadActionPanel: React.FC<SquadActionPanelProps> = ({
    hasActiveMission, isOngoingManual, currentExpedition, timeLeft, party, maxPartySize,
    hiredMercs, failedMercs, lowHpMercs, isFloorCleared, onClaim, onRecall, onToggleMercenary,
    onOpenPicker, onStartAuto, onStartManual
}) => {
    if (hasActiveMission) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center animate-in fade-in duration-700">
                <Trophy className={`w-12 h-12 sm:w-28 mb-8 ${currentExpedition?.status === 'COMPLETED' ? 'text-emerald-500 animate-bounce' : 'text-stone-800 opacity-30'}`} />
                <h2 className="text-lg sm:text-4xl font-black text-stone-100 mb-2 uppercase tracking-tighter font-serif italic">Mission Underway</h2>
                <div className="bg-stone-900/80 border-2 border-stone-800 px-10 py-5 rounded-2xl font-mono text-2xl sm:text-4xl font-black text-amber-50 shadow-2xl flex items-center gap-3 mb-8"><Timer className="w-8 h-8 animate-pulse text-amber-600" /><span>{timeLeft || '---'}</span></div>
                <div className="flex gap-3">
                    {currentExpedition?.status === 'COMPLETED' ? (
                        <SfxButton onClick={onClaim} className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-xl flex items-center gap-2 border-b-4 border-emerald-800 active:scale-95 transition-all uppercase tracking-widest"><CheckCircle className="w-5 h-5" /> Secure Loot</SfxButton>
                    ) : (
                        <SfxButton onClick={onRecall} className="px-6 py-3 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded-xl text-red-500 font-black text-xs uppercase tracking-widest transition-all active:scale-95"><Ban className="w-4 h-4 mr-2 inline" /> Recall Squad</SfxButton>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-6 min-h-0 overflow-hidden">
                <div className="w-full max-w-xl space-y-4">
                    <div className="flex justify-between items-end px-1">
                        <h3 className="text-[10px] sm:text-xs font-black text-stone-500 uppercase tracking-widest">Squad Assembly</h3>
                        <span className="text-[9px] font-mono text-stone-600">{party.length} / {maxPartySize}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 md:gap-4">
                        {Array.from({ length: 4 }).map((_, idx) => {
                            const isAvailable = idx < maxPartySize;
                            const mercId = party[idx];
                            const merc = hiredMercs.find(m => m.id === mercId);
                            const hasError = mercId && (failedMercs.includes(mercId) || lowHpMercs.includes(mercId));
                            const isInjured = merc?.status === 'INJURED';
                            const isDead = merc?.status === 'DEAD';

                            if (!isAvailable) return <div key={idx} className="aspect-square bg-stone-950/60 border-2 border-stone-900 rounded-xl md:rounded-2xl flex items-center justify-center grayscale"><Ban className="w-6 md:w-8 text-stone-800" /></div>;

                            return (
                                <div key={idx} className={`aspect-square bg-stone-900 border-2 rounded-xl md:rounded-2xl flex items-center justify-center relative shadow-2xl overflow-hidden group hover:bg-stone-850 transition-all ${hasError || isInjured || isDead ? 'border-red-600 animate-shake-hard' : 'border-dashed border-stone-800'}`}>
                                    {!!merc ? (
                                        <SfxButton onClick={() => onToggleMercenary(merc.id)} className={`w-full h-full flex flex-col items-center justify-center p-1 md:p-2 relative animate-in zoom-in-95 ${(isInjured || isDead) ? 'grayscale' : ''}`}>
                                            <MercenaryPortrait mercenary={merc} className="w-10 h-10 md:w-16 md:h-16 rounded-xl group-hover:scale-110 transition-transform mb-1" />
                                            <div className="flex flex-col items-center leading-tight w-full">
                                                <div className="text-[7px] md:text-xs font-black text-stone-200 truncate w-full text-center">{merc.name.split(' ')[0]}</div>
                                                <div className="text-[5px] md:text-[8px] font-bold text-stone-500 uppercase tracking-tighter">{merc.job} • Lv.{merc.level}</div>
                                            </div>
                                            <div className="absolute top-1 right-1 md:top-2 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity"><XCircle className="w-4 md:w-5 text-red-600" /></div>
                                            {isInjured && <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center"><AlertTriangle className="w-6 md:w-8 text-red-500 mb-0.5" /><span className="text-[6px] md:text-[8px] font-black text-red-200 uppercase">Injured</span></div>}
                                            {isDead && <div className="absolute inset-0 bg-black/80 backdrop-blur-[1px] flex flex-col items-center justify-center"><Skull className="w-6 md:w-8 text-stone-500 mb-0.5" /><span className="text-[6px] md:text-[8px] font-black text-stone-400 uppercase">K.I.A</span></div>}
                                            {hasError && !isInjured && !isDead && <div className="absolute inset-0 bg-red-900/40 backdrop-blur-[1px] flex items-center justify-center"><AlertCircle className="w-6 md:w-8 text-white" /></div>}
                                        </SfxButton>
                                    ) : (
                                        <SfxButton onClick={onOpenPicker} className="w-full h-full flex flex-col items-center justify-center gap-1 md:gap-2 text-stone-700 hover:text-amber-500 hover:bg-stone-850 transition-all"><User className="w-6 h-6 md:w-10 md:h-10 opacity-20" /><span className="text-[6px] md:text-[8px] font-black uppercase tracking-tighter">Add</span></SfxButton>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6 bg-stone-900/50 border-t border-stone-800 shrink-0 mt-auto">
                <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                    <SfxButton onClick={onStartAuto} disabled={party.length === 0 || isOngoingManual || !isFloorCleared} className={`flex flex-col items-center justify-center gap-1 py-2 sm:py-4 rounded-xl border-b-4 transition-all shadow-xl ${party.length > 0 && !isOngoingManual && isFloorCleared ? 'bg-indigo-700 hover:bg-indigo-600 border-indigo-900 text-white' : 'bg-stone-800 text-stone-600 border-stone-900 opacity-60'}`}>
                        <div className="flex items-center gap-2">{!isFloorCleared ? <LockIcon className="w-3.5" /> : <Timer className="w-4" />}<span className="font-black uppercase text-[10px] sm:text-xs">Strategic Deploy</span></div>
                        <span className="text-[7px] sm:text-[8px] font-bold opacity-60 uppercase">{isFloorCleared ? "Auto Expedition" : "Requires Manual Clear"}</span>
                    </SfxButton>
                    <SfxButton onClick={onStartManual} disabled={party.length === 0 && !isOngoingManual} className={`flex flex-col items-center justify-center gap-1 py-2 sm:py-4 rounded-xl border-b-4 transition-all shadow-xl ${party.length > 0 || isOngoingManual ? 'bg-amber-600 hover:bg-amber-500 border-amber-800 text-white' : 'bg-stone-800 text-stone-600 border-stone-900 opacity-60'}`}><div className="flex items-center gap-2"><Gamepad2 className="w-4" /><span className="font-black uppercase text-[10px] sm:text-xs">{isOngoingManual ? 'Resume' : 'Direct Assault'}</span></div><span className="text-[7px] sm:text-[8px] font-bold opacity-60 uppercase">Manual Exploration</span></SfxButton>
                </div>
            </div>
        </div>
    );
};

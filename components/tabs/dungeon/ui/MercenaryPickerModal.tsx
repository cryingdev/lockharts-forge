
import React from 'react';
import { User, X, Search, Sword, Zap, AlertTriangle, Skull } from 'lucide-react';
import { SfxButton } from '../../../common/ui/SfxButton';
import { MercenaryPortrait } from '../../../common/ui/MercenaryPortrait';
import { calculateMercenaryPower } from '../../../../utils/combatLogic';

interface MercenaryPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidates: any[];
    onToggle: (id: string) => void;
    activeExpeditions: any[];
    activeManualDungeon: any;
    staminaCostForFloor: number;
}

export const MercenaryPickerModal: React.FC<MercenaryPickerModalProps> = ({ 
    isOpen, onClose, candidates, onToggle, activeExpeditions, activeManualDungeon, staminaCostForFloor 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-900/30 p-2 rounded-xl border border-amber-700/50"><User className="w-5 h-5 text-amber-500" /></div>
                        <div>
                            <h3 className="text-lg font-black text-stone-100 font-serif uppercase">Select Squad Member</h3>
                            <p className="text-[10px] text-stone-500 font-black uppercase">Assign available units to the squad</p>
                        </div>
                    </div>
                    <SfxButton sfx="switch" onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full text-stone-500 transition-colors"><X className="w-6 h-6" /></SfxButton>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-stone-950/40">
                    {candidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20"><Search className="w-16 h-16 mb-4" /><p className="font-black uppercase text-sm tracking-widest">No candidates available</p></div>
                    ) : (
                        candidates.map(merc => {
                            const isBusy = activeExpeditions.some(e => e.partyIds.includes(merc.id)) || (activeManualDungeon?.partyIds.includes(merc.id));
                            const isInjured = merc.status === 'INJURED';
                            const isDead = merc.status === 'DEAD';
                            const isUnavailable = isBusy || isInjured || isDead;
                            const power = calculateMercenaryPower(merc);
                            const stamina = merc.expeditionEnergy || 0;
                            const hpPer = (merc.currentHp / (merc.maxHp || 1)) * 100;
                            
                            return (
                                <SfxButton key={merc.id} onClick={() => !isUnavailable && onToggle(merc.id)} disabled={isUnavailable} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isUnavailable ? 'bg-stone-950 border-stone-900 opacity-40 grayscale cursor-not-allowed' : 'bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-750 shadow-lg'}`}>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <MercenaryPortrait mercenary={merc} className="w-10 h-10 md:w-14 md:h-14 rounded-lg shrink-0" />
                                        <div className="text-left">
                                            <div className="font-black text-stone-100 text-sm md:text-base truncate">{merc.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{merc.job} • Lv.{merc.level}</span>
                                                {!isDead && <div className="flex items-center gap-1 text-[10px] text-amber-500 font-mono font-bold border-l border-stone-700 pl-2"><Sword className="w-3 h-3" /> {power}</div>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        {isBusy ? <span className="text-[8px] font-black uppercase text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/30">On Mission</span> : 
                                         isInjured ? <div className="flex items-center gap-1 text-[8px] font-black uppercase text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-500/30"><AlertTriangle className="w-2.5 h-2.5" /> Injured</div> : 
                                         isDead ? <div className="flex items-center gap-1 text-[8px] font-black uppercase text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-white/5"><Skull className="w-2.5 h-2.5" /> K.I.A</div> : 
                                         <div className="flex flex-col items-end gap-1"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-stone-950 rounded-full border border-stone-700 overflow-hidden"><div className={`h-full rounded-full ${stamina >= staminaCostForFloor ? 'bg-stone-100' : 'bg-red-600 animate-pulse'}`} style={{ width: `${stamina}%` }} /></div><Zap className={`w-3 h-3 ${stamina >= staminaCostForFloor ? 'text-stone-100' : 'text-red-500 animate-pulse'}`} /></div><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-stone-950 rounded-full border border-stone-700 overflow-hidden"><div className={`h-full rounded-full ${hpPer < 30 ? 'bg-red-500 animate-pulse' : 'bg-red-600'}`} style={{ width: `${hpPer}%` }} /></div><span className="text-[8px] font-black text-stone-500 uppercase">HP</span></div></div>}
                                    </div>
                                </SfxButton>
                            );
                        })
                    )}
                </div>
                <div className="p-4 bg-stone-900 border-t border-stone-800 text-center"><p className="text-[9px] text-stone-600 font-black uppercase tracking-widest">Squad Strength relies on matching equipment and attributes.</p></div>
            </div>
        </div>
    );
};


import React from 'react';
import { ChevronUp, Heart, Sword } from 'lucide-react';
import { Mercenary } from '../../../../models/Mercenary';
import { calculateMercenaryPower } from '../../../../utils/combatLogic';
import { MercenaryPortrait } from '../../../common/ui/MercenaryPortrait';
import { SfxButton } from '../../../common/ui/SfxButton';
import { StaminaBattery } from './StaminaBattery';

interface MercenaryCardProps {
    merc: Mercenary;
    onClick: () => void;
    isHired: boolean;
}

export const MercenaryCard: React.FC<MercenaryCardProps> = ({ merc, onClick, isHired }) => {
    const hasUnallocated = isHired && (merc.bonusStatPoints || 0) > 0;
    const xpPer = (merc.currentXp / (merc.xpToNextLevel || 100)) * 100;
    const cp = calculateMercenaryPower(merc);

    return (
        <SfxButton 
            onClick={onClick}
            className={`group relative bg-stone-900 border-2 text-left ${isHired ? 'border-amber-600/20 hover:border-amber-500/50 shadow-lg' : 'border-stone-800 hover:border-stone-700'} p-2 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${merc.status === 'DEAD' ? 'opacity-40 grayscale pointer-events-none' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="relative">
                    <MercenaryPortrait 
                        mercenary={merc}
                        className={`w-11 h-11 rounded-xl border-2 ${merc.status === 'ON_EXPEDITION' ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : isHired ? 'border-amber-600/40' : 'border-stone-700'} group-hover:scale-105 transition-transform`}
                    />
                    {hasUnallocated && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-stone-900 p-0.5 rounded shadow-lg animate-bounce border border-stone-950 z-10">
                            <ChevronUp className="w-2.5 h-2.5 font-black" />
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 bg-pink-950/20 px-1.5 py-0 rounded-full border border-pink-900/30">
                        <Heart className="w-2.5 h-2.5 fill-pink-500 text-pink-500" />
                        <span className="text-[9px] font-mono text-pink-400 font-black">{merc.affinity}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-950/20 px-1.5 py-0 rounded border border-amber-900/30">
                        <Sword className="w-2.5 h-2.5 text-amber-500" />
                        <span className="text-[9px] font-mono text-amber-400 font-black">{cp}</span>
                    </div>
                    <div className="bg-stone-950 px-1.5 py-0 rounded border border-stone-800 text-[9px] font-mono text-stone-500 font-bold">LV.{merc.level}</div>
                </div>
            </div>

            <div className="space-y-1 mb-2">
                <h3 className="font-black text-xs text-stone-200 truncate leading-tight group-hover:text-amber-200 transition-colors">{merc.name}</h3>
                <div className="flex flex-wrap gap-1">
                    <span className="bg-stone-950/80 px-1 py-0 rounded text-[7px] font-black text-stone-500 uppercase tracking-tighter border border-white/5">{merc.job}</span>
                    <span className={`px-1 py-0 rounded text-[7px] font-black uppercase border leading-none ${
                        merc.status === 'ON_EXPEDITION' ? 'bg-blue-900/40 border-blue-700 text-blue-300' : 
                        merc.status === 'INJURED' ? 'bg-red-900/40 border-red-700 text-red-300' : 
                        merc.status === 'DEAD' ? 'bg-black border-stone-800 text-stone-600' :
                        isHired ? 'bg-amber-900/30 border-amber-700/30 text-amber-400/80' : 'bg-stone-800 border-stone-700 text-stone-500'
                    }`}>{merc.status}</span>
                </div>
            </div>

            {isHired && merc.status !== 'DEAD' && (
                <div className="mb-2"><StaminaBattery value={merc.expeditionEnergy} /></div>
            )}

            <div className="space-y-1 pt-1.5 border-t border-white/5">
                <div className="flex justify-between items-center text-[7px] font-mono text-stone-600 px-0.5"><span>HP</span><span className="font-black">{Math.floor(merc.currentHp)}</span></div>
                <div className="w-full bg-stone-950 h-0.5 rounded-full overflow-hidden"><div className={`h-full bg-red-600/80 transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, (merc.currentHp / (merc.maxHp || 1)) * 100))}%` }} /></div>
                <div className="flex justify-between items-center text-[7px] font-mono text-stone-600 px-0.5"><span>MP</span><span className="font-black">{Math.floor(merc.currentMp)}</span></div>
                <div className="w-full bg-stone-950 h-0.5 rounded-full overflow-hidden"><div className={`h-full bg-blue-600/80 transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, (merc.currentMp / (merc.maxMp || 1)) * 100))}%` }} /></div>
            </div>
            
            <div className="mt-2 flex items-center gap-1 bg-stone-950/30 p-0.5 rounded">
                <span className="text-[6px] font-black text-stone-600 uppercase ml-0.5 shrink-0">EXP</span>
                <div className="flex-1 h-0.5 bg-stone-900 rounded-full overflow-hidden"><div className="h-full bg-indigo-500/40" style={{ width: `${xpPer}%` }} /></div>
            </div>
        </SfxButton>
    );
};

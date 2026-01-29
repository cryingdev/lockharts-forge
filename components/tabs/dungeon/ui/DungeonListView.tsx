
import React from 'react';
import { LayoutList, Lock, ChevronRight, Layers, Skull } from 'lucide-react';
import { DUNGEONS } from '../../../../data/dungeons';
import { getAssetUrl } from '../../../../utils';
import { SfxButton } from '../../../common/ui/SfxButton';

interface DungeonListViewProps {
    tierLevel: number;
    maxFloorReached: Record<string, number>;
    dungeonClearCounts: Record<string, number>;
    onSelect: (id: string) => void;
}

export const DungeonListView: React.FC<DungeonListViewProps> = ({ tierLevel, maxFloorReached, dungeonClearCounts, onSelect }) => {
    return (
        <div className="h-full w-full bg-stone-950 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex justify-between items-end border-b border-stone-800 pb-4 mb-6 shrink-0">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black text-amber-50 font-serif uppercase tracking-tighter">Tactical Deployment</h2>
                    <p className="text-stone-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-1">Select Engagement Zone</p>
                </div>
                <div className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800 text-[10px] font-mono text-stone-500">
                    <LayoutList className="w-3.5 h-3.5" /> Sector Overview
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {DUNGEONS.map(d => {
                    const isLocked = d.tier > tierLevel + 1;
                    const maxReached = maxFloorReached[d.id] || 1;
                    const hasClearedAtLeastOnce = (dungeonClearCounts[d.id] || 0) > 0;
                    const completedFloors = hasClearedAtLeastOnce ? d.maxFloors : Math.max(0, maxReached - 1);
                    const progressPercent = (completedFloors / d.maxFloors) * 100;
                    
                    return (
                        <SfxButton key={d.id} onClick={() => onSelect(d.id)} className={`w-full group relative flex flex-col md:flex-row items-center gap-4 p-4 md:p-6 rounded-2xl border-2 transition-all overflow-hidden text-left ${isLocked ? 'bg-stone-900 border-stone-800 opacity-50 grayscale cursor-not-allowed' : 'bg-stone-900/40 border-stone-800 hover:border-amber-500 hover:bg-stone-800 shadow-xl active:scale-[0.99]'}`}>
                            <div className="w-20 h-20 md:w-32 md:h-32 bg-stone-950 rounded-xl border-2 border-stone-800 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500 overflow-hidden relative">
                                <img src={getAssetUrl(d.image || 'dungeon_sewer.jpeg', 'dungeons')} className={`w-full h-full object-cover transition-all duration-700 ${isLocked ? 'grayscale brightness-50' : 'group-hover:scale-110'}`} alt={d.name} />
                                {isLocked && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"><Lock className="w-8 h-8 text-stone-400" /></div>}
                            </div>
                            <div className="flex-1 text-center md:text-left min-w-0">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                    <h3 className="text-lg md:text-2xl font-black text-stone-100 uppercase font-serif tracking-tight">{d.name}</h3>
                                    <span className={`w-fit mx-auto md:mx-0 px-2 py-0.5 rounded font-black text-[8px] md:text-[10px] uppercase border ${isLocked ? 'border-stone-700 text-stone-600' : 'border-amber-600/30 bg-amber-900/20 text-amber-500'}`}>Tier {d.tier}</span>
                                </div>
                                <p className="text-stone-500 text-[10px] md:text-sm line-clamp-2 italic mb-3">"{d.description}"</p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-stone-600" /><span className="text-[10px] md:text-xs font-black text-stone-400 uppercase">Progression: <span className="text-amber-500">{completedFloors}/{d.maxFloors} Cleared</span></span></div>
                                    <div className="flex items-center gap-2"><Skull className="w-3.5 h-3.5 text-stone-600" /><span className="text-[10px] md:text-xs font-black text-stone-400 uppercase">Threat: <span className="text-red-500">POW {d.requiredPower}</span></span></div>
                                </div>
                                <div className="mt-3 w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800 shadow-inner"><div className="h-full bg-gradient-to-r from-amber-900 to-amber-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div></div>
                            </div>
                            <div className="absolute top-4 right-4 md:relative md:top-0 md:right-0">{isLocked ? <Lock className="w-6 h-6 text-stone-800" /> : <ChevronRight className="w-6 h-6 text-stone-700 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />}</div>
                        </SfxButton>
                    );
                })}
            </div>
        </div>
    );
};

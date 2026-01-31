import React from 'react';
import { ChevronLeft, ChevronRight, Timer, Zap, Skull, Box } from 'lucide-react';
import { getAssetUrl } from '../../../../utils';
import { SfxButton } from '../../../common/ui/SfxButton';
import { DungeonDefinition } from '../../../../models/Dungeon';
import { materials } from '../../../../data/materials';

interface DungeonInfoPanelProps {
    dungeon: DungeonDefinition;
    selectedFloor: number;
    potentialRewards: string[];
    staminaCost: number;
    requiredPower: number;
    currentPower: number;
    powerHighlight: boolean;
    onBack: () => void;
    onPrevFloor: () => void;
    onNextFloor: () => void;
    canGoPrev: boolean;
    canGoNext: boolean;
}

export const DungeonInfoPanel: React.FC<DungeonInfoPanelProps> = ({
    dungeon, selectedFloor, potentialRewards, staminaCost, requiredPower, currentPower, powerHighlight,
    onBack, onPrevFloor, onNextFloor, canGoPrev, canGoNext
}) => {
    const getItemImageUrl = (itemId: string) => {
        const item = materials[itemId];
        if (!item) return getAssetUrl(`${itemId}.png`, 'materials');
        
        const isSkill = item.type === 'SKILL_BOOK' || item.type === 'SKILL_SCROLL';
        const folder = isSkill ? 'skills' : 'materials';
        const fileName = item.image || `${itemId}.png`;
        
        return getAssetUrl(fileName, folder);
    };

    return (
        <div className="w-full sm:w-[40%] h-[55%] sm:h-full flex flex-col border-b sm:border-b-0 sm:border-r border-stone-800 bg-stone-900/50 relative overflow-hidden shrink-0 min-h-0">
            <div className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-1000">
                <img src={getAssetUrl(dungeon.image || 'dungeon_sewer.jpeg', 'dungeons')} className="w-full h-full object-cover grayscale" alt="bg" />
            </div>
            <div className="flex-1 flex flex-col items-center z-10 min-h-0">
                <SfxButton sfx="switch" onClick={onBack} className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg border border-stone-700 text-stone-400 text-[10px] font-black uppercase transition-all shadow-xl active:scale-95"><ChevronLeft className="w-3.5 h-3.5" /> Back</SfxButton>
                <div className="relative flex flex-col items-center pt-8 sm:pt-14 shrink-0 w-full">
                    <div className="h-10 sm:h-20 flex flex-col items-center justify-center text-center px-10 mb-1 sm:mb-2">
                        <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-white font-serif tracking-tighter uppercase leading-none">{dungeon.name}</h1>
                        <div className="mt-1 px-3 py-0.5 rounded-full bg-amber-900/30 border border-amber-600/30 text-amber-500 text-[8px] font-black uppercase tracking-widest">Tier {dungeon.tier}</div>
                    </div>
                    <div className="relative w-full flex items-center justify-center h-20 sm:h-44 mb-1 sm:mb-4">
                        <SfxButton sfx="switch" onClick={onPrevFloor} disabled={!canGoPrev} className={`absolute left-4 z-30 p-2 sm:p-5 rounded-full border transition-all active:scale-90 ${canGoPrev ? 'bg-stone-800 hover:bg-amber-600 border-stone-700 text-white' : 'bg-stone-900 border-stone-850 text-stone-800 opacity-20 cursor-not-allowed'}`}><ChevronLeft className="w-5 h-5 sm:w-10 sm:h-10" /></SfxButton>
                        <div className="relative group animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 sm:w-36 lg:w-44 sm:h-36 lg:h-44 bg-stone-900 rounded-2xl sm:rounded-[2rem] border-2 sm:border-4 border-stone-700 flex flex-col items-center justify-center relative shadow-2xl ring-4 ring-white/5 overflow-hidden">
                                 <img src={getAssetUrl(dungeon.image || 'dungeon_sewer.jpeg', 'dungeons')} className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-50" alt="bg" />
                                 <div className="relative z-10 flex flex-col items-center">
                                     <div className="text-[8px] sm:text-[10px] font-black text-amber-50/60 uppercase">Sector</div>
                                     <div className="text-3xl sm:text-7xl lg:text-8xl font-black text-white font-mono leading-none drop-shadow-glow-amber">{selectedFloor}</div>
                                 </div>
                            </div>
                            {selectedFloor === dungeon.maxFloors && <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-600 border border-red-400 rounded-lg text-white font-black text-[8px] sm:text-[10px] shadow-2xl rotate-12 z-40">BOSS</div>}
                        </div>
                        <SfxButton sfx="switch" onClick={onNextFloor} disabled={!canGoNext} className={`absolute right-4 z-30 p-2 sm:p-5 rounded-full border transition-all active:scale-90 ${canGoNext ? 'bg-stone-800 hover:bg-amber-600 border-stone-700 text-white' : 'bg-stone-900 border-stone-850 text-stone-800 opacity-20 cursor-not-allowed'}`}><ChevronRight className="w-5 h-5 sm:w-10 sm:h-10" /></SfxButton>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1 sm:p-8 pt-0 z-10 flex flex-col items-center min-h-0 w-full space-y-4">
                    <div className="bg-stone-950/40 p-2 sm:p-4 rounded-xl border border-stone-800/50 w-full max-w-[280px]">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                            <Box className="w-3 h-3 text-stone-600" />
                            <h4 className="text-[9px] sm:text-xs font-black text-stone-500 uppercase tracking-widest">{selectedFloor === dungeon.maxFloors ? 'Final Rewards' : `Potential Floor ${selectedFloor} Loot`}</h4>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                            {potentialRewards.map((itemId, ridx) => (
                                <div key={`${itemId}-${ridx}`} className="w-8 h-8 md:w-12 md:h-12 bg-stone-900 border border-stone-800 rounded-lg flex items-center justify-center shadow-inner group">
                                    <img src={getItemImageUrl(itemId)} className="w-6 h-6 md:w-8 md:h-8 object-contain" onError={e=>e.currentTarget.style.display='none'} alt="loot" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full max-w-[400px] p-2 bg-stone-950/60 rounded-xl border border-stone-800 flex flex-row items-center justify-between gap-1.5 shrink-0">
                        <div className="flex items-center gap-1.5 bg-stone-950 px-2 py-1.5 rounded-lg border border-stone-800 flex-1 justify-center min-w-0">
                            <Timer className="w-3 h-3 text-stone-500 shrink-0" /><span className="text-[10px] sm:text-sm font-black text-stone-200 font-mono truncate">{dungeon.durationMinutes}m</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-stone-950 px-2 py-1.5 rounded-lg border border-stone-800 flex-1 justify-center min-w-0">
                            <Zap className="w-3 h-3 text-stone-200 shrink-0" /><span className="text-[10px] sm:text-sm font-black text-stone-100 font-mono truncate">-{staminaCost}</span>
                        </div>
                        <div className={`flex items-center justify-center gap-1.5 bg-stone-950 px-2 py-1.5 rounded-lg border transition-all flex-[1.5] min-w-0 ${powerHighlight ? 'border-red-500 ring-2 ring-red-500/50 animate-shake-hard' : 'border-stone-800'}`}>
                            <Skull className="w-3 h-3 text-red-500 shrink-0" /><span className={`text-[10px] sm:text-sm font-black font-mono truncate ${currentPower >= requiredPower ? 'text-emerald-400' : 'text-red-500'}`}>{currentPower}/{requiredPower}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
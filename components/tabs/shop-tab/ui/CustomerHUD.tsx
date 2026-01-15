import React from 'react';
import { Heart } from 'lucide-react';

interface CustomerHUDProps {
    mercenary: any;
    refusalReaction: 'POLITE' | 'ANGRY' | null;
}

export const CustomerHUD: React.FC<CustomerHUDProps> = ({ mercenary, refusalReaction }) => {
    return (
        <div className="absolute top-4 left-4 z-40 animate-in slide-in-from-left-4 duration-500 w-[32%] max-w-[180px] md:max-w-[240px]">
            <div className="bg-stone-900/90 border border-stone-700 p-2.5 md:p-4 rounded-xl backdrop-blur-md shadow-2xl">
                <div className="flex justify-between items-center mb-1.5 md:mb-2.5">
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="font-black text-amber-50 text-[8px] md:text-[10px] tracking-widest uppercase truncate">{mercenary.job}</span>
                        <span className="text-stone-500 text-[8px] md:text-[10px] font-mono">Lv.{mercenary.level}</span>
                    </div>
                    <div className={`flex items-center gap-1 font-bold bg-stone-950/20 px-1 md:px-1.5 py-0.5 rounded border ${refusalReaction === 'ANGRY' ? 'text-red-500 border-red-900/30' : 'text-pink-400 border-pink-900/30'}`}>
                        <Heart className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${refusalReaction === 'ANGRY' ? 'fill-red-500' : 'fill-pink-400'}`} />
                        <span className="font-mono text-[9px] md:text-xs">{mercenary.affinity}</span>
                    </div>
                </div>
                <div className="space-y-1.5 md:space-y-2.5">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center text-[7px] md:text-[9px] font-mono text-stone-500 px-0.5">
                            <span>HP</span>
                            <span>{Math.floor(mercenary.currentHp)}/{mercenary.maxHp}</span>
                        </div>
                        <div className="w-full bg-stone-950 h-1 md:h-1.5 rounded-full overflow-hidden border border-stone-800">
                            <div className="bg-red-600 h-full transition-all duration-700" style={{ width: `${(mercenary.currentHp / mercenary.maxHp) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center text-[7px] md:text-[9px] font-mono text-stone-500 px-0.5">
                            <span>MP</span>
                            <span>{Math.floor(mercenary.currentMp)}/{mercenary.maxMp}</span>
                        </div>
                        <div className="w-full bg-stone-950 h-1 md:h-1.5 rounded-full overflow-hidden border border-stone-800">
                            <div className="bg-blue-600 h-full transition-all duration-700" style={{ width: `${(mercenary.currentMp / mercenary.maxMp) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

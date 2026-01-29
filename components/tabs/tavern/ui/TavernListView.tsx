
import React from 'react';
import { PlusCircle, Users, UserRound, ShieldAlert } from 'lucide-react';
import { MercenaryCard } from './MercenaryCard';
import { SfxButton } from '../../../common/ui/SfxButton';
import { getAssetUrl } from '../../../../utils';

interface TavernListViewProps {
    hired: any[];
    visitors: any[];
    onScout: () => void;
    onSelect: (id: string) => void;
}

export const TavernListView: React.FC<TavernListViewProps> = ({ hired, visitors, onScout, onSelect }) => {
    return (
        <div className="h-full w-full bg-stone-950 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"><img src={getAssetUrl('tavern_bg.jpeg', 'bg')} className="w-full h-full object-cover blur-[2px]" /></div>
            <div className="relative z-10 h-full p-3 md:p-5 overflow-y-auto custom-scrollbar flex flex-col gap-6 pb-20">
                <div className="flex justify-between items-end border-b border-stone-800 pb-3 shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-amber-500 font-serif leading-none uppercase tracking-tighter">The Broken Anvil</h2>
                        <p className="text-stone-600 text-[8px] md:text-sm mt-1 uppercase tracking-widest font-bold">Wayfarers gather here.</p>
                    </div>
                    <SfxButton onClick={onScout} className="bg-stone-900 border border-stone-700 px-4 py-1.5 rounded-lg text-stone-300 flex items-center gap-2 hover:border-amber-500 transition-all shadow-md active:scale-95 group">
                        <PlusCircle className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="text-[10px] font-black uppercase tracking-tight">Scout (50G)</span>
                    </SfxButton>
                </div>

                <section className="animate-in fade-in slide-in-from-left-2 duration-500">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        <h3 className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-[0.2em] font-serif italic">Your Squad</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-stone-800 to-transparent"></div>
                        <span className="text-[9px] font-mono text-stone-600 uppercase font-black">{hired.length}/12</span>
                    </div>
                    {hired.length === 0 ? (
                        <div className="py-8 border-2 border-dashed border-stone-800 rounded-xl flex flex-col items-center justify-center text-stone-700 gap-2">
                            <ShieldAlert className="w-8 h-8 opacity-20" />
                            <p className="text-[9px] uppercase font-black tracking-widest opacity-50">No active contracts.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                            {hired.map(merc => <MercenaryCard key={merc.id} merc={merc} isHired={true} onClick={() => onSelect(merc.id)} />)}
                        </div>
                    )}
                </section>

                <section className="animate-in fade-in slide-in-from-left-2 duration-700 delay-100">
                    <div className="flex items-center gap-2 mb-3">
                        <UserRound className="w-3.5 h-3.5 text-stone-500" />
                        <h3 className="text-[10px] md:text-xs font-black text-stone-500 uppercase tracking-[0.2em] font-serif italic">Visitors</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-stone-800 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                        {visitors.map(merc => <MercenaryCard key={merc.id} merc={merc} isHired={false} onClick={() => merc.status !== 'DEAD' && onSelect(merc.id)} />)}
                        <SfxButton onClick={onScout} className="bg-stone-950/30 border-2 border-dashed border-stone-800/50 rounded-xl flex flex-col items-center justify-center gap-1.5 text-stone-700 hover:text-stone-500 hover:border-stone-700 transition-all min-h-[140px]"><PlusCircle className="w-6 h-6 opacity-20" /><span className="text-[8px] font-black uppercase tracking-widest">Find Talent</span></SfxButton>
                    </div>
                </section>
            </div>
        </div>
    );
};

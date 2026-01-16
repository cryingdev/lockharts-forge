
import React from 'react';
import { Layers, Zap, BookOpen, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { MarketItemCard } from './MarketItemCard';

interface MarketCatalogProps {
    groups: any[];
    collapsed: string[];
    onToggle: (id: string) => void;
    stock: Record<string, number>;
    cart: Record<string, number>;
    inventory: any[];
    multipliers: Record<string, number>;
    affinity: number;
    onAdd: (id: string, count: number) => void;
    onSetMultiplier: (id: string, val: number) => void;
}

const ICONS: Record<string, any> = {
    tier1: <Layers className="w-3 h-3"/>, tier2: <Layers className="w-3 h-3"/>, tier3: <Layers className="w-3 h-3"/>, tier4: <Layers className="w-3 h-3"/>,
    sup: <Zap className="w-3 h-3"/>, tech: <BookOpen className="w-3 h-3"/>, fac: <Wrench className="w-3 h-3"/>
};

export const MarketCatalog: React.FC<MarketCatalogProps> = ({ groups, collapsed, onToggle, stock, cart, inventory, multipliers, affinity, onAdd, onSetMultiplier }) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-24">
            <div className="grid gap-4 content-start grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
                {groups.map(group => {
                    const isCollapsed = collapsed.includes(group.id);
                    return (
                        <React.Fragment key={group.id}>
                            <button onClick={() => onToggle(group.id)} className="col-span-full mt-4 first:mt-0 mb-2 border-b border-stone-800 pb-1 flex items-center gap-3 hover:bg-stone-800/30 transition-colors w-full text-left group">
                                <div className="p-1.5 bg-stone-950 rounded-lg border border-white/5 text-stone-500 group-hover:text-amber-500">{ICONS[group.id] || <Layers className="w-3 h-3"/>}</div>
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{group.name}</span>
                                <div className="flex-1 h-px bg-stone-800/60"></div>
                                {isCollapsed ? <ChevronDown className="w-3 h-3 text-stone-600" /> : <ChevronUp className="w-3 h-3 text-stone-600" />}
                            </button>
                            {!isCollapsed && group.items.map((item: any) => (
                                <MarketItemCard key={item.id} item={item} stock={(stock[item.id] || 0) - (cart[item.id] || 0)} inventoryCount={inventory.find(i => i.id === item.id)?.quantity || 0} multiplier={multipliers[item.id] || 1} isLocked={(item.id === 'scroll_t2' && affinity < 20) || (item.id === 'scroll_t3' && affinity < 40)} onAdd={onAdd} onSetMultiplier={onSetMultiplier} />
                            ))}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

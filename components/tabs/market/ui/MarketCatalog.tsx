import React, { useEffect, useRef, useState } from 'react';
import { Layers, Zap, BookOpen, Wrench, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { MarketItemCard } from './MarketItemCard';
import { useGame } from '../../../../context/GameContext';
import { t } from '../../../../utils/i18n';

interface MarketCatalogProps {
    groups: any[];
    collapsed: string[];
    onToggle: (id: string) => void;
    stock: Record<string, number>;
    cart: Record<string, number>;
    inventory: any[];
    multipliers: Record<string, number>;
    affinity: number;
    gold: number;
    onAdd: (id: string, count: number) => void;
    onSetMultiplier: (id: string, val: number) => void;
}

const ICONS: Record<string, any> = {
    tier1: <Layers className="w-3 h-3"/>, tier2: <Layers className="w-3 h-3"/>, tier3: <Layers className="w-3 h-3"/>, tier4: <Layers className="w-3 h-3"/>,
    sup: <Zap className="w-3 h-3"/>, tech: <BookOpen className="w-3 h-3"/>, fac: <Wrench className="w-3 h-3"/>,
    skill: <Sparkles className="w-3 h-3"/>
};

export const MarketCatalog: React.FC<MarketCatalogProps> = ({ groups, collapsed, onToggle, stock, cart, inventory, multipliers, affinity, gold, onAdd, onSetMultiplier }) => {
    const { state } = useGame();
    const language = state.settings.language;
    const [activeTooltip, setActiveTooltip] = useState<null | { itemId: string; description: string; left: number; top: number }>(null);
    const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
        };
    }, []);

    const closeTooltip = () => {
        if (tooltipTimerRef.current) {
            clearTimeout(tooltipTimerRef.current);
            tooltipTimerRef.current = null;
        }
        setActiveTooltip(null);
    };

    const handleToggleTooltip = (itemId: string, anchorRect: DOMRect, description: string) => {
        if (tooltipTimerRef.current) {
            clearTimeout(tooltipTimerRef.current);
            tooltipTimerRef.current = null;
        }

        if (activeTooltip?.itemId === itemId) {
            setActiveTooltip(null);
            return;
        }

        const tooltipWidth = window.innerWidth < 768 ? 208 : 224;
        const maxLeft = window.innerWidth - tooltipWidth - 12;
        const left = Math.min(Math.max(anchorRect.right - tooltipWidth, 12), maxLeft);
        const top = Math.max(anchorRect.top - 12, 12);

        setActiveTooltip({ itemId, description, left, top });
        tooltipTimerRef.current = setTimeout(() => {
            setActiveTooltip(current => (current?.itemId === itemId ? null : current));
            tooltipTimerRef.current = null;
        }, 2000);
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-24">
            <div className="grid gap-4 content-start grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
                {groups.map(group => {
                    const isCollapsed = collapsed.includes(group.id);
                    return (
                        <React.Fragment key={group.id}>
                            <button onClick={() => onToggle(group.id)} className="col-span-full mt-4 first:mt-0 mb-2 border-b border-stone-800 pb-1 flex items-center gap-3 hover:bg-stone-800/30 transition-colors w-full text-left group">
                                <div className="p-1.5 bg-stone-950 rounded-lg border border-white/5 text-stone-500 group-hover:text-amber-500">{ICONS[group.id] || <Layers className="w-3 h-3"/>}</div>
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{t(language, group.nameKey || group.name)}</span>
                                <div className="flex-1 h-px bg-stone-800/60"></div>
                                {isCollapsed ? <ChevronDown className="w-3 h-3 text-stone-600" /> : <ChevronUp className="w-3 h-3 text-stone-600" />}
                            </button>
                            {!isCollapsed && group.items.map((item: any) => (
                                <MarketItemCard 
                                    key={item.id} 
                                    item={item} 
                                    stock={(stock[item.id] || 0) - (cart[item.id] || 0)} 
                                    inventoryCount={inventory.find(i => i.id === item.id)?.quantity || 0} 
                                    multiplier={multipliers[item.id] || 1} 
                                    isLocked={(item.id === 'scroll_t2' && affinity < 20) || (item.id === 'scroll_t3' && affinity < 40)} 
                                    gold={gold}
                                    onAdd={onAdd} 
                                    onSetMultiplier={onSetMultiplier} 
                                    isTooltipOpen={activeTooltip?.itemId === item.id}
                                    onToggleTooltip={handleToggleTooltip}
                                />
                            ))}
                        </React.Fragment>
                    );
                })}
            </div>
            {activeTooltip && (
                <button
                    type="button"
                    onClick={closeTooltip}
                    className="fixed z-[2500] w-[13rem] rounded-xl border border-stone-600/55 bg-stone-900/72 px-2.5 py-2 text-left text-[14px] italic leading-snug text-stone-200 shadow-[0_14px_30px_rgba(0,0,0,0.28)] backdrop-blur-[2px] md:w-[14rem] md:text-[12px]"
                    style={{
                        left: `${activeTooltip.left}px`,
                        top: `${activeTooltip.top}px`,
                        transform: 'translateY(-100%)',
                    }}
                >
                    {activeTooltip.description}
                </button>
            )}
        </div>
    );
};

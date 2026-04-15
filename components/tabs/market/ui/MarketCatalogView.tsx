
import React from 'react';
import { ArrowLeft, Coins, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { MarketCatalog } from './MarketCatalog';
import { ShoppingCartDrawer } from './ShoppingCartDrawer';
import { SfxButton } from '../../../common/ui/SfxButton';
import { useGame } from '../../../../context/GameContext';
import { t } from '../../../../utils/i18n';

interface MarketCatalogViewProps {
    categorizedMarketItems: any[];
    collapsedSections: string[];
    marketStock: Record<string, number>;
    cart: Record<string, number>;
    inventory: any[];
    catalogMultiplier: number;
    garrickAffinity: number;
    gold: number;
    totalCost: number;
    isCartOpen: boolean;
    onBack: () => void;
    onToggleSection: (id: string) => void;
    onAddToCart: (id: string, count: number) => void;
    onSetMultiplier: (val: number) => void;
    onToggleCart: () => void;
    onRemoveFromCart: (id: string) => void;
    onDeleteFromCart: (id: string) => void;
    onBuy: () => void;
}

export const MarketCatalogView: React.FC<MarketCatalogViewProps> = ({
    categorizedMarketItems, collapsedSections, marketStock, cart, inventory, catalogMultiplier,
    garrickAffinity, gold, totalCost, isCartOpen,
    onBack, onToggleSection, onAddToCart, onSetMultiplier, onToggleCart, onRemoveFromCart, onDeleteFromCart, onBuy
}) => {
    const { state } = useGame();
    const language = state.settings.language;
    // Added explicit type casting to totalCost and gold to prevent 'unknown' comparison errors
    const isOverBudget = (totalCost as number) > (gold as number);
    // Use generic reduce type to ensure cartItemCount is strictly a number even if Object.values is loosely typed
    const cartItemCount = Object.values(cart).reduce<number>((a, b) => (a as number) + (b as number), 0);

    return (
        <div className="absolute inset-x-[4vw] md:inset-x-[10vw] top-[10vh] bottom-[10vh] z-[100] flex flex-col animate-in zoom-in-95 duration-300">
            <div className="w-full h-full bg-stone-900/95 backdrop-blur-xl border-2 border-stone-700 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
                <div className="bg-stone-850 px-4 py-4 md:px-5 md:py-4.5 border-b border-stone-800 shrink-0">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3.5 md:gap-4">
                    <div className="min-w-0 flex items-center gap-3.5 md:gap-4">
                        <SfxButton onClick={onBack} className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-2xl border border-stone-700 bg-stone-800 px-3 active:scale-90 md:min-h-[58px] md:min-w-[58px]"><ArrowLeft className="h-5 w-5 text-stone-300 md:h-6 md:w-6" /></SfxButton>
                        <div className="min-w-0">
                            <h2 className="truncate text-[1.5rem] leading-none font-black text-stone-100 font-serif uppercase tracking-tight md:text-[1.8rem]">
                                {t(language, 'market.catalog_title')}
                            </h2>
                            <div className="mt-1.5 flex max-w-full flex-wrap items-center gap-2">
                                <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/5 bg-stone-950 px-2.5 py-1">
                                    <Coins className="h-4 w-4 shrink-0 text-amber-50 md:h-4.5 md:w-4.5" />
                                    <span className="truncate text-[13px] font-mono font-black text-stone-300 md:text-[14px]">{gold.toLocaleString()} G</span>
                                </div>
                                <div className="inline-flex items-center gap-1 rounded-xl border border-stone-700 bg-stone-950/90 p-1">
                                    {[1, 5, 10].map(v => (
                                        <SfxButton
                                            key={v}
                                            sfx="switch"
                                            onClick={() => onSetMultiplier(v)}
                                            className={`h-8 min-w-[2.1rem] rounded-lg px-2 text-[13px] font-black leading-none transition-all md:h-8 md:min-w-[2.35rem] md:text-[13px] ${
                                                catalogMultiplier === v
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 active:bg-stone-800'
                                            }`}
                                        >
                                            {v}
                                        </SfxButton>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {!isCartOpen && (
                        <SfxButton 
                            onClick={onBuy} 
                            disabled={cartItemCount === 0 || isOverBudget}
                            data-tutorial-id="PAY_NOW_BUTTON" 
                            className={`relative flex min-h-[52px] min-w-[148px] items-center justify-center gap-2.5 px-3.5 py-2 md:min-h-[58px] md:min-w-[176px] md:gap-3 md:px-5 md:py-2.5 rounded-2xl border transition-all ${
                                cartItemCount === 0 
                                    ? 'opacity-50 grayscale' 
                                    : isOverBudget
                                        ? 'bg-red-900 border-red-500 text-red-100 shadow-lg cursor-not-allowed'
                                        : 'bg-amber-600 border-amber-400 text-white shadow-xl active:scale-95'
                            }`}
                        >
                            <ShoppingCart className="w-4.5 h-4.5 shrink-0 md:w-5 md:h-5"/>
                            <div className="flex min-w-0 flex-col items-start leading-none">
                                <span className="w-full text-[10px] md:text-[11px] font-black uppercase">
                                    {isOverBudget ? t(language, 'market.checkout_shortage') : t(language, 'market.checkout')}
                                </span>
                                <span className="text-[15px] md:text-[16px] font-mono font-black whitespace-nowrap">{totalCost.toLocaleString()}G</span>
                            </div>
                        </SfxButton>
                    )}
                    </div>
                </div>
                
                <div className="relative flex-1 overflow-hidden">
                    <MarketCatalog 
                        groups={categorizedMarketItems} 
                        collapsed={collapsedSections} 
                        onToggle={onToggleSection} 
                        stock={marketStock} 
                        cart={cart} 
                        inventory={inventory} 
                        multiplier={catalogMultiplier} 
                        affinity={garrickAffinity} 
                        gold={gold}
                        onAdd={onAddToCart} 
                        onSetMultiplier={onSetMultiplier} 
                    />
                    <div className={`absolute inset-y-0 right-0 z-[2050] transition-transform duration-500 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <ShoppingCartDrawer 
                            isOpen={isCartOpen} 
                            cart={cart} 
                            total={totalCost} 
                            gold={gold} 
                            onRemove={onRemoveFromCart} 
                            onAdd={(id) => onAddToCart(id, 1)} 
                            onDelete={onDeleteFromCart} 
                            onBuy={onBuy} 
                        />
                    </div>
                </div>
                
                <SfxButton sfx="switch" onClick={onToggleCart} data-tutorial-id="CART_TOGGLE" className={`absolute top-1/2 right-0 w-8 h-20 -translate-y-1/2 border-y border-l transition-all z-[2100] rounded-l-xl flex flex-col items-center justify-center ${isCartOpen ? 'translate-x-[-192px] md:translate-x-[-288px]' : ''} ${cartItemCount > 0 ? 'bg-amber-600 text-white border-amber-400 animate-pulse' : 'bg-stone-800 text-stone-400 border-stone-600'}`}>{isCartOpen ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}<ShoppingCart className="w-3 h-3 mt-1"/></SfxButton>
            </div>
        </div>
    );
};

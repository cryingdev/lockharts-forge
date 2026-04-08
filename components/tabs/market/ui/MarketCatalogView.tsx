
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
    itemMultipliers: Record<string, number>;
    garrickAffinity: number;
    gold: number;
    totalCost: number;
    isCartOpen: boolean;
    onBack: () => void;
    onToggleSection: (id: string) => void;
    onAddToCart: (id: string, count: number) => void;
    onSetMultiplier: (id: string, val: number) => void;
    onToggleCart: () => void;
    onRemoveFromCart: (id: string) => void;
    onDeleteFromCart: (id: string) => void;
    onBuy: () => void;
}

export const MarketCatalogView: React.FC<MarketCatalogViewProps> = ({
    categorizedMarketItems, collapsedSections, marketStock, cart, inventory, itemMultipliers,
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
                <div className="bg-stone-850 px-4 py-4 md:px-5 md:py-4.5 border-b border-stone-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3.5 md:gap-4">
                        <SfxButton onClick={onBack} className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-2xl border border-stone-700 bg-stone-800 px-3 active:scale-90 md:min-h-[58px] md:min-w-[58px]"><ArrowLeft className="h-5 w-5 text-stone-300 md:h-6 md:w-6" /></SfxButton>
                        <div>
                            <h2 className="text-[1.55rem] leading-none font-black text-stone-100 font-serif uppercase tracking-tight md:text-[1.85rem]">{t(language, 'market.garricks_wares')}</h2>
                            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-white/5 bg-stone-950 px-2.5 py-1"><Coins className="h-4 w-4 text-amber-50 md:h-4.5 md:w-4.5" /><span className="text-[13px] font-mono font-black text-stone-300 md:text-[14px]">{gold.toLocaleString()} G</span></div>
                        </div>
                    </div>
                    {!isCartOpen && (
                        <SfxButton 
                            onClick={onBuy} 
                            disabled={cartItemCount === 0 || isOverBudget}
                            data-tutorial-id="PAY_NOW_BUTTON" 
                            className={`relative flex min-h-[52px] items-center gap-2.5 px-3.5 md:min-h-[58px] md:gap-3 md:px-5.5 py-2 md:py-2.5 rounded-2xl border transition-all ${
                                cartItemCount === 0 
                                    ? 'opacity-50 grayscale' 
                                    : isOverBudget
                                        ? 'bg-red-900 border-red-500 text-red-100 shadow-lg cursor-not-allowed'
                                        : 'bg-amber-600 border-amber-400 text-white shadow-xl active:scale-95'
                            }`}
                        >
                            <ShoppingCart className="w-4.5 h-4.5 md:w-5 md:h-5"/>
                            <div className="flex flex-col items-start leading-none min-w-0">
                                <span className="text-[10px] md:text-[11px] font-black uppercase truncate w-full">
                                    {isOverBudget ? t(language, 'market.checkout_shortage') : t(language, 'market.checkout')}
                                </span>
                                <span className="text-[15px] md:text-[16px] font-mono font-black whitespace-nowrap">{totalCost.toLocaleString()}G</span>
                            </div>
                        </SfxButton>
                    )}
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    <MarketCatalog 
                        groups={categorizedMarketItems} 
                        collapsed={collapsedSections} 
                        onToggle={onToggleSection} 
                        stock={marketStock} 
                        cart={cart} 
                        inventory={inventory} 
                        multipliers={itemMultipliers} 
                        affinity={garrickAffinity} 
                        gold={gold}
                        onAdd={onAddToCart} 
                        onSetMultiplier={onSetMultiplier} 
                    />
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
                
                <SfxButton sfx="switch" onClick={onToggleCart} data-tutorial-id="CART_TOGGLE" className={`absolute top-1/2 right-0 w-8 h-20 -translate-y-1/2 border-y border-l transition-all z-[2100] rounded-l-xl flex flex-col items-center justify-center ${isCartOpen ? 'translate-x-[-192px] md:translate-x-[-288px]' : ''} ${cartItemCount > 0 ? 'bg-amber-600 text-white border-amber-400 animate-pulse' : 'bg-stone-800 text-stone-400 border-stone-600'}`}>{isCartOpen ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}<ShoppingCart className="w-3 h-3 mt-1"/></SfxButton>
            </div>
        </div>
    );
};

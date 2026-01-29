
import React from 'react';
import { ArrowLeft, Coins, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { MarketCatalog } from './MarketCatalog';
import { ShoppingCartDrawer } from './ShoppingCartDrawer';
import { SfxButton } from '../../../common/ui/SfxButton';

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
    const isOverBudget = totalCost > gold;
    const cartItemCount = Object.values(cart).reduce((a: number, b: number) => a + b, 0);

    return (
        <div className="absolute inset-x-[4vw] md:inset-x-[10vw] top-[10vh] bottom-[10vh] z-[100] flex flex-col animate-in zoom-in-95 duration-300">
            <div className="w-full h-full bg-stone-900/95 backdrop-blur-xl border-2 border-stone-700 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
                <div className="bg-stone-850 p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <SfxButton onClick={onBack} className="bg-stone-800 p-2 rounded-xl border border-stone-700 active:scale-90"><ArrowLeft className="w-5 h-5 text-stone-300" /></SfxButton>
                        <div>
                            <h2 className="text-xl font-black text-stone-100 font-serif uppercase tracking-tight">Garrick's Wares</h2>
                            <div className="flex items-center gap-2 bg-stone-950 px-2 py-0.5 rounded border border-white/5 mt-1"><Coins className="w-3 h-3 text-amber-50" /><span className="text-[10px] font-mono font-black text-stone-300">{gold.toLocaleString()} G</span></div>
                        </div>
                    </div>
                    {!isCartOpen && (
                        <SfxButton 
                            onClick={onBuy} 
                            disabled={cartItemCount === 0 || isOverBudget}
                            data-tutorial-id="PAY_NOW_BUTTON" 
                            className={`relative flex items-center gap-2 md:gap-3 px-3 md:px-5 py-1.5 md:py-2 rounded-xl border transition-all ${
                                cartItemCount === 0 
                                    ? 'opacity-50 grayscale' 
                                    : isOverBudget
                                        ? 'bg-red-900 border-red-500 text-red-100 shadow-lg cursor-not-allowed'
                                        : 'bg-amber-600 border-amber-400 text-white shadow-xl active:scale-95'
                            }`}
                        >
                            <ShoppingCart className="w-4 h-4"/>
                            <div className="flex flex-col items-start leading-none min-w-0">
                                <span className="text-[8px] font-black uppercase truncate w-full">
                                    {isOverBudget ? 'Shortage' : 'Checkout'}
                                </span>
                                <span className="text-xs font-mono font-black whitespace-nowrap">{totalCost.toLocaleString()}G</span>
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

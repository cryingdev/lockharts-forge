import React, { useEffect } from 'react';
import { useMarket } from './hooks/useMarket';
import { GarrickSprite } from './ui/GarrickSprite';
import { MarketCatalog } from './ui/MarketCatalog';
import { ShoppingCartDrawer } from './ui/ShoppingCartDrawer';
import { MarketTutorialOverlay, SequenceStep } from './ui/MarketTutorialOverlay';
import DialogueBox from '../../DialogueBox';
import { ItemSelectorList } from '../../ItemSelectorList';
import { ArrowLeft, Heart, MessageSquare, Gift, ShoppingBag, Coins, ShoppingCart, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getAssetUrl } from '../../../utils';

interface MarketTabProps {
    onNavigate: (tab: any) => void;
}

const MarketTab: React.FC<MarketTabProps> = ({ onNavigate }) => {
    const market = useMarket(onNavigate);
    const { state, actions, handlers, viewMode, dialogue, cart, isCartOpen, totalCost, categorizedMarketItems, floatingHearts, showGiftModal, pendingGiftItem, collapsedSections } = market;

    // Debugging Garrick Gift Modal
    useEffect(() => {
        if (showGiftModal) {
            console.group('[MarketTab] Garrick Gift Selection Debug');
            console.log('Total Inventory Size:', state.inventory.length);
            const equipmentItems = state.inventory.filter(i => i.type === 'EQUIPMENT');
            console.log('Equipment Items Count:', equipmentItems.length);
            console.table(state.inventory.map(i => ({ name: i.name, type: i.type, quantity: i.quantity })));
            console.groupEnd();
        }
    }, [showGiftModal, state.inventory]);

    // 마켓 튜토리얼 씬인지 확인
    const isLocalTutorial = state.activeTutorialScene === 'MARKET';
    
    // 현재 단계가 마켓 튜토리얼 단계에 포함되는지 확인 (Type Guard)
    const marketSteps: SequenceStep[] = [
        'BROWSE_GOODS_GUIDE', 'FURNACE_GUIDE', 'OPEN_SHOPPING_CART', 
        'CLOSE_SHOPPING_CART', 'PAY_NOW', 'GARRICK_AFTER_PURCHASE_DIALOG', 'LEAVE_MARKET_GUIDE'
    ];
    
    const currentMarketStep = state.tutorialStep && marketSteps.includes(state.tutorialStep as any) 
        ? (state.tutorialStep as SequenceStep) 
        : null;

    const isOverBudget = totalCost > state.stats.gold;

    return (
        <div className="fixed inset-0 z-[1000] bg-stone-950 overflow-hidden flex flex-col items-center justify-center px-safe">
            <style>{`
                @keyframes heartFloatUp { 0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-350px) translateX(var(--wobble)) scale(1.4); opacity: 0; } }
                .animate-heart { animation: heartFloatUp 2.5s ease-out forwards; }
            `}</style>

            <div className="absolute inset-0 z-0">
                <img src={getAssetUrl('garricks_store_bg.png')} className="absolute top-0 opacity-60 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/30"></div>
            </div>

            {/* 마켓 튜토리얼 오버레이 */}
            {isLocalTutorial && currentMarketStep && (
                <MarketTutorialOverlay step={currentMarketStep} />
            )}

            {/* 튜토리얼 중에는 마지막 단계(LEAVE_MARKET_GUIDE)에서만 Back 버튼 노출 */}
            {(!isLocalTutorial || state.tutorialStep === 'LEAVE_MARKET_GUIDE') && (
                <button onClick={handlers.handleBackToForge} data-tutorial-id="MARKET_BACK_BUTTON" className="absolute top-4 left-4 z-[1050] flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 rounded-xl border border-stone-700 shadow-2xl backdrop-blur-md transition-all active:scale-90 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1" /> <span className="text-xs font-black uppercase tracking-widest">Back</span>
                </button>
            )}

            <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
                <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in-95 duration-1000">
                    <div className="absolute top-[12dvh] md:top-32 left-[calc(50%+85px)] md:left-[calc(50%+180px)] z-[1050] pointer-events-auto">
                        <div className="bg-stone-900/85 border-2 border-stone-700 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                            <div className="flex flex-col leading-none">
                                <span className="text-[7px] text-stone-500 font-black uppercase">Garrick's Trust</span>
                                <span className="text-sm font-black font-mono text-pink-400">{state.garrickAffinity}</span>
                            </div>
                        </div>
                    </div>
                    <GarrickSprite floatingHearts={floatingHearts} />
                </div>
            </div>

            {viewMode === 'INTERACTION' && (
                <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl z-50 flex flex-col items-end pointer-events-none">
                    {!isLocalTutorial && (
                        <div className={`flex flex-col items-end gap-2 w-full px-4 py-2 pointer-events-auto transition-opacity ${pendingGiftItem ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                            <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3 w-full">
                                <button onClick={handlers.handleTalk} data-tutorial-id="GARRICK_TALK_BUTTON" className="flex items-center gap-2 px-4 py-2 bg-stone-900/90 border border-stone-700 rounded-xl hover:border-amber-500 transition-all shadow-xl active:scale-95"><MessageSquare className="w-4 h-4 text-amber-500" /><span className="font-black text-[9px] text-stone-200 uppercase tracking-widest">Talk</span></button>
                                <button onClick={() => market.setShowGiftModal(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-900/90 border border-stone-700 rounded-xl hover:border-pink-500 transition-all shadow-xl active:scale-95"><Gift className="w-4 h-4 text-pink-500" /><span className="font-black text-[9px] text-stone-200 uppercase tracking-widest">Gift</span></button>
                                <button onClick={() => market.setViewMode('CATALOG')} data-tutorial-id="BROWSE_GOODS_BUTTON" className="flex items-center gap-2 px-6 py-2 bg-amber-700/90 border border-amber-500 rounded-xl shadow-xl active:scale-95"><ShoppingBag className="w-4 h-4 text-white" /><span className="font-black text-[9px] text-white uppercase tracking-widest">Browse Goods</span></button>
                            </div>
                        </div>
                    )}
                    {!isLocalTutorial && (
                        <DialogueBox speaker="Garrick" text={dialogue} options={pendingGiftItem ? [{ label: `Give ${pendingGiftItem.name}`, action: handlers.handleConfirmGift, variant: 'primary' }, { label: "Cancel", action: () => market.setPendingGiftItem(null), variant: 'neutral' }] : []} className="w-full relative pointer-events-auto" />
                    )}
                </div>
            )}

            {viewMode === 'CATALOG' && (
                <div className="absolute inset-x-[4vw] md:inset-x-[10vw] top-[10vh] bottom-[10vh] z-[100] flex flex-col animate-in zoom-in-95 duration-300">
                    <div className="w-full h-full bg-stone-900/95 backdrop-blur-xl border-2 border-stone-700 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
                        <div className="bg-stone-850 p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                {!isLocalTutorial && <button onClick={() => market.setViewMode('INTERACTION')} className="bg-stone-800 p-2 rounded-xl border border-stone-700 active:scale-90"><ArrowLeft className="w-5 h-5 text-stone-300" /></button>}
                                <div>
                                    <h2 className="text-xl font-black text-stone-100 font-serif uppercase tracking-tight">Garrick's Wares</h2>
                                    <div className="flex items-center gap-2 bg-stone-950 px-2 py-0.5 rounded border border-white/5 mt-1"><Coins className="w-3 h-3 text-amber-50" /><span className="text-[10px] font-mono font-black text-stone-300">{state.stats.gold.toLocaleString()} G</span></div>
                                </div>
                            </div>
                            {!isCartOpen && (
                                <button 
                                    onClick={() => !isOverBudget && handlers.handleBuy()} 
                                    disabled={market.cartItemCount === 0 || isOverBudget}
                                    data-tutorial-id="PAY_NOW_BUTTON" 
                                    className={`relative flex items-center gap-2 md:gap-3 px-3 md:px-5 py-1.5 md:py-2 rounded-xl border transition-all ${
                                        market.cartItemCount === 0 
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
                                </button>
                            )}
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <MarketCatalog 
                                groups={categorizedMarketItems} 
                                collapsed={collapsedSections} 
                                onToggle={(id) => market.setCollapsedSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])} 
                                stock={state.marketStock} 
                                cart={cart} 
                                inventory={state.inventory} 
                                multipliers={market.itemMultipliers} 
                                affinity={state.garrickAffinity} 
                                gold={state.stats.gold}
                                onAdd={handlers.addToCart} 
                                onSetMultiplier={(id, v) => market.setItemMultipliers(p => ({ ...p, [id]: v }))} 
                            />
                            <ShoppingCartDrawer isOpen={isCartOpen} cart={cart} total={totalCost} gold={state.stats.gold} onRemove={handlers.removeFromCart} onAdd={handlers.addToCart} onDelete={handlers.deleteFromCart} onBuy={handlers.handleBuy} />
                        </div>
                        <button onClick={() => { if (!isCartOpen && state.tutorialStep === 'OPEN_SHOPPING_CART') actions.setTutorialStep('CLOSE_SHOPPING_CART'); else if (isCartOpen && state.tutorialStep === 'CLOSE_SHOPPING_CART') actions.setTutorialStep('PAY_NOW'); market.setIsCartOpen(!isCartOpen); }} data-tutorial-id="CART_TOGGLE" className={`absolute top-1/2 right-0 w-8 h-20 -translate-y-1/2 border-y border-l transition-all z-[2100] rounded-l-xl flex flex-col items-center justify-center ${isCartOpen ? 'translate-x-[-192px] md:translate-x-[-288px]' : ''} ${market.cartItemCount > 0 || ['OPEN_SHOPPING_CART', 'CLOSE_SHOPPING_CART'].includes(state.tutorialStep || '') ? 'bg-amber-600 text-white border-amber-400 animate-pulse' : 'bg-stone-800 text-stone-400 border-stone-600'}`}>{isCartOpen ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}<ShoppingCart className="w-3 h-3 mt-1"/></button>
                    </div>
                </div>
            )}

            {showGiftModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl w-full max-w-2xl h-[60vh] min-h-[400px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                        <div className="p-3 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="bg-pink-900/30 p-1.5 rounded-lg border border-pink-700/50">
                                    <Gift className="w-4 h-4 text-pink-500" />
                                </div>
                                <h3 className="font-bold text-stone-200 font-serif uppercase tracking-widest text-sm">Select Gift for Garrick</h3>
                            </div>
                            <button onClick={() => market.setShowGiftModal(false)} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <ItemSelectorList 
                                items={state.inventory.filter(i => i.type === 'EQUIPMENT')} 
                                onSelect={handlers.handleGiftInit} 
                                onToggleLock={(id) => actions.toggleLockItem(id)} 
                                customerMarkup={1.0} 
                                emptyMessage="Only Equipment can be gifted to Garrick. Craft some gear first!" 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketTab;

import React from 'react';
import { useMarket } from './hooks/useMarket';
import { MarketLobbyView } from './ui/MarketLobbyView';
import { MarketCatalogView } from './ui/MarketCatalogView';
import { MarketTutorialOverlay, SequenceStep } from './ui/MarketTutorialOverlay';
import { ItemSelectorList } from '../../ItemSelectorList';
import { ArrowLeft, Gift, X } from 'lucide-react';
import { getAssetUrl } from '../../../utils';
import { SfxButton } from '../../common/ui/SfxButton';

interface MarketTabProps {
    onNavigate: (tab: any) => void;
}

const MarketTab: React.FC<MarketTabProps> = ({ onNavigate }) => {
    const market = useMarket(onNavigate);
    const { 
        state, actions, handlers, viewMode, setViewMode, dialogue, cart, 
        isCartOpen, setIsCartOpen, totalCost, categorizedMarketItems, 
        floatingHearts, showGiftModal, setShowGiftModal, pendingGiftItem, 
        collapsedSections, setCollapsedSections 
    } = market;

    const isLocalTutorial = state.activeTutorialScene === 'MARKET';
    const marketSteps: SequenceStep[] = [
        'BROWSE_GOODS_GUIDE', 'FURNACE_GUIDE', 'OPEN_SHOPPING_CART', 
        'CLOSE_SHOPPING_CART', 'PAY_NOW', 'GARRICK_AFTER_PURCHASE_DIALOG', 'LEAVE_MARKET_GUIDE'
    ];
    const currentMarketStep = state.tutorialStep && marketSteps.includes(state.tutorialStep as any) 
        ? (state.tutorialStep as SequenceStep) 
        : null;

    // 튜토리얼 오버레이가 대화를 담당하는 단계인지 판단
    const isTutorialDialogueActive = isLocalTutorial && currentMarketStep && 
        ['BROWSE_GOODS_GUIDE', 'GARRICK_AFTER_PURCHASE_DIALOG', 'LEAVE_MARKET_GUIDE'].includes(currentMarketStep);

    return (
        <div className="fixed inset-0 z-[1000] bg-stone-950 overflow-hidden flex flex-col items-center justify-center px-safe">
            <style>{`
                @keyframes heartFloatUp { 0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-350px) translateX(var(--wobble)) scale(1.4); opacity: 0; } }
                .animate-heart { animation: heartFloatUp 2.5s ease-out forwards; }
            `}</style>

            <div className="absolute inset-0 z-0">
                <img src={getAssetUrl('garricks_store_bg.jpeg', 'bg')} className="absolute top-0 opacity-60 w-full h-full object-cover" alt="bg" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/30"></div>
            </div>

            {isLocalTutorial && currentMarketStep && <MarketTutorialOverlay step={currentMarketStep} />}

            {(!isLocalTutorial || state.tutorialStep === 'LEAVE_MARKET_GUIDE') && (
                <SfxButton sfx="switch" onClick={handlers.handleBackToForge} data-tutorial-id="MARKET_BACK_BUTTON" className="absolute top-4 left-4 z-[1050] flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 rounded-xl border border-stone-700 shadow-2xl backdrop-blur-md transition-all active:scale-90 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> <span className="text-xs font-black uppercase tracking-widest">Back</span>
                </SfxButton>
            )}

            {viewMode === 'INTERACTION' ? (
                <MarketLobbyView 
                    dialogue={dialogue}
                    garrickAffinity={state.garrickAffinity}
                    talkedToday={state.talkedToGarrickToday}
                    floatingHearts={floatingHearts}
                    pendingGiftItem={pendingGiftItem}
                    onTalk={handlers.handleTalk}
                    onOpenGiftModal={() => setShowGiftModal(true)}
                    onOpenCatalog={() => setViewMode('CATALOG')}
                    onConfirmGift={handlers.handleConfirmGift}
                    onCancelGift={() => market.setPendingGiftItem(null)}
                    isTutorialActive={!!isTutorialDialogueActive} // 추가됨
                />
            ) : (
                <MarketCatalogView 
                    categorizedMarketItems={categorizedMarketItems}
                    collapsedSections={collapsedSections}
                    marketStock={state.marketStock}
                    cart={cart}
                    inventory={state.inventory}
                    itemMultipliers={market.itemMultipliers}
                    garrickAffinity={state.garrickAffinity}
                    gold={state.stats.gold}
                    totalCost={totalCost}
                    isCartOpen={isCartOpen}
                    onBack={() => setViewMode('INTERACTION')}
                    onToggleSection={(id) => setCollapsedSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])}
                    onAddToCart={handlers.addToCart}
                    onSetMultiplier={(id, v) => market.setItemMultipliers(p => ({ ...p, [id]: v }))}
                    onToggleCart={() => {
                        if (!isCartOpen && state.tutorialStep === 'OPEN_SHOPPING_CART') actions.setTutorialStep('CLOSE_SHOPPING_CART');
                        else if (isCartOpen && state.tutorialStep === 'CLOSE_SHOPPING_CART') actions.setTutorialStep('PAY_NOW');
                        setIsCartOpen(!isCartOpen);
                    }}
                    onRemoveFromCart={handlers.removeFromCart}
                    onDeleteFromCart={handlers.deleteFromCart}
                    onBuy={handlers.handleBuy}
                />
            )}

            {showGiftModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl w-full max-w-2xl h-[60vh] min-h-[400px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                        <div className="p-3 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-stone-200 font-serif uppercase tracking-widest text-sm">Select Gift for Garrick</h3>
                            <SfxButton sfx="switch" onClick={() => setShowGiftModal(false)} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500"><X className="w-4 h-4" /></SfxButton>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <ItemSelectorList 
                                items={state.inventory.filter(i => i.type === 'EQUIPMENT')} 
                                onSelect={handlers.handleGiftInit} 
                                onToggleLock={(id) => actions.toggleLockItem(id)} 
                                customerMarkup={1.0} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketTab;

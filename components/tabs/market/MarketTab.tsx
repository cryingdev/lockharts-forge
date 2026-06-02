import React, { useEffect } from 'react';
import { useMarket } from './hooks/useMarket';
import { MarketLobbyView } from './ui/MarketLobbyView';
import { MarketCatalogView } from './ui/MarketCatalogView';
import { MarketTutorialOverlay, SequenceStep } from './ui/MarketTutorialOverlay';
import { ItemSelectorList } from '../../ItemSelectorList';
import { X } from 'lucide-react';
import { getAssetUrl } from '../../../utils';
import { SfxButton } from '../../common/ui/SfxButton';
import { CommonBackButton } from '../../common/ui/CommonBackButton';
import { t } from '../../../utils/i18n';
import { getPlayerName } from '../../../utils/gameText';

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
    const language = state.settings.language;
    const playerName = getPlayerName(state);

    useEffect(() => {
        actions.triggerNamedEncounterCheck('MARKET');
    }, []);

    const isLocalTutorial = state.activeTutorialScene === 'MARKET';
    const marketSteps: SequenceStep[] = [
        'BROWSE_GOODS_GUIDE', 'FURNACE_GUIDE', 'PAY_NOW_GUIDE', 'GARRICK_AFTER_PURCHASE_DIALOG_GUIDE', 'GARRICK_EXIT_DIALOG_GUIDE', 'LEAVE_MARKET_GUIDE'
    ];
    const currentMarketStep = state.tutorialStep && marketSteps.includes(state.tutorialStep as any) 
        ? (state.tutorialStep as SequenceStep) 
        : null;

    // 튜토리얼 오버레이가 대화를 담당하는 단계인지 판단
    const isTutorialDialogueActive = isLocalTutorial && currentMarketStep && 
        ['BROWSE_GOODS_GUIDE', 'GARRICK_AFTER_PURCHASE_DIALOG_GUIDE', 'GARRICK_EXIT_DIALOG_GUIDE'].includes(currentMarketStep);
    const shouldHideLobbyDialogue = false;
    const lobbyDialogue =
        isLocalTutorial && currentMarketStep === 'LEAVE_MARKET_GUIDE'
            ? t(language, 'marketTutorial.dialogue.exit_square', { playerName })
            : dialogue;
    const resolvedLobbyDialogue = lobbyDialogue.trim().length > 0
        ? lobbyDialogue
        : t(language, 'market.garrick_intro', { playerName });

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
                <CommonBackButton
                    onClick={handlers.handleBackToMain}
                    data-tutorial-id="MARKET_BACK_BUTTON"
                    label={t(language, 'common.back')}
                    className="absolute left-3 top-3 z-[1050] md:left-4 md:top-4"
                    widthClassName="w-[128px] md:w-[162px]"
                    heightClassName="h-[52px] md:h-[66px]"
                />
            )}

            {viewMode === 'INTERACTION' ? (
                <MarketLobbyView 
                    dialogue={resolvedLobbyDialogue}
                    garrickAffinity={state.garrickAffinity}
                    talkedToday={state.talkedToGarrickToday}
                    floatingHearts={floatingHearts}
                    pendingGiftItem={pendingGiftItem}
                    onTalk={handlers.handleTalk}
                    onOpenGiftModal={() => setShowGiftModal(true)}
                    onOpenCatalog={() => setViewMode('CATALOG')}
                    onConfirmGift={handlers.handleConfirmGift}
                    onCancelGift={() => market.setPendingGiftItem(null)}
                    isTutorialActive={!!isTutorialDialogueActive}
                    hideLobbyDialogue={shouldHideLobbyDialogue}
                />
            ) : (
                <MarketCatalogView 
                    categorizedMarketItems={categorizedMarketItems}
                    collapsedSections={collapsedSections}
                    marketStock={state.marketStock}
                    cart={cart}
                    inventory={state.inventory}
                    catalogMultiplier={market.catalogMultiplier}
                    garrickAffinity={state.garrickAffinity}
                    gold={state.stats.gold}
                    totalCost={totalCost}
                    isCartOpen={isCartOpen}
                    onBack={() => setViewMode('INTERACTION')}
                    onToggleSection={(id) => setCollapsedSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])}
                    onAddToCart={handlers.addToCart}
                    onSetMultiplier={market.setCatalogMultiplier}
                    onToggleCart={() => {
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
                            <h3 className="font-bold text-stone-200 font-serif uppercase tracking-widest text-sm">{t(language, 'market.gift_modal_title')}</h3>
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

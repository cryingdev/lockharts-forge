import React, { useState, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import DialogueBox from '../../DialogueBox';
import { Store, Heart, ArrowLeft, ChevronLeft, ScrollText } from 'lucide-react';
import { getAssetUrl } from '../../../utils';
import { useShop } from './hooks/useShop';
import { DialogueOption } from '../../../types/game-state';

// Sub-components
import { ShopSign } from './ui/ShopSign';
import { AnimatedMercenary } from '../../common/ui/AnimatedMercenary';
import { CustomerHUD } from './ui/CustomerHUD';
import { ShopQueueBadge } from './ui/ShopQueueBadge';
import { ShopClosedOverlay } from './ui/ShopClosedOverlay';
import { InstanceSelectorPopup } from './ui/InstanceSelectorPopup';
import { SfxButton } from '../../common/ui/SfxButton';
import { t } from '../../../utils/i18n';

interface ShopTabProps {
    onNavigate: (tab: any) => void;
}

const ShopTab: React.FC<ShopTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();
  const shop = useShop(onNavigate);
  const language = state.settings.language;

  useEffect(() => {
    actions.triggerNamedEncounterCheck('SHOP');
  }, []);

  const [counterImgError, setCounterImgError] = useState(false);
  const isOpeningStep = state.tutorialStep === 'OPEN_SHOP_SIGN_GUIDE';
  
  // MainGameLayout에서 글로벌로 처리하는 튜토리얼 대화 단계인지 확인 (Shop 인트로만 해당)
  const isGlobalTutorialDialogue = state.tutorialStep === 'SHOP_INTRO_DIALOG_GUIDE';

  return (
    <div className="fixed inset-0 z-[1000] bg-stone-900 overflow-hidden flex flex-col items-center justify-center px-safe">
        <style>{`
            @keyframes heartFloatUp { 
                0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; } 
                15% { opacity: 1; } 
                80% { opacity: 0.8; }
                100% { transform: translateY(-350px) translateX(var(--wobble)) scale(1.4); opacity: 0; } 
            }
            .animate-heart { animation: heartFloatUp 2.5s ease-out forwards; }
        `}</style>

        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
            <img 
                src={getAssetUrl('shop_bg.jpeg', 'bg')} 
                className="absolute top-0 opacity-60 w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.background = 'linear-gradient(to bottom, #292524, #1c1917)'; }}
            />
        </div>

        {/* Back Button - Immersive navigation */}
        {!shop.isTutorialActive && (
            <SfxButton sfx="switch" onClick={() => onNavigate('MAIN')} className="absolute top-4 left-4 z-[1050] flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 rounded-xl border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> <span className="text-xs font-black uppercase tracking-widest">{t(language, 'common.back')}</span>
            </SfxButton>
        )}

        {/* Paging Button - To Forge (오른쪽 중앙 배치) */}
        {(!shop.isTutorialActive || state.tutorialStep === 'CRAFT_FIRST_SWORD_GUIDE') && (
            <SfxButton 
                sfx="switch" 
                onClick={() => {
                    if (state.tutorialStep === 'CRAFT_FIRST_SWORD_GUIDE') {
                        actions.setTutorialStep('OPEN_RECIPE_GUIDE');
                    }
                    onNavigate('FORGE');
                }} 
                data-tutorial-id="NAV_TO_FORGE"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-[1050] w-8 h-24 bg-stone-900/60 hover:bg-amber-600/40 text-amber-500 rounded-l-2xl border-y border-l border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-95 group flex items-center justify-center"
            >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </SfxButton>
        )}

        {/* Floating Sign */}
        <ShopSign 
            isOpen={shop.isShopOpen} 
            onToggle={shop.handlers.handleToggleShop} 
            disabled={shop.isTutorialActive && !isOpeningStep}
            isPulsing={state.tutorialStep === 'OPEN_SHOP_SIGN_GUIDE'}
        />

        {/* UI Elements: Queue & HUD */}
        {shop.isShopOpen && shop.dialogueState && (
            <>
                <ShopQueueBadge count={shop.shopQueue.length} />
                {shop.activeCustomer && (
                    <CustomerHUD 
                        mercenary={shop.activeCustomer.mercenary} 
                        refusalReaction={shop.refusalReaction} 
                    />
                )}
            </>
        )}

        {/* Character Stage - Anchored to bottom of ShopTab */}
        <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none">
        {shop.isShopOpen && shop.activeCustomer && shop.dialogueState && (
            <div className="relative flex justify-center items-end w-full h-full animate-in fade-in zoom-in-95 duration-700 ease-out">
                <div className="relative h-[70dvh] max-h-[100dvh] flex items-end justify-center">
                    {/* 하트가 캐릭터 앞쪽에서 떠오르도록 z-20 설정, y축 시작점 bottom 상향 조정 */}
                    {shop.floatingHearts.map((heart) => (
                    <Heart
                        key={heart.id}
                        className="absolute animate-heart fill-pink-500 text-pink-400 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)] z-20"
                        style={{
                        left: `${heart.left}%`,
                        bottom: '55%',
                        width: heart.size,
                        height: heart.size,
                        animationDelay: `${heart.delay}s`,
                        '--wobble': `${(Math.random() - 0.5) * 80}px`,
                        } as React.CSSProperties}
                    />
                    ))}

                    <AnimatedMercenary
                        mercenary={shop.activeCustomer.mercenary}
                        valign="bottom"
                        className={`h-full w-auto object-contain object-bottom filter drop-shadow-[0_0_100px_rgba(0,0,0,0.95)] transition-all duration-500 relative z-10 ${
                            shop.refusalReaction === 'ANGRY' ? 'brightness-50 sepia-50' : ''
                        }`}
                    />

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-16 bg-black/60 blur-3xl rounded-full -z-10"></div>
                </div>
            </div>
        )}
        </div>

        {/* Shop Counter */}
        <div className="absolute bottom-0 w-full h-[35dvh] md:h-64 z-30 flex items-end justify-center pointer-events-none">
            {/* Pip's Order Sticky Note */}
            {(state.tutorialStep === 'CRAFT_FIRST_SWORD_GUIDE' || state.tutorialStep === 'PIP_RETURN_GUIDE' || state.tutorialStep === 'PIP_RETURN_DIALOG_GUIDE') && (
                <div className="absolute top-0 left-10 md:left-24 -translate-y-1/2 z-40 animate-in slide-in-from-bottom-10 duration-700 pointer-events-auto">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 bg-amber-50 border-2 border-amber-200/50 shadow-xl rotate-[-6deg] p-2 md:p-3 flex flex-col items-center justify-center group hover:rotate-0 transition-transform cursor-help">
                        {/* Tape effect */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-stone-400/30 rotate-3"></div>
                        
                        <ScrollText className="w-5 h-5 md:w-6 md:h-6 text-amber-700 mb-1" />
                        <span className="text-[8px] md:text-[10px] font-black text-amber-900 uppercase tracking-tighter text-center leading-none">
                            {t(language, 'tutorial.pip_order_note_title')}<br/>{t(language, 'tutorial.pip_order_note_item')}
                        </span>
                        <div className="mt-1 w-full h-0.5 bg-amber-200/50"></div>
                        <span className="text-[6px] md:text-[8px] text-amber-700/60 font-serif italic mt-1">"{t(language, 'tutorial.pip_order_note_quote')}"</span>
                    </div>
                </div>
            )}

            {!counterImgError ? (
                <img 
                    src={getAssetUrl('shop_counter.png', 'bg')} 
                    className="w-full h-full object-cover object-top filter drop-shadow-[0_-30px_50px_rgba(0,0,0,0.8)]"
                    onError={() => setCounterImgError(true)}
                />
            ) : (
                <div className="w-full h-full bg-[#3f2e22] border-t-2 md:border-t-[8px] border-[#5d4037] shadow-[0_-40px_60px_rgba(0,0,0,0.85)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)' }}></div>
                </div>
            )}
        </div>

        {/* Dialogue Box Container - Unified 표준 규격 적용 */}
        <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl z-50 flex flex-col items-center pointer-events-auto">
            {/* 튜토리얼 전역 대화창이 떠있을 때는 로컬 대화창을 숨김 */}
            {shop.isShopOpen && shop.dialogueState && !isGlobalTutorialDialogue && (
                 <DialogueBox 
                    speaker={shop.dialogueState.speaker}
                    text={shop.dialogueState.text}
                    options={(shop.dialogueState.options as DialogueOption[]).map(opt => ({
                        ...opt,
                        action: () => {
                            if (opt.action) {
                                if (typeof opt.action === 'function') {
                                    opt.action();
                                } else if (typeof opt.action === 'object' && opt.action !== null) {
                                    actions.dispatch(opt.action);
                                }
                            }
                            if (opt.targetTab) {
                                onNavigate(opt.targetTab as any);
                            }
                        }
                    }))}
                    highlightTerm={(shop.dialogueState as any).highlightTerm}
                    itemDetail={(shop.dialogueState as any).itemDetail}
                    className="w-full relative pointer-events-auto"
                />
            )}
        </div>

        {/* Modals & Overlays */}
        <InstanceSelectorPopup 
            show={shop.showInstanceSelector}
            onClose={() => shop.handlers.setShowInstanceSelector(false)}
            matchingItems={shop.matchingItems}
            selectedInstance={shop.selectedInstance}
            onSelect={shop.handlers.setSelectedInstance}
            onSell={shop.handlers.executeSell}
            onToggleLock={(id) => actions.toggleLockItem(id)}
            customerMarkup={shop.activeCustomer?.request.markup || 1.25}
        />

        <ShopClosedOverlay 
            isOpen={shop.isShopOpen}
            onNavigate={onNavigate}
        />

        {shop.isShopOpen && !shop.activeCustomer && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none pb-20">
                <div className="text-center animate-in fade-in zoom-in duration-1000">
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 backdrop-blur-xl shadow-inner">
                        <Store className="w-10 h-10 md:w-12 md:h-12 text-stone-700 animate-pulse" />
                    </div>
                    <h3 className="text-lg md:text-2xl font-black text-stone-50 uppercase tracking-[0.3em] opacity-40">{t(language, 'shop.awaiting_customers')}</h3>
                </div>
            </div>
        )}
    </div>
  );
};

export default ShopTab;

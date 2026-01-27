
import React, { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import DialogueBox from '../../DialogueBox';
import { Store, Heart } from 'lucide-react';
import { getAssetUrl } from '../../../utils';
import { useShop } from './hooks/useShop';

// Sub-components
import { ShopSign } from './ui/ShopSign';
import { AnimatedMercenary } from '../../common/ui/AnimatedMercenary';
import { CustomerHUD } from './ui/CustomerHUD';
import { ShopQueueBadge } from './ui/ShopQueueBadge';
import { ShopClosedOverlay } from './ui/ShopClosedOverlay';
import { InstanceSelectorPopup } from './ui/InstanceSelectorPopup';

interface ShopTabProps {
    onNavigate: (tab: any) => void;
}

const ShopTab: React.FC<ShopTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();
  const shop = useShop();
  const [counterImgError, setCounterImgError] = useState(false);

  // 튜토리얼 중 상점 열기 단계인지 확인
  const isOpeningStep = state.tutorialStep === 'OPEN_SHOP_SIGN_GUIDE';

  return (
    <div className="relative h-full w-full bg-stone-900 overflow-hidden flex flex-col items-center justify-center">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
            <img 
                src={getAssetUrl('shop_bg.jpeg', 'bg')} 
                className="absolute top-0 opacity-60 w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.background = 'linear-gradient(to bottom, #292524, #1c1917)'; }}
            />
        </div>

        {/* Floating Sign */}
        <ShopSign 
            isOpen={shop.isShopOpen} 
            onToggle={shop.handlers.handleToggleShop} 
            disabled={isOpeningStep ? false : ((!shop.isShopOpen && !shop.canAffordOpen) || shop.isTutorialActive)}
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
                {/* ✅ ShopTab(=h-full) 기준 80% 스테이지 */}
                <div className="relative w-full h-[80%] flex items-end justify-center">
                    {shop.floatingHearts.map((heart) => (
                    <Heart
                        key={heart.id}
                        className="absolute animate-heart fill-pink-500 text-pink-400 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)] z-0"
                        style={{
                        left: `${heart.left}%`,
                        bottom: '40%',
                        width: heart.size,
                        height: heart.size,
                        animationDelay: `${heart.delay}s`,
                        '--wobble': `${(Math.random() - 0.5) * 60}px`,
                        } as React.CSSProperties}
                    />
                    ))}

                    {/* ✅ height prop 제거 + h-full로 스테이지에 정확히 맞춤 */}
                    <AnimatedMercenary
                        mercenary={shop.activeCustomer.mercenary}
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
        <div className="absolute bottom-0 w-full h-[35dvh] md:h-64 z-20 flex items-end justify-center pointer-events-none">
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

        {/* Dialogue Box */}
        <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl z-50 flex flex-col items-center pointer-events-auto">
            {shop.isShopOpen && shop.dialogueState && (
                 <DialogueBox 
                    speaker={shop.dialogueState.speaker}
                    text={shop.dialogueState.text}
                    options={shop.dialogueState.options}
                    // Fix: Use type assertion to access optional properties in union type
                    highlightTerm={(shop.dialogueState as any).highlightTerm}
                    // Fix: Use type assertion to access optional properties in union type
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
            canAffordOpen={shop.canAffordOpen}
            onNavigate={onNavigate}
        />

        {shop.isShopOpen && !shop.activeCustomer && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none pb-20">
                <div className="text-center animate-in fade-in zoom-in duration-1000">
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 backdrop-blur-xl shadow-inner">
                        <Store className="w-10 h-10 md:w-12 md:h-12 text-stone-700 animate-pulse" />
                    </div>
                    <h3 className="text-lg md:text-2xl font-black text-stone-500 uppercase tracking-[0.3em] opacity-40">Awaiting Customers</h3>
                </div>
            </div>
        )}
    </div>
  );
};

export default ShopTab;

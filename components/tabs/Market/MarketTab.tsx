import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useGame } from '../../../context/GameContext';
import DialogueBox from '../../DialogueBox';
import {
  Store,
  ShoppingCart,
  ShoppingBag,
  Coins,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Plus,
  Minus,
  Package,
  MessageSquare,
  ArrowLeft,
  X,
  Pointer,
  Heart,
  Gift,
  Lock,
  Unlock,
  Sword,
  Shield,
  Star
} from 'lucide-react';
import { MATERIALS } from '../../../data/materials';
import { MARKET_CATALOG } from '../../../data/market/index';
import { getAssetUrl } from '../../../utils';
import { InventoryItem } from '../../../types/inventory';
import { ItemSelectorList } from '../../ItemSelectorList';

interface MarketTabProps {
  onNavigate: (tab: any) => void;
}

type MarketViewMode = 'INTERACTION' | 'CATALOG';

type SequenceStep = 
    | 'BROWSE_GOODS_GUIDE'
    | 'FURNACE_GUIDE'
    | 'OPEN_SHOPPING_CART'
    | 'CLOSE_SHOPPING_CART'
    | 'PAY_NOW'
    | 'TALK_TO_GARRICK_AFTER_PURCHASE'
    | 'LEAVE_MARKET_GUIDE';

type TutorialDirection = 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';

interface SceneStepConfig {
    targetId: string;
    label: string;
    direction: TutorialDirection;
}

interface FloatingHeart {
    id: number;
    left: number;
    delay: number;
    size: number;
}

const SCENE_STEPS_CONFIG: Record<SequenceStep, SceneStepConfig> = {
    BROWSE_GOODS_GUIDE: { targetId: 'BROWSE_GOODS_BUTTON', label: 'Browse Goods', direction: 'top' },
    FURNACE_GUIDE: { targetId: 'FURNACE_ITEM', label: 'Select the Furnace', direction: 'bottomright' },
    OPEN_SHOPPING_CART: { targetId: 'CART_TOGGLE', label: 'Open the Cart', direction: 'left' },
    CLOSE_SHOPPING_CART: { targetId: 'CART_TOGGLE', label: 'Close the Cart', direction: 'right' },
    PAY_NOW: { targetId: 'PAY_NOW_BUTTON', label: 'Finalize Purchase', direction: 'bottomleft' },
    TALK_TO_GARRICK_AFTER_PURCHASE: { targetId: 'GARRICK_TALK_BUTTON', label: 'Talk to Garrick', direction: 'top' },
    LEAVE_MARKET_GUIDE: { targetId: 'MARKET_BACK_BUTTON', label: 'Return to Forge', direction: 'bottom' },
};

const SCRIPTS: Record<SequenceStep, { speaker: string, text: string }> = {
    BROWSE_GOODS_GUIDE: { speaker: "Garrick", text: "Welcome back, smith! I've been keeping the heavy equipment in the back. Open up my catalog and see if something catches your eye." },
    FURNACE_GUIDE: { speaker: "Garrick", text: "There it is! A fine piece of engineering. It's not as grand as your old one, but it'll bring the fire back to your lineage in no time." },
    OPEN_SHOPPING_CART: { speaker: "Garrick", text: "Going to settle the bill? Open your cart on the right. I like my ledgers clean, and I'm sure you do too." },
    CLOSE_SHOPPING_CART: { speaker: "Garrick", text: "Everything look correct? Good. Now close the list so we can talk business and get that unit delivered." },
    PAY_NOW: { speaker: "Garrick", text: "Hand over the coin, and the future is yours. I'll make sure it's at your doorstep before you even get home." },
    TALK_TO_GARRICK_AFTER_PURCHASE: { speaker: "Lockhart", text: "I should say goodbye to Garrick before I leave. He's been helpful during this difficult time." },
    LEAVE_MARKET_GUIDE: { speaker: "Garrick", text: "Safe travels, Lockhart. Don't let those embers go cold again. Come back when you need real steel supplies!" },
};

const LocalSpotlight = ({ step }: { step: SequenceStep }) => {
    const { actions } = useGame();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [animatedRadius, setAnimatedRadius] = useState(2000);
    const requestRef = useRef<number | null>(null);
    const animRef = useRef<number | null>(null);
    
    const config = SCENE_STEPS_CONFIG[step];
    const script = SCRIPTS[step];

    const updateRect = useCallback(() => {
        if (!config) return;
        const el = document.querySelector(`[data-tutorial-id="${config.targetId}"]`);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) setTargetRect(rect);
            else setTargetRect(null);
        } else {
            setTargetRect(null);
        }
        requestRef.current = requestAnimationFrame(updateRect);
    }, [config]);

    useEffect(() => {
        if (!targetRect) return; 
        const targetR = Math.max(targetRect.width, targetRect.height) / 1.3;
        setAnimatedRadius(2000);
        const startTime = performance.now();
        const duration = 1300;
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const nextR = 2000 - (2000 - targetR) * easeOut;
            setAnimatedRadius(nextR);
            if (progress < 1) animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [config?.targetId, !!targetRect]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateRect);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [updateRect]);

    if (!config) return null;

    const { top, left, width, height } = targetRect || { top: 0, left: 0, width: 0, height: 0 };
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    let pointerStyles: React.CSSProperties = {};
    let iconRotation = '';
    let animationClass = '';
    let containerLayout = '';
    let labelMargin = '';

    const cardinalBuffer = 12;

    switch (config.direction) {
        case 'top':
            pointerStyles = { left: centerX, top: top - cardinalBuffer, transform: 'translate(-50%, -100%)' };
            iconRotation = 'rotate(180deg)';
            animationClass = 'animate-bounce-reverse';
            containerLayout = 'flex-col-reverse';
            labelMargin = 'mb-3';
            break;
        case 'bottom':
            pointerStyles = { left: centerX, top: top + height + cardinalBuffer, transform: 'translateX(-50%)' };
            iconRotation = 'rotate(0deg)';
            animationClass = 'animate-bounce';
            containerLayout = 'flex-col';
            labelMargin = 'mt-3';
            break;
        case 'left':
            pointerStyles = { left: left - cardinalBuffer, top: centerY, transform: 'translate(-100%, -50%)' };
            iconRotation = 'rotate(90deg)';
            animationClass = 'animate-bounce-x-reverse';
            containerLayout = 'flex-row-reverse';
            labelMargin = 'mr-3';
            break;
        case 'right':
            pointerStyles = { left: left + width + cardinalBuffer, top: centerY, transform: 'translateY(-50%)' };
            iconRotation = 'rotate(-90deg)';
            animationClass = 'animate-bounce-x';
            containerLayout = 'flex-row';
            labelMargin = 'ml-3';
            break;
        case 'topleft':
            pointerStyles = { left:left - 5, top, transform: 'translate(-50%, -100%)' };
            iconRotation = 'rotate(135deg)';
            animationClass = 'animate-bounce-tl';
            containerLayout = 'flex-col-reverse items-end';
            labelMargin = 'mb-2 mr-2';
            break;
        case 'topright':
            pointerStyles = { left: left + width, top, transform: 'translate(-50%, -100%)' };
            iconRotation = 'rotate(-135deg)';
            animationClass = 'animate-bounce-tr';
            containerLayout = 'flex-col-reverse items-start';
            labelMargin = 'mb-2 ml-2';
            break;
        case 'bottomleft':
            pointerStyles = { left: left - 5, top: top + height, transform: 'translate(-50%, -25%)' };
            iconRotation = 'rotate(45deg)';
            animationClass = 'animate-bounce-bl';
            containerLayout = 'flex-col items-end';
            labelMargin = 'mt-2 mr-2';
            break;
        case 'bottomright':
            pointerStyles = { left: left + width + 5, top: top + height, transform: 'translate(-50%, -25%)' };
            iconRotation = 'rotate(-45deg)';
            animationClass = 'animate-bounce-br';
            containerLayout = 'flex-col items-start';
            labelMargin = 'mt-2 ml-2';
            break;
        default:
            pointerStyles = { left: centerX, top: top + height + cardinalBuffer, transform: 'translateX(-50%)' };
            iconRotation = 'rotate(0deg)';
            animationClass = 'animate-bounce';
            containerLayout = 'flex-col';
            labelMargin = 'mt-3';
            break;
    }

    const dialogueOptions = [];
    if (step === 'BROWSE_GOODS_GUIDE') {
        dialogueOptions.push({ 
            label: "Browse Goods", 
            action: () => actions.setTutorialStep('FURNACE_GUIDE'), 
            variant: 'primary' as const 
        });
    } else if (step === 'TALK_TO_GARRICK_AFTER_PURCHASE') {
        dialogueOptions.push({ 
            label: "Talk", 
            action: () => actions.setTutorialStep('LEAVE_MARKET_GUIDE'), 
            variant: 'primary' as const 
        });
    }

    return (
        <div className="fixed inset-0 z-[4000] pointer-events-none overflow-hidden">
            <style>{`
                @keyframes bounce-x { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(12px); } }
                @keyframes bounce-x-reverse { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-12px); } }
                @keyframes bounce-reverse { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
                @keyframes bounce-tl { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-8px, -8px); } }
                @keyframes bounce-tr { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(8px, -8px); } }
                @keyframes bounce-bl { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-8px, 8px); } }
                @keyframes bounce-br { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(8px, 8px); } }
                .animate-bounce-x { animation: bounce-x 1s infinite; }
                .animate-bounce-x-reverse { animation: bounce-x-reverse 1s infinite; }
                .animate-bounce-reverse { animation: bounce-reverse 1s infinite; }
                .animate-bounce-tl { animation: bounce-tl 1s infinite; }
                .animate-bounce-tr { animation: bounce-tr 1s infinite; }
                .animate-bounce-bl { animation: bounce-bl 1s infinite; }
                .animate-bounce-br { animation: bounce-br 1s infinite; }
            `}</style>

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="tutorial-mask-market">
                        <rect width="100%" height="100%" fill="white" />
                        {targetRect && <circle cx={centerX} cy={centerY} r={animatedRadius} fill="black" />}
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill={`rgba(0,0,0,${Math.min(0.75, 1.5 - (animatedRadius / 1000))})`} mask="url(#tutorial-mask-market)" />
            </svg>

            {targetRect && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full pointer-events-auto bg-transparent" style={{ height: top }} />
                    <div className="absolute left-0 w-full pointer-events-auto bg-transparent" style={{ top: top + height, bottom: 0 }} />
                    <div className="absolute top-0 left-0 pointer-events-auto bg-transparent" style={{ top, height, width: left }} />
                    <div className="absolute top-0 pointer-events-auto bg-transparent" style={{ top, height, left: left + width, right: 0 }} />
                </div>
            )}

            {targetRect && (
                <div key={`${config.targetId}-${config.direction}`} className="absolute animate-in fade-in zoom-in-95 duration-300" style={pointerStyles}>
                    <div className={`flex items-center ${containerLayout} ${animationClass}`}>
                        <Pointer className={`w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]`} style={{ transform: iconRotation }} />
                        <div className={`${labelMargin} px-4 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-2xl whitespace-nowrap border-2 border-amber-400`}>
                            {config.label}
                        </div>
                    </div>
                </div>
            )}

            {script && (
                <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl pointer-events-none z-[5000]">
                    <DialogueBox 
                        speaker={script.speaker} 
                        text={script.text} 
                        options={dialogueOptions} 
                        className="w-full relative pointer-events-auto" 
                    />
                </div>
            )}
        </div>
    );
};

const GarrickSprite = ({ floatingHearts }: { floatingHearts: FloatingHeart[] }) => {
  const [frame, setFrame] = useState(0); 
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const blink = useCallback(() => {
    setFrame(1);
    setTimeout(() => {
      setFrame(2);
      setTimeout(() => {
        setFrame(1);
        setTimeout(() => {
          setFrame(0);
          scheduleNextBlink();
        }, 80);
      }, 100);
    }, 80);
  }, []);

  const scheduleNextBlink = useCallback(() => {
    const delay = 3000 + Math.random() * 4000;
    timerRef.current = setTimeout(blink, delay);
  }, [blink]);

  useEffect(() => {
    scheduleNextBlink();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleNextBlink]);

  return (
    <div className="relative w-full h-full flex items-end justify-center pointer-events-none">
      <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full -z-10 animate-pulse"></div>
      
      {/* Floating Hearts Behind Sprite */}
      {floatingHearts.map(heart => (
           <Heart 
                key={heart.id}
                className="absolute animate-heart fill-pink-500 text-pink-400 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)] z-0"
                style={{
                    left: `${heart.left}%`,
                    bottom: '40%',
                    width: heart.size,
                    height: heart.size,
                    animationDelay: `${heart.delay}s`,
                    '--wobble': `${(Math.random() - 0.5) * 60}px`
                } as React.CSSProperties}
           />
       ))}

      <div 
        className="relative h-[75dvh] md:h-[110dvh] flex justify-center overflow-hidden bottom-[12dvh] md:bottom-0 md:translate-y-[15dvh] z-10"
        style={{ aspectRatio: '453.3 / 1058' }}
      >
        <div 
          className="h-full w-full transition-transform duration-75 ease-linear"
          style={{
            backgroundImage: `url(${getAssetUrl('garrick_standing_sprite.png')})`,
            backgroundSize: '300% 100%',
            backgroundPosition: `${frame * 50}% 0%`,
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 50px rgba(0,0,0,0.9))'
          }}
        />
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 h-10 bg-black/60 blur-3xl rounded-full -z-10"></div>
    </div>
  );
};

const MarketTab: React.FC<MarketTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();

  const [viewMode, setViewMode] = useState<MarketViewMode>('INTERACTION');
  const [dialogue, setDialogue] = useState("Ah, Lockhart. I heard the hammer falling on that old anvil again. Good to see you haven't given up on the family trade.");
  
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [itemMultipliers, setItemMultipliers] = useState<Record<string, number>>({});

  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showGiftModal, setShowGiftModal] = useState(false);

  const { hasFurnace, hasWorkbench } = state.forge;
  const currentTier = state.stats.tierLevel;

  const currentTutorialStep = state.tutorialStep as SequenceStep | null;
  const isLocalTutorialStep = currentTutorialStep && SCENE_STEPS_CONFIG[currentTutorialStep];

  useEffect(() => {
    if (state.tutorialStep === 'FURNACE_GUIDE') {
        setViewMode('CATALOG');
    } else if (state.tutorialStep === 'TALK_TO_GARRICK_AFTER_PURCHASE') {
        setViewMode('INTERACTION');
    }
  }, [state.tutorialStep]);

  const spawnHearts = useCallback((count: number) => {
    const newHearts = Array.from({ length: count }).map((_, i) => ({
        id: Date.now() + i,
        left: 40 + Math.random() * 20, 
        delay: Math.random() * 0.5, 
        size: 16 + Math.random() * 12
    }));
    setFloatingHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => setFloatingHearts([]), 3500);
  }, []);

  // Track affinity for logic (trigger hearts when affinity increases)
  const prevAffinityRef = useRef<number>(state.garrickAffinity);
  useEffect(() => {
      if (state.garrickAffinity > prevAffinityRef.current) {
          const diff = state.garrickAffinity - prevAffinityRef.current;
          spawnHearts(Math.min(10, diff * 2));
      }
      prevAffinityRef.current = state.garrickAffinity;
  }, [state.garrickAffinity, spawnHearts]);

  const cartItemCount = useMemo(
    () => (Object.values(cart) as number[]).reduce((a, b) => a + b, 0),
    [cart]
  );

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [id, count]) => {
      const item = MARKET_CATALOG.find(i => i.id === id);
      return total + (item ? item.price * (count as number) : 0);
    }, 0);
  };

  const totalCost = calculateTotal();

  const handleTalk = () => {
    if (!state.talkedToGarrickToday) {
        actions.talkGarrick();
    }

    const lines = [
      "The roads are getting dangerous. My suppliers are demanding hazard pay, which means my prices might sting a bit.",
      "Looking for something specific? If it's for metalwork, I've got the basics covered.",
      "I remember your grandfather. He could forge a blade that could cut through silk and stone in the same breath.",
      "The village feels quieter since the fire. But your forge... it's a sign of hope, I suppose.",
      "Don't go getting yourself killed in those ruins. I need my best customers alive and paying!",
      "If you're looking for rarer materials, you'll have to prove that forge of yours is worth the investment."
    ];
    setDialogue(lines[Math.floor(Math.random() * lines.length)]);
  };

  const handleGift = (itemId: string) => {
    const item = state.inventory.find(i => i.id === itemId);
    if (item?.isLocked) {
        actions.showToast("Cannot gift locked items.");
        return;
    }
    actions.giftGarrick({ itemId });
    setShowGiftModal(false);
    setDialogue("For me? Hah, you're a thoughtful one, Lockhart. I'll make sure to remember this kindness.");
  };

  const addToCart = (itemId: string, amount: number = 1) => {
    const isOneTimeItem = itemId === 'furnace' || itemId === 'workbench' || itemId.startsWith('scroll_');
    const availableStock = state.marketStock[itemId] || 0;
    const currentInCart = cart[itemId] || 0;

    if (currentInCart >= availableStock) return false;

    const canAddCount = Math.min(amount, availableStock - currentInCart);
    if (canAddCount <= 0) return false;

    if (itemId === 'furnace' && state.tutorialStep === 'FURNACE_GUIDE') {
        actions.setTutorialStep('OPEN_SHOPPING_CART');
    }

    setCart(prev => {
      const nowInCart = prev[itemId] || 0;
      if (nowInCart >= availableStock) return prev;
      if (isOneTimeItem && nowInCart > 0) return prev;

      return {
        ...prev,
        [itemId]: nowInCart + (isOneTimeItem ? 1 : canAddCount),
      };
    });

    return true;
  };

  const removeFromCart = (itemId: string) => {
    let stillHasItems = true;
    setCart(prev => {
      const currentInCart = prev[itemId] || 0;
      if (currentInCart <= 0) {
        stillHasItems = false;
        return prev;
      }

      const newCount = currentInCart - 1;
      const newCart = { ...prev };
      if (newCount <= 0) {
        delete newCart[itemId];
        stillHasItems = false;
      } else {
        newCart[itemId] = newCount;
      }
      return newCart;
    });
    return stillHasItems;
  };

  const deleteFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[itemId];
      return newCart;
    });
  };

  const setItemMultiplier = (itemId: string, value: number) => {
    setItemMultipliers(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleBuy = () => {
    if (cartItemCount === 0) {
      actions.showToast("Your cart is empty.");
      return;
    }
    if (totalCost > state.stats.gold) {
      actions.showToast("Insufficient Gold!");
      return;
    }

    const hasFurnaceInCart = !!cart['furnace'];

    if (state.tutorialStep === 'PAY_NOW') {
        if (hasFurnaceInCart) {
          actions.setTutorialStep('TALK_TO_GARRICK_AFTER_PURCHASE');
        } else {
          actions.setTutorialStep(null);
        }
    }

    const itemsToBuy = Object.entries(cart).map(([id, count]) => ({ id, count }));
    actions.buyItems(itemsToBuy, totalCost);
    setCart({});
    actions.showToast("Purchase complete!");
  };

  const toggleCart = () => {
    if (!isCartOpen && state.tutorialStep === 'OPEN_SHOPPING_CART') {
        actions.setTutorialStep('CLOSE_SHOPPING_CART');
    } 
    else if (isCartOpen && state.tutorialStep === 'CLOSE_SHOPPING_CART') {
        actions.setTutorialStep('PAY_NOW');
    }
    setIsCartOpen(!isCartOpen);
  };

  const handleBackToForge = () => {
    if (state.tutorialStep === 'LEAVE_MARKET_GUIDE') {
      actions.setTutorialScene('FURNACE_RESTORED');
    }
    onNavigate('FORGE');
  };

  const getQualityLabel = (q: number): string => {
      if (q >= 110) return 'MASTERWORK';
      if (q >= 100) return 'PRISTINE';
      if (q >= 90) return 'SUPERIOR';
      if (q >= 80) return 'FINE';
      if (q >= 70) return 'STANDARD';
      if (q >= 60) return 'RUSTIC';
      return 'CRUDE';
  };

  // Garrick이 판매 중인 아이템 ID 목록
  const marketItemIds = useMemo(() => MARKET_CATALOG.map(item => item.id), []);

  const giftableItems = state.inventory.filter(i => 
    (i.type === 'RESOURCE' || 
    i.type === 'CONSUMABLE' || 
    i.type === 'EQUIPMENT' ||
    i.type === 'SCROLL') &&
    !marketItemIds.includes(i.id) // Garrick이 판매하는 품목 제외
  );

  const getItemImageUrl = (item: InventoryItem) => {
    if (item.type === 'SCROLL') return getAssetUrl('scroll.png');
    if (item.id.startsWith('scroll_') || item.id.startsWith('recipe_scroll_')) return getAssetUrl('scroll.png');
    if (item.type === 'EQUIPMENT' && item.equipmentData) {
        if (item.equipmentData.image) return getAssetUrl(item.equipmentData.image);
        return item.equipmentData.recipeId ? getAssetUrl(`${item.equipmentData.recipeId}.png`) : getAssetUrl(`${item.id.split('_')[0]}.png`);
    }
    return getAssetUrl(`${item.id}.png`);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-stone-950 overflow-hidden flex flex-col items-center justify-center animate-in fade-in duration-500 px-safe">
      
      <style>
        {`
            @keyframes heartFloatUp {
                0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
                20% { opacity: 1; }
                100% { transform: translateY(-350px) translateX(var(--wobble)) scale(1.4); opacity: 0; }
            }
            .animate-heart {
                animation: heartFloatUp 2.5s ease-out forwards;
            }
        `}
      </style>

      {isLocalTutorialStep && (
          <LocalSpotlight step={currentTutorialStep!} />
      )}

      {/* Background - Base for both modes */}
      <div className="absolute inset-0 z-0">
        <img 
          src={getAssetUrl('garricks_store_bg.png')} 
          alt="Garrick's Store" 
          className="absolute top-0 opacity-60 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.style.background = 'linear-gradient(to bottom, #292524, #1c1917)';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/30"></div>
      </div>

      {/* 퇴장 버튼 */}
      {(!isLocalTutorialStep || state.tutorialStep === 'LEAVE_MARKET_GUIDE') && (
        <button 
            onClick={handleBackToForge}
            data-tutorial-id="MARKET_BACK_BUTTON"
            className={`absolute top-4 left-4 z-[1050] flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 hover:text-red-100 rounded-xl border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90 group`}
            title="Leave Market"
        >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>
      )}

      {/* Garrick Character - Always visible behind UI */}
      <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
        <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in-95 duration-1000 ease-out">
          
          {/* Garrick Affinity HUD - Positioned next to him */}
          <div className="absolute top-[12dvh] md:top-32 left-[calc(50%+85px)] md:left-[calc(50%+180px)] z-[1050] scale-90 md:scale-100 animate-in slide-in-from-right-4 duration-500 pointer-events-auto">
            <div className="bg-stone-900/85 border-2 border-stone-700 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-2 ring-1 ring-white/5">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                <div className="flex flex-col leading-none">
                    <span className="text-[7px] text-stone-500 font-black uppercase tracking-widest">Garrick's Trust</span>
                    <span className="text-sm font-black font-mono text-pink-400">{state.garrickAffinity}</span>
                </div>
            </div>
          </div>

          <GarrickSprite floatingHearts={floatingHearts} />
        </div>
      </div>

      {/* MODE 1: INTERACTION (Standard Dialogue) */}
      {viewMode === 'INTERACTION' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-end pointer-events-none pb-[6dvh] md:pb-[12dvh]">
          <div className="w-[92vw] md:w-[85vw] max-w-5xl flex flex-col items-center gap-4">
            
            {!isLocalTutorialStep && (
              <div className="flex justify-end w-full gap-3 pointer-events-auto pr-0 md:pr-4">
                <button 
                    onClick={handleTalk}
                    data-tutorial-id="GARRICK_TALK_BUTTON"
                    className={`flex items-center gap-1.5 md:gap-2 px-6 py-2.5 md:py-3.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 rounded-xl backdrop-blur-md transition-all shadow-2xl group active:scale-95 ${state.talkedToGarrickToday ? 'opacity-70' : ''}`}
                  >
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    <span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">Talk</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowGiftModal(true)}
                    className="flex items-center gap-1.5 md:gap-2 px-6 py-2.5 md:py-3.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 hover:border-pink-500 rounded-xl backdrop-blur-md transition-all shadow-2xl group active:scale-95"
                  >
                    <Gift className="w-4 h-4 text-pink-500" />
                    <span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">Gift</span>
                  </button>

                  <button 
                    onClick={() => setViewMode('CATALOG')}
                    data-tutorial-id="BROWSE_GOODS_BUTTON"
                    className="flex items-center gap-1.5 md:gap-2 px-8 py-2.5 md:py-3.5 bg-amber-700/90 hover:bg-amber-600 border border-amber-500 rounded-xl backdrop-blur-md transition-all shadow-2xl group active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <span className="font-black text-[9px] md:text-xs text-white uppercase tracking-widest">Browse Goods</span>
                  </button>
              </div>
            )}

            {!isLocalTutorialStep && (
              <DialogueBox 
                speaker="Garrick"
                text={dialogue}
                className="w-full relative pointer-events-auto"
              />
            )}
          </div>
        </div>
      )}

      {/* MODE 2: CATALOG (Overlay with 10vh margin) */}
      {viewMode === 'CATALOG' && (
        <div className="absolute inset-x-[4vw] md:inset-x-[10vw] top-[10vh] bottom-[10vh] z-[100] animate-in zoom-in-95 fade-in duration-300 flex flex-col">
          {/* Main Overlay Container */}
          <div className="w-full h-full bg-stone-900/95 backdrop-blur-xl border-2 border-stone-700/50 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative">
            
            {/* Overlay Header */}
            <div className="bg-stone-850 p-3 md:p-5 border-b border-stone-800 flex items-center justify-between shrink-0 shadow-lg">
              <div className="flex items-center gap-2 md:gap-4">
                {!isLocalTutorialStep && (
                    <button 
                    onClick={() => setViewMode('INTERACTION')}
                    className="bg-stone-800 hover:bg-stone-700 p-2 md:p-3 rounded-xl border border-stone-700 transition-all active:scale-90"
                    title="Close Catalog"
                    >
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-stone-300" />
                    </button>
                )}
                <div className={isLocalTutorialStep ? 'ml-2' : ''}>
                  <h2 className="text-sm md:text-2xl font-black text-stone-100 font-serif tracking-tight uppercase leading-none">
                    Garrick's Wares
                  </h2>
                  <span className="text-[7px] md:text-[10px] font-mono font-bold text-amber-600 block mt-1 uppercase tracking-wider">
                    Tier {currentTier} Supplies
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isCartOpen && (
                  <button
                    onClick={handleBuy}
                    data-tutorial-id="PAY_NOW_BUTTON"
                    className={`relative flex items-center gap-2 md:gap-3 px-3 md:px-6 py-1.5 md:py-3 rounded-xl border transition-all shadow-lg active:scale-95 group ${
                      cartItemCount === 0
                        ? 'bg-stone-800/40 border-stone-700 text-stone-600 grayscale'
                        : totalCost > state.stats.gold
                          ? 'bg-red-900/40 border-red-700 text-red-300'
                          : 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(217,119,6,0.2)]'
                    }`}
                  >
                    <div className="relative">
                      <ShoppingCart className={`w-3.5 h-3.5 md:w-5 md:h-5 ${cartItemCount > 0 ? 'animate-bounce' : ''}`} />
                      {cartItemCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[7px] md:text-[9px] font-black px-1 rounded-full border border-stone-900 ring-1 ring-white/20">
                          {cartItemCount}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Checkout</span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <span className="text-[9px] md:text-sm font-mono font-black">{totalCost}</span>
                        <Coins className="w-2.5 h-2.5 md:w-4 md:h-4 text-amber-200" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Catalog Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Grid of Items */}
              <div className="flex-1 overflow-y-auto p-2 md:p-6 custom-scrollbar pb-24">
                <div className="grid gap-2.5 md:gap-6 content-start grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {MARKET_CATALOG.map(marketItem => {
                    const isKeyItem = marketItem.id === 'furnace' || marketItem.id === 'workbench';
                    const isOwned =
                      (marketItem.id === 'furnace' && state.forge.hasFurnace) ||
                      (marketItem.id === 'workbench' && state.forge.hasWorkbench);

                    if (isKeyItem && isOwned) return null;

                    let itemName = '';
                    let itemTier = 1;
                    if (marketItem.id === 'furnace') {
                      itemName = 'Furnace';
                      itemTier = 0;
                    } else if (marketItem.id === 'workbench') {
                      itemName = 'Workbench';
                      itemTier = 1;
                    } else if (marketItem.id === 'scroll_t2') {
                      itemName = 'Scroll T2';
                      itemTier = 1;
                      if (currentTier >= 2) return null;
                    } else if (marketItem.id === 'scroll_t3') {
                      itemName = 'Scroll T3';
                      itemTier = 2;
                      if (currentTier >= 3) return null;
                    } else {
                      const itemDef = Object.values(MATERIALS).find(i => i.id === marketItem.id);
                      if (!itemDef) return null;
                      itemName = (itemDef as any).name;
                      itemTier = (itemDef as any).tier || 1;
                    }

                    if (itemTier > currentTier) return null;

                    const stockLeft = (state.marketStock[marketItem.id] || 0) - (cart[marketItem.id] || 0);
                    const isSoldOut = stockLeft <= 0;
                    const invCount = state.inventory.find(i => i.id === marketItem.id)?.quantity || 0;
                    const currentMultiplier = itemMultipliers[marketItem.id] || 1;

                    return (
                      <div
                        key={marketItem.id}
                        data-tutorial-id={marketItem.id === 'furnace' ? 'FURNACE_ITEM' : undefined}
                        className={`group relative flex flex-col items-center p-2 rounded-2xl border transition-all h-[170px] md:h-[220px] justify-between overflow-hidden shadow-md select-none ${
                          isSoldOut
                            ? 'bg-stone-900 border-stone-800 opacity-40 grayscale'
                            : 'bg-stone-850 border-stone-800 hover:border-stone-600'
                        }`}
                      >
                        {invCount > 0 && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[7px] md:text-[9px] font-black uppercase tracking-tighter border z-10 bg-slate-900/80 border-slate-600 text-slate-300 flex items-center gap-1">
                            <Package className="w-2 h-2 md:w-3 md:h-3" />
                            <span>{invCount}</span>
                          </div>
                        )}

                        <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[7px] md:text-[9px] font-black tracking-tighter border z-10 ${stockLeft > 0 ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' : 'bg-red-950/60 border-red-500/40 text-red-500'}`}>
                          {isSoldOut ? 'X' : stockLeft}
                        </div>

                        {/* 아이콘 클릭 영역: 클릭 시 현재 배율만큼 담기 */}
                        <div
                          className={`flex-1 w-full flex items-center justify-center transition-all relative mt-1 overflow-hidden rounded-lg
                            ${isSoldOut ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-stone-800/50 group-hover:scale-105 active:scale-95'}
                          `}
                          onClick={() => { if (!isSoldOut) addToCart(marketItem.id, currentMultiplier); }}
                        >
                          <img
                            src={getAssetUrl(`${marketItem.id}.png`)}
                            className="w-12 h-12 md:w-24 md:h-24 object-contain drop-shadow-md pointer-events-none"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden text-xl md:text-3xl pointer-events-none">📦</div>
                        </div>

                        {/* 수량 선택 버튼: 1, 5, 10 (재고량에 따라 활성화/비활성화) */}
                        {!isSoldOut && !isKeyItem && !marketItem.id.startsWith('scroll_') && (
                            <div className="flex items-center gap-1.5 mb-1.5 scale-90 md:scale-100">
                                {[1, 5, 10].map(val => {
                                    const isDisabled = stockLeft < val;
                                    return (
                                        <button 
                                            key={val}
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => setItemMultiplier(marketItem.id, val)}
                                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full border text-[8px] md:text-[10px] font-black transition-all flex items-center justify-center ${
                                                isDisabled 
                                                ? 'bg-stone-900 border-stone-800 text-stone-700 opacity-20 grayscale cursor-not-allowed'
                                                : currentMultiplier === val 
                                                    ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_8px_rgba(217,119,6,0.3)]' 
                                                    : 'bg-stone-900 border-stone-700 text-stone-500 hover:text-stone-300'
                                            }`}
                                        >
                                            {val}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="w-full text-center mb-1">
                          <h4 className={`text-[8px] md:text-[11px] font-black leading-none truncate px-1 ${marketItem.id === 'furnace' || marketItem.id === 'workbench' || marketItem.id.startsWith('scroll_') ? 'text-amber-400' : 'text-stone-400'}`}>
                            {itemName}
                          </h4>
                        </div>

                        {/* 가격 클릭 영역: 클릭 시 현재 배율만큼 담기 */}
                        <div
                          className={`w-full py-1 md:py-2 rounded-b-xl border-t flex flex-col items-center justify-center gap-0.5 font-mono font-black transition-all
                            ${isSoldOut ? 'bg-stone-900 border-stone-800 text-stone-700' : 'bg-stone-950 border-stone-800 text-amber-500 cursor-pointer hover:bg-amber-900/20 active:scale-95'}
                          `}
                          onClick={() => { if (!isSoldOut) addToCart(marketItem.id, currentMultiplier); }}
                        >
                          <div className="flex items-center gap-1 text-[8px] md:text-sm">
                            <span>{marketItem.price * currentMultiplier}</span>
                            <Coins className="w-2.5 h-2.5 md:w-4 md:h-4 text-amber-500" />
                          </div>
                          {currentMultiplier > 1 && (
                              <span className="text-[6px] md:text-[8px] opacity-50 font-sans uppercase">({currentMultiplier} units)</span>
                          )}
                        </div>

                        {isSoldOut && (
                          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-[0.5px]">
                            <span className="bg-red-600 text-white text-[7px] md:text-[10px] font-black px-2 py-0.5 rounded rotate-12 shadow-md uppercase tracking-widest">Sold Out</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side Cart Sidebar (Within Overlay) */}
              <div
                className={`h-full bg-stone-950/80 border-l border-stone-800 shadow-2xl flex flex-col transition-all duration-500 ease-in-out ${
                  isCartOpen ? 'w-48 md:w-72 translate-x-0' : 'w-0 translate-x-full border-none'
                }`}
              >
                <div className={`flex flex-col h-full w-full ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="bg-stone-850 p-3 md:p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
                    <h3 className="font-serif font-black text-[10px] md:text-base text-stone-100 uppercase tracking-tighter truncate">
                      Cart Contents
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-3 custom-scrollbar">
                    {Object.keys(cart).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-stone-700 text-center px-4">
                        <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 opacity-10 mb-2" />
                        <p className="italic font-medium text-[8px] md:text-[9px] uppercase tracking-widest leading-tight">Empty</p>
                      </div>
                    ) : (
                      Object.entries(cart).map(([id, count]) => {
                        const marketItem = MARKET_CATALOG.find(i => i.id === id);
                        const name = id === 'furnace' ? 'Furnace' : id === 'workbench' ? 'Workbench' : MATERIALS[id.toUpperCase() as keyof typeof MATERIALS]?.name || id;
                        if (!marketItem) return null;
                        return (
                          <div key={id} className="flex flex-col gap-1.5 bg-stone-900/60 p-2 md:p-3 rounded-xl border border-stone-800 select-none shadow-inner">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-center shrink-0 shadow-inner">
                                  <img src={getAssetUrl(`${id}.png`)} className="w-6 h-6 md:w-9 md:h-9 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-stone-100 font-bold text-[10px] md:text-sm truncate leading-tight">{name}</div>
                                  <div className="text-amber-600 font-mono text-[9px] md:text-xs font-black">{marketItem.price * (count as number)} G</div>
                                </div>
                                <button type="button" onClick={() => deleteFromCart(id)} className="p-1.5 text-stone-600 hover:text-red-500 transition-colors shrink-0">
                                  <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between bg-black/40 rounded-lg p-1 md:p-1.5 border border-white/5">
                                <div className="flex items-center gap-1 ml-1">
                                    <span className="text-[10px] md:text-sm font-mono font-black text-stone-200">{count}</span>
                                    <span className="text-[8px] md:text-[9px] text-stone-500 font-black uppercase tracking-tighter">EA</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        type="button"
                                        onClick={() => removeFromCart(id)} 
                                        className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-stone-800 hover:bg-stone-700 rounded-md border border-stone-700 text-stone-300 transition-all active:scale-90"
                                    >
                                        <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => addToCart(id, 1)} 
                                        className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-stone-800 hover:bg-stone-700 rounded-md border border-stone-700 text-stone-300 transition-all active:scale-90"
                                    >
                                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="bg-stone-850 p-3 md:p-4 border-t border-stone-800 space-y-2 shrink-0">
                    <div className="flex justify-between items-center text-[8px] md:xs text-stone-500 font-bold uppercase tracking-tighter">
                      <span>Total</span>
                      <span className={`text-[11px] md:text-lg font-mono font-black ${totalCost > state.stats.gold ? 'text-red-500' : 'text-emerald-400'}`}>
                        {totalCost}G
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleBuy}
                      className={`w-full py-2 md:py-3 rounded-xl font-black text-[9px] md:text-xs transition-all flex items-center justify-center gap-1.5 shadow-xl ${
                        totalCost > state.stats.gold ? 'bg-red-900/60 text-red-100 border border-red-500/50' : 
                        totalCost === 0 ? 'bg-stone-800 text-stone-500 grayscale opacity-60' :
                        'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>{totalCost > state.stats.gold ? 'Insufficient Funds' : 'Buy Now'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Toggle Button (Float on the left of cart area) */}
            <button
              onClick={toggleCart}
              data-tutorial-id="CART_TOGGLE"
              className={`absolute top-1/2 right-0 w-6 md:w-8 h-16 md:h-24 -translate-y-1/2 border-y border-l transition-all z-[2100] cursor-pointer shadow-xl rounded-l-xl flex flex-col items-center justify-center 
                ${isCartOpen ? 'translate-x-[-192px] md:translate-x-[-288px]' : ''}
                ${
                  cartItemCount > 0 || state.tutorialStep === 'OPEN_SHOPPING_CART' || state.tutorialStep === 'CLOSE_SHOPPING_CART'
                    ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)] ring-4 ring-amber-400/50 animate-pulse'
                    : 'bg-stone-800 border-stone-600 text-stone-400 hover:text-amber-400'
                }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {isCartOpen ? <ChevronRight className="w-2.5 h-2.5 mt-1" /> : <ChevronLeft className="w-2.5 h-2.5 mt-1" />}
            </button>
          </div>
        </div>
      )}

      {/* Gift Selection Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[85vh]">
                <div className="p-3 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-pink-900/30 p-1.5 rounded-lg border border-pink-700/50">
                            <Gift className="w-4 h-4 text-pink-500" />
                        </div>
                        <h3 className="font-bold text-stone-200 font-serif uppercase tracking-widest text-sm">Select Gift for Garrick</h3>
                    </div>
                    <button onClick={() => setShowGiftModal(false)} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500 hover:text-stone-300 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <ItemSelectorList 
                    items={giftableItems}
                    onSelect={(item) => handleGift(item.id)}
                    onToggleLock={(id) => actions.toggleLockItem(id)}
                    customerMarkup={1.0}
                    emptyMessage="No giftable items in inventory."
                />
            </div>
        </div>
      )}

      {/* Conceptual Counter Shadow (Bottom) */}
      <div className="absolute bottom-0 w-full h-[35dvh] md:h-64 z-20 pointer-events-none bg-gradient-to-t from-black/90 to-transparent"></div>
    </div>
  );
};

export default MarketTab;
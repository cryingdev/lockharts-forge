import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGame } from '../../../context/GameContext';
import DialogueBox from '../../DialogueBox';
import { Store, Coins, PackageOpen, Heart, Users, ArrowLeft, ZapOff, Info, Check, X, Lock, Star, Sword, Shield, Zap, Brain, ChevronRight, Search, Unlock, Sparkles } from 'lucide-react';
import { EQUIPMENT_ITEMS } from '../../../data/equipment';
import { materials } from '../../../data/materials';
import { getAssetUrl } from '../../../utils';
import { GAME_CONFIG } from '../../../config/game-config';
import { InventoryItem } from '../../../types/inventory';
import { ItemSelectorList } from '../../ItemSelectorList';

interface ShopTabProps {
    onNavigate: (tab: any) => void;
}

interface FloatingHeart {
    id: number;
    left: number;
    delay: number;
    size: number;
}

const ShopSign = ({ isOpen, onToggle, disabled }: { isOpen: boolean, onToggle: () => void, disabled: boolean }) => {
    return (
        <div className="absolute top-2 md:top-4 right-2 md:right-4 z-50 flex flex-col items-center">
            <div className="flex justify-around w-16 md:w-24 h-4 md:h-6 px-4">
                <div className="w-0.5 md:w-1 bg-stone-600 rounded-full"></div>
                <div className="w-0.5 md:w-1 bg-stone-600 rounded-full"></div>
            </div>
            
            <button 
                onClick={onToggle}
                disabled={disabled}
                data-tutorial-id="SHOP_SIGN"
                className={`group relative w-24 md:w-36 h-10 md:h-16 perspective-1000 cursor-pointer disabled:cursor-not-allowed`}
            >
                <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isOpen ? '' : 'rotate-y-180'}`}>
                    <div className="absolute inset-0 backface-hidden bg-[#5d4037] border md:border-2 border-[#3e2723] rounded shadow-lg flex flex-col items-center justify-center p-0.5 md:p-1">
                        <div className="w-full h-full border border-[#795548]/30 rounded flex flex-col items-center justify-center">
                             <span className="text-[8px] md:text-[10px] text-[#8d6e63] font-bold uppercase tracking-widest leading-none">The Shop is</span>
                             <span className="text-sm md:text-xl font-black text-emerald-400 font-serif tracking-tighter drop-shadow-sm">OPEN</span>
                        </div>
                    </div>
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#3e2723] border md:border-2 border-[#1b0000] rounded shadow-lg flex flex-col items-center justify-center p-0.5 md:p-1">
                        <div className="w-full h-full border border-[#5d4037]/30 rounded flex flex-col items-center justify-center">
                             <span className="text-[8px] md:text-[10px] text-[#5d4037] font-bold uppercase tracking-widest font-none">The Shop is</span>
                             <span className="text-sm md:text-xl font-black text-stone-500 font-serif tracking-tighter drop-shadow-sm">CLOSED</span>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
};

const BlinkingMercenary = ({ mercenary, className }: { mercenary: any, className?: string }) => {
  const [frame, setFrame] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 현재 Pip the Green만 애니메이션을 지원함
  const isPip = mercenary.id === 'pip_green';

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
    if (isPip) {
      scheduleNextBlink();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPip, scheduleNextBlink]);

  if (isPip) {
    return (
      <div 
        className={className}
        style={{ 
          aspectRatio: '453.3 / 1058', 
          overflow: 'hidden'
        }}
      >
        <div 
          className="h-full w-full transition-transform duration-75 ease-linear"
          style={{
            backgroundImage: `url(${getAssetUrl(mercenary.sprite)})`,
            backgroundSize: '300% 100%',
            backgroundPosition: `${frame * 50}% 0%`,
            imageRendering: 'pixelated'
          }}
        />
      </div>
    );
  }

  return (
    <img 
      src={mercenary.sprite ? getAssetUrl(mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')} 
      className={className}
    />
  );
};

const ShopTab: React.FC<ShopTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();
  const { isShopOpen } = state.forge;
  const { activeCustomer, shopQueue, tutorialStep, inventory, unlockedRecipes } = state;
  const [counterImgError, setCounterImgError] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [lastSoldQuality, setLastSoldQuality] = useState<number>(100);
  const [refusalReaction, setRefusalReaction] = useState<'POLITE' | 'ANGRY' | null>(null);
  
  const [showInstanceSelector, setShowInstanceSelector] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<InventoryItem | null>(null);

  // FIX: Added getQualityLabel helper to resolve find name error
  const getQualityLabel = (q: number): string => {
    if (q >= 110) return 'MASTERWORK';
    if (q >= 100) return 'PRISTINE';
    if (q >= 90) return 'SUPERIOR';
    if (q >= 80) return 'FINE';
    if (q >= 70) return 'STANDARD';
    if (q >= 60) return 'RUSTIC';
    return 'CRUDE';
  };

  // FIX: Added getRarityColor helper to resolve find name error
  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
        case 'Legendary': return 'text-amber-100 border-amber-400 bg-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.4)]';
        case 'Epic': return 'text-purple-100 border-purple-400 bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]';
        case 'Rare': return 'text-blue-100 border-blue-400 bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.4)]';
        case 'Uncommon': return 'text-emerald-100 border-emerald-400 bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
        default: return 'text-stone-300 border-stone-600 bg-stone-700';
    }
  };

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

  useEffect(() => {
    if (!activeCustomer) {
        setSaleCompleted(false);
        setRefusalReaction(null);
        setShowInstanceSelector(false);
        setSelectedInstance(null);
    }
  }, [activeCustomer]);

  const getItemName = (id: string) => {
    const eq = EQUIPMENT_ITEMS.find(e => e.id === id);
    if (eq) return eq.name;
    const res = Object.values(materials).find(i => i.id === id);
    return res ? res.name : id;
  };

  const getInventoryItemImageUrl = (item: InventoryItem) => {
    if (item.type === 'EQUIPMENT' && item.equipmentData) {
        if (item.equipmentData.image) return getAssetUrl(item.equipmentData.image);
        return item.equipmentData.recipeId ? getAssetUrl(`${item.equipmentData.recipeId}.png`) : getAssetUrl(`${item.id.split('_')[0]}.png`);
    }
    return getAssetUrl(`${item.id}.png`);
  };

  // FIX: Added getItemImageUrl helper to resolve find name error
  const getItemImageUrl = (id: string) => {
    const eq = EQUIPMENT_ITEMS.find(e => e.id === id);
    if (eq && eq.image) return getAssetUrl(eq.image);
    return getAssetUrl(`${id}.png`);
  };

  const getItemIcon = (id: string) => {
      const eq = EQUIPMENT_ITEMS.find(e => e.id === id);
      if (eq) return eq.icon;
      return '📦';
  };

  const matchingItems = useMemo(() => {
      if (!activeCustomer) return [];
      const { request } = activeCustomer;
      if (request.type === 'RESOURCE') {
          return inventory.filter(i => i.id === request.requestedId);
      } else {
          return inventory.filter(i => i.id.startsWith(request.requestedId));
      }
  }, [activeCustomer, inventory]);

  const handleSellClick = () => {
      if (!activeCustomer) return;
      if (matchingItems.length > 1) {
          setShowInstanceSelector(true);
      } else if (matchingItems.length === 1) {
          const item = matchingItems[0];
          executeSell(item);
      }
  };

  const executeSell = (item: InventoryItem) => {
      if (!activeCustomer || !item) return;
      if (item.isLocked) {
          actions.showToast("Item is locked and cannot be sold.");
          return;
      }
      const { mercenary, request } = activeCustomer;
      const isPipTutorial = tutorialStep === 'SELL_ITEM_GUIDE' && mercenary.id === 'pip_green';
      
      const itemQuality = item.equipmentData?.quality || 100;
      setLastSoldQuality(itemQuality);

      let affinityGain = isPipTutorial ? 10 : 2;
      if (itemQuality > 100) affinityGain += 2;
      else if (itemQuality < 80) affinityGain = Math.max(1, affinityGain - 1);
      
      const markup = request.markup || 1.25;
      const finalPrice = Math.ceil(item.baseValue * markup);

      if (item.type === 'RESOURCE') {
          actions.sellItem(item.id, 1, finalPrice, undefined, mercenary);
      } else {
          actions.sellItem(item.id, 1, finalPrice, item.id, mercenary);
      }

      spawnHearts(affinityGain);
      setSaleCompleted(true);
      setShowInstanceSelector(false);
      setSelectedInstance(null);
  };

  const handleRefuse = () => {
      if (!activeCustomer) return;
      const { mercenary } = activeCustomer;
      const affinity = mercenary.affinity || 0;
      const politeChance = affinity > 40 ? 0.8 : 0.3;
      const isPolite = Math.random() < politeChance;
      if (isPolite) {
          setRefusalReaction('POLITE');
          actions.refuseCustomer(mercenary.id, 0);
      } else {
          setRefusalReaction('ANGRY');
          actions.refuseCustomer(mercenary.id, 5);
      }
  };

  const handleFarewell = () => {
      setSaleCompleted(false);
      setRefusalReaction(null);
      actions.dismissCustomer();
  };
  
  const handleToggleShop = () => {
      if (!isShopOpen && state.tutorialStep === 'OPEN_SHOP_SIGN_GUIDE') {
          actions.setTutorialStep('SELL_ITEM_GUIDE');
      }
      actions.toggleShop();
  };

  const hasItem = matchingItems.some(i => !i.isLocked);
  const canAffordOpen = state.stats.energy >= GAME_CONFIG.ENERGY_COST.OPEN_SHOP;
  const isTutorialActive = tutorialStep === 'SELL_ITEM_GUIDE' || tutorialStep === 'PIP_PRAISE' || tutorialStep === 'DRAGON_TALK';

  const tutorialDialogue = {
    PIP_PRAISE: {
        speaker: activeCustomer?.mercenary.name || "Pip the Green",
        text: "This... this is incredible. I can feel the balance in the grip. It's much better than the scraps I found in the woods. You really are a Lockhart, aren't you?",
        options: [{ label: "Continue", action: () => actions.setTutorialStep('DRAGON_TALK'), variant: 'primary' as const }]
    },
    DRAGON_TALK: {
        speaker: activeCustomer?.mercenary.name || "Pip the Green",
        text: "The village... it hasn't been the same since the Dragon's fire. I lost my brother that night. I see that same shadow in your eyes, smith. We all lost someone. Good luck with the forge.",
        options: [{ label: "Farewell", action: () => { handleFarewell(); actions.setTutorialStep('TUTORIAL_END_MONOLOGUE'); }, variant: 'primary' as const }]
    },
    TUTORIAL_END_MONOLOGUE: {
        speaker: "Lockhart",
        text: "Finally... the first sale. It's just a simple bronze blade, but it marks the beginning of my resurgence. I will rebuild this forge, piece by piece, until the name Lockhart once again commands respect across the realm. Every strike of my hammer brings me closer to the day I face that dragon. ... I miss my people. I miss my home. But I will not falter. My business starts now.",
        options: [{ label: "The Shop is Open", action: () => actions.completeTutorial(), variant: 'primary' as const }]
    }
  };

  const currentTutorialDialogue = (tutorialStep === 'PIP_PRAISE' || tutorialStep === 'DRAGON_TALK' || tutorialStep === 'TUTORIAL_END_MONOLOGUE') 
    ? tutorialDialogue[tutorialStep as keyof typeof tutorialDialogue] 
    : null;

  const getThanksDialogue = () => {
      const itemName = getItemName(activeCustomer?.request.requestedId || "");
      
      if (lastSoldQuality > 100) {
          const masterworkLines = [
              `"Unbelievable! This ${itemName} is a true masterpiece. The edge is unlike anything I've seen. You really have the Lockhart touch!"`,
              `"Absolute perfection. I can feel the strength in this steel. I'll tell everyone in the tavern about your forge!"`,
              `"This quality is beyond what I expected. A fair price for legendary work. Thank you, Lockhart!"`
          ];
          return masterworkLines[Math.floor(Math.random() * masterworkLines.length)];
      } 
      
      if (lastSoldQuality < 80) {
          const crudeLines = [
              `"It'll do for now, I suppose. Though the finish on this ${itemName} is a bit rough... I hope your next work is a bit more refined."`,
              `"Hmm, not your best work, smith. I'll take it, but I was expecting that famous Lockhart quality. Try harder next time."`,
              `"A bit crude, but I need a blade today. Next time, I hope the anvil's rhythm is more precise."`
          ];
          return crudeLines[Math.floor(Math.random() * crudeLines.length)];
      }

      const standardLines = [
          `"Fantastic craftsmanship! This ${itemName} is exactly what I needed. Thank you, Lockhart!"`,
          `"Superb work. I feel much safer with this by my side. I'll be back!"`,
          `"A fair price for quality steel. May your bellows never tire, smith."`,
          `"You truly have the Lockhart touch. This will serve me well in the ruins."`
      ];
      return standardLines[Math.floor(Math.random() * standardLines.length)];
  };

  const getRefusalDialogue = () => {
      if (refusalReaction === 'POLITE') {
          return [
              `"I see. Perhaps another time then. Safe forging, smith."`,
              `"Ah, a shame. I'll keep looking elsewhere for now."`,
              `"Understandable. A Lockhart's work shouldn't be rushed. Farewell."`,
              `"I'll come back when your anvil is hotter. Until next time."`
          ][(activeCustomer?.id.length || 0) % 4];
      } else {
          return [
              `"What? I walked all this way for nothing? Hmph. Don't expect me back soon."`,
              `"A cold welcome for a paying customer... I'll find a better forge."`,
              `"Unbelievable. My old blade has more edge than your business sense!"`,
              `"I thought the Lockharts were more reliable. Guess I was wrong."`
          ][(activeCustomer?.id.length || 0) % 4];
      }
  };

  const itemDetails = useMemo(() => {
    if (!activeCustomer) return undefined;
    const requestedId = activeCustomer.request.requestedId;
    const eq = EQUIPMENT_ITEMS.find(e => e.id === requestedId);
    const isUnlocked = eq ? (eq.unlockedByDefault !== false || unlockedRecipes.includes(requestedId)) : true;
    
    return {
        icon: getItemIcon(requestedId),
        imageUrl: getItemImageUrl(requestedId),
        price: activeCustomer.request.price,
        requirements: eq?.requirements,
        isUnlocked
    };
  }, [activeCustomer, unlockedRecipes]);

  return (
    <div className="relative h-full w-full bg-stone-900 overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 z-0">
            <img 
                src={getAssetUrl('shop_bg.jpeg')} 
                className="absolute top-0 opacity-60 w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.background = 'linear-gradient(to bottom, #292524, #1c1917)'; }}
            />
        </div>

        <ShopSign 
            isOpen={isShopOpen} 
            onToggle={handleToggleShop} 
            disabled={(!isShopOpen && !canAffordOpen) || isTutorialActive}
        />

        {isShopOpen && !currentTutorialDialogue && (
            <div className="absolute top-20 md:top-28 right-4 z-50 flex items-center gap-1.5 md:gap-2 bg-stone-900/90 px-2 md:px-4 py-1 md:py-1.5 rounded-xl border border-stone-700 text-stone-200 shadow-xl backdrop-blur-md">
                <div className="bg-stone-800 p-1 md:p-1.5 rounded-full">
                    <Users className="w-3 h-3 md:w-5 md:h-5 text-amber-500" />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[7px] md:text-[9px] text-stone-500 font-bold uppercase tracking-wider">Queue</span>
                    <span className="text-sm md:text-lg font-bold font-mono">{shopQueue.length}</span>
                </div>
            </div>
        )}

        {isShopOpen && activeCustomer && tutorialStep !== 'TUTORIAL_END_MONOLOGUE' && (
            <div className="absolute top-4 left-4 z-40 animate-in slide-in-from-left-4 duration-500 w-[32%] max-w-[180px] md:max-w-[240px]">
                <div className="bg-stone-900/90 border border-stone-700 p-2.5 md:p-4 rounded-xl backdrop-blur-md shadow-2xl">
                    <div className="flex justify-between items-center mb-1.5 md:mb-2.5">
                        <div className="flex flex-col leading-tight min-w-0">
                            <span className="font-black text-amber-50 text-[8px] md:text-[10px] tracking-widest uppercase truncate">{activeCustomer.mercenary.job}</span>
                            <span className="text-stone-500 text-[8px] md:text-[10px] font-mono">Lv.{activeCustomer.mercenary.level}</span>
                        </div>
                        <div className={`flex items-center gap-1 font-bold bg-stone-950/20 px-1 md:px-1.5 py-0.5 rounded border ${refusalReaction === 'ANGRY' ? 'text-red-500 border-red-900/30' : 'text-pink-400 border-pink-900/30'}`}>
                            <Heart className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${refusalReaction === 'ANGRY' ? 'fill-red-500' : 'fill-pink-400'}`} />
                            <span className="font-mono text-[9px] md:text-xs">{activeCustomer.mercenary.affinity}</span>
                        </div>
                    </div>
                    <div className="space-y-1.5 md:space-y-2.5">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-center text-[7px] md:text-[9px] font-mono text-stone-500 px-0.5">
                                <span>HP</span>
                                <span>{Math.floor(activeCustomer.mercenary.currentHp)}/{activeCustomer.mercenary.maxHp}</span>
                            </div>
                            <div className="w-full bg-stone-950 h-1 md:h-1.5 rounded-full overflow-hidden border border-stone-800">
                                <div className="bg-red-600 h-full transition-all duration-700" style={{ width: `${(activeCustomer.mercenary.currentHp / activeCustomer.mercenary.maxHp) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-center text-[7px] md:text-[9px] font-mono text-stone-500 px-0.5">
                                <span>MP</span>
                                <span>{Math.floor(activeCustomer.mercenary.currentMp)}/{activeCustomer.mercenary.maxMp}</span>
                            </div>
                            <div className="w-full bg-stone-950 h-1 md:h-1.5 rounded-full overflow-hidden border border-stone-800">
                                <div className="bg-blue-600 h-full transition-all duration-700" style={{ width: `${(activeCustomer.mercenary.currentMp / activeCustomer.mercenary.maxMp) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
            {isShopOpen && activeCustomer && tutorialStep !== 'TUTORIAL_END_MONOLOGUE' && (
               <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in-95 duration-700 ease-out">
                   <div className="relative h-[75dvh] md:h-[110dvh] w-auto flex justify-center bottom-[12dvh] md:bottom-0 md:translate-y-[20dvh]">
                       {floatingHearts.map(heart => (
                           <Heart 
                                key={heart.id}
                                className="absolute animate-heart fill-pink-500 text-pink-400 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)] z-0"
                                style={{ left: `${heart.left}%`, bottom: '40%', width: heart.size, height: heart.size, animationDelay: `${heart.delay}s`, '--wobble': `${(Math.random() - 0.5) * 60}px` } as React.CSSProperties}
                           />
                       ))}
                       <BlinkingMercenary 
                           mercenary={activeCustomer.mercenary} 
                           className={`h-full w-auto object-contain object-bottom filter drop-shadow-[0_0_100px_rgba(0,0,0,0.95)] transition-all duration-500 relative z-10 ${refusalReaction === 'ANGRY' ? 'brightness-50 sepia-50' : ''}`}
                       />
                       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-16 bg-black/60 blur-3xl rounded-full -z-10"></div>
                   </div>
               </div>
            )}
        </div>

        <div className="absolute bottom-0 w-full h-[35dvh] md:h-64 z-20 flex items-end justify-center pointer-events-none">
            {!counterImgError ? (
                <img 
                    src={getAssetUrl('shop_counter.png')} 
                    className="w-full h-full object-cover object-top filter drop-shadow-[0_-30px_50px_rgba(0,0,0,0.8)]"
                    onError={() => setCounterImgError(true)}
                />
            ) : (
                <div className="w-full h-full bg-[#3f2e22] border-t-2 md:border-t-[8px] border-[#5d4037] shadow-[0_-40px_60px_rgba(0,0,0,0.85)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)' }}></div>
                </div>
            )}
        </div>

        <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl z-50 flex flex-col items-center pointer-events-none">
            {isShopOpen && currentTutorialDialogue ? (
                 <DialogueBox 
                    speaker={currentTutorialDialogue.speaker}
                    text={currentTutorialDialogue.text}
                    options={currentTutorialDialogue.options}
                    className="w-full relative pointer-events-auto"
                />
            ) : isShopOpen && activeCustomer ? (
                saleCompleted ? (
                    <DialogueBox 
                        speaker={activeCustomer.mercenary.name}
                        text={getThanksDialogue()}
                        options={[{ label: "Farewell", action: handleFarewell, variant: 'primary' }]}
                        className="w-full relative pointer-events-auto"
                    />
                ) : refusalReaction ? (
                    <DialogueBox 
                        speaker={activeCustomer.mercenary.name}
                        text={getRefusalDialogue()}
                        options={[{ label: "Farewell", action: handleFarewell, variant: refusalReaction === 'ANGRY' ? 'danger' : 'neutral' }]}
                        className="w-full relative pointer-events-auto"
                    />
                ) : (
                    <DialogueBox 
                        speaker={activeCustomer.mercenary.name}
                        text={activeCustomer.request.dialogue}
                        highlightTerm={getItemName(activeCustomer.request.requestedId)}
                        itemDetail={itemDetails}
                        options={[
                            { label: `Sell`, action: handleSellClick, variant: 'primary', disabled: !hasItem },
                            { label: "Refuse", action: handleRefuse, variant: 'danger', disabled: isTutorialActive }
                        ]}
                        className="w-full relative pointer-events-auto"
                    />
                )
            ) : null}
        </div>

        {showInstanceSelector && activeCustomer && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300 pointer-events-auto">
                <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-row shadow-2xl animate-in zoom-in-95 duration-300 relative">
                    <div className="flex-1 flex flex-col border-r border-stone-800 bg-stone-925/50 overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-stone-800 flex justify-between items-center bg-stone-900 shrink-0">
                            <div>
                                <h3 className="font-serif font-black text-xl text-stone-100 uppercase tracking-tighter">Select Instance</h3>
                                <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest mt-0.5">Which one will you part with?</p>
                            </div>
                            <button onClick={() => setShowInstanceSelector(false)} className="p-2 hover:bg-stone-800 rounded-full text-stone-500 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <ItemSelectorList 
                            items={matchingItems}
                            onSelect={(item) => setSelectedInstance(item)}
                            onToggleLock={(id) => actions.toggleLockItem(id)}
                            customerMarkup={activeCustomer.request.markup || 1.25}
                        />
                        
                        <div className="p-4 border-t border-stone-800 bg-stone-900/80 flex justify-end gap-3 shrink-0">
                            <button 
                                onClick={() => setShowInstanceSelector(false)}
                                className="px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 font-black uppercase text-xs transition-all flex items-center gap-2"
                            >
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button 
                                onClick={() => selectedInstance && executeSell(selectedInstance)}
                                disabled={!selectedInstance || selectedInstance.isLocked}
                                className={`px-10 py-3 rounded-xl font-black uppercase text-xs transition-all flex items-center gap-2 border-b-4 ${(!selectedInstance || selectedInstance.isLocked) ? 'bg-stone-800 text-stone-600 border-stone-950 grayscale cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 shadow-xl active:scale-95'}`}
                            >
                                <Check className="w-4 h-4" /> Select & Sell
                            </button>
                        </div>
                    </div>
                    
                    <div className="hidden md:flex w-72 lg:w-96 flex-col bg-stone-900 overflow-hidden">
                        <div className="p-6 border-b border-stone-800 flex items-center gap-3 shrink-0">
                            <Info className="w-5 h-5 text-stone-500" />
                            <h3 className="font-bold text-stone-400 uppercase tracking-widest text-sm">Item Inspection</h3>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                            {selectedInstance ? (
                                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex flex-col items-center text-center">
                                        <div className={`w-24 h-24 bg-stone-950 rounded-full border-2 flex items-center justify-center mb-3 shadow-2xl relative ${getRarityColor(selectedInstance.equipmentData?.rarity)}`}>
                                            <img src={getInventoryItemImageUrl(selectedInstance)} className={`w-16 h-16 object-contain ${selectedInstance.isLocked ? 'opacity-50 grayscale' : ''}`} />
                                            {selectedInstance.isLocked && (
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-600 p-2 rounded-full border-2 border-stone-900 shadow-xl">
                                                    <Lock className="w-6 h-6 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="text-xl font-bold text-amber-500 font-serif leading-none">{selectedInstance.name}</h4>
                                        <div className="flex flex-col items-center gap-1.5 mt-2.5">
                                            <div className={`px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm ${getRarityColor(selectedInstance.equipmentData?.rarity)}`}>
                                                {selectedInstance.equipmentData?.rarity}
                                            </div>
                                            <div className={`px-2 py-0.5 rounded border border-stone-800 bg-stone-950 text-[8px] font-bold uppercase flex items-center gap-1 ${selectedInstance.equipmentData?.quality && selectedInstance.equipmentData.quality >= 100 ? 'text-amber-400' : 'text-stone-500'}`}>
                                                <Sparkles className="w-2.5 h-2.5 fill-current" /> {getQualityLabel(selectedInstance.equipmentData?.quality || 100)} Grade
                                            </div>
                                        </div>
                                    </div>

                                    {selectedInstance.equipmentData && (
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black text-stone-600 uppercase tracking-widest border-b border-stone-800 pb-1 flex items-center gap-2"><Sword className="w-3 h-3" /> Performance</h5>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { label: 'P.ATK', value: selectedInstance.equipmentData.stats.physicalAttack, icon: <Sword className="w-3 h-3 text-orange-500" /> },
                                                    { label: 'P.DEF', value: selectedInstance.equipmentData.stats.physicalDefense, icon: <Shield className="w-3 h-3 text-blue-500" /> },
                                                    { label: 'M.ATK', value: selectedInstance.equipmentData.stats.magicalAttack, icon: <Zap className="w-3 h-3 text-blue-400" /> },
                                                    { label: 'M.DEF', value: selectedInstance.equipmentData.stats.magicalDefense, icon: <Brain className="w-3 h-3 text-purple-400" /> }
                                                ].map(s => (
                                                    <div key={s.label} className="bg-stone-950/50 p-2 rounded-lg border border-stone-800 flex justify-between items-center">
                                                        <span className="text-[9px] font-bold text-stone-500 flex items-center gap-1">{s.icon} {s.label}</span>
                                                        <span className="font-mono text-xs font-black text-stone-200">{s.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-6">
                                        <div className="flex justify-between items-center px-1 mb-2">
                                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Offered Price</span>
                                            <span className={`text-2xl font-mono font-black ${selectedInstance.isLocked ? 'text-stone-600' : 'text-emerald-400'}`}>{Math.ceil(selectedInstance.baseValue * (activeCustomer.request.markup || 1.25))} G</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-stone-700 italic text-center p-8 gap-4 opacity-50">
                                    <Search className="w-12 h-12" />
                                    <p className="text-sm">Select an item to inspect its quality and stats before finalizing the contract.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {!isShopOpen && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-1000 animate-in fade-in"></div>
                <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
                    {!canAffordOpen ? (
                        <div className="bg-stone-950/90 border-2 border-red-900/50 p-6 md:p-10 rounded-[2rem] shadow-2xl flex flex-col items-center text-center max-w-xs ring-4 ring-black/50 backdrop-blur-2xl">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-950/30 rounded-full flex items-center justify-center mb-4 border border-red-800/30">
                                <ZapOff className="w-8 h-8 md:w-10 md:h-10 text-red-50 animate-pulse" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-red-100 font-serif uppercase tracking-tight">Exhausted</h3>
                            <p className="text-stone-500 text-xs md:text-base mt-2 mb-6 leading-relaxed">You lack the energy to manage the counter. Take a rest to recover.</p>
                            <button onClick={() => onNavigate('FORGE')} className="w-full py-3 md:py-4 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-xl font-black text-xs md:text-sm transition-all border border-stone-700 pointer-events-auto flex items-center justify-center gap-2 uppercase tracking-widest"><ArrowLeft className="w-4 h-4" />Back to Forge</button>
                        </div>
                    ) : (
                        <div className="text-center group">
                             <div className="w-20 h-20 md:w-24 md:h-24 bg-stone-900/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-700/50 backdrop-blur-xl shadow-2xl transition-transform group-hover:scale-110 duration-700 ring-1 ring-white/5">
                                <Store className="w-8 h-8 md:w-10 md:h-10 text-stone-500" />
                            </div>
                            <h3 className="text-2xl md:text-4xl font-black text-stone-300 font-serif tracking-tighter drop-shadow-2xl uppercase">Shop is Closed</h3>
                            <p className="text-stone-500 text-sm md:text-lg mt-2 font-black uppercase tracking-widest opacity-60">Flip the sign to welcome travelers</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {isShopOpen && !activeCustomer && tutorialStep !== 'TUTORIAL_END_MONOLOGUE' && (
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
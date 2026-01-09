
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../../../context/GameContext';
import DialogueBox from '../../DialogueBox';
import { Store, Coins, PackageOpen, Heart, Users, ArrowLeft, ZapOff } from 'lucide-react';
import { EQUIPMENT_ITEMS } from '../../../data/equipment';
import { MATERIALS } from '../../../data/materials';
import { getAssetUrl } from '../../../utils';
import { GAME_CONFIG } from '../../../config/game-config';

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
                             <span className="text-[8px] md:text-[10px] text-[#8d6e63] font-bold uppercase tracking-widest leading-none">The Forge is</span>
                             <span className="text-sm md:text-xl font-black text-emerald-400 font-serif tracking-tighter drop-shadow-sm">OPEN</span>
                        </div>
                    </div>
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#3e2723] border md:border-2 border-[#1b0000] rounded shadow-lg flex flex-col items-center justify-center p-0.5 md:p-1">
                        <div className="w-full h-full border border-[#5d4037]/30 rounded flex flex-col items-center justify-center">
                             <span className="text-[8px] md:text-[10px] text-[#5d4037] font-bold uppercase tracking-widest leading-none">The Forge is</span>
                             <span className="text-sm md:text-xl font-black text-stone-500 font-serif tracking-tighter drop-shadow-sm">CLOSED</span>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
};

const ShopTab: React.FC<ShopTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();
  const { isShopOpen } = state.forge;
  const { activeCustomer, shopQueue, tutorialStep } = state;
  const [counterImgError, setCounterImgError] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [refusalReaction, setRefusalReaction] = useState<'POLITE' | 'ANGRY' | null>(null);
  
  // Track affinity for logic (though we trigger hearts manually now)
  const prevAffinityRef = useRef<number>(0);

  const spawnHearts = useCallback(() => {
    const newHearts = Array.from({ length: 14 }).map((_, i) => ({
        id: Date.now() + i,
        left: 35 + Math.random() * 30, // Random range around center
        delay: Math.random() * 0.7, 
        size: 18 + Math.random() * 22
    }));
    setFloatingHearts(prev => [...prev, ...newHearts]);
    // Clear hearts after animation ends
    setTimeout(() => setFloatingHearts([]), 3500);
  }, []);

  // Sync basic state when customer changes
  useEffect(() => {
    if (!activeCustomer) {
        setSaleCompleted(false);
        setRefusalReaction(null);
        prevAffinityRef.current = 0;
    } else {
        prevAffinityRef.current = activeCustomer.mercenary.affinity;
    }
  }, [activeCustomer]);

  const getItemName = (id: string) => {
    const eq = EQUIPMENT_ITEMS.find(e => e.id === id);
    if (eq) return eq.name;
    const res = Object.values(MATERIALS).find(i => i.id === id);
    return res ? res.name : id;
  };

  const getItemImageUrl = (id: string) => {
      const eq = EQUIPMENT_ITEMS.find(e => e.id === id);
      if (eq && eq.image) return getAssetUrl(eq.image);
      const res = Object.values(MATERIALS).find(i => i.id === id);
      if (res) return getAssetUrl(`${res.id}.png`);
      return getAssetUrl(`${id}.png`);
  };

  const getItemIcon = (id: string) => {
      const eq = EQUIPMENT_ITEMS.find(e => e.id === id);
      if (eq) return eq.icon;
      return '📦';
  };

  const handleSell = () => {
      if (!activeCustomer) return;
      const { mercenary, request } = activeCustomer;
      
      // 1. Trigger Reducer (Gold + Affinity + Inventory)
      if (request.type === 'RESOURCE') {
          actions.sellItem(request.requestedId, 1, request.price, undefined, mercenary);
      } else {
          const matchingItem = state.inventory.find(i => i.equipmentData && i.id.startsWith(request.requestedId));
          if (matchingItem) actions.sellItem(matchingItem.id, 1, request.price, matchingItem.id, mercenary);
      }

      // 2. Trigger Visual Feedback IMMEDIATELY
      spawnHearts();
      setSaleCompleted(true);
  };

  const handleRefuse = () => {
      if (!activeCustomer) return;
      
      const { mercenary } = activeCustomer;
      const affinity = mercenary.affinity || 0;
      
      // Logic for reaction:
      // High affinity (>40): 80% chance Polite, 20% chance Angry
      // Low affinity: 30% chance Polite, 70% chance Angry
      const politeChance = affinity > 40 ? 0.8 : 0.3;
      const isPolite = Math.random() < politeChance;

      if (isPolite) {
          setRefusalReaction('POLITE');
          actions.refuseCustomer(mercenary.id, 0); // No affinity loss
      } else {
          setRefusalReaction('ANGRY');
          actions.refuseCustomer(mercenary.id, 5); // Affinity -5
      }
  };

  const handleFarewell = () => {
      setSaleCompleted(false);
      setRefusalReaction(null);
      actions.dismissCustomer();
  };
  
  const handleToggleShop = () => {
      if (!isShopOpen && state.tutorialStep === 'OPEN_SHOP_TAB_GUIDE') {
          actions.setTutorialStep('OPEN_SHOP_SIGN_GUIDE');
      }
      actions.toggleShop();
  };

  const hasItem = () => {
      if (!activeCustomer) return false;
      const { request } = activeCustomer;
      if (request.type === 'RESOURCE') {
          const item = state.inventory.find(i => i.id === request.requestedId);
          return item && item.quantity > 0;
      } else {
          return state.inventory.some(i => i.id.startsWith(request.requestedId));
      }
  };

  const canAffordOpen = state.stats.energy >= GAME_CONFIG.ENERGY_COST.OPEN_SHOP;
  
  // Tutorial Lock: Block closing shop when waiting for Pip
  const isTutorialActive = tutorialStep === 'SELL_ITEM_GUIDE' || tutorialStep === 'PIP_PRAISE' || tutorialStep === 'DRAGON_TALK';

  // Narrative Script Mapping
  const tutorialDialogue = {
    PIP_PRAISE: {
        speaker: activeCustomer?.mercenary.name || "Pip the Green",
        text: "This... this is incredible. I can feel the balance in the grip. It's much better than the scraps I found in the woods. You really are a Lockhart, aren't you?",
        options: [{ label: "Continue", action: () => actions.setTutorialStep('DRAGON_TALK'), variant: 'primary' as const }]
    },
    DRAGON_TALK: {
        speaker: activeCustomer?.mercenary.name || "Pip the Green",
        text: "The village... it hasn't been the same since the Dragon's fire. I lost my brother that night. I see that same shadow in your eyes, smith. We all lost someone. Good luck with the forge.",
        options: [{ label: "Farewell", action: () => {
            handleFarewell();
            actions.setTutorialStep('TUTORIAL_END_MONOLOGUE');
        }, variant: 'primary' as const }]
    },
    TUTORIAL_END_MONOLOGUE: {
        speaker: "Lockhart",
        text: "Finally... the first sale. It's just a simple bronze blade, but it marks the beginning of my resurgence. I will rebuild this forge, piece by piece, until the name Lockhart once again commands respect across the realm. Every strike of my hammer brings me closer to the day I face that dragon. ... I miss my people. I miss my home. But I will not falter. My business starts now.",
        options: [{ label: "The Forge is Open", action: () => actions.completeTutorial(), variant: 'primary' as const }]
    }
  };

  const currentTutorialDialogue = (tutorialStep === 'PIP_PRAISE' || tutorialStep === 'DRAGON_TALK' || tutorialStep === 'TUTORIAL_END_MONOLOGUE') 
    ? tutorialDialogue[tutorialStep as keyof typeof tutorialDialogue] 
    : null;

  const getThanksDialogue = () => {
      const lines = [
          `"Fantastic craftsmanship! This ${getItemName(activeCustomer?.request.requestedId || "")} is exactly what I needed. Thank you, Lockhart!"`,
          `"Superb work. I feel much safer with this by my side. I'll be back!"`,
          `"A fair price for quality steel. May your bellows never tire, smith."`,
          `"You truly have the Lockhart touch. This will serve me well in the ruins."`
      ];
      // Deterministic based on customer ID
      const index = (activeCustomer?.id.length || 0) % lines.length;
      return lines[index];
  };

  const getRefusalDialogue = () => {
      if (refusalReaction === 'POLITE') {
          const lines = [
              `"I see. Perhaps another time then. Safe forging, smith."`,
              `"Ah, a shame. I'll keep looking elsewhere for now."`,
              `"Understandable. A Lockhart's work shouldn't be rushed. Farewell."`,
              `"I'll come back when your anvil is hotter. Until next time."`
          ];
          return lines[(activeCustomer?.id.length || 0) % lines.length];
      } else {
          const lines = [
              `"What? I walked all this way for nothing? Hmph. Don't expect me back soon."`,
              `"A cold welcome for a paying customer... I'll find a better forge."`,
              `"Unbelievable. My old blade has more edge than your business sense!"`,
              `"I thought the Lockharts were more reliable. Guess I was wrong."`
          ];
          return lines[(activeCustomer?.id.length || 0) % lines.length];
      }
  };

  return (
    <div className="relative h-full w-full bg-stone-900 overflow-hidden flex flex-col items-center justify-center">
        
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

        <div className="absolute inset-0 z-0">
            <img 
                src={getAssetUrl('shop_bg.jpeg')} 
                alt="Shop Interior" 
                className="absolute top-0 opacity-60 w-full h-full object-cover"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.style.background = 'linear-gradient(to bottom, #292524, #1c1917)';
                }}
            />
        </div>

        <ShopSign 
            isOpen={isShopOpen} 
            onToggle={handleToggleShop} 
            disabled={(!isShopOpen && !canAffordOpen) || isTutorialActive}
        />

        {/* Queue Display */}
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

        {/* Mercenary Info HUD */}
        {isShopOpen && activeCustomer && tutorialStep !== 'TUTORIAL_END_MONOLOGUE' && (
            <div className="absolute top-4 left-4 z-40 animate-in slide-in-from-left-4 duration-500 w-[32%] max-w-[180px] md:max-w-[240px]">
                <div className="bg-stone-900/90 border border-stone-700 p-2.5 md:p-4 rounded-xl backdrop-blur-md shadow-2xl">
                    <div className="flex justify-between items-center mb-1.5 md:mb-2.5">
                        <div className="flex flex-col leading-tight min-w-0">
                            <span className="font-black text-amber-500 text-[8px] md:text-[10px] tracking-widest uppercase truncate">{activeCustomer.mercenary.job}</span>
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

        {/* Character Placement */}
        <div className="absolute inset-0 z-20 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
            {isShopOpen && activeCustomer && tutorialStep !== 'TUTORIAL_END_MONOLOGUE' && (
               <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in-95 duration-700 ease-out">
                   <div className="relative h-[75dvh] md:h-[110dvh] w-auto flex justify-center bottom-[12dvh] md:bottom-0 md:translate-y-[20dvh]">
                       
                       {/* Floating Hearts Container - RENDERED BEFORE IMAGE (BEHIND) */}
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

                       <img 
                           src={activeCustomer.mercenary.sprite ? getAssetUrl(activeCustomer.mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')} 
                           alt="Adventurer"
                           className={`h-full w-auto object-contain object-bottom filter drop-shadow-[0_0_100px_rgba(0,0,0,0.95)] transition-all duration-500 relative z-10 ${refusalReaction === 'ANGRY' ? 'brightness-50 sepia-50' : ''}`}
                       />
                       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-16 bg-black/60 blur-3xl rounded-full -z-10"></div>
                   </div>
               </div>
            )}
        </div>

        {/* Shop Counter */}
        <div className="absolute bottom-0 w-full h-[35dvh] md:h-64 z-30 flex items-end justify-center pointer-events-none">
            {!counterImgError ? (
                <img 
                    src={getAssetUrl('shop_counter.png')} 
                    alt="Shop Counter"
                    className="w-full h-full object-cover object-top filter drop-shadow-[0_-30px_50px_rgba(0,0,0,0.8)]"
                    onError={() => setCounterImgError(true)}
                />
            ) : (
                <div className="w-full h-full bg-[#3f2e22] border-t-2 md:border-t-[8px] border-[#5d4037] shadow-[0_-40px_60px_rgba(0,0,0,0.85)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)' }}></div>
                </div>
            )}
        </div>

        {/* Bottom UI 컨테이너 */}
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
                        options={[
                            { label: "Farewell", action: handleFarewell, variant: 'primary' }
                        ]}
                        className="w-full relative pointer-events-auto"
                    />
                ) : refusalReaction ? (
                    <DialogueBox 
                        speaker={activeCustomer.mercenary.name}
                        text={getRefusalDialogue()}
                        options={[
                            { label: "Farewell", action: handleFarewell, variant: refusalReaction === 'ANGRY' ? 'danger' : 'neutral' }
                        ]}
                        className="w-full relative pointer-events-auto"
                    />
                ) : (
                    <DialogueBox 
                        speaker={activeCustomer.mercenary.name}
                        text={activeCustomer.request.dialogue}
                        highlightTerm={getItemName(activeCustomer.request.requestedId)}
                        itemDetail={{
                            icon: getItemIcon(activeCustomer.request.requestedId),
                            imageUrl: getItemImageUrl(activeCustomer.request.requestedId),
                            price: activeCustomer.request.price
                        }}
                        options={[
                            { label: `Sell (${activeCustomer.request.price} G)`, action: handleSell, variant: 'primary', disabled: !hasItem() },
                            { label: "Refuse", action: handleRefuse, variant: 'danger', disabled: isTutorialActive }
                        ]}
                        className="w-full relative pointer-events-auto"
                    />
                )
            ) : null}
        </div>

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
                            <p className="text-stone-500 text-xs md:text-base mt-2 mb-6 leading-relaxed">
                                You lack the energy to manage the counter. Take a rest to recover.
                            </p>
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

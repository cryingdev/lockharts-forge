import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useGame } from '../../../../context/GameContext';
import { materials } from '../../../../data/materials';
import { MARKET_CATALOG } from '../../../../data/market/index';
import { InventoryItem } from '../../../../types/inventory';
import { GAME_CONFIG } from '../../../../config/game-config';

export type MarketViewMode = 'INTERACTION' | 'CATALOG';

export interface FloatingHeart {
    id: number;
    left: number;
    delay: number;
    size: number;
}

export const useMarket = (onNavigate: (tab: any) => void) => {
    const { state, actions } = useGame();
    const [viewMode, setViewMode] = useState<MarketViewMode>('INTERACTION');
    const [dialogue, setDialogue] = useState("Ah, Lockhart. I heard the hammer falling on that old anvil again. Good to see you haven't given up on the family trade.");
    const [cart, setCart] = useState<Record<string, number>>({});
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [itemMultipliers, setItemMultipliers] = useState<Record<string, number>>({});
    const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [pendingGiftItem, setPendingGiftItem] = useState<InventoryItem | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

    const { hasFurnace, hasWorkbench } = state.forge;
    const currentTier = state.stats.tierLevel;

    // Tutorial Sync
    useEffect(() => {
        if (state.tutorialStep === 'FURNACE_GUIDE') setViewMode('CATALOG');
        else if (state.tutorialStep === 'GARRICK_AFTER_PURCHASE_DIALOG') setViewMode('INTERACTION');
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

    const prevAffinityRef = useRef<number>(state.garrickAffinity);
    useEffect(() => {
        if (state.garrickAffinity > prevAffinityRef.current) {
            spawnHearts(Math.min(10, (state.garrickAffinity - prevAffinityRef.current) * 2));
        }
        prevAffinityRef.current = state.garrickAffinity;
    }, [state.garrickAffinity, spawnHearts]);

    // Explicitly typed parameters to fix "Operator '+' cannot be applied to types 'unknown' and 'unknown'"
    const cartItemCount = useMemo(() => Object.values(cart).reduce((a: number, b: number) => a + b, 0), [cart]);

    // Explicitly typed parameters to fix arithmetic operation errors on unknown types
    const totalCost = useMemo(() => {
        return Object.entries(cart).reduce((total: number, [id, count]: [string, number]) => {
            return total + ((materials[id]?.baseValue ?? 0) * count);
        }, 0);
    }, [cart]);

    const categorizedMarketItems = useMemo(() => {
        if (state.tutorialStep === 'FURNACE_GUIDE') {
            const config = MARKET_CATALOG.find(c => c.id === 'furnace');
            return config ? [{ id: 'fac', name: 'Facilities', items: [{ ...config, meta: materials['furnace'] }] }] : [];
        }

        const groups: Record<string, any[]> = { t1: [], t2: [], t3: [], t4: [], sup: [], tech: [], fac: [] };
        MARKET_CATALOG.forEach(config => {
            const meta = materials[config.id];
            if (!meta) return;
            const isOwned = (config.id === 'furnace' && hasFurnace) || (config.id === 'workbench' && hasWorkbench);
            if (config.type === 'FACILITY' && isOwned) return;
            
            // 티어 제한이 있는 아이템들 (RESOURCE, SUPPLY, TECHNIQUE) 필터링
            const isTierRestricted = config.type === 'RESOURCE' || config.type === 'SUPPLY' || config.type === 'TECHNIQUE';
            if (isTierRestricted && (meta.tier || 1) > currentTier) return;

            const payload = { ...config, meta };
            if (config.type === 'RESOURCE') groups[`t${meta.tier || 1}`].push(payload);
            else if (config.type === 'SUPPLY') groups.sup.push(payload);
            else if (config.type === 'TECHNIQUE') groups.tech.push(payload);
            else if (config.type === 'FACILITY') groups.fac.push(payload);
        });

        return [
            { id: 'tier1', name: 'Tier 1 Resources', items: groups.t1 },
            { id: 'tier2', name: 'Tier 2 Resources', items: groups.t2 },
            { id: 'tier3', name: 'Tier 3 Resources', items: groups.t3 },
            { id: 'tier4', name: 'Tier 4 Resources', items: groups.t4 },
            { id: 'sup', name: 'Potions & Supplies', items: groups.sup },
            { id: 'tech', name: 'Techniques', items: groups.tech },
            { id: 'fac', name: 'Facilities', items: groups.fac },
        ].filter(g => g.items.length > 0);
    }, [hasFurnace, hasWorkbench, currentTier, state.tutorialStep]);

    const addToCart = (itemId: string, amount: number = 1) => {
        if (itemId === 'scroll_t2' && state.garrickAffinity < 20) {
            setDialogue("Requires 20 Affinity with Garrick.");
            return false;
        }
        if (itemId === 'scroll_t3' && state.garrickAffinity < 40) {
            setDialogue("Requires 40 Affinity with Garrick.");
            return false;
        }
        const available = (state.marketStock[itemId] || 0) - (cart[itemId] || 0);
        if (available <= 0) return false;
        const addCount = Math.min(amount, available);
        
        if (itemId === 'furnace' && state.tutorialStep === 'FURNACE_GUIDE') actions.setTutorialStep('OPEN_SHOPPING_CART');

        setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + addCount }));
        return true;
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => {
            const next = { ...prev };
            if (next[itemId] > 1) next[itemId]--;
            else delete next[itemId];
            return next;
        });
    };

    const handleBuy = () => {
        if (cartItemCount === 0 || totalCost > state.stats.gold) return;
        if (state.tutorialStep === 'PAY_NOW') {
            if (cart['furnace']) actions.setTutorialStep('GARRICK_AFTER_PURCHASE_DIALOG');
            else actions.setTutorialStep(null);
        }
        actions.buyItems(Object.entries(cart).map(([id, count]) => ({ id, count })), totalCost);
        setCart({});
        setIsCartOpen(false);
    };

    return {
        state, actions, viewMode, setViewMode, dialogue, setDialogue, cart, isCartOpen, setIsCartOpen,
        itemMultipliers, setItemMultipliers, floatingHearts, showGiftModal, setShowGiftModal,
        pendingGiftItem, setPendingGiftItem, collapsedSections, setCollapsedSections,
        cartItemCount, totalCost, categorizedMarketItems,
        handlers: {
            handleTalk: () => {
                if (!state.talkedToGarrickToday) actions.talkGarrick();
                const lines = ["Roads are dangerous lately.", "Your grandfather was a legend.", "Need rarity? Prove your worth."];
                setDialogue(lines[Math.floor(Math.random() * lines.length)]);
            },
            handleGiftInit: (item: InventoryItem) => {
                if (item.isLocked) return actions.showToast("Item is locked.");
                setPendingGiftItem(item); setShowGiftModal(false);
                setDialogue(`"Would you like this, Garrick?"`);
            },
            handleConfirmGift: () => {
                if (!pendingGiftItem) return;
                actions.giftGarrick({ itemId: pendingGiftItem.id });
                setPendingGiftItem(null); setDialogue("For me? Hah, you're a thoughtful one.");
            },
            addToCart, removeFromCart, deleteFromCart: (id: string) => setCart(prev => { const n = {...prev}; delete n[id]; return n; }),
            handleBuy, handleBackToForge: () => {
                if (state.tutorialStep === 'LEAVE_MARKET_GUIDE') {
                    actions.setTutorialScene('FURNACE_RESTORED');
                    actions.setTutorialStep(null);
                }
                onNavigate('FORGE');
            }
        }
    };
};
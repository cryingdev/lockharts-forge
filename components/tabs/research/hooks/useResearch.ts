import { useState, useCallback, useMemo } from 'react';
import { useGame } from '../../../../context/GameContext';
import { InventoryItem } from '../../../../types/inventory';
import { EQUIPMENT_ITEMS } from '../../../../data/equipment';

export type ResearchResultType = 'SUCCESS' | 'RESONATE' | 'FAIL';

export interface ResearchResult {
    type: ResearchResultType;
    recipeId?: string;
}

export const useResearch = () => {
    const { state, actions } = useGame();
    const [selectedSlots, setSelectedSlots] = useState<(InventoryItem | null)[]>([null, null, null, null]);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isResearching, setIsResearching] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);
    const [result, setResult] = useState<ResearchResult | null>(null);

    const inventoryItems = useMemo(() => {
        return state.inventory.filter(i => 
            i.type === 'RESOURCE' && 
            ['METAL', 'WOOD', 'LEATHER', 'CLOTH', 'MONSTER_PART', 'GEM', 'FUEL'].includes(i.category || '')
        );
    }, [state.inventory]);

    const handleSelectItem = useCallback((item: InventoryItem) => {
        if (isResearching || result) return;
        const existingIdx = selectedSlots.findIndex(s => s && s.id === item.id);
        
        const newSlots = [...selectedSlots];
        if (existingIdx > -1) {
            const currentInSlot = newSlots[existingIdx]!;
            if (currentInSlot.quantity < item.quantity) {
                newSlots[existingIdx] = { ...currentInSlot, quantity: currentInSlot.quantity + 1 };
            } else {
                actions.showToast("Maximum inventory reached in research slots.");
            }
        } else {
            const emptyIdx = selectedSlots.findIndex(s => !s);
            if (emptyIdx === -1) {
                actions.showToast("Research slots are full.");
                return;
            }
            newSlots[emptyIdx] = { ...item, quantity: 1 };
        }
        setSelectedSlots(newSlots);
    }, [selectedSlots, actions, isResearching, result]);

    const handleIncrementQuantity = useCallback((idx: number) => {
        if (isResearching || result) return;
        const newSlots = [...selectedSlots];
        const itemInSlot = newSlots[idx];
        if (!itemInSlot) return;

        const invItem = state.inventory.find(i => i.id === itemInSlot.id);
        if (invItem && itemInSlot.quantity < invItem.quantity) {
            newSlots[idx] = { ...itemInSlot, quantity: itemInSlot.quantity + 1 };
            setSelectedSlots(newSlots);
        } else {
            actions.showToast("No more items available in inventory.");
        }
    }, [selectedSlots, state.inventory, actions, isResearching, result]);

    const handleDecrementQuantity = useCallback((idx: number) => {
        if (isResearching || result) return;
        const newSlots = [...selectedSlots];
        const item = newSlots[idx];
        if (!item) return;

        if (item.quantity > 1) {
            newSlots[idx] = { ...item, quantity: item.quantity - 1 };
        } else {
            newSlots[idx] = null;
        }
        setSelectedSlots(newSlots);
    }, [selectedSlots, isResearching, result]);

    const handleRemoveItem = useCallback((idx: number) => {
        if (isResearching || result) return;
        const newSlots = [...selectedSlots];
        newSlots[idx] = null;
        setSelectedSlots(newSlots);
    }, [selectedSlots, isResearching, result]);

    const handleClearResult = useCallback(() => {
        setResult(null);
        setSelectedSlots([null, null, null, null]);
    }, []);

    const handleResearch = useCallback(() => {
        if (isResearching || result) return;
        const itemsToProcess = selectedSlots
            .filter((s): s is InventoryItem => s !== null);
            
        if (itemsToProcess.length === 0) return;

        // Pre-calculate result logic for timing
        const inputData = itemsToProcess.map(s => ({ id: s.id, count: s.quantity }));
        const inputIds = [...inputData].sort((a,b) => a.id.localeCompare(b.id)).map(i => i.id);
        const sortedInput = [...inputData].sort((a,b) => a.id.localeCompare(b.id));

        const lockedRecipes = EQUIPMENT_ITEMS.filter(item => 
            !state.unlockedRecipes.includes(item.id) && item.unlockedByDefault === false
        );

        let finalType: ResearchResultType = 'FAIL';
        let foundId: string | undefined = undefined;

        for (const recipe of lockedRecipes) {
            const sortedReqs = [...recipe.requirements].sort((a, b) => a.id.localeCompare(b.id));
            const reqIds = sortedReqs.map(r => r.id);

            if (JSON.stringify(inputIds) === JSON.stringify(reqIds)) {
                const countsMatch = sortedReqs.every((req, idx) => req.count === sortedInput[idx].count);
                if (countsMatch) {
                    finalType = 'SUCCESS';
                    foundId = recipe.id;
                    break;
                } else {
                    finalType = 'RESONATE';
                }
            }
        }

        // Start Animation Flow
        setIsResearching(true);
        setIsInventoryModalOpen(false);
        setResult({ type: finalType, recipeId: foundId }); // Set result early to trigger the correct CSS animation

        // Success/Resonate takes 5s, Fail takes 3s for "ejection" feel
        const animDuration = finalType === 'FAIL' ? 3000 : 5000;

        setTimeout(() => {
            setIsFlashing(true);
            
            // Apply logic to state (consume items, potentially unlock)
            actions.researchCombination(inputData);
            
            // Final Reveal (The result state is already set, this confirms UI transition)
            setTimeout(() => {
                setIsFlashing(false);
                setIsResearching(false);
            }, animDuration > 3000 ? 500 : 300);

        }, animDuration);
    }, [selectedSlots, actions, isResearching, result, state.unlockedRecipes]);

    return {
        selectedSlots,
        isInventoryModalOpen,
        inventoryItems,
        isResearching,
        isFlashing,
        result,
        handlers: {
            handleSelectItem,
            handleIncrementQuantity,
            handleDecrementQuantity,
            handleRemoveItem,
            handleClearResult,
            handleResearch,
            setIsInventoryModalOpen
        }
    };
};

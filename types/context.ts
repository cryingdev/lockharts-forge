
import { GameState } from './game-state';
import { EquipmentItem, EquipmentSlotType } from './inventory';
import { ShopCustomer } from './shop';
import { Mercenary } from '../models/Mercenary';

export interface GameContextType {
  state: GameState;
  actions: {
    repairItem: () => void; // Placeholder for Cold Forging
    rest: () => void; // Trigger Sleep Modal (Manual)
    confirmSleep: () => void; // Actually proceed to next day (From Modal)
    handleEventOption: (action: () => void) => void;
    closeEvent: () => void;
    
    // Crafting Lifecycle
    startCrafting: (item: EquipmentItem) => void; // Deducts resources
    cancelCrafting: (item: EquipmentItem) => void; // Refunds resources
    finishCrafting: (item: EquipmentItem, quality: number) => void; // Generates Item
    craftItem: (item: EquipmentItem, quality: number) => void; 
    
    buyItems: (items: { id: string; count: number }[], totalCost: number) => void;
    sellItem: (itemId: string, count: number, price: number, equipmentInstanceId?: string, customer?: Mercenary) => void;
    toggleShop: () => void;
    addMercenary: (merc: Mercenary) => void;
    consumeItem: (id: string, count: number) => void;
    
    // Shop Specific Actions
    enqueueCustomer: (customer: ShopCustomer) => void;
    nextCustomer: () => void;
    dismissCustomer: () => void;

    // Logic Control
    setCrafting: (isCrafting: boolean) => void;
    updateForgeStatus: (temp: number) => void; // Save residual heat
    toggleJournal: () => void; // Open/Close Journal

    // Contracts
    hireMercenary: (mercenaryId: string, cost: number) => void;
    fireMercenary: (mercenaryId: string) => void;

    // Dungeon Actions
    startExpedition: (dungeonId: string, partyIds: string[]) => void;
    completeExpedition: (expeditionId: string) => void; // Transition ACTIVE -> COMPLETED
    claimExpedition: (expeditionId: string) => void;
    dismissDungeonResult: () => void; // Close modal

    // Equipment Actions
    equipItem: (mercenaryId: string, inventoryItemId: string) => void;
    unequipItem: (mercenaryId: string, slot: EquipmentSlotType) => void;

    // Item Actions
    useItem: (itemId: string) => void;
  };
}

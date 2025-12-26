import { GameState } from './game-state';
import { EquipmentItem, EquipmentSlotType } from './inventory';
import { ShopCustomer } from './shop';
import { Mercenary } from '../models/Mercenary';
import { PrimaryStats } from '../models/Stats';
import { GameEvent } from './events';

export interface GameContextType {
  state: GameState;
  actions: {
    repairItem: () => void;
    rest: () => void;
    confirmSleep: () => void;
    // Added triggerEvent to actions to fix property missing error in ForgeTab
    triggerEvent: (event: GameEvent) => void;
    handleEventOption: (action: () => void) => void;
    closeEvent: () => void;
    
    startCrafting: (item: EquipmentItem) => void;
    cancelCrafting: (item: EquipmentItem) => void;
    finishCrafting: (item: EquipmentItem, quality: number, bonus?: number) => void;
    craftItem: (item: EquipmentItem, quality: number) => void; 
    dismissCraftingResult: () => void;
    
    buyItems: (items: { id: string; count: number }[], totalCost: number) => void;
    sellItem: (itemId: string, count: number, price: number, equipmentInstanceId?: string, customer?: Mercenary) => void;
    toggleShop: () => void;
    addMercenary: (merc: Mercenary) => void;
    consumeItem: (id: string, count: number) => void;
    
    enqueueCustomer: (customer: ShopCustomer) => void;
    nextCustomer: () => void;
    dismissCustomer: () => void;

    setCrafting: (isCrafting: boolean) => void;
    updateForgeStatus: (temp: number) => void;
    toggleJournal: () => void;

    hireMercenary: (mercenaryId: string, cost: number) => void;
    fireMercenary: (mercenaryId: string) => void;

    startExpedition: (dungeonId: string, partyIds: string[]) => void;
    completeExpedition: (expeditionId: string) => void;
    claimExpedition: (expeditionId: string) => void;
    dismissDungeonResult: () => void;

    equipItem: (mercenaryId: string, inventoryItemId: string) => void;
    unequipItem: (mercenaryId: string, slot: EquipmentSlotType) => void;

    useItem: (itemId: string) => void;
    allocateStat: (mercenaryId: string, stat: keyof PrimaryStats) => void;
    updateMercenaryStats: (mercenaryId: string, stats: PrimaryStats) => void;

    triggerEnergyHighlight: () => void;
  };
}
import { GameState } from './game-state';
import { EquipmentItem } from './inventory';
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
  };
}
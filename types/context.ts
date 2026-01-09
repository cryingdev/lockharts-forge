
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
    closeRest: () => void;
    triggerEvent: (event: GameEvent) => void;
    handleEventOption: (action: () => void) => void;
    closeEvent: () => void;

    saveGame: (slotIndex?: number) => void;
    loadGame: (loadedState: GameState) => void;
    
    startCrafting: (item: EquipmentItem) => void;
    cancelCrafting: (item: EquipmentItem) => void;
    finishCrafting: (item: EquipmentItem; quality: number; bonus?: number; masteryGain?: number) => void;
    craftItem: (item: EquipmentItem; quality: number) => void; 
    dismissCraftingResult: () => void;
    
    buyItems: (items: { id: string; count: number }[], totalCost: number) => void;
    sellItem: (itemId: string, count: number, price: number, equipmentInstanceId?: string, customer?: Mercenary) => void;
    toggleShop: () => void;
    addMercenary: (merc: Mercenary) => void;
    scoutMercenary: (merc: Mercenary, cost: number) => void;
    consumeItem: (id: string, count: number) => void;
    
    enqueueCustomer: (customer: ShopCustomer) => void;
    nextCustomer: () => void;
    dismissCustomer: () => void;
    // Added missing refuseCustomer method definition
    refuseCustomer: (mercenaryId: string, affinityLoss: number) => void;

    setCrafting: (isCrafting: boolean) => void;
    updateForgeStatus: (temp: number) => void;
    toggleJournal: () => void;

    hireMercenary: (mercenaryId: string, cost: number) => void;
    fireMercenary: (mercenaryId: string) => void;
    giveGift: (mercenaryId: string, itemId: string) => void;
    talkMercenary: (mercenaryId: string) => void;

    startExpedition: (dungeonId: string, partyIds: string[]) => void;
    completeExpedition: (expeditionId: string) => void;
    // Added missing abortExpedition method definition
    abortExpedition: (expeditionId: string) => void;
    claimExpedition: (expeditionId: string) => void;
    dismissDungeonResult: () => void;

    equipItem: (mercenaryId: string, inventoryItemId: string) => void;
    unequipItem: (mercenaryId: string, slot: EquipmentSlotType) => void;

    useItem: (itemId: string) => void;
    allocateStat: (mercenaryId: string, stat: keyof PrimaryStats) => void;
    updateMercenaryStats: (mercenaryId: string, stats: PrimaryStats) => void;

    triggerEnergyHighlight: () => void;
    showToast: (message: string) => void;
    hideToast: () => void;

    setTutorialStep: (step: GameState['tutorialStep']) => void;
    // Added missing setTutorialScene action to fix property does not exist error
    setTutorialScene: (mode: GameState['activeTutorialScene']) => void;
    // Added missing completePrologue action
    completePrologue: () => void;
    // Added missing completeTutorial action
    completeTutorial: () => void;

    // Manual Dungeon Actions
    startManualAssault: (dungeonId: string, partyIds: string[]) => void;
    moveInManualDungeon: (dx: number, dy: number) => void;
    finishManualAssault: () => void;
    retreatFromManualDungeon: () => void;
    toggleManualDungeonOverlay: (show: boolean) => void;
    rescueMercenary: (npcId: string) => void;
  };
}

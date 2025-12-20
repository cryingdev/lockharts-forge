
import { GameEvent } from '../types/events';
import { EquipmentItem, EquipmentSlotType } from '../types/inventory';
import { ShopCustomer } from '../types/shop';
import { Mercenary } from '../models/Mercenary';
import { PrimaryStats } from '../models/Stats';

export type GameAction =
  | { type: 'REPAIR_WORK' }
  | { type: 'SLEEP' }        
  | { type: 'CONFIRM_SLEEP' } 
  | { type: 'TRIGGER_EVENT'; payload: GameEvent }
  | { type: 'CLOSE_EVENT' }
  | { type: 'ACQUIRE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'PAY_COST'; payload: { gold?: number; items?: { id: string; count: number }[] } }
  | { type: 'BUY_MARKET_ITEMS'; payload: { items: { id: string; count: number }[]; totalCost: number } }
  | { type: 'INSTALL_FURNACE' }
  | { type: 'START_CRAFTING'; payload: { item: EquipmentItem } }
  | { type: 'CANCEL_CRAFTING'; payload: { item: EquipmentItem } }
  | { type: 'FINISH_CRAFTING'; payload: { item: EquipmentItem; quality: number; bonus?: number } }
  | { type: 'SELL_ITEM'; payload: { itemId: string; count: number; price: number; equipmentInstanceId?: string; customer?: Mercenary } }
  | { type: 'TOGGLE_SHOP' }
  | { type: 'ADD_KNOWN_MERCENARY'; payload: Mercenary }
  | { type: 'ENQUEUE_CUSTOMER'; payload: ShopCustomer }
  | { type: 'NEXT_CUSTOMER' }
  | { type: 'DISMISS_CUSTOMER' }
  | { type: 'SET_CRAFTING'; payload: boolean }
  | { type: 'UPDATE_FORGE_STATUS'; payload: { temp: number } }
  | { type: 'TOGGLE_JOURNAL' }
  | { type: 'HIRE_MERCENARY'; payload: { mercenaryId: string; cost: number } }
  | { type: 'FIRE_MERCENARY'; payload: { mercenaryId: string } }
  | { type: 'START_EXPEDITION'; payload: { dungeonId: string; partyIds: string[] } }
  | { type: 'COMPLETE_EXPEDITION'; payload: { expeditionId: string } }
  | { type: 'CLAIM_EXPEDITION'; payload: { expeditionId: string } }
  | { type: 'DISMISS_DUNGEON_RESULT' }
  | { type: 'EQUIP_ITEM'; payload: { mercenaryId: string; inventoryItemId: string } }
  | { type: 'UNEQUIP_ITEM'; payload: { mercenaryId: string; slot: EquipmentSlotType } }
  | { type: 'USE_ITEM'; payload: { itemId: string } }
  | { type: 'ALLOCATE_STAT'; payload: { mercenaryId: string; stat: keyof PrimaryStats } };

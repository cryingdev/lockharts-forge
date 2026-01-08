
import { GameEvent } from '../types/events';
import { EquipmentItem, InventoryItem } from '../types/inventory';
import { EquipmentSlotType } from '../models/Equipment';
import { ShopCustomer } from '../types/shop';
import { Mercenary } from '../models/Mercenary';
import { PrimaryStats } from '../models/Stats';
import { GameState } from '../types/game-state';

export type GameAction =
  | { type: 'REPAIR_WORK' }
  | { type: 'SLEEP' }        
  | { type: 'CONFIRM_SLEEP' } 
  | { type: 'CLOSE_SLEEP_MODAL' }
  | { type: 'TRIGGER_EVENT'; payload: GameEvent }
  | { type: 'CLOSE_EVENT' }
  | { type: 'ACQUIRE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'PAY_COST'; payload: { gold?: number; items?: { id: string; count: number }[] } }
  | { type: 'BUY_MARKET_ITEMS'; payload: { items: { id: string; count: number }[]; totalCost: number } }
  | { type: 'INSTALL_FURNACE' }
  | { type: 'START_CRAFTING'; payload: { item: EquipmentItem } }
  | { type: 'CANCEL_CRAFTING'; payload: { item: EquipmentItem } }
  | { type: 'FINISH_CRAFTING'; payload: { item: EquipmentItem; quality: number; bonus?: number; masteryGain?: number } }
  | { type: 'DISMISS_CRAFTING_RESULT' }
  | { type: 'SELL_ITEM'; payload: { itemId: string; count: number; price: number; equipmentInstanceId?: string; customer?: Mercenary } }
  | { type: 'TOGGLE_SHOP' }
  | { type: 'ADD_KNOWN_MERCENARY'; payload: Mercenary }
  | { type: 'SCOUT_MERCENARY'; payload: { mercenary: Mercenary; cost: number } }
  | { type: 'ENQUEUE_CUSTOMER'; payload: ShopCustomer }
  | { type: 'NEXT_CUSTOMER' }
  | { type: 'DISMISS_CUSTOMER' }
  | { type: 'SET_CRAFTING'; payload: boolean }
  | { type: 'UPDATE_FORGE_STATUS'; payload: { temp: number } }
  | { type: 'TOGGLE_JOURNAL' }
  | { type: 'HIRE_MERCENARY'; payload: { mercenaryId: string; cost: number } }
  | { type: 'FIRE_MERCENARY'; payload: { mercenaryId: string } }
  | { type: 'GIVE_GIFT'; payload: { mercenaryId: string; itemId: string } }
  | { type: 'TALK_MERCENARY'; payload: { mercenaryId: string } }
  | { type: 'START_EXPEDITION'; payload: { dungeonId: string; partyIds: string[] } }
  | { type: 'COMPLETE_EXPEDITION'; payload: { expeditionId: string } }
  | { type: 'CLAIM_EXPEDITION'; payload: { expeditionId: string } }
  | { type: 'ABORT_EXPEDITION'; payload: { expeditionId: string } }
  | { type: 'DISMISS_DUNGEON_RESULT' }
  | { type: 'EQUIP_ITEM'; payload: { mercenaryId: string; inventoryItemId: string } }
  | { type: 'UNEQUIP_ITEM'; payload: { mercenaryId: string; slot: EquipmentSlotType } }
  | { type: 'USE_ITEM'; payload: { itemId: string } }
  | { type: 'ALLOCATE_STAT'; payload: { mercenaryId: string; stat: keyof PrimaryStats } }
  | { type: 'UPDATE_MERCENARY_STATS'; payload: { mercenaryId: string; stats: PrimaryStats } }
  | { type: 'SET_UI_EFFECT'; payload: { effect: keyof GameState['uiEffects']; value: boolean } }
  | { type: 'SHOW_TOAST'; payload: string }
  | { type: 'HIDE_TOAST' }
  | { type: 'LOAD_GAME'; payload: GameState }
  // Manual Dungeon Actions
  | { type: 'START_MANUAL_DUNGEON'; payload: { dungeonId: string; partyIds: string[] } }
  | { type: 'MOVE_MANUAL_DUNGEON'; payload: { x: number; y: number } }
  | { type: 'FINISH_MANUAL_DUNGEON' }
  | { type: 'RETREAT_MANUAL_DUNGEON' }
  | { type: 'TOGGLE_MANUAL_DUNGEON_OVERLAY'; payload: boolean }
  | { type: 'RESCUE_NPC'; payload: { npcId: string } };

export type GameEventId = 'NONE' | 'MERCHANT_ARRIVAL' | 'CUSTOMER_VISIT';

export interface GameEvent {
  id: GameEventId;
  title: string;
  description: string;
  options: {
    label: string;
    action: () => void;
    cost?: { gold?: number; items?: { id: string; count: number }[] };
  }[];
}
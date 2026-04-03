export type GameEventId = 'NONE' | 'MERCHANT_ARRIVAL' | 'CUSTOMER_VISIT';

export interface GameEvent {
  id: GameEventId;
  title: string;
  titleKey?: string;
  description: string;
  descriptionKey?: string;
  options: {
    label: string;
    labelKey?: string;
    action: () => void;
    cost?: { gold?: number; items?: { id: string; count: number }[] };
  }[];
}

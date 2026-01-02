import { Mercenary } from '../models/Mercenary';

export interface ShopRequest {
    type: 'RESOURCE' | 'EQUIPMENT';
    requestedId: string;
    price: number;
    dialogue: string;
}

export interface ShopCustomer {
    id: string; // unique transaction id
    mercenary: Mercenary;
    request: ShopRequest;
    entryTime: number; 
}
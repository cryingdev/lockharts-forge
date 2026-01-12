import { Mercenary } from '../models/Mercenary';

export interface ShopRequest {
    type: 'RESOURCE' | 'EQUIPMENT';
    requestedId: string;
    price: number;
    markup?: number; // Markup percentage offered by the customer
    dialogue: string;
}

export interface ShopCustomer {
    id: string; // unique transaction id
    mercenary: Mercenary;
    request: ShopRequest;
    entryTime: number; 
}
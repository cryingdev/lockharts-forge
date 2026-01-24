import { EQUIPMENT_CATEGORIES, EQUIPMENT_SUBCATEGORIES } from './equipment/constants';
import { TIER1_ITEMS } from './equipment/tier1';
import { TIER2_ITEMS } from './equipment/tier2';
import { TIER3_ITEMS } from './equipment/tier3';
import { TIER4_ITEMS } from './equipment/tier4';

export { EQUIPMENT_CATEGORIES, EQUIPMENT_SUBCATEGORIES };

export const EQUIPMENT_ITEMS = [
  ...TIER1_ITEMS,
  ...TIER2_ITEMS,
  ...TIER3_ITEMS,
  ...TIER4_ITEMS,
];

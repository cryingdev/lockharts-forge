import { ItemDefinition } from '../types/inventory';
import { Language } from '../types/game-state';
import { hasTranslation, t } from './i18n';

export const getLocalizedItemName = (
  language: Language,
  item: Pick<ItemDefinition, 'id' | 'name'>
) => {
  const key = `items.${item.id}.name`;
  return hasTranslation(language, key) ? t(language, key) : item.name;
};

export const getLocalizedItemDescription = (
  language: Language,
  item: Pick<ItemDefinition, 'id' | 'description'>
) => {
  const key = `items.${item.id}.description`;
  return hasTranslation(language, key) ? t(language, key) : item.description;
};

import en from '../locales/en';
import ko from '../locales/ko';
import { Language } from '../types/game-state';

type LocaleDictionary = {
  [key: string]: string | LocaleDictionary;
};

const dictionaries: Record<Language, LocaleDictionary> = {
  en: en as LocaleDictionary,
  ko: ko as LocaleDictionary,
};

const getNestedValue = (obj: Record<string, unknown>, key: string): string | undefined => {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);

  return typeof value === 'string' ? value : undefined;
};

export const t = (
  language: Language,
  key: string,
  params?: Record<string, string | number>
): string => {
  const template =
    getNestedValue(dictionaries[language] as unknown as Record<string, unknown>, key) ??
    getNestedValue(dictionaries.en as unknown as Record<string, unknown>, key) ??
    key;

  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value === undefined ? `{${token}}` : String(value);
  });
};

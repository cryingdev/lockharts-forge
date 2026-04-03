import { GameState } from '../types/game-state';
import { t } from './i18n';

export const getDefaultPlayerName = (language: GameState['settings']['language']) =>
  t(language, 'names.lockhart');

export const extractLegacyPlayerName = (rawName: string | undefined, language: GameState['settings']['language']) => {
  const value = rawName?.trim();
  if (!value) return '';

  if (language === 'ko' && value.endsWith('의 대장간')) {
    return value.replace(/의 대장간$/, '').trim();
  }

  if (value.endsWith("'s Forge")) {
    return value.replace(/'s Forge$/, '').trim();
  }

  if (value.endsWith(' Forge')) {
    return value.replace(/ Forge$/, '').trim();
  }

  return value;
};

export const getPlayerName = (state: GameState) => {
  const configured = state.settings.playerName?.trim();
  if (configured) return configured;

  const legacy = extractLegacyPlayerName(state.settings.forgeName, state.settings.language);
  return legacy || getDefaultPlayerName(state.settings.language);
};

export const getForgeNameFromPlayerName = (
  language: GameState['settings']['language'],
  playerName: string
) => {
  const safeName = playerName.trim() || getDefaultPlayerName(language);
  return t(language, 'names.player_forge', { playerName: safeName });
};

export const getDefaultForgeName = (language: GameState['settings']['language']) =>
  getForgeNameFromPlayerName(language, getDefaultPlayerName(language));

export const getForgeName = (state: GameState) =>
  getForgeNameFromPlayerName(state.settings.language, getPlayerName(state));

export const splitTitleName = (name: string): [string, string?] => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return [name.trim() || ''];
  const midpoint = Math.ceil(parts.length / 2);
  return [parts.slice(0, midpoint).join(' '), parts.slice(midpoint).join(' ')];
};

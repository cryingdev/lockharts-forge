
const SESSION_VERSION = Date.now();

export const getAssetUrl = (filename: string): string => {
  const baseUrl = 'https://raw.githubusercontent.com/cryingdev/lockharts-forge/main/assets/';
  // Use the static session version to cache images for the duration of the session
  return `${baseUrl}${filename}?v=${SESSION_VERSION}`;
};

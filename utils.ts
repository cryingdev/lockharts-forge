const SESSION_VERSION = Date.now();

export const getAssetUrl = (filename: string): string => {
  const baseUrl = 'https://raw.githubusercontent.com/cryingdev/lockharts-forge/sub/assets/';
  // Use the static session version to cache images for the duration of the session
  return `${baseUrl}${filename}?v=${SESSION_VERSION}`;
};

/**
 * Formats a duration in milliseconds to a MM:SS string.
 */
export const formatDuration = (ms: number): string => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};


const SESSION_VERSION = Date.now();

/**
 * 이미지 등 일반 에셋의 URL을 생성합니다.
 */
export const getAssetUrl = (filename: string, folder?: string): string => {
  const baseUrl = 'https://raw.githubusercontent.com/cryingdev/lockharts-forge/sub/assets/';
  
  let path = filename;
  if (folder) {
    const cleanFolder = folder.endsWith('/') ? folder.slice(0, -1) : folder;
    const cleanFile = filename.startsWith('/') ? filename.slice(1) : filename;
    path = `${cleanFolder}/${cleanFile}`;
  }
  
  return `${baseUrl}${path}?v=${SESSION_VERSION}`;
};

/**
 * sfx 폴더 내의 오디오 에셋 URL을 생성합니다.
 * 경로가 assets/audio/sfx/로 고정되어 있습니다.
 */
export const getAudioUrl = (filename: string): string => {
  const baseUrl = 'https://raw.githubusercontent.com/cryingdev/lockharts-forge/sub/assets/audio/sfx/';
  const cleanFile = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${baseUrl}${cleanFile}?v=${SESSION_VERSION}`;
};

/**
 * audio/tracks 폴더 내의 음악 트랙 URL을 생성합니다.
 */
export const getMusicUrl = (filename: string): string => {
    const baseUrl = 'https://raw.githubusercontent.com/cryingdev/lockharts-forge/sub/assets/audio/tracks/';
    const cleanFile = filename.startsWith('/') ? filename.slice(1) : filename;
    return `${baseUrl}${cleanFile}?v=${SESSION_VERSION}`;
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

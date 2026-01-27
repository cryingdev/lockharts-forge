const SESSION_VERSION = Date.now();

export const getAssetUrl = (filename: string, folder?: string): string => {
  const baseUrl = 'https://raw.githubusercontent.com/cryingdev/lockharts-forge/sub/assets/';
  
  let path = filename;
  if (folder) {
    // 폴더와 파일명 사이의 중복 슬래시 방지 및 경로 결합
    const cleanFolder = folder.endsWith('/') ? folder.slice(0, -1) : folder;
    const cleanFile = filename.startsWith('/') ? filename.slice(1) : filename;
    path = `${cleanFolder}/${cleanFile}`;
  }
  
  // Use the static session version to cache images for the duration of the session
  return `${baseUrl}${path}?v=${SESSION_VERSION}`;
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
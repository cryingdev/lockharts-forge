
const SESSION_VERSION = Date.now();

/**
 * 전역 에셋 캐시 (메모리 상의 리소스 저장소)
 */
export const AssetCache = {
    audio: new Map<string, AudioBuffer>(),
    images: new Map<string, HTMLImageElement>()
};

/**
 * 전역 오디오 에셋 목록
 */
export const AUDIO_MANIFEST = {
    BGM: [
        'track_01.mp3',
        'dungeon_track_01.mp3',
        'battle_track_01.mp3'
    ],
    SFX: [
        'item_click.wav',
        'tab_switch.wav',
        'click_light.wav',
        'click_medium.wav',
        // Dungeon
        'trap_triggered.mp3',
        'get_coin.mp3',
        'found_item.mp3',
        'ambush.mp3',
        'battle_slash.mp3',
        'swing_miss.mp3',
        // SmithingMinigame
        'bellows.wav',
        'billet_hit_normal.mp3',
        'fire_up.mp3',
    ]
};

/**
 * 전역 이미지 에셋 목록
 */
export const IMAGE_MANIFEST = {
    MERCENARIES: [
        'tilly_footloose_sprite.png', 'tilly_footloose_profile.png',
        'pip_green_sprite.png', 'pip_green_profile.png',
        'adeline_ashford_sprite.png', 'adeline_ashford_profile.png',
        'iron_garret_sprite.png', 'iron_garret_profile.png',
        'elara_flame_sprite.png', 'elara_flame_profile.png',
        'ylva_ironvein_sprite.png', 'ylva_ironvein_profile.png',
        'lucian_ravenscar_sprite.png', 'lucian_ravenscar_profile.png',
        'skeld_stormblood_sprite.png', 'skeld_stormblood_profile.png',
        'sly_vargo_sprite.png', 'sly_vargo_profile.png',
        'jade_nightbinder_sprite.png', 'jade_nightbinder_profile.png',
        'sister_aria_sprite.png', 'sister_aria_profile.png'
    ],
    MISC: [
        'garrick_standing_sprite.png'
    ]
};

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

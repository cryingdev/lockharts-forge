const getStorage = (type: 'local' | 'session'): Storage | null => {
    if (typeof window === 'undefined') return null;
    try {
        return type === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
        return null;
    }
};

export const readStorageString = (key: string, fallback = '', type: 'local' | 'session' = 'local'): string => {
    const storage = getStorage(type);
    if (!storage) return fallback;

    try {
        return storage.getItem(key) ?? fallback;
    } catch {
        return fallback;
    }
};

export const writeStorageString = (key: string, value: string, type: 'local' | 'session' = 'local'): boolean => {
    const storage = getStorage(type);
    if (!storage) return false;

    try {
        storage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
};

export const readStorageNumber = (key: string, fallback = 0, type: 'local' | 'session' = 'local'): number => {
    const rawValue = readStorageString(key, '', type);
    if (rawValue === '') return fallback;

    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const writeStorageNumber = (key: string, value: number, type: 'local' | 'session' = 'local'): boolean => {
    return writeStorageString(key, String(value), type);
};

export const readStorageJson = <T>(key: string, fallback: T, type: 'local' | 'session' = 'local'): T => {
    const rawValue = readStorageString(key, '', type);
    if (!rawValue) return fallback;

    try {
        return JSON.parse(rawValue) as T;
    } catch {
        return fallback;
    }
};

export const writeStorageJson = <T>(key: string, value: T, type: 'local' | 'session' = 'local'): boolean => {
    return writeStorageString(key, JSON.stringify(value), type);
};

export const removeStorageValue = (key: string, type: 'local' | 'session' = 'local'): boolean => {
    const storage = getStorage(type);
    if (!storage) return false;

    try {
        storage.removeItem(key);
        return true;
    } catch {
        return false;
    }
};

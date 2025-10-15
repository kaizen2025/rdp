import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const CacheContext = createContext();

export const useCache = () => {
    const context = useContext(CacheContext);
    if (!context) {
        throw new Error('useCache must be used within CacheProvider');
    }
    return context;
};

const CACHE_VERSION = '1.0.0';
const CACHE_DURATION = {
    users: 5 * 60 * 1000,
    adGroups: 3 * 60 * 1000,
    computers: 2 * 60 * 1000,
    loans: 1 * 60 * 1000,
    config: 10 * 60 * 1000,
};

export const CacheProvider = ({ children }) => {
    const [cache, setCache] = useState({});
    const [isHydrated, setIsHydrated] = useState(false);
    const pendingRequests = useRef(new Map());

    useEffect(() => {
        try {
            const stored = localStorage.getItem('appCache');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.version === CACHE_VERSION) {
                    const now = Date.now();
                    const cleaned = Object.entries(parsed.data || {}).reduce((acc, [key, value]) => {
                        if (value.expiresAt > now) {
                            acc[key] = value;
                        }
                        return acc;
                    }, {});
                    setCache(cleaned);
                }
            }
        } catch (error) {
            console.warn('Erreur hydratation cache:', error);
        } finally {
            setIsHydrated(true);
        }

        const handleDataUpdate = () => {
            console.log('🔄 Données mises à jour - invalidation cache');
            setCache({});
        };

        window.electronAPI?.onDataUpdated?.(handleDataUpdate);

        return () => {
            window.electronAPI?.removeDataUpdatedListener?.();
        };
    }, []);

    useEffect(() => {
        if (!isHydrated) return;

        const saveTimer = setTimeout(() => {
            try {
                localStorage.setItem('appCache', JSON.stringify({
                    version: CACHE_VERSION,
                    data: cache,
                    savedAt: Date.now()
                }));
            } catch (error) {
                console.warn('Erreur sauvegarde cache:', error);
            }
        }, 500);

        return () => clearTimeout(saveTimer);
    }, [cache, isHydrated]);

    const get = useCallback((key) => {
        const entry = cache[key];
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            setCache(prev => {
                const { [key]: removed, ...rest } = prev;
                return rest;
            });
            return null;
        }

        return entry.data;
    }, [cache]);

    const set = useCallback((key, data, customDuration) => {
        const duration = customDuration || CACHE_DURATION[key.split(':')[0]] || 60000;
        setCache(prev => ({
            ...prev,
            [key]: {
                data,
                cachedAt: Date.now(),
                expiresAt: Date.now() + duration
            }
        }));
    }, []);

    const invalidate = useCallback((keyPattern) => {
        setCache(prev => {
            const newCache = { ...prev };
            Object.keys(newCache).forEach(key => {
                if (key.startsWith(keyPattern) || key === keyPattern) {
                    delete newCache[key];
                }
            });
            return newCache;
        });
    }, []);

    const clear = useCallback(() => {
        setCache({});
        localStorage.removeItem('appCache');
    }, []);

    const fetchWithCache = useCallback(async (key, fetchFn, options = {}) => {
        const { force = false, duration } = options;

        if (!force) {
            const cached = get(key);
            if (cached !== null) {
                return { data: cached, fromCache: true };
            }
        }

        if (pendingRequests.current.has(key)) {
            return await pendingRequests.current.get(key);
        }

        const promise = (async () => {
            try {
                const data = await fetchFn();
                set(key, data, duration);
                return { data, fromCache: false };
            } catch (error) {
                console.error(`Erreur fetch ${key}:`, error);
                throw error;
            } finally {
                pendingRequests.current.delete(key);
            }
        })();

        pendingRequests.current.set(key, promise);
        return await promise;
    }, [get, set]);

    const value = {
        get,
        set,
        invalidate,
        clear,
        fetchWithCache,
        isHydrated
    };

    return (
        <CacheContext.Provider value={value}>
            {children}
        </CacheContext.Provider>
    );
};
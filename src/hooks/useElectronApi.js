// src/hooks/useElectronApi.js
import { useState, useEffect, useCallback } from 'react';
import { useCache } from '../contexts/CacheContext';

export const useElectronApi = (apiCall, options = {}) => {
    const { key, params = [], force = false } = options;
    const { fetchWithCache } = useCache();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const cacheKey = key || `${apiCall}:${JSON.stringify(params)}`;
            const { data: resultData, fromCache } = await fetchWithCache(
                cacheKey,
                () => window.electronAPI[apiCall](...params),
                { force }
            );
            
            // Gérer les différents formats de retour
            if (resultData && resultData.success === false) {
                throw new Error(resultData.error);
            } else if (resultData && resultData.success === true) {
                setData(resultData.users || resultData.data || resultData);
            } else {
                setData(resultData);
            }

        } catch (err) {
            console.error(`Erreur API [${apiCall}]:`, err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [apiCall, JSON.stringify(params), force, key, fetchWithCache]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refresh: fetchData };
};
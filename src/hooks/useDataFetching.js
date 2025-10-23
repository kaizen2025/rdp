// src/hooks/useDataFetching.js - VERSION FINALE STABILISÉE

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';

const useDataFetching = (fetchFunction, options = {}) => {
    const { refreshInterval, entityName, initialFetch = true } = options;
    const { events } = useApp();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(initialFetch);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (isBackgroundRefresh = false) => {
        if (!isBackgroundRefresh) setIsLoading(true);
        setError(null);
        
        try {
            const result = await fetchFunction();
            setData(result);
        } catch (err) {
            console.error(`Erreur lors du fetch de ${entityName || 'données'}:`, err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [fetchFunction, entityName]);

    useEffect(() => {
        if (initialFetch) {
            fetchData(false);
        }

        const handleRefresh = () => fetchData(true);

        let intervalId = refreshInterval ? setInterval(handleRefresh, refreshInterval) : null;
        const unsubscribe = entityName ? events.on(`data_updated:${entityName}`, handleRefresh) : null;
        const forceRefreshUnsubscribe = events.on('force_refresh', handleRefresh);

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (unsubscribe) unsubscribe();
            forceRefreshUnsubscribe();
        };
    }, [fetchData, refreshInterval, entityName, events, initialFetch]);

    return { data, isLoading, error, refresh: () => fetchData(false) };
};

export default useDataFetching;
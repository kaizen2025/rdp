// src/hooks/useDataFetching.js - NOUVEAU HOOK UTILITAIRE

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';

const useDataFetching = (fetchFunction, options = {}) => {
    const { refreshInterval, entityName } = options;
    const { events } = useApp();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const result = await fetchFunction();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [fetchFunction]);

    useEffect(() => {
        fetchData();

        let intervalId = null;
        if (refreshInterval) {
            intervalId = setInterval(fetchData, refreshInterval);
        }

        let unsubscribe = null;
        if (entityName) {
            unsubscribe = events.on(`data_updated:${entityName}`, fetchData);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (unsubscribe) unsubscribe();
        };
    }, [fetchData, refreshInterval, entityName, events]);

    return { data, isLoading, error, refresh: fetchData };
};

export default useDataFetching;
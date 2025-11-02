// src/utils/adGroupCache.js - Système de cache intelligent pour les groupes AD

/**
 * Cache des groupes AD avec TTL et gestion de popularité
 * Stocke les groupes fréquemment utilisés pour réduire les requêtes AD
 */

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 100; // Maximum de groupes en cache
const POPULAR_THRESHOLD = 3; // Nombre d'utilisations pour marquer comme "populaire"

class AdGroupCache {
    constructor() {
        this.cache = new Map();
        this.usageCount = new Map();
        this.searchCache = new Map();
        this.lastCleanup = Date.now();
    }

    /**
     * Récupère les groupes du cache ou retourne null si expiré
     * @param {string} searchTerm - Terme de recherche
     * @returns {Array|null} Liste des groupes ou null
     */
    get(searchTerm) {
        const normalizedTerm = searchTerm.toLowerCase();
        const cached = this.searchCache.get(normalizedTerm);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            // Incrémenter le compteur d'utilisation
            this.usageCount.set(normalizedTerm, (this.usageCount.get(normalizedTerm) || 0) + 1);
            return cached.data;
        }

        return null;
    }

    /**
     * Stocke les groupes dans le cache
     * @param {string} searchTerm - Terme de recherche
     * @param {Array} groups - Liste des groupes
     */
    set(searchTerm, groups) {
        const normalizedTerm = searchTerm.toLowerCase();

        // Nettoyer le cache si trop plein
        if (this.searchCache.size >= MAX_CACHE_SIZE) {
            this.cleanup();
        }

        this.searchCache.set(normalizedTerm, {
            data: groups,
            timestamp: Date.now()
        });

        // Incrémenter le compteur d'utilisation
        this.usageCount.set(normalizedTerm, (this.usageCount.get(normalizedTerm) || 0) + 1);

        // Stocker chaque groupe individuellement pour accès rapide
        groups.forEach(group => {
            this.cache.set(group.toLowerCase(), {
                data: group,
                timestamp: Date.now()
            });
        });
    }

    /**
     * Récupère les groupes les plus populaires
     * @param {number} limit - Nombre maximum de groupes à retourner
     * @returns {Array} Liste des groupes populaires
     */
    getPopularGroups(limit = 10) {
        const popular = Array.from(this.usageCount.entries())
            .filter(([term, count]) => count >= POPULAR_THRESHOLD)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([term]) => {
                const cached = this.searchCache.get(term);
                return cached ? cached.data : null;
            })
            .filter(Boolean)
            .flat();

        // Dédupliquer
        return [...new Set(popular)];
    }

    /**
     * Vérifie si un groupe existe dans le cache
     * @param {string} groupName - Nom du groupe
     * @returns {boolean}
     */
    hasGroup(groupName) {
        const cached = this.cache.get(groupName.toLowerCase());
        return cached && Date.now() - cached.timestamp < CACHE_DURATION;
    }

    /**
     * Nettoie les entrées expirées et les moins utilisées
     */
    cleanup() {
        const now = Date.now();

        // Supprimer les entrées expirées
        for (const [key, value] of this.searchCache.entries()) {
            if (now - value.timestamp >= CACHE_DURATION) {
                this.searchCache.delete(key);
                this.usageCount.delete(key);
            }
        }

        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp >= CACHE_DURATION) {
                this.cache.delete(key);
            }
        }

        // Si toujours trop plein, supprimer les moins utilisés
        if (this.searchCache.size >= MAX_CACHE_SIZE) {
            const entries = Array.from(this.usageCount.entries())
                .sort((a, b) => a[1] - b[1])
                .slice(0, Math.floor(MAX_CACHE_SIZE / 3));

            entries.forEach(([key]) => {
                this.searchCache.delete(key);
                this.usageCount.delete(key);
            });
        }

        this.lastCleanup = now;
    }

    /**
     * Vide complètement le cache
     */
    clear() {
        this.cache.clear();
        this.usageCount.clear();
        this.searchCache.clear();
    }

    /**
     * Retourne des statistiques sur le cache
     * @returns {Object} Statistiques du cache
     */
    getStats() {
        return {
            totalEntries: this.searchCache.size,
            popularGroups: this.getPopularGroups(5),
            cacheSize: this.cache.size,
            mostSearched: Array.from(this.usageCount.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([term, count]) => ({ term, count }))
        };
    }

    /**
     * Précharge les groupes populaires
     * @param {Function} fetchFn - Fonction pour récupérer les groupes
     */
    async preloadPopularGroups(fetchFn) {
        const commonGroups = [
            'VPN', 'Internet', 'Administrators', 'Users', 'Domain Users',
            'Domain Admins', 'Remote Desktop Users'
        ];

        for (const group of commonGroups) {
            try {
                const results = await fetchFn(group);
                if (results && results.length > 0) {
                    this.set(group, results);
                }
            } catch (error) {
                console.warn(`Échec du préchargement du groupe ${group}:`, error);
            }
        }
    }
}

// Instance singleton
const adGroupCache = new AdGroupCache();

// Nettoyage automatique toutes les 5 minutes
if (typeof window !== 'undefined') {
    setInterval(() => {
        adGroupCache.cleanup();
    }, 5 * 60 * 1000);
}

export default adGroupCache;

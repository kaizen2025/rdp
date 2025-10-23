// src/utils/chatUtils.js - NOUVEAU FICHIER

/**
 * Génère une clé de canal unique et cohérente pour une conversation privée (DM).
 * @param {string} userId1 - L'ID du premier utilisateur.
 * @param {string} userId2 - L'ID du second utilisateur.
 * @returns {string} La clé de canal formatée, ex: "dm--kevin_bivia--paul_martin".
 */
export const getDmChannelKey = (userId1, userId2) => {
    // On trie les IDs pour s'assurer que la clé est toujours la même,
    // peu importe qui initie la conversation.
    return `dm--${[userId1, userId2].sort().join('--')}`;
};
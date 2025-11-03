/**
 * Service de recherche semantique vectorielle
 * Utilise TF-IDF et similarite cosinus pour rechercher dans les documents
 */

const nlpService = require('./nlpService');
const natural = require('natural');

class VectorSearchService {
    constructor() {
        this.documents = new Map(); // documentId -> { text, metadata, chunks }
        this.tfidf = new natural.TfIdf();
        this.tokenizer = new natural.WordTokenizer();
    }

    /**
     * Indexe un document
     */
    indexDocument(documentId, text, metadata = {}) {
        try {
            // Stocker le document
            const chunks = this.chunkText(text);
            this.documents.set(documentId, {
                text: text,
                metadata: metadata,
                chunks: chunks,
                indexedAt: new Date()
            });

            // Ajouter au corpus TF-IDF
            this.tfidf.addDocument(text, documentId);
            
            console.log(`Document ${documentId} indexe avec succes (${chunks.length} chunks)`);
            return true;
        } catch (error) {
            console.error('Erreur indexation document:', error);
            return false;
        }
    }

    /**
     * Recherche des documents pertinents
     */
    search(query, options = {}) {
        const {
            maxResults = 5,
            minScore = 0.1,
            searchInChunks = true
        } = options;

        try {
            // Recherche avec TF-IDF
            const tfidfResults = this.searchWithTfIdf(query, maxResults * 2);

            // Recherche par similarite de tokens
            const tokenResults = this.searchByTokenSimilarity(query, maxResults * 2);

            // Fusionner et re-scorer les resultats
            const mergedResults = this.mergeResults(tfidfResults, tokenResults);

            // Filtrer par score minimum
            const filteredResults = mergedResults.filter(r => r.score >= minScore);

            // Si recherche dans chunks, affiner les resultats
            let finalResults = filteredResults;
            if (searchInChunks) {
                finalResults = this.searchInChunks(query, filteredResults);
            }

            return finalResults.slice(0, maxResults);
        } catch (error) {
            console.error('Erreur recherche:', error);
            return [];
        }
    }

    /**
     * Recherche avec TF-IDF
     */
    searchWithTfIdf(query, maxResults) {
        const results = [];

        this.tfidf.tfidfs(query, (i, measure, documentId) => {
            if (measure > 0) {
                const doc = this.documents.get(documentId);
                if (doc) {
                    results.push({
                        documentId: documentId,
                        score: measure,
                        metadata: doc.metadata,
                        method: 'tfidf'
                    });
                }
            }
        });

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);
    }

    /**
     * Recherche par similarite de tokens
     */
    searchByTokenSimilarity(query, maxResults) {
        const queryTokens = new Set(
            this.tokenizer.tokenize(query.toLowerCase())
        );
        const results = [];

        this.documents.forEach((doc, documentId) => {
            const docTokens = new Set(
                this.tokenizer.tokenize(doc.text.toLowerCase())
            );

            const similarity = this.calculateJaccardSimilarity(queryTokens, docTokens);
            
            if (similarity > 0) {
                results.push({
                    documentId: documentId,
                    score: similarity,
                    metadata: doc.metadata,
                    method: 'token_similarity'
                });
            }
        });

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);
    }

    /**
     * Recherche affinee dans les chunks
     */
    searchInChunks(query, documentResults) {
        const refinedResults = [];

        documentResults.forEach(result => {
            const doc = this.documents.get(result.documentId);
            if (!doc) return;

            // Chercher les chunks les plus pertinents
            const chunkScores = doc.chunks.map((chunk, index) => {
                const similarity = nlpService.calculateSimilarity(query, chunk.text);
                return {
                    chunkIndex: index,
                    score: similarity,
                    text: chunk.text
                };
            });

            // Prendre le meilleur chunk
            const bestChunk = chunkScores.sort((a, b) => b.score - a.score)[0];

            if (bestChunk && bestChunk.score > 0) {
                refinedResults.push({
                    ...result,
                    score: (result.score + bestChunk.score) / 2, // Moyenne des scores
                    relevantChunk: bestChunk.text.substring(0, 500), // Extrait
                    chunkIndex: bestChunk.chunkIndex
                });
            } else {
                refinedResults.push(result);
            }
        });

        return refinedResults.sort((a, b) => b.score - a.score);
    }

    /**
     * Fusionne les resultats de differentes methodes
     */
    mergeResults(results1, results2) {
        const merged = new Map();

        // Ajouter resultats methode 1
        results1.forEach(r => {
            merged.set(r.documentId, {
                ...r,
                score: r.score
            });
        });

        // Fusionner avec methode 2
        results2.forEach(r => {
            if (merged.has(r.documentId)) {
                const existing = merged.get(r.documentId);
                // Moyenne ponderee des scores
                existing.score = (existing.score * 0.6 + r.score * 0.4);
            } else {
                merged.set(r.documentId, r);
            }
        });

        return Array.from(merged.values());
    }

    /**
     * Calcule la similarite de Jaccard entre deux ensembles
     */
    calculateJaccardSimilarity(set1, set2) {
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    }

    /**
     * Calcule la similarite cosinus entre deux vecteurs
     */
    calculateCosineSimilarity(vector1, vector2) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vector1.length; i++) {
            dotProduct += vector1[i] * vector2[i];
            norm1 += vector1[i] * vector1[i];
            norm2 += vector2[i] * vector2[i];
        }

        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);

        if (norm1 === 0 || norm2 === 0) return 0;

        return dotProduct / (norm1 * norm2);
    }

    /**
     * Decoupe un texte en chunks
     */
    chunkText(text, chunkSize = 1000, overlap = 100) {
        const words = text.split(/\s+/);
        const chunks = [];

        for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
            const chunkWords = words.slice(i, i + chunkSize);
            chunks.push({
                text: chunkWords.join(' '),
                position: Math.floor(i / chunkSize),
                wordCount: chunkWords.length,
                startIndex: i
            });
        }

        return chunks;
    }

    /**
     * Supprime un document de l'index
     */
    removeDocument(documentId) {
        try {
            this.documents.delete(documentId);
            // Reconstruire le TF-IDF sans ce document
            this.rebuildTfIdf();
            return true;
        } catch (error) {
            console.error('Erreur suppression document:', error);
            return false;
        }
    }

    /**
     * Reconstruit l'index TF-IDF
     */
    rebuildTfIdf() {
        this.tfidf = new natural.TfIdf();
        this.documents.forEach((doc, documentId) => {
            this.tfidf.addDocument(doc.text, documentId);
        });
    }

    /**
     * Obtient des statistiques sur l'index
     */
    getStats() {
        return {
            totalDocuments: this.documents.size,
            totalChunks: Array.from(this.documents.values())
                .reduce((sum, doc) => sum + doc.chunks.length, 0),
            avgChunksPerDocument: this.documents.size > 0
                ? Array.from(this.documents.values())
                    .reduce((sum, doc) => sum + doc.chunks.length, 0) / this.documents.size
                : 0
        };
    }

    /**
     * Obtient un document par ID
     */
    getDocument(documentId) {
        return this.documents.get(documentId);
    }

    /**
     * Liste tous les documents indexes
     */
    listDocuments() {
        return Array.from(this.documents.entries()).map(([id, doc]) => ({
            id: id,
            metadata: doc.metadata,
            indexedAt: doc.indexedAt,
            chunksCount: doc.chunks.length,
            textLength: doc.text.length
        }));
    }

    /**
     * Reinitialise completement l'index
     */
    clearIndex() {
        this.documents.clear();
        this.tfidf = new natural.TfIdf();
    }
}

module.exports = new VectorSearchService();

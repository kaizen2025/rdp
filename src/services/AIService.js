import axios from 'axios';

class AIService {
  constructor() {
    this.baseURL = 'http://localhost:8000';
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/ai/test-connection`);
      return response.data;
    } catch (error) {
      console.error('Erreur test connexion:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMessage(message, context = []) {
    try {
      const response = await axios.post(`${this.baseURL}/api/ai/chat`, {
        message: message,
        context: context
      });
      return response.data;
    } catch (error) {
      console.error('Erreur envoi message:', error);
      throw new Error('Impossible de contacter le serveur IA');
    }
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/ai/models`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération modèles:', error);
      return { success: false, models: [] };
    }
  }

  async analyzeDocument(text) {
    try {
      const response = await axios.post(`${this.baseURL}/api/ai/analyze-document`, {
        text: text
      });
      return response.data;
    } catch (error) {
      console.error('Erreur analyse document:', error);
      throw new Error('Impossible d'analyser le document');
    }
  }
}

export default new AIService();
const axios = require('axios');
const BaseLLMService = require('./base');

/**
 * Ollama LLM Service
 * Implements the BaseLLMService for local Ollama models
 */
class OllamaService extends BaseLLMService {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.modelName = config.modelName || 'llama3';
  }

  /**
   * Generate a completion using Ollama
   * @param {string} prompt - The prompt to send to Ollama
   * @returns {Promise<string>} - The generated text
   */
  async generateCompletion(prompt) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7
        },
        format: 'json'
      });

      return response.data.response;
    } catch (error) {
      console.error('Error generating completion with Ollama:', error);
      throw error;
    }
  }
}

module.exports = OllamaService;
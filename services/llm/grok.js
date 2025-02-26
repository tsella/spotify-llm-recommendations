const axios = require('axios');
const BaseLLMService = require('./base');

/**
 * Grok LLM Service
 * Implements the BaseLLMService for xAI's Grok model
 */
class GrokService extends BaseLLMService {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.xai.org/v1';
    this.modelName = config.modelName || 'grok-1';
    
    if (!this.apiKey) {
      throw new Error('Grok API key is required');
    }
  }

  /**
   * Generate a completion using Grok
   * @param {string} prompt - The prompt to send to Grok
   * @returns {Promise<string>} - The generated text
   */
  async generateCompletion(prompt) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.modelName,
          messages: [
            { 
              role: "system", 
              content: "You are a specialized music recommendation system that understands music genres, artists, and trends. Always respond with valid JSON."
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating completion with Grok:', error);
      throw error;
    }
  }
}

module.exports = GrokService;
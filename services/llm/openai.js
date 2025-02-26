const axios = require('axios');
const BaseLLMService = require('./base');

/**
 * OpenAI LLM Service
 * Implements the BaseLLMService for OpenAI models
 */
class OpenAIService extends BaseLLMService {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.modelName = config.modelName || 'gpt-3.5-turbo';
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }

  /**
   * Generate a completion using OpenAI
   * @param {string} prompt - The prompt to send to OpenAI
   * @returns {Promise<string>} - The generated text
   */
  async generateCompletion(prompt) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.modelName,
          messages: [
            { role: "system", content: "You are a specialized music recommendation system that understands music genres, artists, and trends." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: "json_object" }
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
      console.error('Error generating completion with OpenAI:', error);
      throw error;
    }
  }
}

module.exports = OpenAIService;
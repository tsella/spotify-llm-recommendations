const axios = require('axios');
const BaseLLMService = require('./base');

/**
 * Claude LLM Service
 * Implements the BaseLLMService for Anthropic's Claude models
 */
class ClaudeService extends BaseLLMService {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.modelName = config.modelName || 'claude-3-haiku-20240307';
    
    if (!this.apiKey) {
      throw new Error('Claude API key is required');
    }
  }

  /**
   * Generate a completion using Claude
   * @param {string} prompt - The prompt to send to Claude
   * @returns {Promise<string>} - The generated text
   */
  async generateCompletion(prompt) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.modelName,
          max_tokens: 1500,
          messages: [
            { role: "user", content: prompt }
          ],
          system: "You are a specialized music recommendation system that understands music genres, artists, and trends. Always respond with valid JSON.",
          temperature: 0.7
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Error generating completion with Claude:', error);
      throw error;
    }
  }
}

module.exports = ClaudeService;
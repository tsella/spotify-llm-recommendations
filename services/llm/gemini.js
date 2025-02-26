const axios = require('axios');
const BaseLLMService = require('./base');

/**
 * Gemini LLM Service
 * Implements the BaseLLMService for Google's Gemini models
 */
class GeminiService extends BaseLLMService {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.modelName = config.modelName || 'gemini-pro';
    
    if (!this.apiKey) {
      throw new Error('Gemini API key is required');
    }
  }

  /**
   * Generate a completion using Gemini
   * @param {string} prompt - The prompt to send to Gemini
   * @returns {Promise<string>} - The generated text
   */
  async generateCompletion(prompt) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          },
          systemInstruction: {
            parts: [{ text: "You are a specialized music recommendation system that understands music genres, artists, and trends. Always respond with valid JSON." }]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract text from the response
      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('No text generated from Gemini');
      }

      return text;
    } catch (error) {
      console.error('Error generating completion with Gemini:', error);
      throw error;
    }
  }
}

module.exports = GeminiService;
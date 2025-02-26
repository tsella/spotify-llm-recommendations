/**
 * Base LLM Service
 * Abstract base class for LLM services
 */
class BaseLLMService {
  constructor(config = {}) {
    this.config = config;
    this.modelName = config.modelName || 'default';
  }

  /**
   * Generate a completion from the LLM
   * @param {string} prompt - The prompt to send to the LLM
   * @returns {Promise<string>} - The generated text
   */
  async generateCompletion(prompt) {
    throw new Error('Method not implemented: generateCompletion');
  }

  /**
   * Clean and parse the LLM response
   * @param {string} response - The raw response from the LLM
   * @returns {object} - The parsed JSON object
   */
  parseResponse(response) {
    try {
      // Find the JSON object in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        return JSON.parse(jsonString);
      } else {
        console.error('LLM response is not valid JSON:', response);
        return null;
      }
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      return null;
    }
  }
}

module.exports = BaseLLMService;
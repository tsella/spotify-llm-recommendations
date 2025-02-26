const OllamaService = require('./ollama');
const OpenAIService = require('./openai');
const ClaudeService = require('./claude');
const GeminiService = require('./gemini');
const GrokService = require('./grok');

/**
 * Create an LLM service based on configuration
 * @param {string} provider - The LLM provider to use (ollama, openai, claude, gemini, grok)
 * @param {object} config - Configuration for the LLM service
 * @returns {BaseLLMService} - An instance of the appropriate LLM service
 */
function createLLMService(provider, config = {}) {
  switch (provider.toLowerCase()) {
    case 'ollama':
      return new OllamaService(config);
    case 'openai':
      return new OpenAIService(config);
    case 'claude':
      return new ClaudeService(config);
    case 'gemini':
      return new GeminiService(config);
    case 'grok':
      return new GrokService(config);
    default:
      console.warn(`Unsupported LLM provider: ${provider}, falling back to Ollama`);
      return new OllamaService(config);
  }
}

/**
 * Factory function for creating LLM services from environment variables
 * @returns {BaseLLMService} - An instance of the appropriate LLM service
 */
function createLLMServiceFromEnv() {
  const provider = process.env.LLM_PROVIDER || 'ollama';
  
  const config = {
    // Common config
    modelName: process.env[`${provider.toUpperCase()}_MODEL`],
    
    // Provider-specific config
    baseUrl: process.env[`${provider.toUpperCase()}_BASE_URL`],
    apiKey: process.env[`${provider.toUpperCase()}_API_KEY`]
  };
  
  return createLLMService(provider, config);
}

module.exports = {
  createLLMService,
  createLLMServiceFromEnv
};
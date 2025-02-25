const crypto = require('crypto');

/**
 * Collection of utility functions for the Spotify LLM Recommendations app
 */
const helpers = {
  /**
   * Generates a unique ID for recommendations
   * @returns {string} A unique identifier
   */
  generateId() {
    return crypto.randomBytes(8).toString('hex');
  },

  /**
   * Formats a date string into a more readable format
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Truncates text to a specified length with ellipsis
   * @param {string} text - The text to truncate
   * @param {number} maxLength - Maximum length before truncation
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  /**
   * Sanitizes a search query for Spotify
   * @param {string} query - The raw search query
   * @returns {string} Sanitized query
   */
  sanitizeSearchQuery(query) {
    // Remove special characters that might interfere with Spotify search
    return query
      .replace(/[^\w\s]/gi, '')
      .trim();
  },

  /**
   * Groups array items by a specific property
   * @param {Array} array - Array to group
   * @param {string} property - Property to group by
   * @returns {Object} Grouped object
   */
  groupBy(array, property) {
    return array.reduce((grouped, item) => {
      const key = item[property];
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
      return grouped;
    }, {});
  },

  /**
   * Extracts genres from user's top artists
   * @param {Array} topArtists - Array of artist objects
   * @returns {Object} Object with genre counts and top genres
   */
  extractGenres(topArtists) {
    // Count occurrences of each genre
    const genreCounts = topArtists.reduce((counts, artist) => {
      if (artist.genres && Array.isArray(artist.genres)) {
        artist.genres.forEach(genre => {
          counts[genre] = (counts[genre] || 0) + 1;
        });
      }
      return counts;
    }, {});

    // Sort genres by count (descending)
    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));

    // Get top genres (top 5)
    const topGenres = sortedGenres.slice(0, 5).map(g => g.genre);

    return {
      genreCounts,
      sortedGenres,
      topGenres
    };
  },

  /**
   * Calculates listening diversity score based on artist and genre distribution
   * @param {Array} topArtists - User's top artists
   * @param {Array} topTracks - User's top tracks
   * @returns {Object} Diversity scores (0-100)
   */
  calculateDiversity(topArtists, topTracks) {
    // Extract unique artists from top tracks
    const trackArtists = new Set();
    topTracks.forEach(track => {
      track.artists.forEach(artist => {
        trackArtists.add(artist.id);
      });
    });

    // Count unique artists
    const uniqueArtistsCount = trackArtists.size;
    
    // Extract genres
    const { genreCounts } = this.extractGenres(topArtists);
    const uniqueGenresCount = Object.keys(genreCounts).length;
    
    // Calculate diversity scores (higher is more diverse)
    // Scale to 0-100
    const artistDiversity = Math.min(100, (uniqueArtistsCount / topTracks.length) * 100);
    const genreDiversity = Math.min(100, (uniqueGenresCount / 20) * 100);
    
    return {
      artistDiversity: Math.round(artistDiversity),
      genreDiversity: Math.round(genreDiversity),
      overall: Math.round((artistDiversity + genreDiversity) / 2)
    };
  },

  /**
   * Formats milliseconds into a readable duration
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration (e.g. "3:45")
   */
  formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * Creates a friendly error message from Spotify API errors
   * @param {Error} error - The error object
   * @returns {string} User-friendly error message
   */
  friendlyErrorMessage(error) {
    // Check if it's a Spotify API error
    if (error.response && error.response.data && error.response.data.error) {
      const spotifyError = error.response.data.error;
      
      // Authentication errors
      if (spotifyError.status === 401) {
        return 'Your Spotify session has expired. Please log in again.';
      }
      
      // Rate limiting
      if (spotifyError.status === 429) {
        return 'We\'ve hit Spotify\'s rate limit. Please try again in a moment.';
      }
      
      // Other API errors
      if (spotifyError.message) {
        return `Spotify error: ${spotifyError.message}`;
      }
    }
    
    // Ollama errors
    if (error.message && error.message.includes('ECONNREFUSED') && error.message.includes('11434')) {
      return 'Could not connect to Ollama. Make sure Ollama is running on your machine.';
    }
    
    // Database errors
    if (error.message && error.message.includes('SQLITE_')) {
      return 'A database error occurred. Please restart the application.';
    }
    
    // Default message
    return 'An unexpected error occurred. Please try again later.';
  },

  /**
   * Process LLM-generated recommendations to ensure they have unique IDs
   * @param {Array} recommendations - Recommendations from LLM
   * @returns {Array} Processed recommendations with IDs
   */
  processRecommendations(recommendations) {
    if (!recommendations || !Array.isArray(recommendations)) {
      return [];
    }
    
    return recommendations.map(rec => ({
      ...rec,
      id: rec.id || this.generateId()  // Ensure each recommendation has an ID
    }));
  }
};

module.exports = helpers;
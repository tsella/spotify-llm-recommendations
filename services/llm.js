const { createLLMServiceFromEnv } = require('./llm/index');
const helpers = require('../utils/helpers');

// Create LLM service instance based on environment configuration
const llmService = createLLMServiceFromEnv();

// Format user music profile for LLM context
function formatMusicProfile(topTracks, topArtists, recentlyPlayed) {
  const profile = {
    top_artists: topArtists.slice(0, 10).map(artist => ({
      name: artist.name,
      genres: artist.genres
    })),
    top_tracks: topTracks.slice(0, 10).map(track => ({
      name: track.name,
      artist: track.artists[0].name
    })),
    recent_tracks: recentlyPlayed.slice(0, 10).map(item => ({
      name: item.track.name,
      artist: item.track.artists[0].name
    }))
  };
  
  return JSON.stringify(profile, null, 2);
}

// Format previous feedback for LLM context
function formatFeedback(previousFeedback) {
  if (!previousFeedback || previousFeedback.length === 0) {
    return "No previous feedback available.";
  }
  
  const formatted = previousFeedback.map(feedback => {
    return `Item: ${feedback.itemName} (${feedback.itemType}), Liked: ${feedback.liked ? 'Yes' : 'No'}${feedback.comments ? `, Comments: "${feedback.comments}"` : ''}`;
  }).join('\n');
  
  return formatted;
}

// Generate recommendations using configured LLM
async function getRecommendations(topTracks, topArtists, recentlyPlayed, previousFeedback) {
  try {
    const musicProfile = formatMusicProfile(topTracks, topArtists, recentlyPlayed);
    const feedbackHistory = formatFeedback(previousFeedback);
    
    // Analyze user's music diversity
    const diversity = helpers.calculateDiversity(topArtists, topTracks);
    
    // Extract top genres
    const { topGenres } = helpers.extractGenres(topArtists);
    
    const prompt = `
You are a music recommendation system. Based on the user's music profile and past feedback, suggest 5 artists and 5 tracks they might enjoy.

User's Music Profile:
${musicProfile}

User's Top Genres:
${topGenres.join(', ')}

User's Music Diversity Score: ${diversity.overall}/100
(Artist Diversity: ${diversity.artistDiversity}, Genre Diversity: ${diversity.genreDiversity})

User's Previous Feedback on Recommendations:
${feedbackHistory}

Provide recommendations in the following JSON format:
{
  "recommendations": [
    {
      "id": "unique_id_1",
      "type": "artist",
      "name": "Artist Name",
      "reason": "Personalized reason why this artist fits the user's taste"
    },
    {
      "id": "unique_id_2",
      "type": "track",
      "name": "Track Name",
      "artist": "Artist Name",
      "reason": "Personalized reason why this track fits the user's taste"
    }
  ]
}

Important: Make recommendations that match their listening patterns but also introduce some new elements. Be specific with artist and track names. Make sure they exist on Spotify.
    `;
    
    try {
      // Generate completion from LLM
      const responseText = await llmService.generateCompletion(prompt);
      
      // Parse the response
      const result = llmService.parseResponse(responseText);
      
      if (result && result.recommendations) {
        // Process recommendations to ensure they have IDs
        return helpers.processRecommendations(result.recommendations);
      }
      
      throw new Error('Invalid response format from LLM');
    } catch (error) {
      console.error('Error with LLM service:', error);
      
      // Return fallback recommendations
      return getFallbackRecommendations(topGenres);
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

// Provide fallback recommendations if LLM fails
function getFallbackRecommendations(topGenres = []) {
  const fallbacks = [
    {
      id: 'fallback_1',
      type: 'artist',
      name: 'The Beatles',
      reason: 'A universally acclaimed artist that many music lovers enjoy'
    },
    {
      id: 'fallback_2',
      type: 'track',
      name: 'Hotel California',
      artist: 'Eagles',
      reason: 'One of the most popular songs of all time'
    },
    {
      id: 'fallback_3',
      type: 'artist',
      name: 'Queen',
      reason: 'Legendary band with wide appeal and diverse musical styles'
    },
    {
      id: 'fallback_4',
      type: 'track',
      name: 'Bohemian Rhapsody',
      artist: 'Queen',
      reason: 'A timeless classic with multiple musical elements'
    },
    {
      id: 'fallback_5',
      type: 'artist',
      name: 'Daft Punk',
      reason: 'Influential electronic music that crosses many genres'
    }
  ];
  
  return fallbacks;
}

module.exports = {
  getRecommendations
};
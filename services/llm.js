const axios = require('axios');
const helpers = require('../utils/helpers');

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

// Generate recommendations using Ollama LLM
async function getRecommendations(topTracks, topArtists, recentlyPlayed, previousFeedback) {
  try {
    const musicProfile = formatMusicProfile(topTracks, topArtists, recentlyPlayed);
    const feedbackHistory = formatFeedback(previousFeedback);
    
    const prompt = `
You are a music recommendation system. Based on the user's music profile and past feedback, suggest 5 artists and 5 tracks they might enjoy.

User's Music Profile:
${musicProfile}

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
    
    const response = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
      model: process.env.OLLAMA_MODEL || 'llama3',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7
      },
      format: 'json'
    });
    
    // Extract the text response
    const responseText = response.data.response;
    
    // Find the JSON object in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      const result = JSON.parse(jsonString);
      return result.recommendations;
    } else {
      // Fallback if the response is not properly formatted JSON
      console.error('LLM response is not valid JSON:', responseText);
      
      // Create some basic default recommendations to prevent complete failure
      return [
        {
          id: 'default_1',
          type: 'artist',
          name: 'Radiohead',
          reason: 'Based on your music profile, you might enjoy this artist'
        },
        {
          id: 'default_2',
          type: 'track',
          name: 'Bohemian Rhapsody',
          artist: 'Queen',
          reason: 'A timeless classic that matches your listening patterns'
        }
      ];
    }
  } catch (error) {
    console.error('Error generating recommendations with Ollama:', error);
    
    // Return a basic fallback if the API call fails
    return [
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
      }
    ];
  }
}

module.exports = {
  getRecommendations
};

module.exports = {
  getRecommendations
};
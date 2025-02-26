const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');
const helpers = require('../utils/helpers');

// Helper function to initialize Spotify API with token
function getSpotifyApi(accessToken) {
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  });
  
  spotifyApi.setAccessToken(accessToken);
  return spotifyApi;
}

/**
 * Get user's top tracks
 * @param {string} accessToken - Spotify access token
 * @param {string} timeRange - Time range (short_term, medium_term, long_term)
 * @param {number} limit - Number of tracks to retrieve
 * @returns {Promise<Array>} - Array of track objects
 */
async function getTopTracks(accessToken, timeRange = 'medium_term', limit = 50) {
  const spotifyApi = getSpotifyApi(accessToken);
  
  try {
    const response = await spotifyApi.getMyTopTracks({ 
      limit, 
      time_range: timeRange 
    });
    
    return response.body.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => ({
        id: artist.id,
        name: artist.name
      })),
      album: {
        id: track.album.id,
        name: track.album.name
      },
      popularity: track.popularity,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify
    }));
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    throw error;
  }
}

/**
 * Get user's top artists
 * @param {string} accessToken - Spotify access token
 * @param {string} timeRange - Time range (short_term, medium_term, long_term)
 * @param {number} limit - Number of artists to retrieve
 * @returns {Promise<Array>} - Array of artist objects
 */
async function getTopArtists(accessToken, timeRange = 'medium_term', limit = 50) {
  const spotifyApi = getSpotifyApi(accessToken);
  
  try {
    const response = await spotifyApi.getMyTopArtists({ 
      limit, 
      time_range: timeRange 
    });
    
    return response.body.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      image_url: artist.images?.[0]?.url || null,
      external_url: artist.external_urls.spotify
    }));
  } catch (error) {
    console.error('Error fetching top artists:', error);
    throw error;
  }
}

/**
 * Get recently played tracks
 * @param {string} accessToken - Spotify access token
 * @param {number} limit - Number of tracks to retrieve
 * @returns {Promise<Array>} - Array of recently played track objects
 */
async function getRecentlyPlayed(accessToken, limit = 50) {
  const spotifyApi = getSpotifyApi(accessToken);
  
  try {
    const response = await spotifyApi.getMyRecentlyPlayedTracks({ limit });
    
    return response.body.items.map(item => ({
      track: {
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        album: {
          id: item.track.album.id,
          name: item.track.album.name
        }
      },
      played_at: item.played_at
    }));
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    throw error;
  }
}

/**
 * Search and validate recommendations on Spotify
 * @param {string} accessToken - Spotify access token
 * @param {Array} recommendations - Recommendations from LLM
 * @returns {Promise<Array>} - Array of validated Spotify recommendations
 */
async function validateRecommendations(accessToken, recommendations) {
  const spotifyApi = getSpotifyApi(accessToken);
  const validatedRecommendations = [];
  
  for (const rec of recommendations) {
    try {
      // Different search logic based on recommendation type
      if (rec.type === 'artist') {
        // Search for artist
        const response = await spotifyApi.searchArtists(rec.name, { limit: 1 });
        
        if (response.body.artists.items.length > 0) {
          const artist = response.body.artists.items[0];
          validatedRecommendations.push({
            id: artist.id,
            type: 'artist',
            name: artist.name,
            genres: artist.genres,
            popularity: artist.popularity,
            image_url: artist.images?.[0]?.url || null,
            external_url: artist.external_urls.spotify,
            reason: rec.reason,
            recommendationId: rec.id
          });
        }
      } else if (rec.type === 'track') {
        // Search for track
        const response = await spotifyApi.searchTracks(
          `${rec.name} ${rec.artist || ''}`.trim(), 
          { limit: 1 }
        );
        
        if (response.body.tracks.items.length > 0) {
          const track = response.body.tracks.items[0];
          validatedRecommendations.push({
            id: track.id,
            type: 'track',
            name: track.name,
            artists: track.artists.map(artist => ({
              id: artist.id,
              name: artist.name
            })),
            album: {
              id: track.album.id,
              name: track.album.name,
              image_url: track.album.images?.[0]?.url || null
            },
            preview_url: track.preview_url,
            external_url: track.external_urls.spotify,
            reason: rec.reason,
            recommendationId: rec.id
          });
        }
      }
    } catch (error) {
      console.error(`Error validating recommendation: ${rec.name}`, error);
      // Skip invalid recommendations
      continue;
    }
  }
  
  return validatedRecommendations;
}

/**
 * Get audio features for tracks
 * @param {string} accessToken - Spotify access token
 * @param {Array} trackIds - Array of track IDs
 * @returns {Promise<Array>} - Array of audio features
 */
async function getAudioFeatures(accessToken, trackIds) {
  const spotifyApi = getSpotifyApi(accessToken);
  
  try {
    // Spotify API can only process 100 tracks at a time
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }
    
    let allFeatures = [];
    
    for (const chunk of chunks) {
      const response = await spotifyApi.getAudioFeaturesForTracks(chunk);
      allFeatures = [...allFeatures, ...response.body.audio_features];
    }
    
    return allFeatures;
  } catch (error) {
    console.error('Error fetching audio features:', error);
    throw error;
  }
}

/**
 * Search for items on Spotify
 * @param {string} accessToken - Spotify access token
 * @param {string} query - Search query
 * @param {Array} types - Array of types to search for (artist, track, album, playlist)
 * @param {number} limit - Number of results per type
 * @returns {Promise<Object>} - Search results
 */
async function search(accessToken, query, types = ['artist', 'track'], limit = 10) {
  const spotifyApi = getSpotifyApi(accessToken);
  
  try {
    const response = await spotifyApi.search(query, types, { limit });
    return response.body;
  } catch (error) {
    console.error('Error searching Spotify:', error);
    throw error;
  }
}

module.exports = {
  getTopTracks,
  getTopArtists,
  getRecentlyPlayed,
  validateRecommendations,
  getAudioFeatures,
  search
};
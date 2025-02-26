const SpotifyWebApi = require('spotify-web-api-node');
const helpers = require('../utils/helpers');
const { createLLMServiceFromEnv } = require('./llm/index');

// Create LLM service instance
const llmService = createLLMServiceFromEnv();

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
 * Generate a themed playlist based on user's listening habits
 * @param {string} accessToken - Spotify access token
 * @param {string} userId - Spotify user ID
 * @param {string} theme - Theme for the playlist (genre, mood, activity, etc.)
 * @param {number} trackCount - Number of tracks to include (default: 20)
 * @returns {Promise<Object>} - Created playlist info and tracks
 */
async function createThemedPlaylist(accessToken, userId, theme, trackCount = 20) {
  const spotifyApi = getSpotifyApi(accessToken);
  
  try {
    // Get user's top artists and tracks for context
    const [topArtistsResponse, topTracksResponse] = await Promise.all([
      spotifyApi.getMyTopArtists({ limit: 20, time_range: 'medium_term' }),
      spotifyApi.getMyTopTracks({ limit: 20, time_range: 'medium_term' })
    ]);
    
    const topArtists = topArtistsResponse.body.items;
    const topTracks = topTracksResponse.body.items;
    
    // Extract genre information
    const { topGenres } = helpers.extractGenres(topArtists);
    
    // Generate playlist name, description and track suggestions using LLM
    const playlistData = await generatePlaylistWithLLM(theme, topGenres, topArtists, topTracks, trackCount);
    
    // Create the playlist on Spotify
    const createdPlaylist = await spotifyApi.createPlaylist(playlistData.name, {
      description: playlistData.description,
      public: false
    });
    
    const playlistId = createdPlaylist.body.id;
    
    // Search for and add the suggested tracks to the playlist
    const tracks = await findTracksOnSpotify(spotifyApi, playlistData.trackSuggestions);
    
    // Add tracks to the playlist
    if (tracks.length > 0) {
      const trackUris = tracks.map(track => track.uri);
      await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
    }
    
    return {
      playlist: createdPlaylist.body,
      tracks: tracks,
      theme: theme
    };
  } catch (error) {
    console.error('Error creating themed playlist:', error);
    throw error;
  }
}

/**
 * Generate playlist information and track suggestions using LLM
 * @param {string} theme - Theme for the playlist
 * @param {Array} topGenres - User's top genres
 * @param {Array} topArtists - User's top artists
 * @param {Array} topTracks - User's top tracks
 * @param {number} trackCount - Number of tracks to include
 * @returns {Promise<Object>} - Playlist name, description and track suggestions
 */
async function generatePlaylistWithLLM(theme, topGenres, topArtists, topTracks, trackCount) {
  try {
    // Format user's top genres, artists, and tracks for the LLM
    const genresText = topGenres.slice(0, 5).join(', ');
    const artistsText = topArtists.slice(0, 5).map(a => a.name).join(', ');
    const tracksText = topTracks.slice(0, 5).map(t => `${t.name} by ${t.artists[0].name}`).join(', ');
    
    const prompt = `
You are a creative music curator that creates engaging Spotify playlists.

Generate a playlist based on the theme: "${theme}". The playlist should reflect the user's music taste
but also introduce them to new tracks and artists that fit the theme.

User's top genres: ${genresText}
User's top artists: ${artistsText}
User's recent favorite tracks: ${tracksText}

Please create:
1. A catchy and descriptive playlist name (max 50 characters)
2. A brief engaging description explaining the playlist theme and vibe (max 100 characters)
3. A list of ${trackCount} track suggestions that fit the theme

The tracks should be a mix of:
- Some tracks/artists the user might know based on their taste
- Some new discoveries that still fit their preferences
- All tracks must fit the theme: "${theme}"

Respond in the following JSON format:
{
  "name": "Engaging Playlist Title Related to ${theme}",
  "description": "Brief engaging description explaining the playlist theme and vibe",
  "trackSuggestions": [
    {
      "title": "Track Name 1",
      "artist": "Artist Name 1"
    },
    {
      "title": "Track Name 2",
      "artist": "Artist Name 2"
    },
    ...
  ]
}

Be specific with artist and track names. Make sure they likely exist on Spotify. Don't abbreviate artist names.
    `;
    
    // Generate completion from LLM
    const responseText = await llmService.generateCompletion(prompt);
    
    // Parse the response
    const result = llmService.parseResponse(responseText);
    
    if (result && result.name && result.description && result.trackSuggestions) {
      // Ensure the name and description aren't too long
      return {
        name: result.name.substring(0, 50).trim(),
        description: result.description.substring(0, 100).trim(),
        trackSuggestions: result.trackSuggestions.slice(0, trackCount)
      };
    }
    
    // Fallback if the LLM fails or returns incorrect format
    throw new Error('Invalid response format from LLM');
  } catch (error) {
    console.error('Error generating playlist with LLM:', error);
    // Fallback in case of error
    return {
      name: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Playlist`,
      description: `Personalized playlist based on ${theme}.`,
      trackSuggestions: [] // Empty array will trigger standard recommendations
    };
  }
}

/**
 * Find tracks on Spotify based on LLM suggestions
 * @param {Object} spotifyApi - Initialized Spotify API
 * @param {Array} trackSuggestions - Array of track suggestions from LLM
 * @returns {Promise<Array>} - Array of Spotify track objects
 */
async function findTracksOnSpotify(spotifyApi, trackSuggestions) {
  const tracks = [];
  
  // Handle empty suggestions or missing suggestions
  if (!trackSuggestions || trackSuggestions.length === 0) {
    return [];
  }
  
  // Process each suggestion
  for (const suggestion of trackSuggestions) {
    try {
      // Skip invalid suggestions
      if (!suggestion.title || !suggestion.artist) {
        continue;
      }
      
      // Search for the track on Spotify
      const searchQuery = `track:${suggestion.title} artist:${suggestion.artist}`;
      const response = await spotifyApi.searchTracks(searchQuery, { limit: 1 });
      
      // Check if we found a match
      if (response.body.tracks.items.length > 0) {
        tracks.push(response.body.tracks.items[0]);
      } else {
        // Try a more lenient search if exact match fails
        const looseSearchQuery = `${suggestion.title} ${suggestion.artist}`;
        const looseResponse = await spotifyApi.searchTracks(looseSearchQuery, { limit: 1 });
        
        if (looseResponse.body.tracks.items.length > 0) {
          tracks.push(looseResponse.body.tracks.items[0]);
        }
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error searching for track "${suggestion.title}" by "${suggestion.artist}":`, error);
      // Continue with the next suggestion
      continue;
    }
  }
  
  return tracks;
}

module.exports = {
  createThemedPlaylist
};
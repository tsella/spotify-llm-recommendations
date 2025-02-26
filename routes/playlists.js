const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const playlistService = require('../services/playlist');
const helpers = require('../utils/helpers');

// Use auth middleware to ensure user is logged in and token is valid
router.use(authRoutes.refreshSpotifyToken);

// Get playlist creation page
router.get('/create', async (req, res) => {
  // Suggested themes for the user to choose from
  const suggestedThemes = [
    { name: 'Chill Vibes', description: 'Relaxing music to unwind' },
    { name: 'Workout Energy', description: 'High-energy tracks for exercise' },
    { name: 'Focus & Concentration', description: 'Music to help you concentrate' },
    { name: 'Happy Mood', description: 'Uplifting songs to boost your mood' },
    { name: 'Dance Party', description: 'Danceable tracks for your next party' },
    { name: 'Nostalgic Classics', description: 'Throwbacks and classics' },
    { name: 'Rainy Day', description: 'Perfect soundtrack for rainy weather' },
    { name: 'Acoustic Gems', description: 'Stripped-down acoustic music' }
  ];
  
  res.render('playlists/create', {
    user: req.session.user,
    suggestedThemes
  });
});

// Create themed playlist (API endpoint)
router.post('/create', async (req, res) => {
  try {
    const { theme, trackCount } = req.body;
    const accessToken = req.session.spotifyAccessToken;
    const userId = req.session.user.id;
    
    // Sanitize input
    const sanitizedTheme = helpers.sanitizeSearchQuery(theme);
    if (!sanitizedTheme) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    
    // Limit track count to reasonable range
    const count = Math.min(Math.max(parseInt(trackCount || 20), 10), 50);
    
    // Create the playlist
    const result = await playlistService.createThemedPlaylist(
      accessToken,
      userId,
      sanitizedTheme,
      count
    );
    
    res.json({
      success: true,
      playlistId: result.playlist.id,
      playlistUrl: result.playlist.external_urls.spotify,
      name: result.playlist.name,
      trackCount: result.tracks.length
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ 
      error: helpers.friendlyErrorMessage(error) || 'Failed to create playlist'
    });
  }
});

// Get user's playlists
router.get('/list', async (req, res) => {
  try {
    const accessToken = req.session.spotifyAccessToken;
    const spotifyApi = new (require('spotify-web-api-node'))({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
    
    spotifyApi.setAccessToken(accessToken);
    
    // Get user's playlists
    const playlistsResponse = await spotifyApi.getUserPlaylists(req.session.user.id, { limit: 50 });
    const playlists = playlistsResponse.body.items;
    
    res.render('playlists/list', {
      user: req.session.user,
      playlists
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).render('error', { 
      message: helpers.friendlyErrorMessage(error) || 'Failed to load playlists'
    });
  }
});

module.exports = router;
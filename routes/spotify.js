const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');
const authRoutes = require('./auth');

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Auth middleware
router.use(authRoutes.refreshSpotifyToken);

// Dashboard route
router.get('/dashboard', async (req, res) => {
  try {
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    
    // Get user's top tracks
    const topTracks = await spotifyApi.getMyTopTracks({ limit: 10, time_range: 'medium_term' });
    
    // Get user's top artists
    const topArtists = await spotifyApi.getMyTopArtists({ limit: 10, time_range: 'medium_term' });
    
    // Get user's recently played tracks
    const recentlyPlayed = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 10 });
    
    res.render('dashboard', {
      user: req.session.user,
      topTracks: topTracks.body.items,
      topArtists: topArtists.body.items,
      recentlyPlayed: recentlyPlayed.body.items
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.redirect('/?error=dashboard_error');
  }
});

// Get user's top tracks
router.get('/top-tracks/:timeRange', async (req, res) => {
  try {
    const { timeRange } = req.params; // short_term, medium_term, long_term
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    
    const response = await spotifyApi.getMyTopTracks({ 
      limit: 50, 
      time_range: timeRange || 'medium_term' 
    });
    
    res.json(response.body);
  } catch (error) {
    console.error('Top tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
});

// Get user's top artists
router.get('/top-artists/:timeRange', async (req, res) => {
  try {
    const { timeRange } = req.params; // short_term, medium_term, long_term
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    
    const response = await spotifyApi.getMyTopArtists({ 
      limit: 50, 
      time_range: timeRange || 'medium_term' 
    });
    
    res.json(response.body);
  } catch (error) {
    console.error('Top artists error:', error);
    res.status(500).json({ error: 'Failed to fetch top artists' });
  }
});

// Get recently played tracks
router.get('/recently-played', async (req, res) => {
  try {
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    
    const response = await spotifyApi.getMyRecentlyPlayedTracks({ 
      limit: 50
    });
    
    res.json(response.body);
  } catch (error) {
    console.error('Recently played error:', error);
    res.status(500).json({ error: 'Failed to fetch recently played tracks' });
  }
});

// Get user's playlists
router.get('/playlists', async (req, res) => {
  try {
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    
    const response = await spotifyApi.getUserPlaylists(req.session.user.id, { 
      limit: 50 
    });
    
    res.json(response.body);
  } catch (error) {
    console.error('Playlists error:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Search Spotify
router.get('/search', async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    
    const response = await spotifyApi.search(query, type || ['artist', 'track'], { 
      limit: 10 
    });
    
    res.json(response.body);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
});

module.exports = router;
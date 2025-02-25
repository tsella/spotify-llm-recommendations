const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Scope of permissions we need from Spotify
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'playlist-read-private'
];

// Login route - redirect to Spotify authorization
router.get('/login', (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  req.session.spotifyAuthState = state;
  
  const authorizeURL = spotifyApi.createAuthorizeURL(SCOPES, state);
  res.redirect(authorizeURL);
});

// Callback route - handle Spotify auth response
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.session.spotifyAuthState;
  
  if (state !== storedState) {
    return res.redirect('/?error=state_mismatch');
  }
  
  try {
    // Exchange authorization code for access token
    const data = await spotifyApi.authorizationCodeGrant(code);
    
    // Save tokens to session
    req.session.spotifyAccessToken = data.body.access_token;
    req.session.spotifyRefreshToken = data.body.refresh_token;
    req.session.spotifyTokenExpiry = Date.now() + (data.body.expires_in * 1000);
    
    // Set access token on the API object
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);
    
    // Get user profile and store in session
    const userProfile = await spotifyApi.getMe();
    req.session.user = {
      id: userProfile.body.id,
      name: userProfile.body.display_name,
      email: userProfile.body.email,
      imageUrl: userProfile.body.images?.[0]?.url || null
    };
    
    res.redirect('/spotify/dashboard');
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect('/?error=callback_failure');
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Middleware to refresh token if expired
router.refreshSpotifyToken = async (req, res, next) => {
  if (!req.session.spotifyAccessToken) {
    return res.redirect('/auth/login');
  }
  
  // Check if token is expired or about to expire (5 min buffer)
  if (req.session.spotifyTokenExpiry - Date.now() < 300000) {
    try {
      spotifyApi.setRefreshToken(req.session.spotifyRefreshToken);
      const data = await spotifyApi.refreshAccessToken();
      
      req.session.spotifyAccessToken = data.body.access_token;
      req.session.spotifyTokenExpiry = Date.now() + (data.body.expires_in * 1000);
      
      spotifyApi.setAccessToken(data.body.access_token);
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.redirect('/auth/login');
    }
  }
  
  next();
};

module.exports = router;
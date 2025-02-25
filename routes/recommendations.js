const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const spotifyService = require('../services/spotify');
const llmService = require('../services/llm');
const Feedback = require('../models/feedback');
const helpers = require('../utils/helpers');

// Auth middleware
router.use(authRoutes.refreshSpotifyToken);

// Get recommendations
router.get('/', async (req, res) => {
  try {
    // Get user's music profile from Spotify
    const accessToken = req.session.spotifyAccessToken;
    const userId = req.session.user.id;
    const db = req.app.locals.db;
    
    // Fetch user data required for recommendations
    const topTracks = await spotifyService.getTopTracks(accessToken, 'medium_term', 20);
    const topArtists = await spotifyService.getTopArtists(accessToken, 'medium_term', 20);
    const recentlyPlayed = await spotifyService.getRecentlyPlayed(accessToken, 20);
    
    // Get previous feedback to include in the LLM context
    const previousFeedback = await Feedback.find(db, { userId }, { limit: 10 });
    
    // Generate recommendations using LLM
    const recommendations = await llmService.getRecommendations(
      topTracks,
      topArtists,
      recentlyPlayed,
      previousFeedback
    );
    
    // Search and validate recommendations on Spotify
    const validatedRecommendations = await spotifyService.validateRecommendations(
      accessToken,
      recommendations
    );
    
    res.render('recommendations', {
      user: req.session.user,
      recommendations: validatedRecommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).render('error', { message: 'Failed to generate recommendations' });
  }
});

// Submit feedback on a recommendation
router.post('/feedback', async (req, res) => {
  try {
    const { recommendationId, itemType, itemId, itemName, liked, comments } = req.body;
    const userId = req.session.user.id;
    const db = req.app.locals.db;
    
    // Save feedback to database
    await Feedback.create(db, {
      userId,
      recommendationId,
      itemType, // 'artist' or 'track'
      itemId,
      itemName,
      liked: liked === 'true',
      comments
    });
    
    res.status(200).json({ success: true, message: 'Feedback recorded' });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

// Get new recommendations (refresh)
router.get('/refresh', async (req, res) => {
  try {
    // Clear session cache for recommendations
    delete req.session.cachedRecommendations;
    
    // Redirect to recommendations page to generate new ones
    res.redirect('/recommendations');
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).render('error', { message: 'Failed to refresh recommendations' });
  }
});

module.exports = router;
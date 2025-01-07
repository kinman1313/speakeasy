import express from 'express';
import { auth } from '../middleware/auth.js';
import giphyService from '../services/giphyService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Search GIFs
router.get('/search', auth, async (req, res) => {
    try {
        const { q, limit = 20, offset = 0 } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const results = await giphyService.search(q, parseInt(limit), parseInt(offset));
        res.json(results);
    } catch (error) {
        logger.error('GIF search error:', error);
        res.status(500).json({ message: error.message || 'Failed to search GIFs' });
    }
});

// Get trending GIFs
router.get('/trending', auth, async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const results = await giphyService.trending(parseInt(limit));
        res.json(results);
    } catch (error) {
        logger.error('Trending GIFs error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch trending GIFs' });
    }
});

// Get GIF by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await giphyService.getById(id);
        res.json(result);
    } catch (error) {
        logger.error('Get GIF error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch GIF' });
    }
});

export default router; 
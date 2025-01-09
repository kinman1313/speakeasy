"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _auth = require("../middleware/auth.js");
var _giphyService = _interopRequireDefault(require("../services/giphyService.js"));
var _logger = _interopRequireDefault(require("../utils/logger.js"));
const router = _express.default.Router();

// Search GIFs
router.get('/search', _auth.auth, async (req, res) => {
  try {
    const {
      q,
      limit = 20,
      offset = 0
    } = req.query;
    if (!q) {
      return res.status(400).json({
        message: 'Search query is required'
      });
    }
    const results = await _giphyService.default.search(q, parseInt(limit), parseInt(offset));
    res.json(results);
  } catch (error) {
    _logger.default.error('GIF search error:', error);
    res.status(500).json({
      message: error.message || 'Failed to search GIFs'
    });
  }
});

// Get trending GIFs
router.get('/trending', _auth.auth, async (req, res) => {
  try {
    const {
      limit = 20
    } = req.query;
    const results = await _giphyService.default.trending(parseInt(limit));
    res.json(results);
  } catch (error) {
    _logger.default.error('Trending GIFs error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch trending GIFs'
    });
  }
});

// Get GIF by ID
router.get('/:id', _auth.auth, async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const result = await _giphyService.default.getById(id);
    res.json(result);
  } catch (error) {
    _logger.default.error('Get GIF error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch GIF'
    });
  }
});
var _default = exports.default = router;
import axios from 'axios';
import logger from '../utils/logger.js';

const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

class GiphyService {
    async search(query, limit = 20, offset = 0) {
        try {
            const response = await axios.get(`${GIPHY_API_URL}/search`, {
                params: {
                    api_key: GIPHY_API_KEY,
                    q: query,
                    limit,
                    offset,
                    rating: 'g'
                }
            });
            return response.data;
        } catch (error) {
            logger.error('Giphy search error:', error);
            throw new Error('Failed to search GIFs');
        }
    }

    async trending(limit = 20) {
        try {
            const response = await axios.get(`${GIPHY_API_URL}/trending`, {
                params: {
                    api_key: GIPHY_API_KEY,
                    limit,
                    rating: 'g'
                }
            });
            return response.data;
        } catch (error) {
            logger.error('Giphy trending error:', error);
            throw new Error('Failed to fetch trending GIFs');
        }
    }

    async getById(gifId) {
        try {
            const response = await axios.get(`${GIPHY_API_URL}/${gifId}`, {
                params: {
                    api_key: GIPHY_API_KEY
                }
            });
            return response.data;
        } catch (error) {
            logger.error('Giphy getById error:', error);
            throw new Error('Failed to fetch GIF');
        }
    }
}

export default new GiphyService(); 
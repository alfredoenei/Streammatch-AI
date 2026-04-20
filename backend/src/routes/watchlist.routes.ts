import { Router } from 'express';
import * as watchlistController from '../controllers/watchlist.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route POST /api/watchlist
 * @desc Toggle (Add/Remove) a movie from the user's watchlist (El Cofre)
 * @access Private
 */
router.post('/', protect, watchlistController.toggleWatchlist);

/**
 * @route GET /api/watchlist
 * @desc Get all saved items in the user's watchlist
 * @access Private
 */
router.get('/', protect, watchlistController.getWatchlist);

export default router;

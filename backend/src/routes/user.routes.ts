import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route PATCH /api/users/watch/:movieId
 * @desc Toggle a movie in the user's watched history
 * @access Private
 */
/**
 * @route GET /api/users/history
 * @desc Get the user's watched movie history with details
 * @access Private
 */
router.patch('/watch/:movieId', protect, userController.toggleWatchedMovie);
router.get('/history', protect, userController.getWatchedHistory);

// v10.0: Perfil de Paladar
router.post('/profile/taste', protect, userController.updateTasteProfile);
router.post('/profile/reset', protect, userController.resetTasteProfile);

export default router;

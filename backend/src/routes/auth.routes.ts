import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

import { AVAILABLE_PLATFORMS } from '../config/platforms';

// Esquemas de Validación con Zod
const updateProfileSchema = z.object({
  body: z.object({
    streamingPlatforms: z.array(z.string().refine(val => AVAILABLE_PLATFORMS.includes(val), {
      message: 'Plataforma no soportada en el Radar actual'
    }))
      .min(1, 'Debes seleccionar al menos una plataforma')
  })
});

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', protect, authController.getProfile);

/**
 * @route PUT /api/auth/profile
 * @desc Update current user profile
 * @access Private
 */
router.put('/profile', protect, validate(updateProfileSchema), authController.updateProfile);

export default router;


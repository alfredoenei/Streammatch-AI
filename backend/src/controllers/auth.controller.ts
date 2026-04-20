import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import tmdbService from '../services/tmdb.service';

/**
 * Handles user registration.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, streamingPlatforms } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
      return;
    }

    const result = await authService.register({ name, email, password, streamingPlatforms });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al registrar usuario'
    });
  }
};

/**
 * Handles user login.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
      return;
    }

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al iniciar sesión'
    });
  }
};

/**
 * Gets the current authenticated user's profile.
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // El usuario ya viene en el req por el middleware de auth
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil'
    });
  }
};

/**
 * Updates the current authenticated user's profile.
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)._id; // Using the ID injected by protect middleware
    const { streamingPlatforms } = req.body;

    if (!Array.isArray(streamingPlatforms)) {
      res.status(400).json({ success: false, message: 'Formato de plataformas inválido' });
      return;
    }

    const updatedUser = await authService.updateProfile(userId, streamingPlatforms);

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar el perfil'
    });
  }
};





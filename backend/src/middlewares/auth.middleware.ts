import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { IUserDocument } from '../types/user';

interface TokenPayload {
  id: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to protect routes and ensure the user is authenticated.
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // 1. Verificar si el token viene en el header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // 2. Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as TokenPayload;

      // 3. Buscar el usuario correspondiente al ID del token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.error('❌ [AUTH] Usuario no encontrado en DB para el token dado');
        res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        return;
      }

      // 4. Adjuntar el usuario al objeto request
      req.user = user as IUserDocument;
      next();
    } catch (error: any) {
      console.error('❌ [AUTH] FALLO DE VALIDACIÓN:', error.message);
      res.status(401).json({ success: false, message: 'Token no válido o expirado' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'No autorizado, falta el token' });
  }
};

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware de validación genérico usando Zod.
 * Blindaje de Grado Auditor para prevenir Inyección de Datos y Schemas inválidos.
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Error de validación de datos',
          errors: error.issues.map((err: any) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor en validación',
      });
    }
  };
};

import dotenv from 'dotenv';
// Load env variables immediately before any other imports
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import movieRoutes from './routes/movie.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import watchlistRoutes from './routes/watchlist.routes';

// Connect to Database
connectDB();

const app: Application = express();

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Límite de 200 peticiones por IP cada 15m
  message: { success: false, message: 'Frecuencia de radar excedida. Por favor, espera unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como herramientas de test o server-to-server)
    if (!origin) return callback(null, true);
    
    const isNetlify = origin.endsWith('.netlify.app');
    const isAllowed = allowedOrigins.includes(origin);

    if (isAllowed || isNetlify) {
      callback(null, true);
    } else {
      callback(new Error('Acceso denegado por política CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api/', apiLimiter);

// Routes
app.use('/api/movies', movieRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to StreamMatch AI API',
    status: 'Server is running smoothly'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

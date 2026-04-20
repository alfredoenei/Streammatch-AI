import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { IUser, IUserDocument } from '../types/user';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

/**
 * Generates a JWT for a user.
 */
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
};


/**
 * Register a new user.
 */
export const register = async (userData: Partial<IUser>): Promise<{ user: Partial<IUser>; token: string }> => {
  const { email, password, name, streamingPlatforms } = userData;

  // Verificar si el usuario ya existe
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('El correo electrónico ya está registrado');
  }

  // Crear nuevo usuario
  const user = await User.create({
    name,
    email,
    password,
    streamingPlatforms: streamingPlatforms || [],
  });

  const token = generateToken(user._id.toString());

  // No devolver la contraseña
  const userResponse = user.toObject();
  delete userResponse.password;

  return { user: userResponse, token };
};

/**
 * Login a user.
 */
export const login = async (email: string, password: string): Promise<{ user: Partial<IUser>; token: string }> => {
  // Buscar usuario por email
  const user = await User.findOne({ email }) as IUserDocument | null;
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  // Verificar contraseña (usando el método definido en el schema)
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Credenciales inválidas');
  }


  const token = generateToken(user._id.toString());

  // No devolver la contraseña
  const userResponse = user.toObject();
  delete userResponse.password;

  return { user: userResponse, token };
};

/**
 * Update user profile (e.g. streaming platforms).
 */
export const updateProfile = async (userId: string, streamingPlatforms: string[]): Promise<Partial<IUser>> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { streamingPlatforms },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return user.toObject();
};

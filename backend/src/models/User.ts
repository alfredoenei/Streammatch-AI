import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserDocument } from '../types/user';

const userSchema = new Schema<IUserDocument>({
  name: { 
    type: String, 
    required: [true, 'El nombre es obligatorio'] 
  },
  email: { 
    type: String, 
    required: [true, 'El correo es obligatorio'], 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es obligatoria'] 
  },
  
  // Las plataformas que el usuario tiene contratadas
  streamingPlatforms: {
    type: [String],
    enum: ['netflix', 'hbo_max', 'disney_plus', 'amazon_prime', 'apple_tv', 'skyshowtime', 'movistar_plus', 'filmin'],
    default: []
  },

  region: {
    type: String,
    default: 'ES'
  },
  
  
  watchedMovies: [{
    id: { type: Number, required: true },
    media_type: { type: String, enum: ['movie', 'tv'], required: true }
  }],

  // v10.0: Perfil de Paladar Cinematográfico
  tasteProfile: {
    type: {
      genres: [String],
      pace: String,
      tone: String,
      era: String,
      dealbreakers: [String]
    },
    default: null
  },
  
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(this: IUserDocument) {
  if (!this.isModified('password') || !this.password) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});


// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(password?: string): Promise<boolean> {
  if (!password || !this.password) return false;
  return await bcrypt.compare(password, this.password);
};

export const User = model<IUserDocument>('User', userSchema);

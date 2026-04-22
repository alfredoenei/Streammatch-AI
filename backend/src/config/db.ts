import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix for environments where default DNS refuses SRV queries
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    });

    // Verificar la conexión con un ping
    if (conn.connection.db) {
      await conn.connection.db.admin().ping();
    }

    console.log('✅ [DATABASE] Conectado exitosamente a MongoDB Atlas (Cluster: FutbolConect).');
  } catch (error) {
    console.error('❌ [DATABASE] Error de conexión:');
    
    if (error instanceof Error) {
      if (error.message.includes('authentication failed')) {
        console.error('   -> Error de Autenticación: Verifica el usuario y la contraseña.');
      } else if (error.message.includes('ETIMEOUT') || error.message.includes('selection timeout')) {
        console.error('   -> Tiempo de espera agotado: Verifica tu conexión a internet o el estado del cluster.');
      } else {
        console.error(`   -> Detalle: ${error.message}`);
      }
    } else {
      console.error('   -> Ocurrió un error desconocido durante la conexión.');
    }
    
    process.exit(1);
  }
};

export default connectDB;

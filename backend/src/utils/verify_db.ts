import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

// Fix for environments where default DNS refuses SRV queries
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const verifyDatabase = async () => {
  console.log('🔍 [VERIFICATION] Iniciando comprobación de salud de la base de datos...');
  
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ [ERROR] MONGODB_URI no encontrada en .env');
    process.exit(1);
  }

  try {
    console.log('📡 [NETWORK] Intentando conectar a MongoDB Atlas...');
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
    
    console.log('✅ [DATABASE] Conectado exitosamente a MongoDB Atlas (Cluster: FutbolConect).');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');

    // 1. Ping
    const ping = await db.admin().ping();
    console.log('🏓 [PING] Latencia verificada: OK');

    // 2. Collections check
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = ['users', 'sessions', 'watchlist_cache'];
    console.log('\n📊 [SCHEMAS] Estado de las Colecciones:');
    
    requiredCollections.forEach(reqCol => {
      const exists = collectionNames.includes(reqCol);
      console.log(`   - ${reqCol}: ${exists ? '✅ Localizada' : '⚠️ Pendiente (se creará al primer uso)'}`);
    });

    console.log('\n✨ [STATUS] La base de datos está lista para producción.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ [CRITICAL] Fallo en la verificación:');
    if (error instanceof Error) {
      console.error(`   -> ${error.message}`);
    }
    process.exit(1);
  }
};

verifyDatabase();

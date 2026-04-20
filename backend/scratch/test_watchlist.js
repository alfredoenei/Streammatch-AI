const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Configuración manual del path del modelo (usamos el compilado o simulado)
// Para evitar problemas de importación, definiremos el esquema aquí mismo
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const userId = new mongoose.Types.ObjectId();
const mockMovie = {
  id: 998877,
  title: "Inception Test",
  year: 2010,
  media_type: "movie"
};

async function runTests() {
  console.log('🚀 [NODE_TEST] Iniciando Pruebas de Watchlist...');
  
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/streammatch_ai';
  await mongoose.connect(mongoURI);
  console.log('✅ Conectado a MongoDB');

  // Definimos el modelo en caliente para el test
  const testSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    movie: { type: mongoose.Schema.Types.Mixed, required: true }
  });
  testSchema.index({ userId: 1, 'movie.id': 1 }, { unique: true });
  
  const TestWatchlist = mongoose.model('TestWatchlist', testSchema);
  
  // Sincronizamos índices
  await TestWatchlist.createIndexes();

  // Limpieza
  await TestWatchlist.deleteMany({ userId });

  console.log('\n--- 1. Añadido Inicial ---');
  await TestWatchlist.create({ userId, movie: mockMovie });
  console.log('✅ Documento creado.');

  console.log('\n--- 2. Protección de Duplicados ---');
  try {
    await TestWatchlist.create({ userId, movie: mockMovie });
    console.error('❌ ERROR: No se bloqueó el duplicado.');
  } catch (err) {
    if (err.code === 11000) {
      console.log('✅ ÉXITO: MongoDB bloqueó el duplicado (E11000)');
    } else {
      console.error('❌ ERROR INESPERADO:', err);
    }
  }

  console.log('\n--- 3. Verificación de Data ---');
  const items = await TestWatchlist.find({ userId });
  console.log(`Documentos encontrados: ${items.length}`);
  console.log(`Título guardado: ${items[0].movie.title}`);

  // Limpieza final
  await TestWatchlist.collection.drop();
  await mongoose.connection.close();
  console.log('\n🏁 Pruebas finalizadas con éxito.');
}

runTests().catch(console.error);

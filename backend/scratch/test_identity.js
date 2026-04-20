require('dotenv').config();
const { identityResolver } = require('../src/services/identity.resolver');

async function testResolver() {
  console.log('🚀 Iniciando Prueba de Estrés de Identidad v14.1...\n');

  const titles = [
    'When We Were Kings (1996)', // El documental de Ali (Trakt debe encontrarlo)
    'The Last Dance (2020)',      // El clásico (Trakt impecable)
    'Rising Phoenix (2020)',      // Prueba de match semántico
    'Pelicula No Existente 2026 (2026)', // Fallback total
  ];

  try {
    const results = await identityResolver.resolveBatch(titles, 'both');
    
    console.log('\n--- 📊 RESULTADOS DE LA PRUEBA ---');
    results.forEach((res, i) => {
      console.log(`[${i+1}] Solicitado: ${titles[i]}`);
      console.log(`    Identificado como: "${res.title}" (${res.year})`);
      console.log(`    IMDB: ${res.imdbId} | TMDB: ${res.tmdbId} | Trakt: ${res.traktId}`);
      console.log('    ---------------------------');
    });

  } catch (error) {
    console.error('❌ Error en el test:', error);
  }
}

testResolver();

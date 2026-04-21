import dotenv from 'dotenv';
dotenv.config();

import { identityResolver } from '../src/services/identity.resolver';

async function runTest() {
  console.log('🧪 Iniciando Test de Subtitle Stripping v36.1...\n');

  const testCases = [
    { title: 'Avatar: La senda del agua', year: 2022, type: 'movie' as const },
    { title: 'Misión Imposible - Sentencia Mortal', year: 2023, type: 'movie' as const },
    { title: 'Dune: Parte dos', year: 2024, type: 'movie' as const }
  ];

  for (const test of testCases) {
    console.log(`\n--- 🔍 Probando: "${test.title}" (${test.year}) ---`);
    try {
      const result = await identityResolver.resolveSingle(test.title, test.year, test.type);
      if (result) {
        console.log(`✅ ÉXITO: "${result.title}" (${result.year})`);
        console.log(`   IDs: TMDB: ${result.tmdbId} | IMDB: ${result.imdbId}`);
      } else {
        console.log(`❌ FALLO: No se pudo resolver.`);
      }
    } catch (error) {
      console.error(`❌ ERROR: ${(error as Error).message}`);
    }
  }
}

runTest();

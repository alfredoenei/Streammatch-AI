/**
 * Herramientas base de Procesamiento de Lenguaje Natural (NLP)
 * Optimizadas para la Interfaz Diamante y Búsqueda Híbrida.
 */

/**
 * Limpia el texto de acentos, caracteres especiales y lo pasa a minúsculas.
 */
export const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (acentos)
    .toLowerCase()
    .trim();
};

/**
 * Extrae el núcleo de una búsqueda si el usuario usa comillas.
 * Ej: quiero ver "El Señor de los Anillos" -> El Señor de los Anillos
 */
export const extractQueryCore = (text: string): string => {
  const quoteMatch = text.match(/"([^"]+)"/);
  if (quoteMatch && quoteMatch[1]) {
    return quoteMatch[1].trim();
  }
  return text.trim();
};

/**
 * Analizador Semántico: Calcula la probabilidad (0-100) de que la frase sea 
 * el TÍTULO EXACTO de una película frente a una intención de exploración por géneros.
 */
export const scoreEntityTitle = (text: string): number => {
  let score = 0;
  const normalized = normalizeText(text);

  // 1. Uso explícito de comillas (El usuario sabe lo que busca)
  if (/"([^"]+)"/.test(text)) {
    score += 60; 
  }

  // 2. Longitud de la consulta
  // Títulos suelen ser cortos (1-4 palabras). Consultas de descubrimiento son largas.
  const wordsCount = normalized.split(/\s+/).length;
  if (wordsCount <= 3) score += 20;
  if (wordsCount > 5) score -= 20;

  // 3. Penalización estricta SOLO por verbos claros de descubrimiento
  const discoveryIntentWords = [
    'peliculas de', 'pelis de', 'quiero ver', 'recomendaciones', 'recomiendame',
    'algo de', 'buscame', 'muestrame', 'genero'
  ];
  
  let isDiscovery = false;
  discoveryIntentWords.forEach(word => {
    if (normalized.includes(word)) {
      score -= 40;
      isDiscovery = true;
    }
  });

  // 4. Bonus de Mayúsculas (Title Case)
  if (!isDiscovery) {
    const originalWords = text.trim().split(/\s+/);
    let titleCaseWords = 0;
    for (let i = 1; i < originalWords.length; i++) {
      const word = originalWords[i]; // Extracción segura para TS
      if (word && /^[A-ZÁÉÍÓÚÑ]/.test(word)) {
        titleCaseWords++;
      }
    }
    if (titleCaseWords >= 1) score += 30;
  }

  return Math.max(0, Math.min(score, 100));
};
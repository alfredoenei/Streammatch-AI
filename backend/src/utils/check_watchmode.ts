import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY;

const checkWatchmode = async () => {
  const imdbId = 'tt0944947'; // Game of Thrones
  const region = 'ES';
  
  console.log(`🔍 [DEBUG] Checking Watchmode for IMDB: ${imdbId} in Region: ${region}`);
  console.log(`🔑 [DEBUG] API Key starts with: ${WATCHMODE_API_KEY?.substring(0, 5)}...`);

  try {
    const url = `https://api.watchmode.com/v1/title/${imdbId}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=${region}`;
    const response = await axios.get(url);
    console.log('✅ [SUCCESS] Response length:', response.data.length);
    console.log('📡 [DATA]:', JSON.stringify(response.data.slice(0, 3), null, 2));
    
    const types = new Set(response.data.map((s: any) => s.type));
    console.log('📊 [SOURCE TYPES]:', Array.from(types));
    
    const platforms = response.data.map((s: any) => `${s.name} (${s.source_id}) [${s.type}]`);
    console.log('🏛️ [PLATFORMS FOUND]:', platforms);
  } catch (error: any) {
    console.log('❌ [ERROR]:', error.response?.data || error.message);
  }
};

checkWatchmode();

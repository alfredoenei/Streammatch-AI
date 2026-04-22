import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('🔍 [DEBUG] Intentando POST a https://streammatch-ai.onrender.com/api/auth/login');
    const response = await axios.post('https://streammatch-ai.onrender.com/api/auth/login', {
      email: 'andresenei@gmail.com',
      password: 'wrong_password' // Esperamos un 401, no un 404
    });
    console.log('✅ [SUCCESS] Respuesta:', response.data);
  } catch (error: any) {
    if (error.response) {
      console.log(`❌ [ERROR] El servidor respondió con ${error.response.status}`);
      console.log('Detalle:', error.response.data);
    } else {
      console.log('❌ [ERROR] Fallo de red:', error.message);
    }
  }
};

testLogin();

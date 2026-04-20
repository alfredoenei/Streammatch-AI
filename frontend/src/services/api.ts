import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    console.log(`🔌 [API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle responses (Global session management)
api.interceptors.response.use(
  (response) => {
    console.log(`📡 [API RESPONSE] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    if (response.config.url?.includes('recommend-ai')) {
      console.log('🍷 [RADAR DATA]:', response.data);
    }
    return response;
  },
  (error) => {
    console.error(`❌ [API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message);
    if (error.response && error.response.status === 401) {
      // Evitar bucle de redirección si ya estamos en el login
      if (window.location.pathname === '/login') {
        return Promise.reject(error);
      }

      
      // Atomic Cleanup
      localStorage.removeItem('token');
      
      // Post-Audit Radical Redirect (Force Heap Clearance)
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

export default api;

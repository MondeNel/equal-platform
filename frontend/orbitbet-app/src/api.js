import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const betAPI = axios.create({
  baseURL: `${API_BASE_URL}/bet`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
betAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('equal_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors by redirecting to login
betAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('equal_token');
      window.location.href = 'http://localhost:5171';
    }
    return Promise.reject(error);
  }
);

export { betAPI };

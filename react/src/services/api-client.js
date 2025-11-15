// src/integration/apiClient.js
import axios from 'axios';
import { Storage } from '../utilities/app handlers/services';



// export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4042/';
// export const STORAGE_URL = 'http://localhost:4042';
export const STORAGE_URL = 'http://127.0.0.1:8000/';
export const BASE_URL = 'http://127.0.0.1:8000/'

const defaultConfig = {
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // ✅ add this line
  },
};

const apiClient = (customOptions = {}) => {
  const client = axios.create({
    ...defaultConfig,
    ...customOptions,
    headers: {
      ...defaultConfig.headers,
      ...customOptions.headers, // override or add headers
    },
  });

  client.interceptors.request.use(
    (config) => {
      const token = Storage.get("token");
      if (token)
        config.headers.Authorization = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
      
      // If sending FormData, remove Content-Type header to let axios set it with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle 401 errors globally
  client.interceptors.response.use(
    (response) => response, // Pass through successful responses
    (error) => {
      // Check if error response status is 401 (Unauthorized)
      if (error.response && error.response.status === 401) {
        console.warn('⚠ 401 Unauthorized - Logging out user');
        
        // Clear all storage
        // Storage.clear();
        
        // Force redirect to login page
        // Using window.location to ensure clean redirect
        // window.location.href = '/';
      }
      
      // Reject the promise to allow error handling in components
      return Promise.reject(error);
    }
  );

  return client;
};

export default apiClient;
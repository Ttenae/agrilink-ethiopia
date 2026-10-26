import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        // ✅ If the error happens on the login page, DO NOT redirect.
        // Let the login page handle the error message.
        if (!window.location.pathname.includes('/auth/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please log in again.');
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
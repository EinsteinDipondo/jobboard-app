// API Configuration
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  JOBS: `${API_BASE}/jobs/`,
  APPLY: `${API_BASE}/apply/`,
  CATEGORIES: `${API_BASE}/categories/`,
  AUTH: {
    LOGIN: `${API_BASE}/token/`,
    REGISTER: `${API_BASE}/register/`,
    REFRESH: `${API_BASE}/token/refresh/`,
  }
};

export default API_BASE;

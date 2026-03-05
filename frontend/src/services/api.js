import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('cafe_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('cafe_token');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:  (pin)   => api.post('/auth/login', { pin }),
  verify: (token) => api.post('/auth/verify', { token }),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  create: (data)   => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  toggle: (id)     => api.patch(`/products/${id}/toggle`),
  delete: (id)     => api.delete(`/products/${id}`),
};

export const ordersAPI = {
  place:      (data)       => api.post('/orders', data),
  edit:       (id, data)   => api.put(`/orders/${id}`, data),   // ← NEW
  getAll:     (params)     => api.get('/orders', { params }),
  getSummary: (days)       => api.get('/orders/summary', { params: { days } }),
  getToday:   ()           => api.get('/orders/today'),
  getOne:     (id)         => api.get(`/orders/${id}`),
  cancel:     (id)         => api.patch(`/orders/${id}/cancel`),
};

export const settingsAPI = {
  getPublic: () => api.get('/settings'),
  getFull:   () => api.get('/settings/full'),
  update:    (data) => api.put('/settings', data),
};

export default api;

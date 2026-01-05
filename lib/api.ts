import axios from 'axios';

export const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const pingBackend = async () => {
  const res = await api.get('/ping');
  return res.data;
};

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

// export const fetchEvents = () => api.get('/v1/events');
// export const createEvent = (payload: unknown) => api.post('/v1/events', payload);

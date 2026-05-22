import api from './axios';
import axios from 'axios';

const BASE = 'http://localhost:8000';

// 1.1 Registration
export const registerStudent = (data) =>
  axios.post(`${BASE}/api/user/register/student/`, data);

export const registerCompany = (data) =>
  axios.post(`${BASE}/api/user/register/company/`, data);

// 1.2 Token (Login / Refresh)
export const loginUser = (email, password) =>
  axios.post(`${BASE}/api/user/token/`, { email, password });

export const refreshToken = (refresh) =>
  axios.post(`${BASE}/api/user/token/refresh/`, { refresh });

// 1.3 Account Management
export const getMe = () => api.get('/api/user/me/');
export const updateMe = (data) => api.patch('/api/user/me/', data);

export const deleteUser = (id) => api.delete(`/api/user/${id}/delete/`);

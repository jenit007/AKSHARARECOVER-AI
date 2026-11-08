/**
 * @fileoverview User authentication & profile service.
 */

import api from './api';

export async function registerUser({ full_name, email, password, confirm_password }) {
  const response = await api.post('/api/auth/register', {
    full_name,
    email,
    password,
    confirm_password,
  });
  return response.data.data;
}

export async function loginUser({ email, password }) {
  const response = await api.post('/api/auth/login', {
    email,
    password,
  });
  return response.data.data;
}

export async function logoutUser() {
  const response = await api.post('/api/auth/logout');
  return response.data.data;
}

export async function getCurrentUser() {
  const response = await api.get('/api/auth/session');
  return response.data.data;
}

export async function getUserProfile() {
  const response = await api.get('/api/auth/profile');
  return response.data.data;
}

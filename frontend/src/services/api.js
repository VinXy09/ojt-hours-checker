import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbw9KRe4i8gmIpVyf51pf0u8XQXnTr0yrfwKvrXX_0mHVr9yZSFMu6XpeugMQ2hRpHDgbA/exec';

// Create axios instance that works with Google Apps Script
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Important: Enable CORS for Apps Script
  withCredentials: false
});

// Transform request to Apps Script format
api.interceptors.request.use((config) => {
  // Convert REST path to Apps Script action parameter
  const path = config.url.replace(/^\//, '');
  config.url = `?action=${path}`;
  
  // Add token to request
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Transform response from Apps Script format
api.interceptors.response.use(
  (response) => {
    // Apps Script returns the data directly
    return response.data;
  },
  (error) => {
    // Handle errors from Apps Script
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me')
};

// Student API
export const studentAPI = {
  getAll: () => api.get('/students'),
  getByUserId: (userId) => api.get(`/students/user/${userId}`),
  getProgress: (studentId) => api.get(`/students/progress/${studentId}`),
  update: (studentId, data) => api.put(`/students/${studentId}`, data),
  getDailyRecords: (studentId) => api.get(`/students/${studentId}/records`)
};

// Daily Record API
export const dailyRecordAPI = {
  create: (data) => api.post('/daily-records', data),
  update: (id, data) => api.put(`/daily-records/${id}`, data),
  getAll: () => api.get('/daily-records/all'),
  getPending: () => api.get('/daily-records/pending'),
  approve: (id, approverId) => api.put(`/daily-records/${id}/approve`, { approverId }),
  delete: (id) => api.delete(`/daily-records/${id}`),
  getByStudent: (studentId, startDate, endDate) => 
    api.get(`/daily-records/student/${studentId}?startDate=${startDate}&endDate=${endDate}`),
  getTotalHours: (studentId) => api.get(`/daily-records/student/${studentId}/total`)
};

// Weekly Report API
export const weeklyReportAPI = {
  create: (data) => api.post('/weekly-reports', data),
  getAll: () => api.get('/weekly-reports/all'),
  getById: (id) => api.get(`/weekly-reports/${id}`),
  getByStudent: (studentId) => api.get(`/weekly-reports/student/${studentId}`),
  submit: (id) => api.put(`/weekly-reports/${id}/submit`),
  approve: (id) => api.put(`/weekly-reports/${id}/approve`),
  generate: (studentId, weekStartDate, weekEndDate) => 
    api.get(`/weekly-reports/generate?studentId=${studentId}&weekStartDate=${weekStartDate}&weekEndDate=${weekEndDate}`),
  getForPrint: (studentId, weekStartDate, weekEndDate) => 
    api.get(`/weekly-reports/print?studentId=${studentId}&weekStartDate=${weekStartDate}&weekEndDate=${weekEndDate}`)
};

// Excel API - Note: File upload not supported in basic Apps Script
export const excelAPI = {
  exportTimesheet: (studentId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return api.get(`/excel/export/${studentId}${queryString ? '?' + queryString : ''}`, {
      responseType: 'blob'
    });
  }
};

export default api;


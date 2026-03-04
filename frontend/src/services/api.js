import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// Excel API
export const excelAPI = {
  uploadTemplate: (studentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentId', studentId);
    return api.post('/excel/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getTemplate: (studentId) => api.get(`/excel/template/${studentId}`),
  parseExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/excel/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importRecords: (studentId, records) => api.post('/excel/import', { studentId, records }),
  getPreview: (studentId) => api.get(`/excel/preview/${studentId}`),
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

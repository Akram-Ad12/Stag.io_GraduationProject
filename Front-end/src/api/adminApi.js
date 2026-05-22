import api from './axios';

// 5.1 Notifications (Admin-specific)
export const getAdminNotifications = () => api.get('/api/administration/notifications/');
export const getAdminUnreadNotifications = () => api.get('/api/administration/notifications/unread/');
export const markAdminNotificationAsRead = (id) => api.patch(`/api/administration/notifications/${id}/read/`);
export const markAdminNotificationsAsRead = () => api.patch('/api/administration/notifications/mark-all-read/');

// 5.2 Internship Management
export const getAdminInternships = () => api.get('/api/administration/internships/');
export const getAdminInternshipDetails = (id) => api.get(`/api/administration/internships/${id}/`);
export const downloadAdminAgreement = (id) =>
  api.get(`/api/administration/internships/${id}/agreement/`, { responseType: 'blob' });
export const validateInternship = (id) => api.patch(`/api/administration/internships/${id}/validate/`);
export const rejectInternship = (id, reason) => api.patch(`/api/administration/internships/${id}/reject/`, { rejection_reason: reason });

// 5.3 Statistics & Analytics
export const getStatsSummary = () => api.get('/api/administration/statistics/');
export const getStatsCompanies = () => api.get('/api/administration/statistics/companies/');
export const getStatsCompanyDetails = (id) => api.get(`/api/administration/statistics/companies/${id}/`);
export const getStatsWilayas = (source = 'student') => api.get(`/api/administration/statistics/wilayas/?source=${source}`);
export const getStatsTrends = (period = 'monthly') => api.get(`/api/administration/statistics/trends/?period=${period}`);
export const getStatsAgreements = () => api.get('/api/administration/statistics/agreements/');
export const getStatsStatuses = () => api.get('/api/administration/statistics/statuses/');
export const getStatsStudents = () => api.get('/api/administration/statistics/students/');
export const resetAdminData = (password) => api.post('/api/administration/reset-data/', { password });

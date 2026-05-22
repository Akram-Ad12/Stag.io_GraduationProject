import api from './axios';

// 4.1 Offer Management
export const getCompanyOffers = () => api.get('/api/company/offers/');
export const createOffer = (data) => api.post('/api/company/offers/', data);
export const getOfferDetails = (id) => api.get(`/api/company/offers/${id}/`);
export const updateOffer = (id, data) => api.patch(`/api/company/offers/${id}/`, data);
export const deleteOffer = (id) => api.delete(`/api/company/offers/${id}/`);

// 4.2 Applicant Management
export const getOfferApplicants = (id) => api.get(`/api/company/offers/${id}/applicants/`);
export const getAllCompanyApplications = () => api.get('/api/company/applications/');
export const acceptApplication = (id) => api.post(`/api/company/applications/${id}/accept/`);
export const rejectApplication = (id) => api.post(`/api/company/applications/${id}/reject/`);

// Profile
export const getCompanyProfile = () => api.get('/api/user/me/company/');
export const updateCompanyProfile = (data) => api.patch('/api/user/me/company/', data);
export const uploadCompanyLogo = (file) => {
  const form = new FormData();
  form.append('logo', file);
  return api.patch('/api/user/me/upload-logo/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadOfferImage = (id, file) => {
  const form = new FormData();
  form.append('image', file);
  return api.patch(`/api/company/offers/${id}/upload-image/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 4.3 Statistics
export const getCompanyStats = () => api.get('/api/company/stats/');
export const getCompanyOfferStats = (id) => api.get(`/api/company/offers/${id}/stats/`);
export const resetCompanyData = (password) => api.post('/api/company/reset-data/', { password });

// 4.4 Notifications (uses the shared core notification system)
export const getCompanyNotifications = () => api.get('/api/notifications/');
export const markCompanyNotificationsRead = () => api.patch('/api/notifications/read-all/');
export const markCompanyNotificationRead = (id) => api.patch(`/api/notifications/${id}/read/`);

export const downloadCompanyAgreement = (internshipId) => {
  return api.get(`/api/company/applications/${internshipId}/document/`, {
    responseType: 'blob',
  });
};

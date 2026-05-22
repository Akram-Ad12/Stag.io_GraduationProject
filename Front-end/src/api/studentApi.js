import api from './axios';

// Student Internships
export const getOffers = (searchParams = {}) => {
  let url = '/api/student/offers/';
  const params = new URLSearchParams();

  if (typeof searchParams === 'string') {
    if (searchParams) params.append('search', searchParams);
  } else {
    if (searchParams.search) params.append('search', searchParams.search);
    if (searchParams.type && searchParams.type !== 'all') params.append('type', searchParams.type);
    if (searchParams.remote) params.append('remote', 'true');
    if (searchParams.duration && searchParams.duration !== 'none') params.append('duration', searchParams.duration);
    if (searchParams.ordering) params.append('ordering', searchParams.ordering);
  }

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;
  return api.get(url);
};
export const getMyApplications = () => api.get('/api/student/applications/');
export const applyForOffer = (offerId) => api.post(`/api/student/offers/${offerId}/apply/`);
export const getOfferDetails = (offerId) => api.get(`/api/student/offers/${offerId}/`);

// Student Profile & CV
export const getStudentProfile = () => api.get('/api/user/me/student/');
export const updateStudentProfile = (data) => api.patch('/api/user/me/student/', data);
export const uploadProfileImage = (file) => {
  const form = new FormData();
  form.append('profile_image', file);
  return api.patch('/api/user/me/upload-profile-image/', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const getMyCV = () => api.get('/api/student/me/cv/');
export const updateMyCV = (data) => api.patch('/api/student/me/cv/', data);

// Skills
export const getAllSkills = () => api.get('/api/student/skills/');
export const getMySkills = () => api.get('/api/student/me/skills/');
export const addSkill = (skillId) => api.post('/api/student/me/skills/add/', { skill_id: skillId });
export const removeSkill = (skillId) => api.delete(`/api/student/me/skills/${skillId}/remove/`);

// Student Notifications (uses the shared core notification system)
export const getStudentNotifications = () => api.get('/api/notifications/');
export const markStudentNotificationRead = (id) => api.patch(`/api/notifications/${id}/read/`);
export const markAllStudentNotificationsRead = () => api.patch('/api/notifications/read-all/');

// Student Agreements (download via student application document endpoint)
export const downloadStudentAgreement = (internshipId) => {
  return api.get(`/api/student/applications/${internshipId}/document/`, {
    responseType: 'blob',
  });
};
import api from './axios';

export const getPublicCompanies = () => api.get('/api/administration/public/companies/');
export const getPublicOffers = () => api.get('/api/administration/public/offers/');
export const getUniversities = () => api.get('/api/user/universities/');
export const getAllSkills = () => api.get('/api/student/skills/');

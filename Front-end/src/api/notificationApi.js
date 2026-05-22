import api from './axios';

// 2. Shared Notifications (All Roles)

export const getNotifications = () => api.get('/api/notifications/');

export const getUnreadNotifications = () => api.get('/api/notifications/unread/');

export const markNotificationAsRead = (id) => api.patch(`/api/notifications/${id}/read/`);

export const markAllNotificationsAsRead = () => api.patch('/api/notifications/read-all/');

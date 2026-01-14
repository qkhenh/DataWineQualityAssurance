import api from '../lib/axios';

export const getAlerts = async () => {
  const response = await api.get('/alerts');
  return response.data;
};

export const markRead = async (alertId, isRead) => {
  const payload = { alertId };
  if (isRead !== undefined) {
    payload.isRead = isRead;
  }
  const response = await api.post('/alerts/read', payload);
  return response.data;
};

export const deleteRead = async () => {
  const response = await api.delete('/alerts/read');
  return response.data;
};

export const announceAlert = async (data) => {
  const response = await api.post('/alerts/announce', data);
  return response.data;
};

export const getSettings = async () => {
  const response = await api.get('/alerts/settings');
  return response.data;
};

export const updateSettings = async (settings) => {
  const response = await api.post('/alerts/settings', { settings });
  return response.data;
};

export const deleteSetting = async (metric) => {
  const response = await api.delete(`/alerts/settings/${metric}`);
  return response.data;
};

export const getAlertDetails = async (alertId) => {
  const response = await api.get(`/alerts/${alertId}/details`);
  return response.data;
};

export const deleteAlert = async (alertId) => {
  const response = await api.delete(`/alerts/${alertId}`);
  return response.data;
};

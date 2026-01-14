import api from '../lib/axios';

export const getAuditLogs = async () => {
  const response = await api.get('/auditlog');
  return response.data;
};

export const getAuditLogDetail = async (logId) => {
  const response = await api.get(`/auditlog/${logId}`);
  return response.data;
};

export const createAuditLog = async (event, description) => {
  const response = await api.post('/auditlog', { event, description });
  return response.data;
};

export const deleteAuditLog = async (logId) => {
  const response = await api.delete(`/auditlog/${logId}`);
  return response.data;
};

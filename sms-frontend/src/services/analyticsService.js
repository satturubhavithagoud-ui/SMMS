import { apiRequest } from './api';

export function getClientAnalytics(clientId) {
  const suffix = clientId ? `?client_id=${clientId}` : '';
  return apiRequest(`/client-analytics/${suffix}`);
}

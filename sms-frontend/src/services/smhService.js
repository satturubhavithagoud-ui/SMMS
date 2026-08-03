import { apiRequest, API_BASE_URL } from "./api";

export function getSMHSummary() {
  return apiRequest("/smh/dashboard/summary/");
}

export function getClientDashboard(clientId) {
  const q = clientId ? `?client_id=${clientId}` : '';
  return apiRequest(`/client/dashboard/${q}`);
}

export function getClientAnalytics(clientId, period = 30) {
  const params = new URLSearchParams();
  if (clientId) params.set('client_id', clientId);
  params.set('period', period);
  return apiRequest(`/client/analytics/?${params.toString()}`);
}

export function getSMHAnalytics(period = 30) {
  return apiRequest(`/smh/analytics/?period=${period}`);
}

export function getSMHClients() {
  return apiRequest("/smh/clients/");
}

export function generateAICaptions(data) {
  return apiRequest('/smh/ai/generate/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function saveAIDraft(data) {
  return apiRequest('/smh/ai/save-draft/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getAIHistory() {
  return apiRequest('/smh/ai/history/');
}

export function getSMHProfile(userId) {
  return apiRequest(`/smh/profile/?user_id=${userId}`);
}

export function updateSMHProfile(data) {
  return apiRequest('/smh/profile/update/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getClientProfile(clientId) {
  const q = clientId ? `?client_id=${clientId}` : '';
  return apiRequest(`/client/profile/${q}`);
}

export async function updateClientProfile(clientId, formData) {
  if (clientId) formData.append('client_id', clientId);
  const url = `${API_BASE_URL}/client/profile/`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const message = payload?.error || payload?.message || response.statusText || 'Profile update failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export function saveClientPreferences(clientId, prefs) {
  return apiRequest('/client/preferences/', {
    method: 'POST',
    body: JSON.stringify({ client_id: clientId, ...prefs }),
  });
}

export function changeClientPassword(clientId, data) {
  return apiRequest('/client/change-password/', {
    method: 'POST',
    body: JSON.stringify({ client_id: clientId, ...data }),
  });
}

export function getClientNotifications(clientId) {
  const q = clientId ? `?client_id=${clientId}` : '';
  return apiRequest(`/client/notifications/${q}`);
}

export function markClientNotificationRead(clientId, { notification_id, read_all = false } = {}) {
  return apiRequest('/client/notifications/', {
    method: 'POST',
    body: JSON.stringify({ client_id: clientId, notification_id, read_all }),
  });
}

export function disconnectClientPlatform(clientId, platform) {
  return apiRequest('/client/platforms/disconnect/', {
    method: 'POST',
    body: JSON.stringify({ client_id: clientId, platform }),
  });
}

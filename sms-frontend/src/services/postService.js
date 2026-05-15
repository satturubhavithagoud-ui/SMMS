import { apiRequest, API_BASE_URL } from './api';

export async function getPosts(clientId) {
  const path = clientId ? `/posts/?client_id=${clientId}` : '/posts/';
  return apiRequest(path);
}

export async function createPost(formData, clientId) {
  const url = `${API_BASE_URL}/posts/${clientId ? `?client_id=${clientId}` : ''}`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = payload?.error || payload?.message || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

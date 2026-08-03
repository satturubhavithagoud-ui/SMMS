import { apiRequest, API_BASE_URL } from './api';

export async function getPosts(clientId) {
  const path = clientId ? `/posts/?client_id=${clientId}` : '/posts/';
  return apiRequest(path);
}

export async function getSMHContentQueue(status, platform) {
  let path = '/smh/content-queue/';
  const params = [];
  if (status) params.push(`status=${encodeURIComponent(status)}`);
  if (platform) params.push(`platform=${encodeURIComponent(platform)}`);
  if (params.length > 0) {
    path += `?${params.join('&')}`;
  }
  return apiRequest(path);
}

export async function createPost(formData, clientId) {
  const url = `${API_BASE_URL}/posts/${clientId ? `?client_id=${clientId}` : ''}`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
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
export async function getSMHPostDetail(postId) {
  return apiRequest(`/posts/${postId}/`);
}

export async function deletePost(postId) {
  const url = `${API_BASE_URL}/posts/${postId}/`;
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const message = payload?.error || payload?.message || response.statusText || 'Delete request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function publishPost(postId) {
  const url = `${API_BASE_URL}/posts/${postId}/publish/`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
  });
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const message = payload?.error || payload?.message || response.statusText || 'Publish request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function retryPost(postId) {
  const url = `${API_BASE_URL}/posts/${postId}/retry/`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
  });
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const message = payload?.error || payload?.message || response.statusText || 'Retry request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function editPost(postId, formData) {
  const url = `${API_BASE_URL}/posts/${postId}/edit/`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const message = payload?.error || payload?.message || response.statusText || 'Edit request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

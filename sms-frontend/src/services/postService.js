import { apiRequest, API_BASE_URL } from './api';

export async function getPosts(clientId) {
  const path = clientId ? `/posts/?client_id=${clientId}` : '/posts/';
  return apiRequest(path);
}

export async function createPost(formData, clientId) {
  const url = `${API_BASE_URL}/posts/${clientId ? `?client_id=${clientId}` : ''}`;
  console.log("createPost URL:", url);
  console.log("createPost formData size:", new Blob(Array.from(formData.values())).size);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    console.log("createPost response status:", response.status);
    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      const message = payload?.error || payload?.message || response.statusText || 'Request failed';
      console.error("createPost failed:", message, payload);
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    console.log("createPost success:", payload);
    if (payload?.publish_results) {
      console.log("publish_results:", payload.publish_results);
    }
    return payload;
  } catch (error) {
    console.error("createPost error:", error.message, error);
    throw error;
  }
}

export async function updatePost(postId, data) {
  return await apiRequest(`/posts/${postId}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePost(postId) {
  return await apiRequest(`/posts/${postId}/`, {
    method: 'DELETE',
  });
}

import { apiRequest } from "./api";

// Login
export async function login({ email, password }) {
  return await apiRequest("/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Signup
export async function signup({ fullname, email, password, platforms }) {
  return await apiRequest("/signup/", {
    method: "POST",
    body: JSON.stringify({ fullname, email, password, platforms }),
  });
}

// Logout
export async function logout() {
  return await apiRequest("/logout/", {
    method: "POST",
  });
}

// Get available platforms for the current user
export async function getPlatforms() {
  return await apiRequest("/platforms/");
}

// Get connected platforms for the current client
export async function getConnectedPlatforms(clientId) {
  const suffix = clientId ? `?client_id=${clientId}` : '';
  return await apiRequest(`/connected-platforms/${suffix}`);
}

// Initiate OAuth flow for a platform
export async function initiateOAuth({ platform, client_id }) {
  return await apiRequest("/oauth/initiate/", {
    method: "POST",
    body: JSON.stringify({ platform, client_id }),
  });
}

// Handle OAuth callback (exchange code for token)
export async function handleOAuthCallback({ code, state }) {
  return await apiRequest("/oauth/callback/", {
    method: "POST",
    body: JSON.stringify({ code, state }),
  });
}

// Generate Hashtags + Description
export async function generateHashtags({ prompt, platform = "instagram", tone = "professional" }) {
  return await apiRequest("/generate-hashtags/", {
    method: "POST",
    body: JSON.stringify({ prompt, platform, tone }),
  });
}

// Get client profile
export async function getClientProfile(clientId) {
  const suffix = clientId ? `?client_id=${clientId}` : '';
  return await apiRequest(`/client-profile/${suffix}`);
}

// Update client profile (supports file upload via FormData)
export async function updateClientProfile(clientId, formData) {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
  const suffix = clientId ? `?client_id=${clientId}` : '';
  const url = `${API_BASE_URL}/client-profile/${suffix}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const payload = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = payload?.error || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

// Disconnect a platform
export async function disconnectPlatform({ platform, client_id }) {
  return await apiRequest("/disconnect-platform/", {
    method: "POST",
    body: JSON.stringify({ platform, client_id }),
  });
}

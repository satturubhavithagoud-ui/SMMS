import { apiRequest } from "./api";

export function signup(data) {
  return apiRequest("/signup/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data) {
  return apiRequest("/login/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getPlatforms() {
  return apiRequest("/platforms/");
}

export function getConnectedPlatforms() {
  return apiRequest("/connected-platforms/");
}

export function connectPlatforms(data) {
  return apiRequest("/connected-platforms/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function initiateOAuth(data) {
  return apiRequest("/oauth/initiate/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Change this function to POST the code to Django
export function handleOAuthCallback(params) {
  return apiRequest('/oauth/callback/', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

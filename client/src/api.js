const API_BASE_URL = window.ASA_API_BASE || `${window.location.origin}/api`;

export async function apiRequest(endpoint, method = "GET", body = null, token = null) {
  const options = {
    method,
    headers: {}
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

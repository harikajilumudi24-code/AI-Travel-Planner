const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('voyage_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('voyage_token', token);
  else localStorage.removeItem('voyage_token');
}

export function getApiKey() {
  return localStorage.getItem('voyage_api_key');
}

async function request(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (auth) {
    const token = getToken();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('Unable to reach the server. Please check your connection and try again.');
  }
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = { detail: text }; }
  }
  if (!res.ok) {
    let message = data?.detail || data?.message;
    if (!message) {
      if (path.startsWith('/api/places') || path.startsWith('/api/restaurants')) {
        message = `Geoapify request failed (${res.status})`;
      } else if (path.startsWith('/api/weather')) {
        message = `Weather service unavailable (${res.status})`;
      } else if (path.startsWith('/api/ai')) {
        message = `AI service unavailable (${res.status})`;
      } else {
        message = `Request failed (${res.status})`;
      }
    }
    throw new Error(message);
  }
  return data;
}

function buildQueryString(params) {
  if (!params) return '';
  const clean = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== 'All') {
      clean[k] = v;
    }
  }
  return new URLSearchParams(clean).toString();
}

export const api = {
  // ---- Auth ----
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/api/auth/me'),

  // ---- Trips ----
  listTrips: () => request('/api/trips'),
  createTrip: (payload) => request('/api/trips', { method: 'POST', body: payload }),
  getTrip: (id) => request(`/api/trips/${id}`),
  updateTrip: (id, payload) => request(`/api/trips/${id}`, { method: 'PUT', body: payload }),
  deleteTrip: (id) => request(`/api/trips/${id}`, { method: 'DELETE' }),
  regenerateItinerary: (id) => request(`/api/trips/${id}/regenerate`, { method: 'POST' }),

  // ---- AI ----
  chat: (payload) => request('/api/ai/chat', { method: 'POST', body: payload }),
  extractIntent: (payload) => request('/api/ai/extract-intent', { method: 'POST', body: payload }),
  planTrip: (payload) => request('/api/ai/plan-trip', { method: 'POST', body: payload }),
  listConversations: () => request('/api/ai/conversations'),
  getConversation: (id) => request(`/api/ai/conversations/${id}`),
  renameConversation: (id, title) => request(`/api/ai/conversations/${id}`, { method: 'PUT', body: { title } }),
  deleteConversation: (id) => request(`/api/ai/conversations/${id}`, { method: 'DELETE' }),

  // ---- Places ----
  searchPlaces: (params) => request(`/api/places?${buildQueryString(params)}`),
  getPlace: (id) => request(`/api/places/${id}`),

  // ---- Restaurants ----
  searchRestaurants: (params) => request(`/api/restaurants?${buildQueryString(params)}`),

  // ---- Weather ----
  getWeather: (params) => request(`/api/weather?${buildQueryString(params)}`),

  // ---- Search (geocoding) ----
  search: (q) => request(`/api/search?q=${encodeURIComponent(q || '')}`),

  // ---- Saved places ----
  listSavedPlaces: () => request('/api/saved-places'),
  savePlace: (payload) => request('/api/saved-places', { method: 'POST', body: payload }),
  deleteSavedPlace: (id) => request(`/api/saved-places/${id}`, { method: 'DELETE' }),

  // ---- Saved restaurants ----
  listSavedRestaurants: () => request('/api/saved-restaurants'),
  saveRestaurant: (payload) => request('/api/saved-restaurants', { method: 'POST', body: payload }),
  deleteSavedRestaurant: (id) => request(`/api/saved-restaurants/${id}`, { method: 'DELETE' }),
};

export default api;

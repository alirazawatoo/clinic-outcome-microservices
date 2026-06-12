const API_BASE = 'http://localhost:4000';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getClinics: () => request('/api/auth/clinics'),

  verifyToken: () => request('/api/auth/verify'),

  getOutcomes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/outcomes${query ? `?${query}` : ''}`);
  },

  createOutcome: (outcomeData) =>
    request('/api/outcomes', {
      method: 'POST',
      body: JSON.stringify(outcomeData),
    }),

  getStats: () => request('/api/outcomes/stats'),
};

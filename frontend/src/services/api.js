import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('astrocare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle 401s gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Token expired or invalid
      localStorage.removeItem('astrocare_token');
      localStorage.removeItem('astrocare_user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getAuditLogs: (limit = 50) => api.get(`/auth/audit-logs?limit=${limit}`),
};

export const astronautsApi = {
  getAll: () => api.get('/astronauts'),
  getById: (id) => api.get(`/astronauts/${id}`),
};

export const healthApi = {
  getLatest: (astronautId) => api.get(`/health/records/${astronautId}/latest`),
  getHistory: (astronautId, limit = 50) => api.get(`/health/records/${astronautId}?limit=${limit}`),
  getTrends: (astronautId, limit = 100) => api.get(`/health/records/${astronautId}/trends?limit=${limit}`),
  submitRecord: (payload) => api.post('/health/records', payload),
  deleteRecord: (id) => api.delete(`/health/records/${id}`),
};

export const radiationApi = {
  getSummary: (astronautId, limit = 50) => api.get(`/radiation/${astronautId}?limit=${limit}`),
  submitReading: (payload) => api.post('/radiation/readings', payload),
};

export const environmentApi = {
  getLatest: () => api.get('/environment/latest'),
  getHistory: (limit = 50) => api.get(`/environment/history?limit=${limit}`),
  submitReading: (payload) => api.post('/environment/readings', payload),
};

export const wellnessApi = {
  getLatest: (astronautId) => api.get(`/wellness/checkins/${astronautId}/latest`),
  getHistory: (astronautId, limit = 30) => api.get(`/wellness/checkins/${astronautId}?limit=${limit}`),
  getTrends: (astronautId) => api.get(`/wellness/checkins/${astronautId}/trends`),
  submitCheckin: (payload) => api.post('/wellness/checkins', payload),
};

export const insightsApi = {
  getSummary: (astronautId) => api.get(`/insights/summary/${astronautId}`),
  getAlerts: (limit = 50) => api.get(`/insights/alerts?limit=${limit}`),
  acknowledgeAlert: (alertId, reviewerName = 'Flight Surgeon') =>
    api.patch(`/insights/alerts/${alertId}/review?reviewer_name=${encodeURIComponent(reviewerName)}`),
};

export const reportsApi = {
  getAll: (limit = 50) => api.get(`/reports/?limit=${limit}`),
  generate: (payload) => api.post('/reports/generate', payload),
  downloadPdf: (reportId) => api.get(`/reports/${reportId}/download`, { responseType: 'blob' }),
};

export const nasaApi = {
  getDatasets: (category, search) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return api.get(`/nasa/datasets?${params.toString()}`);
  },
  searchLive: (query) => api.get(`/nasa/search?query=${encodeURIComponent(query)}`),
};

export const demoApi = {
  getStatus: () => api.get('/demo/status'),
  start: (astronautId = 'AST-001') => api.post(`/demo/start?astronaut_id=${astronautId}`),
  setStep: (stepNumber) => api.post(`/demo/step/${stepNumber}`),
  pause: () => api.post('/demo/pause'),
  resume: () => api.post('/demo/resume'),
  reset: () => api.post('/demo/reset'),
  triggerAbnormal: (astronautId = 'AST-001', scenario = 'cardiovascular_tachycardia') =>
    api.post(`/demo/trigger-abnormal?astronaut_id=${astronautId}&scenario=${scenario}`),
};

export const emergencyApi = {
  getProtocols: () => api.get('/emergency/protocols'),
  getActiveAlerts: (limit = 50) => api.get(`/emergency/alerts/active?limit=${limit}`),
  getAstronautIncidents: (astronautId, limit = 50) =>
    api.get(`/emergency/incidents/${astronautId}?limit=${limit}`),
  detect: (astronautId) => api.post(`/emergency/detect/${astronautId}`),
  acknowledge: (alertId, reviewerName = 'Flight Surgeon', reviewerRole = 'Flight Surgeon') =>
    api.post(`/emergency/alerts/${alertId}/acknowledge`, { reviewer_name: reviewerName, reviewer_role: reviewerRole }),
  assign: (alertId, officerName, officerRole = 'Flight Surgeon', assignedBy = 'Mission Commander') =>
    api.post(`/emergency/alerts/${alertId}/assign`, {
      officer_name: officerName,
      officer_role: officerRole,
      assigned_by: assignedBy,
    }),
  updateChecklistStep: (alertId, stepId, completed = true, userName = 'Flight Surgeon') =>
    api.post(`/emergency/alerts/${alertId}/checklist-step`, {
      step_id: stepId,
      completed,
      user_name: userName,
    }),
  recordAction: (alertId, actionType, notes, actorName = 'Flight Surgeon', actorRole = 'Flight Surgeon') =>
    api.post(`/emergency/alerts/${alertId}/action`, {
      action_type: actionType,
      notes,
      actor_name: actorName,
      actor_role: actorRole,
    }),
  escalate: (alertId, escalatedBy = 'Medical Officer', escalationReason = 'Clinical threshold exceeded') =>
    api.post(`/emergency/alerts/${alertId}/escalate`, {
      escalated_by: escalatedBy,
      escalation_reason: escalationReason,
    }),
  resolve: (alertId, resolvedBy = 'Flight Surgeon', resolutionNotes = 'Incident resolved nominally') =>
    api.post(`/emergency/alerts/${alertId}/resolve`, {
      resolved_by: resolvedBy,
      resolution_notes: resolutionNotes,
    }),
  simulateScenario: (astronautId = 'AST-001', scenario = 'cardiac_tachycardia') =>
    api.post('/emergency/simulate-scenario', { astronaut_id: astronautId, scenario }),
};

export const astroAiApi = {
  getQuestions: () => api.get('/astro-ai/questions'),
  query: (payload) => api.post('/astro-ai/query', payload),
  analyzeOrgan: (astronautId = 'AST-001', organ = 'heart') =>
    api.post(`/astro-ai/analyze-organ/${astronautId}/${organ}`),
};

export default api;

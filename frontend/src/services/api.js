import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const PREFIX = '/api/v1';

export const apiClient = axios.create({
  baseURL: `${API_BASE}${PREFIX}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor to normalize error handling
apiClient.interceptors.response.use(
  (response) => {
    // Backend standard: { success: true, data: ..., message: ..., meta: ... }
    return response.data;
  },
  (error) => {
    const errorData = error.response?.data?.error;
    let message = errorData?.message || error.message || 'An unexpected error occurred';
    
    // If validation details exist, append or attach them
    if (errorData?.details && Array.isArray(errorData.details)) {
      const detailsMsg = errorData.details.map((d) => `${d.field}: ${d.message}`).join(', ');
      message = `${message} (${detailsMsg})`;
    }

    const customError = new Error(message);
    customError.code = errorData?.code || 'NETWORK_ERROR';
    customError.status = error.response?.status;
    customError.details = errorData?.details;
    customError.raw = error;
    return Promise.reject(customError);
  }
);

export const api = {
  // Auth
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),

  // Metadata
  getCategories: () => apiClient.get('/meta/categories'),

  // Citizen Incidents
  createIncident: (payload) => apiClient.post('/incidents', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyIncidents: (params) => apiClient.get('/incidents/mine', { params }),
  getIncident: (incidentId) => apiClient.get(`/incidents/${incidentId}`),
  getIncidentHistory: (incidentId) => apiClient.get(`/incidents/${incidentId}/history`),
  getCitizenAssignments: (incidentId) => apiClient.get(`/incidents/${incidentId}/assignments`),

  // SOS
  createSos: (payload = {}) => apiClient.post('/sos', payload),
  updateSosDetails: (incidentId, details) => apiClient.patch(`/sos/${incidentId}/details`, details),

  // Geo backend proxy
  searchGeo: (text) => apiClient.get('/geo/search', { params: { text } }),
  reverseGeo: (lat, lon) => apiClient.get('/geo/reverse', { params: { lat, lon } }),

  // Admin Incidents & Dashboard
  getDashboardSummary: (params) => apiClient.get('/admin/dashboard/summary', { params }),
  getOperationsSummary: () => apiClient.get('/admin/operations/summary'),
  getAdminIncidents: (params) => apiClient.get('/admin/incidents', { params }),
  getAdminIncident: (incidentId) => apiClient.get(`/admin/incidents/${incidentId}`),
  updateIncidentStatus: (incidentId, payload) => apiClient.patch(`/admin/incidents/${incidentId}/status`, payload),
  updateIncidentSeverity: (incidentId, payload) => apiClient.patch(`/admin/incidents/${incidentId}/severity`, payload),
  updateAdminIncident: (incidentId, payload) => apiClient.patch(`/admin/incidents/${incidentId}`, payload),
  archiveIncident: (incidentId, reason = '') => apiClient.delete(`/admin/incidents/${incidentId}`, { data: { reason } }),
  restoreIncident: (incidentId) => apiClient.post(`/admin/incidents/${incidentId}/restore`),

  // Admin AI Review & Queue
  getAiReviewQueue: () => apiClient.get('/admin/ai/review-queue'),
  getAiAssessment: (incidentId) => apiClient.get(`/admin/incidents/${incidentId}/ai-assessment`),
  retryAiAssessment: (incidentId) => apiClient.post(`/admin/incidents/${incidentId}/ai-assessment/retry`),

  // Admin Duplicate Management
  getDuplicateSuggestions: (incidentId) => apiClient.get(`/admin/incidents/${incidentId}/duplicate-suggestions`),
  refreshDuplicateSuggestions: (incidentId) => apiClient.post(`/admin/incidents/${incidentId}/duplicate-suggestions/refresh`),
  confirmDuplicate: (suggestionId, primaryIncidentId) => 
    apiClient.post(`/admin/duplicate-suggestions/${suggestionId}/confirm`, primaryIncidentId ? { primaryIncidentId } : {}),
  dismissDuplicate: (suggestionId) => apiClient.post(`/admin/duplicate-suggestions/${suggestionId}/dismiss`),

  // Admin Map & Hotspots
  getMapIncidents: (bbox, params = {}) => apiClient.get('/admin/map/incidents', { params: { ...bbox, ...params } }),
  getHotspots: (params = {}) => apiClient.get('/admin/hotspots', { params }),
  // Response teams
  getTeams: () => apiClient.get('/admin/teams'),
  getTeamLocations: () => apiClient.get('/admin/teams/locations'),
  createTeam: (payload) => apiClient.post('/admin/teams', payload),
  getTeamRecommendations: (incidentId) => apiClient.get(`/admin/incidents/${incidentId}/team-recommendations`),
  getIncidentAssignments: (incidentId) => apiClient.get(`/admin/incidents/${incidentId}/assignments`),
  assignTeams: (incidentId, teamIds) => apiClient.post(`/admin/incidents/${incidentId}/assignments`, { teamIds }),
  getTeamMe: () => apiClient.get('/team/me'),
  setTeamAvailability: (isOnDuty) => apiClient.patch('/team/availability', { isOnDuty }),
  updateTeamLocation: (coordinates, accuracyMeters) => apiClient.post('/team/location', { coordinates, accuracyMeters }),
  getTeamAssignments: () => apiClient.get('/team/assignments'),
  updateAssignmentStatus: (assignmentId, status) => apiClient.patch(`/team/assignments/${assignmentId}/status`, { status }),
  changeTeamPassword: (password) => apiClient.post('/team/change-password', { password }),
};

export default api;

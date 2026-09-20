const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('trusthire_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('trusthire_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('trusthire_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (userData: any) => request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => request<any>('/auth/me'),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: any) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),

  // Dashboard
  getDashboardStats: () => request<any>('/dashboard/stats'),
  getActivities: () => request<any>('/dashboard/activities'),
  getRecentCandidates: () => request<any>('/dashboard/recent-candidates'),

  // Jobs
  getJobs: () => request<{ jobs: any[] }>('/jobs'),
  getJob: (id: string) => request<{ job: any }>(`/jobs/${id}`),
  createJob: (jobData: any) => request<{ message: string; job: any }>('/jobs', { method: 'POST', body: JSON.stringify(jobData) }),
  updateJob: (id: string, jobData: any) => request<{ message: string; job: any }>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(jobData) }),
  deleteJob: (id: string) => request<any>(`/jobs/${id}`, { method: 'DELETE' }),
  parseJDWithAI: (text: string) => request<{ extracted: any }>('/jobs/parse-jd', { method: 'POST', body: JSON.stringify({ text }) }),

  // Resumes
  uploadResumes: (payload: { jobId: string; files: any[] }) =>
    request<{ message: string; resumes: any[] }>('/resumes/upload', { method: 'POST', body: JSON.stringify(payload) }),
  getResumes: () => request<{ resumes: any[] }>('/resumes'),
  getResume: (id: string) => request<{ resume: any }>(`/resumes/${id}`),
  deleteResume: (id: string) => request<any>(`/resumes/${id}`, { method: 'DELETE' }),

  // Screening
  screenResume: (resumeId: string) => request<any>('/screening/analyze', { method: 'POST', body: JSON.stringify({ resumeId }) }),
  getScreenings: () => request<{ screenings: any[] }>('/screening'),
  getScreeningByCandidate: (candidateId: string) => request<any>(`/screening/${candidateId}`),
  retryScreening: (screeningId: string) => request<any>(`/screening/${screeningId}/retry`, { method: 'POST' }),
  saveScreeningNotes: (screeningId: string, notes: string) =>
    request<any>(`/screening/${screeningId}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }),

  // Matching
  getJobMatches: (jobId: string) => request<{ job: any; candidates: any[] }>(`/matching/job/${jobId}`),
  toggleShortlist: (candidateId: string) => request<any>(`/candidates/${candidateId}/toggle-shortlist`, { method: 'POST' }),

  // Certificates
  uploadCertificate: (certData: any) => request<any>('/certificates/upload', { method: 'POST', body: JSON.stringify(certData) }),
  getCertificates: () => request<{ certificates: any[] }>('/certificates'),
  getCertificateById: (id: string) => request<any>(`/certificates/${id}`),
  verifyCertificate: (id: string, data: { status: string; evidence?: string; reviewerNotes?: string }) =>
    request<any>(`/certificates/${id}/verify`, { method: 'PUT', body: JSON.stringify(data) }),

  // Candidates
  getCandidates: () => request<{ candidates: any[] }>('/candidates'),
  getCandidateProfile: (id: string) => request<any>(`/candidates/${id}`),
  addCandidateNote: (id: string, content: string) =>
    request<any>(`/candidates/${id}/notes`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteCandidateNote: (id: string, noteId: string) => request<any>(`/candidates/${id}/notes/${noteId}`, { method: 'DELETE' }),

  // Reports
  getReports: () => request<{ reports: any[] }>('/reports'),
  getAnalytics: () => request<any>('/reports'),
  generateReport: (payload: { reportType: string; candidateId?: string; jobId?: string }) =>
    request<{ message: string; report: any }>('/reports/generate', { method: 'POST', body: JSON.stringify(payload) }),
  generateAISummary: (payload: any) =>
    request<any>('/reports/generate', { method: 'POST', body: JSON.stringify({ reportType: 'Executive Summary', ...payload }) }),
  getReportById: (id: string) => request<{ report: any }>(`/reports/${id}`),

  // Search
  searchCandidates: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<{ total: number; candidates: any[] }>(`/search?${query}`);
  },

  // AI Assistant
  chatAI: (message: string, conversationId?: string) =>
    request<{ conversationId: string; response: string; timestamp: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    }),
  getConversations: () => request<{ conversations: any[] }>('/ai/conversations'),
  deleteConversation: (id: string) => request<any>(`/ai/conversations/${id}`, { method: 'DELETE' }),

  // Support
  getSupportTickets: () => request<{ tickets: any[] }>('/support/tickets'),
  getSupportTicket: (id: string) => request<{ ticket: any }>(`/support/tickets/${id}`),
  createSupportTicket: (ticketData: any) =>
    request<{ message: string; ticket: any }>('/support/tickets', { method: 'POST', body: JSON.stringify(ticketData) }),
  submitSupportTicket: (ticketData: any) =>
    request<{ message: string; ticket: any }>('/support/tickets', { method: 'POST', body: JSON.stringify(ticketData) }),
  replySupportTicket: (id: string, message: string) =>
    request<any>(`/support/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getAdminUsers: () => request<{ users: any[] }>('/admin/users'),
  createAdminUser: (userData: any) =>
    request<{ message: string; user: any }>('/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUserStatus: (id: string, status: 'Active' | 'Disabled' | string) =>
    request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateAdminUserStatus: (id: string, status: string) =>
    request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminSettings: () => request<{ settings: any }>('/admin/settings'),
  saveAdminSettings: (settings: any) =>
    request<{ message: string; settings: any }>('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  getSystemHealth: () => request<{ health: any }>('/admin/health'),
  getAdminCandidates: () => request<{ candidates: any[] }>('/admin/candidates'),
  getAdminJobs: () => request<{ jobs: any[] }>('/admin/jobs'),
  getAdminCertificates: () => request<{ certificates: any[] }>('/admin/certificates'),
  getAdminTickets: () => request<{ tickets: any[] }>('/admin/support-tickets'),
  updateAdminTicket: (id: string, updates: any) =>
    request<any>(`/admin/support-tickets/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  getAdminLogs: () => request<{ logs: any[] }>('/admin/logs'),

  // Notifications
  getNotifications: () => request<{ notifications: any[] }>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),
};

import axios from 'axios';

// Get API URL from env, fallback to localhost:8000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration/401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't clear tokens or redirect for login/register attempts — let the form handle the error
      const requestUrl = error.config?.url || '';
      const isAuthAttempt = requestUrl.includes('/login') || requestUrl.includes('/register');
      if (!isAuthAttempt) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/' && !window.location.search.includes('verified')) {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

// AUTH ENDPOINTS
export const login = async (email, password) => {
  const response = await api.post('/api/auth/login/', { email, password });
  if (response.data.access) {
    localStorage.setItem('token', response.data.access);
    localStorage.setItem('refreshToken', response.data.refresh);
  }
  return response.data;
};

export const register = async (firstName, lastName, email, password, confirmPassword, role) => {
  const response = await api.post('/api/auth/register/', {
    first_name: firstName,
    last_name: lastName,
    email,
    password,
    confirm_password: confirmPassword,
    role,
  });
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await api.post(`/api/auth/verify-email/${token}/`);
  return response.data;
};

export const googleLogin = async (credential, role, mockRole = null) => {
  let url = `/api/auth/social/google/?role=${role}`;
  if (credential) {
    url += `&credential=${credential}`;
  } else if (mockRole) {
    url += `&mock_role=${mockRole}`;
  }
  
  const response = await api.get(url);
  if (response.data.access) {
    localStorage.setItem('token', response.data.access);
    localStorage.setItem('refreshToken', response.data.refresh);
  }
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/api/auth/profile/');
  return response.data;
};

// PROFILE UPDATES
export const updateStudentProfile = async (profileData) => {
  const response = await api.put('/api/auth/profile/student/update/', profileData);
  return response.data;
};

export const updateMentorProfile = async (profileData) => {
  const response = await api.put('/api/auth/profile/mentor/update/', profileData);
  return response.data;
};

// ROADMAP ENDPOINTS
export const generateRoadmap = async () => {
  const response = await api.post('/api/roadmaps/generate/');
  return response.data;
};

export const getRoadmap = async () => {
  const response = await api.get('/api/roadmaps/');
  return response.data;
};

export const completeMilestone = async (milestoneId) => {
  const response = await api.post(`/api/roadmaps/milestone/${milestoneId}/complete/`);
  return response.data;
};

export const regenerateRoadmap = async () => {
  const response = await api.delete('/api/roadmaps/regenerate/');
  return response.data;
};

// MENTOR ENDPOINTS
export const getMentors = async () => {
  const response = await api.get('/api/mentors/');
  return response.data;
};

export const getMentor = async (mentorId) => {
  const response = await api.get(`/api/mentors/${mentorId}/`);
  return response.data;
};

export const bookSession = async (mentorId, scheduledDate, topic, description) => {
  const response = await api.post('/api/mentors/book-session/', {
    mentor: mentorId,
    scheduled_date: scheduledDate,
    topic,
    description,
  });
  return response.data;
};

export const getSessions = async () => {
  const response = await api.get('/api/mentors/sessions/');
  return response.data;
};

export const confirmSession = async (sessionId) => {
  const response = await api.patch(`/api/mentors/sessions/${sessionId}/confirm/`);
  return response.data;
};

export const cancelSession = async (sessionId) => {
  const response = await api.patch(`/api/mentors/sessions/${sessionId}/cancel/`);
  return response.data;
};

export const completeSession = async (sessionId) => {
  const response = await api.patch(`/api/mentors/sessions/${sessionId}/complete/`);
  return response.data;
};

// ADMIN ENDPOINTS
export const adminGetUsers = async () => {
  const response = await api.get('/api/admin/users/');
  return response.data;
};

export const adminVerifyMentor = async (mentorUserId) => {
  const response = await api.patch(`/api/admin/users/${mentorUserId}/verify-mentor/`);
  return response.data;
};

export const adminToggleActive = async (userId) => {
  const response = await api.patch(`/api/admin/users/${userId}/toggle-active/`);
  return response.data;
};

export default api;

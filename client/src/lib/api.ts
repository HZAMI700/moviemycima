import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

export default api;

export const moviesAPI = {
  getMovies: (params?: any) => api.get('/movies', { params }),
  getMovie: (id: string) => api.get(`/movies/${id}`),
  getMovieBySlug: (slug: string) => api.get(`/movies/slug/${slug}`),
  getFeatured: () => api.get('/movies/featured'),
  getTrending: () => api.get('/movies/trending'),
  getLatest: () => api.get('/movies/latest'),
  search: (params: any) => api.get('/movies/search', { params }),
  getRelated: (id: string) => api.get(`/movies/${id}/related`),
};

export const seriesAPI = {
  getSeries: (params?: any) => api.get('/series', { params }),
  getSeriesBySlug: (slug: string) => api.get(`/series/slug/${slug}`),
  getLatest: () => api.get('/series/latest'),
  getTrending: () => api.get('/series/trending'),
  getEpisodes: (id: string) => api.get(`/series/${id}/episodes`),
  getEpisode: (id: string, epId: string) => api.get(`/series/${id}/episodes/${epId}`),
};

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data),
};

export const genresAPI = {
  getAll: () => api.get('/genres'),
  getBySlug: (slug: string) => api.get(`/genres/slug/${slug}`),
};

export const actorsAPI = {
  getAll: () => api.get('/actors'),
  getBySlug: (slug: string) => api.get(`/actors/slug/${slug}`),
  getContent: (id: string) => api.get(`/actors/${id}/content`),
};

export const commentsAPI = {
  get: (params: any) => api.get('/comments', { params }),
  create: (data: any) => api.post('/comments', data),
  delete: (id: string) => api.delete(`/comments/${id}`),
  like: (id: string) => api.post(`/comments/${id}/like`),
};

export const bookmarksAPI = {
  getAll: () => api.get('/auth/bookmarks'),
  add: (data: any) => api.post('/auth/bookmarks', data),
  remove: (data: any) => api.delete('/auth/bookmarks', { data }),
};

export const historyAPI = {
  get: () => api.get('/auth/history'),
  update: (data: any) => api.post('/auth/history', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
};

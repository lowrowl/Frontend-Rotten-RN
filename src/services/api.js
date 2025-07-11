import axios from 'axios';
import config from '../config';

const API_URL = config.apiUrl;

const api = {
  // ─── TMDB ────────────────────────────────
  getPopularMovies: () => axios.get(`${API_URL}/tmdb/popular`),

  searchMovies: (query) =>
    axios.get(`${API_URL}/tmdb/search?query=${encodeURIComponent(query)}`),

  saveMovieFromTmdb: (tmdbId) =>
    axios.post(`${API_URL}/movies/from-tmdb/${tmdbId}`),

  getMovieByTmdbId: (tmdbId) =>
    axios.get(`${API_URL}/movies/tmdb/${tmdbId}`),

  // ─── Comentarios ─────────────────────────
  getCommentsByMovie: (movieId) =>
    axios.get(`${API_URL}/comments/movie/${movieId}`),

  createComment: (data, token) =>
    axios.post(`${API_URL}/comments`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // ─── Auth ────────────────────────────────
  register: (user) =>
    axios.post(`${API_URL}/users/register`, user),

  login: (credentials) =>
    axios.post(`${API_URL}/users/login`, credentials),

  // ─── Perfil ──────────────────────────────
  getUserInfo: (token) =>
    axios.get(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  updateProfile: (data, token) =>
    axios.patch(`${API_URL}/users/profile`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // ─── Listas del usuario ──────────────────
  getUserWatchlist: (token) =>
    axios.get(`${API_URL}/users/watchlist`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getUserSeenlist: (token) =>
    axios.get(`${API_URL}/users/seenlist`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  addToWatchlist: (movieId, token) =>
    axios.post(
      `${API_URL}/users/watchlist`,
      { movieId },
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  removeFromWatchlist: (movieId, token) =>
    axios.post(
      `${API_URL}/users/watchlist/remove`,
      { movieId },
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  addToMyList: (movieId, token) =>
    axios.post(
      `${API_URL}/users/mylist`,
      { movieId },
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  moveToMyList: (movieId, token) =>
    axios.post(
      `${API_URL}/users/watchlist/to-mylist`,
      { movieId },
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  addToSeenlist: (movieId, token) =>
    axios.post(
      `${API_URL}/users/seenlist`,
      { movieId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
};

export default api;

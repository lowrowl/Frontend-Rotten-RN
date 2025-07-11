import axios from 'axios';
import config from '../config';
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = config.apiUrl;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Añadir un interceptor para incluir el token en cada solicitud automáticamente
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const apiService = {
  // ─── TMDB ────────────────────────────────
  getPopularMovies: () => api.get(`/tmdb/popular`),

  searchMovies: (query) =>
    api.get(`/tmdb/search?query=${encodeURIComponent(query)}`),

  saveMovieFromTmdb: (tmdbId) =>
    api.post(`/movies/from-tmdb/${tmdbId}`),

  getMovieByTmdbId: (tmdbId) =>
    api.get(`/movies/tmdb/${tmdbId}`),

  // ─── Comentarios ─────────────────────────
  getCommentsByMovie: (movieId) =>
    api.get(`/comments/movie/${movieId}`),

  createComment: (data) => // Token se añade via interceptor
    api.post(`/comments`, data),

  // ─── Auth ────────────────────────────────
  register: (user) =>
    api.post(`/users/register`, user),

  login: (credentials) =>
    api.post(`/users/login`, credentials),

  // ─── Perfil ──────────────────────────────
  getUserInfo: () => // Token se añade via interceptor
    api.get(`/users/profile`),

  updateProfile: (data) => // Token se añade via interceptor
    api.patch(`/users/profile`, data),

  // ─── Listas del usuario (Watchlist) ──────────────────
  getUserWatchlist: () => // Token se añade via interceptor
    api.get(`/users/watchlist`),

  addToWatchlist: (movieId) => // Token se añade via interceptor
    api.post(
      `/users/watchlist`,
      { movieId }
    ),

  removeFromWatchlist: (movieId) => // Token se añade via interceptor (POST para remover)
    api.post(
      `/users/watchlist/remove`,
      { movieId }
    ),

  // ─── Listas del usuario (Seenlist - Vistas) ──────────────────
  getUserSeenlist: () => // Token se añade via interceptor
    api.get(`/users/seenlist`),

  // **FUNCIÓN CORREGIDA: addToSeenlist**
  // Ahora apunta a /users/mylist, asumiendo que 'mylist' en el backend
  // es equivalente a 'seenlist' en el frontend.
  addToSeenlist: (movieId) => // Token se añade via interceptor
    api.post(
      `/users/mylist`, // **CAMBIO AQUÍ: Usamos /users/mylist que existe en el backend**
      { movieId }
    ),

  // **FUNCIÓN ELIMINADA: removeFromSeenlist**
  // Eliminada porque no hay una ruta correspondiente en tu backend ('user.routes.js').
  // Si necesitas esta funcionalidad, deberás añadirla primero en el backend.

  // ─── Otras Listas (si 'MyList' es diferente de 'Seenlist') ─────
  addToMyList: (movieId) => // Token se añade via interceptor
    api.post(
      `/users/mylist`,
      { movieId }
    ),

  // Esta función es para "mover" una película, posiblemente de watchlist a mylist/seenlist
  // Asegúrate de que el endpoint y la lógica coincidan con tu backend
  moveToMyList: (movieId) => // Token se añade via interceptor
    api.post(
      `/users/watchlist/to-mylist`, // Ruta de ejemplo, ajusta si es diferente en tu backend
      { movieId }
    ),

};

export default apiService;
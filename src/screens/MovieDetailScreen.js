import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

const MovieDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { tmdbId } = route.params;

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [seenlist, setSeenlist] = useState([]);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentScore, setCommentScore] = useState(null);
  const [userComment, setUserComment] = useState(null);
  const [hasUserCommented, setHasUserCommented] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [userRes, movieRes] = await Promise.all([
        api.getUserInfo(token),
        api.getMovieByTmdbId(tmdbId),
      ]);

      setUser(userRes.data);
      setMovie(movieRes.data);

      await loadUserLists(token);
      // Solo carga comentarios si hay una película válida
      if (movieRes.data?._id) {
        await loadComments(movieRes.data._id, userRes.data?._id);
      }
    } catch (err) {
      setError("Error al cargar los datos de la película.");
      console.error("Error en loadData:", err);
      // Considerar redirigir al login si el token es inválido aquí
      if (err.response && err.response.status === 401) {
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserLists = async (token) => {
    try {
      const [wRes, sRes] = await Promise.all([
        api.getUserWatchlist(token),
        api.getUserSeenlist(token),
      ]);
      setWatchlist(wRes.data);
      setSeenlist(sRes.data);
      console.log("loadUserLists: Watchlist cargada:", wRes.data.map(m => m.title));
      console.log("loadUserLists: Seenlist cargada:", sRes.data.map(m => m.title));
    } catch (err) {
      console.error("Error al cargar listas del usuario:", err);
      // Manejar errores de token o red
    }
  };

  const loadComments = async (movieId, userId) => {
    try {
      const res = await api.getCommentsByMovie(movieId);
      const allComments = res.data;

      const found = allComments.find((c) => c.userId._id === userId);
      if (found) {
        setUserComment(found);
        setHasUserCommented(true);
        setComments(allComments.filter((c) => c.userId._id !== userId));
      } else {
        setComments(allComments);
        setHasUserCommented(false);
        setUserComment(null); // Asegúrate de limpiar el comentario del usuario si no hay uno
      }
    } catch (err) {
      console.error("Error al cargar comentarios:", err);
    }
  };

  const isInWatchlist = () => watchlist.some((m) => m._id === movie?._id);
  const isInSeenlist = () => seenlist.some((m) => m._id === movie?._id);

  const submitComment = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token || !movie?._id || !commentText || commentScore === null) {
        Alert.alert("Error", "Por favor, completa tu comentario y puntaje.");
        return;
    }

    try {
      console.log(`Submit comment: MovieId: ${movie._id}, Content: "${commentText}", Rating: ${commentScore}`);
      await api.createComment(
        {
          movieId: movie._id,
          content: commentText,
          rating: commentScore,
        },
        token
      );
      console.log("Comentario enviado con éxito.");

      setCommentText("");
      setCommentScore(null);
      await loadComments(movie._id, user._id);
      await loadUserLists(token);
    } catch (err) {
      Alert.alert("Error", "No se pudo enviar el comentario. " + (err.response?.data?.message || err.message));
      console.error("Error al enviar comentario:", err);
    }
  };

  const toggleWatchlist = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token || !movie?._id) {
        console.warn("toggleWatchlist: Token o Movie ID no disponibles.");
        return;
    }

    if (isInSeenlist()) {
      Alert.alert("Información", "Esta película ya está en tu lista de películas vistas.");
      return;
    }

    try {
      if (isInWatchlist()) {
        console.log(`toggleWatchlist: Eliminando película ID ${movie._id} de watchlist...`);
        const res = await api.removeFromWatchlist(movie._id, token);
        console.log("toggleWatchlist: removeFromWatchlist respuesta:", res.data);
        Alert.alert("Removida de Ver más tarde");
      } else {
        console.log(`toggleWatchlist: Agregando película ID ${movie._id} a watchlist...`);
        const res = await api.addToWatchlist(movie._id, token);
        console.log("toggleWatchlist: addToWatchlist respuesta:", res.data);
        Alert.alert("Agregada a Ver más tarde");
      }
      await loadUserLists(token);
      console.log("toggleWatchlist: Listas de usuario recargadas después de operación.");
    } catch (err) {
      Alert.alert("Error", "No se pudo actualizar la lista de 'Ver más tarde'.");
      console.error("Error al actualizar watchlist:", err?.response?.data || err.message);
    }
  };

  const handleAddToSeenlist = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token || !movie?._id) {
        console.warn("handleAddToSeenlist: Token o Movie ID no disponibles.");
        return;
    }

    try {
      if (isInWatchlist()) {
        console.log(`handleAddToSeenlist: Eliminando película ID ${movie._id} de watchlist antes de mover a seenlist...`);
        const res = await api.removeFromWatchlist(movie._id, token);
        console.log("handleAddToSeenlist: removeFromWatchlist (antes de seenlist) respuesta:", res.data);
      }
      
      console.log(`handleAddToSeenlist: Agregando película ID ${movie._id} a seenlist...`);
      const res = await api.addToSeenlist(movie._id, token);
      console.log("handleAddToSeenlist: addToSeenlist respuesta:", res.data);

      Alert.alert("Éxito", "Película agregada a Mi lista (vistas).");
      await loadUserLists(token);
      console.log("handleAddToSeenlist: Listas de usuario recargadas después de operación.");
    } catch (err) {
      Alert.alert("Error", "No se pudo agregar a Mi lista. " + (err.response?.data?.message || err.message));
      console.error("Error al agregar a Mi lista (vistas):", err?.response?.data || err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {loading && (
        <View style={styles.centerSpinner}>
          <ActivityIndicator size="large" color="#e50914" />
        </View>
      )}

      {!loading && error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {!loading && movie && (
        <View>
          <View style={styles.posterContainer}>
            <Image
              source={{
                uri:
                  movie.posterUrl ||
                  "https://via.placeholder.com/250x375?text=Sin+imagen",
              }}
              style={styles.posterImage}
            />
          </View>

          <Text style={styles.title}>{movie.title}</Text>

          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Fecha de lanzamiento: </Text>
            {movie.releaseDate}
          </Text>

          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Descripción: </Text>
            {movie.description}
          </Text>

          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Géneros: </Text>
            {movie.categories?.join(", ")}
          </Text>

          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Reparto: </Text>
            {movie.cast?.join(", ")}
          </Text>

          <View style={styles.row}>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Usuarios: </Text>
              {movie.averageUserRating ?? "N/A"}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Críticos: </Text>
              {movie.averageCriticRating ?? "N/A"}
            </Text>
          </View>

          {/* Botones de acción */}
          {!isInSeenlist() && !isInWatchlist() && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#333' }]}
                onPress={toggleWatchlist}
              >
                <Text style={styles.buttonText}>
                  Agregar a Ver más tarde
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.greenButton]}
                onPress={handleAddToSeenlist}
              >
                <Text style={styles.buttonText}>
                  Agregar a Mi lista
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Botón para mover de "Ver más tarde" a "Mi lista" */}
          {isInWatchlist() && !isInSeenlist() && (
            <TouchableOpacity
              style={[styles.fullButton, { backgroundColor: '#666' }]}
              onPress={handleAddToSeenlist}
            >
              <Text style={styles.buttonText}>
                Mover a Mi lista (ya vista)
              </Text>
            </TouchableOpacity>
          )}

          {isInSeenlist() && (
            <Text style={styles.mutedText}>
              Ya viste esta película.
            </Text>
          )}

          {/* Tu comentario */}
          {hasUserCommented && userComment && (
            <View style={styles.commentCard}>
              <Text style={styles.commentTitle}>Tu comentario:</Text>
              <Text style={styles.commentUser}>
                {userComment.userId.username} ({userComment.userId.role})
              </Text>
              <Text style={styles.starRating}>
                {"★".repeat(userComment.rating)} ({userComment.rating}/5)
              </Text>
              <Text style={styles.commentText}>{userComment.content}</Text>
            </View>
          )}

          {/* Otros comentarios */}
          {comments.map((c, i) => (
            <View
              key={i}
              style={styles.otherComment}
            >
              <Text style={styles.commentUser}>
                {c.userId.username} ({c.userId.role})
              </Text>
              <Text style={styles.starRating}>
                {"★".repeat(c.rating)} ({c.rating}/5)
              </Text>
              <Text style={styles.commentText}>{c.content}</Text>
            </View>
          ))}

          {/* Formulario de comentario */}
          {!hasUserCommented && (
            <View style={styles.commentForm}>
              <Text style={styles.formLabel}>
                Deja tu comentario:
              </Text>
              <TextInput
                placeholder="Escribe un comentario"
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                style={styles.input}
                multiline
                maxLength={70}
              />

              <Text style={styles.formLabel}>Puntaje:</Text>
              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity key={i} onPress={() => setCommentScore(i)}>
                    <Text
                      style={[
                        styles.star,
                        i <= (commentScore || 0) && styles.starFilled,
                      ]}
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
                {commentScore > 0 && (
                  <Text style={styles.scoreText}>
                    ({commentScore}/5)
                  </Text>
                )}
              </View>

              <TouchableOpacity
                disabled={
                  !commentText.trim() || commentScore === null || commentScore === 0
                }
                onPress={submitComment}
                style={[
                  styles.publishBtn,
                  (!commentText.trim() || commentScore === null || commentScore === 0) && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.buttonText}>
                  Publicar comentario
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181818',
    padding: 16,
    flex: 1
  },
  centerSpinner: {
    alignItems: 'center',
    marginTop: 20
  },
  errorText: {
    color: '#fff',
    textAlign: 'center'
  },
  posterContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  posterImage: {
    width: 250,
    height: 375,
    borderRadius: 12
  },
  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 6
  },
  infoText: {
    color: '#ccc',
    marginBottom: 4
  },
  infoBold: {
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  button: {
    flex: 1,
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8
  },
  greenButton: {
    backgroundColor: 'green'
  },
  fullButton: {
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center'
  },
  mutedText: {
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 16
  },
  commentCard: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  commentTitle: {
    color: '#fff',
    fontWeight: 'bold'
  },
  commentUser: {
    color: '#ccc'
  },
  starRating: {
    color: '#fbbf24'
  },
  commentText: {
    color: '#ddd'
  },
  otherComment: {
    marginBottom: 12,
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 10
  },
  commentForm: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 10
  },
  formLabel: {
    color: '#fff',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    height: 80,
    textAlignVertical: 'top'
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 10
  },
  star: {
    fontSize: 24,
    color: '#444'
  },
  starFilled: {
    color: '#fbbf24'
  },
  scoreText: {
    color: '#fff',
    marginLeft: 8
  },
  publishBtn: {
    backgroundColor: '#e50914',
    padding: 12,
    borderRadius: 8
  }
});


export default MovieDetailScreen;
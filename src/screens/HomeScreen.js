import React, { useEffect, useState, useCallback } from 'react'; // Importamos useCallback
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import debounce from 'lodash.debounce'; // Importamos debounce
import api from '../services/api'; // Tu servicio centralizado

const HomeScreen = () => {
  const navigation = useNavigation();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(''); // Estado para el texto del TextInput

  // Utilizamos useCallback para memoizar la función debounced
  // Esto previene que se cree una nueva función debounce en cada render,
  // lo cual podría causar problemas con el debounce.
  const debouncedSearch = useCallback(
    debounce(async (textToSearch) => { // Renombramos a textToSearch para evitar confusión con el estado 'query'
      const trimmed = textToSearch.trim();

      if (trimmed === '') {
        return loadPopular();
      }

      setLoading(true);
      try {
        const res = await api.searchMovies(trimmed);
        setMovies(res.data);
      } catch (err) {
        console.error('Error en búsqueda:', err);
        // Alert.alert('Error', 'No se pudo realizar la búsqueda.');
      } finally {
        setLoading(false);
      }
    }, 500),
    [] // Array de dependencias vacío para que la función se cree una sola vez
  );

  useEffect(() => {
    loadPopular();
  }, []);

  const loadPopular = async () => {
    setLoading(true);
    try {
      const res = await api.getPopularMovies();
      setMovies(res.data);
    } catch (err) {
      console.error('Error al cargar películas populares:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función que se llama cada vez que el texto del TextInput cambia
  const handleTextInputChange = (text) => {
    setQuery(text); // Inmediatamente actualiza el estado 'query' para que el usuario vea lo que escribe
    debouncedSearch(text); // Llama a la versión debounced de la búsqueda
  };

  // Limpiar el debounce al desmontar el componente para evitar memory leaks
  useEffect(() => {
    return () => {
      debouncedSearch.cancel(); // Cancela cualquier llamada pendiente del debounce
    };
  }, [debouncedSearch]);


  const renderMovie = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MovieDetail', { tmdbId: item.tmdbId })}>
      <Image
        source={{ uri: item.posterUrl || 'https://via.placeholder.com/300x450?text=Sin+imagen' }}
        style={styles.poster}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
        <View style={styles.ratings}>
          <View style={styles.userBadge}>
            <Text style={styles.badgeText}>U: {item.averageUserRating != null ? item.averageUserRating.toFixed(1) : '–'}</Text>
          </View>
          <View style={styles.criticBadge}>
            <Text style={styles.badgeText}>C: {item.averageCriticRating != null ? item.averageCriticRating.toFixed(1) : '–'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Películas Populares</Text>

        <TextInput
          style={styles.search}
          placeholder="Buscar..."
          placeholderTextColor="#999"
          onChangeText={handleTextInputChange} // Usamos la nueva función
          value={query} // ¡Muy importante! Enlaza el valor del TextInput al estado 'query'
          keyboardAppearance="dark"
        />

        {loading ? (
          <View style={styles.centerSpinner}>
            <ActivityIndicator size="large" color="#e50914" />
          </View>
        ) : (
          <FlatList
            data={movies}
            keyExtractor={(item) => item.tmdbId.toString()}
            numColumns={2}
            contentContainerStyle={styles.grid}
            renderItem={renderMovie}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#fff'
  },
  search: {
    backgroundColor: '#232526',
    color: '#fff',
    padding: 12,
    borderRadius: 20,
    marginBottom: 16,
    fontSize: 16,
  },
  centerSpinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  grid: {
    paddingBottom: 20,
    gap: 16
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#232526',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  poster: {
    width: '100%',
    height: 220,
    backgroundColor: '#000'
  },
  cardContent: {
    padding: 12,
  },
  title: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
    height: 40,
  },
  ratings: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  userBadge: {
    backgroundColor: 'rgba(0, 128, 0, 0.7)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  criticBadge: {
    backgroundColor: 'rgba(255, 165, 0, 0.7)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default HomeScreen;
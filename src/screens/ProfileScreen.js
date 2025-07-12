import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [editableUser, setEditableUser] = useState({});
  const [editMode, setEditMode] = useState(false);

  const [watchlist, setWatchlist] = useState([]);
  const [seenlist, setSeenlist] = useState([]);
  const [selectedTab, setSelectedTab] = useState('watchlist');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userRes = await api.getUserInfo(token);
      setUser(userRes.data);
      setEditableUser(userRes.data);

      const [wRes, sRes] = await Promise.all([
        api.getUserWatchlist(token),
        api.getUserSeenlist(token)
      ]);

      // --- INICIO: Añadido para depuración ---
      console.log('Datos de Watchlist recibidos:', wRes.data);
      console.log('Datos de Seenlist recibidos:', sRes.data);
      // --- FIN: Añadido para depuración ---

      setWatchlist(wRes.data);
      setSeenlist(sRes.data);
    } catch (err) {
      console.error('Error al cargar datos del perfil o listas:', err);
      Alert.alert('Error', 'No se pudieron cargar los datos del perfil.');
      if (err.response && err.response.status === 401) {
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const saveProfile = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Token no encontrado. Por favor, inicia sesión de nuevo.');
      return;
    }

    if (!editableUser.username || !editableUser.role || editableUser.role === '') {
      return Alert.alert('Error', 'Nombre de usuario y rol no pueden estar vacíos.');
    }

    setLoading(true);
    try {
      const res = await api.updateProfile(editableUser, token);
      setUser(res.data);
      await AsyncStorage.setItem('user', JSON.stringify(res.data));
      setEditMode(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } catch (err) {
      console.error('Error al actualizar perfil:', err?.response?.data || err.message);
      Alert.alert('Error', err?.response?.data?.message || 'Error al actualizar perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const activeList = selectedTab === 'watchlist' ? watchlist : seenlist;

  const renderMovie = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('MovieDetail', { tmdbId: item.tmdbId })}
    >
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
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.container}>
          <View style={styles.toolbar}>
            <Text style={styles.header}>Mi Perfil</Text>
            <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
              <Icon name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerSpinner}>
              <ActivityIndicator size="large" color="#e50914" />
            </View>
          ) : user && (
            <View style={styles.profileBox}>
              {!editMode ? (
                <View>
                  <Text style={styles.username}>{user.username}</Text>
                  <Text style={styles.role}>Rol: {user.role}</Text>
                  <TouchableOpacity onPress={() => {
                    setEditMode(true);
                    setEditableUser(user);
                  }} style={styles.editBtn}>
                    <Text style={{ color: '#fff' }}>Editar Perfil</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TextInput
                    style={styles.input}
                    value={editableUser.username}
                    placeholder="Tu nombre de usuario"
                    placeholderTextColor="#999"
                    onChangeText={(text) => setEditableUser({ ...editableUser, username: text })}
                  />
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={editableUser.role}
                      onValueChange={(itemValue) =>
                        setEditableUser({ ...editableUser, role: itemValue })
                      }
                      style={styles.picker}
                      itemStyle={Platform.OS === 'ios' ? styles.pickerItem : null}
                    >
                      <Picker.Item label="Selecciona un rol" value="" color="#999" />
                      <Picker.Item label="Usuario" value="user" color="#fff" />
                      <Picker.Item label="Crítico" value="critic" color="#fff" />
                    </Picker>
                  </View>
                  <TouchableOpacity onPress={saveProfile} style={[styles.editBtn, { backgroundColor: 'green' }]}>
                    <Text style={{ color: '#fff' }}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditMode(false)} style={styles.cancelBtn}>
                    <Text style={{ color: '#e50914' }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabBtn, selectedTab === 'watchlist' && styles.activeTab]}
              onPress={() => setSelectedTab('watchlist')}
            >
              <Text style={styles.tabText}>Ver más tarde</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, selectedTab === 'seenlist' && styles.activeTab]}
              onPress={() => setSelectedTab('seenlist')}
            >
              <Text style={styles.tabText}>Mi lista</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerSpinner}>
              <ActivityIndicator size="large" color="#e50914" />
            </View>
          ) : activeList.length > 0 ? (
            <FlatList
              data={activeList}
              renderItem={renderMovie}
              keyExtractor={(item) => item.tmdbId.toString()}
              numColumns={2}
              contentContainerStyle={styles.grid} // Changed to use grid style
            />
          ) : (
            <Text style={styles.empty}>No hay películas en esta lista.</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#181818',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: Platform.OS === 'ios' ? 0 : 20,
  },
  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700'
  },
  logoutBtn: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  profileBox: {
    backgroundColor: '#232526',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6
  },
  role: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10
  },
  input: {
    backgroundColor: '#2c2d2f',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  pickerContainer: {
    backgroundColor: '#2c2d2d',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    height: 50,
    width: '100%',
  },
  pickerItem: {
    color: '#fff',
    fontSize: 16,
  },
  editBtn: {
    backgroundColor: '#e50914',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10
  },
  cancelBtn: {
    alignItems: 'center'
  },
  tabSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16
  },
  tabBtn: {
    backgroundColor: '#232526',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 12
  },
  activeTab: {
    backgroundColor: '#e50914'
  },
  tabText: {
    color: '#fff',
    fontWeight: '600'
  },
  grid: { // Added grid style
    paddingBottom: 20,
    gap: 16
  },
  card: { // Modified card style
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
    backgroundColor: '#000' // Added for consistency
  },
  cardContent: {
    padding: 12,
  },
  title: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8, // Changed from 6
    height: 40, // Added for consistent height
  },
  ratings: { // Modified ratings style
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  userBadge: { // Modified userBadge style
    backgroundColor: 'rgba(0, 128, 0, 0.7)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  criticBadge: { // Modified criticBadge style
    backgroundColor: 'rgba(255, 165, 0, 0.7)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: { // Added badgeText style
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  empty: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20
  },
  centerSpinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default ProfileScreen;
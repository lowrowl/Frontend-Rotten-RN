import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform // Importamos Platform para estilos específicos de iOS
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api'; // ← Importamos el archivo correcto

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  // Eliminamos selectedRole del estado local, Formik manejará esto

  const registerSchema = Yup.object().shape({
    username: Yup.string().required('El nombre de usuario es requerido'),
    email: Yup.string().email('Email inválido').required('El email es requerido'),
    password: Yup.string().min(6, 'La contraseña debe tener al menos 6 caracteres').required('La contraseña es requerida'),
    role: Yup.string().required('Selecciona un rol')
  });

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      await api.register(values);
      Alert.alert('Éxito', 'Registro exitoso');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Register error:', error?.response?.data || error.message);
      const errorMessage = error?.response?.data?.message || 'No se pudo registrar. Inténtalo de nuevo.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{ username: '', email: '', password: '', role: '' }}
        validationSchema={registerSchema}
        onSubmit={handleRegister}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.form}>
            <Text style={styles.title}>Registro</Text>

            <TextInput
              placeholder="Nombre de usuario"
              placeholderTextColor="#999"
              style={styles.input}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              value={values.username}
              autoCapitalize="none"
              keyboardAppearance="dark" // Para que el teclado sea oscuro en iOS
            />
            {touched.username && errors.username && <Text style={styles.error}>{errors.username}</Text>}

            <TextInput
              placeholder="Correo electrónico"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="email-address"
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              autoCapitalize="none"
              keyboardAppearance="dark"
            />
            {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#999"
              style={styles.input}
              secureTextEntry
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
              autoCapitalize="none"
              keyboardAppearance="dark"
            />
            {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={values.role}
                onValueChange={(itemValue) => setFieldValue('role', itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem} // Estilo para los ítems del Picker (solo iOS)
                // Removido dropdownIconColor porque no afecta a todos los renderers
              >
                <Picker.Item label="Selecciona tu rol" value="" color="#999" />
                <Picker.Item label="Usuario" value="user" color="#fff" />
                <Picker.Item label="Crítico" value="critic" color="#fff" />
              </Picker>
            </View>
            {touched.role && errors.role && <Text style={styles.error}>{errors.role}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
    justifyContent: 'center',
    padding: 20
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30
  },
  input: {
    backgroundColor: 'transparent', // Mantener transparente
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
    // Añadimos altura mínima para consistencia
    minHeight: 50
  },
  pickerContainer: {
    backgroundColor: '#232526', // Fondo del Picker para que sea visible
    borderRadius: 12,
    marginBottom: 15,
    // Altura fija para el contenedor del Picker
    minHeight: 50,
    justifyContent: 'center', // Centra verticalmente el Picker dentro de su contenedor
    overflow: 'hidden' // Asegura que el contenido no se desborde
  },
  picker: {
    color: '#fff', // Color del texto seleccionado en el Picker
    width: '100%',
    // Los estilos de altura y minHeight a veces se comportan diferente en iOS/Android
    // Lo manejamos con itemStyle para iOS y con el contenedor para Android
    ...Platform.select({
      ios: {
        // En iOS, el picker se abre como una ruleta, así que la altura no es tan crítica para el componente en sí
        // pero el itemStyle es clave para el color del texto.
      },
      android: {
        height: 50, // Altura del picker en Android
        // backgroundColor: '#232526', // Podría ser necesario si el contenedor no lo cubre
      }
    })
  },
  pickerItem: {
    // Solo aplica a iOS. Controla el color del texto dentro de la "ruleta" del picker
    color: '#fff',
    fontSize: 16,
    height: 100 // Esto puede ayudar con el espaciado y la visibilidad en iOS
  },
  button: {
    backgroundColor: '#e50914',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  disabled: {
    backgroundColor: '#444'
  },
  link: {
    color: '#e50914',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500'
  },
  error: {
    color: '#ff6b6b',
    fontSize: 13,
    marginBottom: 8
  }
});

export default RegisterScreen;
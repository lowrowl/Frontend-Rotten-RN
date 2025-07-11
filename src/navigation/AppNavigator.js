import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Importa SafeAreaProvider

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    // Envuelve toda tu NavigationContainer con SafeAreaProvider
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false, // Oculta el header por defecto para Login, Register, Tabs
            headerStyle: {
              backgroundColor: '#1f1f1f', // Color de fondo del encabezado
            },
            headerTintColor: '#fff', // Color de los íconos y texto del encabezado
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen
            name="MovieDetail"
            component={MovieDetailScreen}
            options={{
              headerShown: true, // ¡Muestra el header específicamente para MovieDetailScreen!
              title: 'Detalles de Película', // Título predeterminado para esta pantalla
              // El botón de regresar se manejará desde MovieDetailScreen.js con headerLeft
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
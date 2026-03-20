import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import DietScreen from '../screens/DietScreen';

import { getToken } from '../utils/authStorage';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [initialRouteName, setInitialRouteName] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const token = await getToken();
        if (!isMounted) return;
        setInitialRouteName(token ? 'Home' : 'Login');
      } catch {
        if (!isMounted) return;
        setInitialRouteName('Login');
      }
    }

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!initialRouteName) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerTitleAlign: 'center' }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false, headerBackVisible: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home', headerBackVisible: false }}
        />
        <Stack.Screen
         name="DietScreen"
         component={DietScreen}
         options={{ title: 'Diet Plan', headerBackVisible: false }}
         
         />


      </Stack.Navigator>
    </NavigationContainer>
  );
}


import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth:token';

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token) {
  if (!token) throw new Error('Token is required');
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}


import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { login } from '../services/api';
import { setToken } from '../utils/authStorage';
import DateTimePicker from '@react-native-community/datetimepicker';

function getErrorMessage(err) {
  const apiMessage =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.response?.data?.title ||
    err?.message;

  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  return 'Login failed. Please try again.';
}

export default function LoginScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date());
  // const [dateText, setDateText] = useState(formatDDMMYYYY(new Date()));

  const [showPicker, setShowPicker] = useState(false);

  const canSubmit = useMemo(() => {
    return userName.trim().length > 0 && password.length > 0 && !loading;
  }, [userName, password, loading]);

  async function onPressLogin() {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const { token } = await login({
        userName: userName.trim(),
        password,
      });
      await setToken(token);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Enter username"
          style={styles.input}
          editable={!loading}
          returnKeyType="next"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Enter password"
          secureTextEntry
          style={styles.input}
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={onPressLogin}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={onPressLogin}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.button,
            (!canSubmit || loading) && styles.buttonDisabled,
            pressed && canSubmit && !loading ? styles.buttonPressed : null,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#F6F7FB',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E9F1',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: '#111827',
  },
  error: {
    marginTop: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },
  button: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});


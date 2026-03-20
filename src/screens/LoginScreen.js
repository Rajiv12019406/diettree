import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { login } from '../services/api';
import { setToken } from '../utils/authStorage';

const DEFAULT_HOSPITAL_NAME = 'Testing Hospital';
const DEFAULT_HOSPITAL_TAGLINE = 'Bringing life and life in abundance';
const FOOTER_TEXT = 'Powered by Trirotee Technologies Pvt. Ltd.';
const DEFAULT_HOSPITAL_LOGO = require('../images/triotree-technologies-original.webp');

function getErrorMessage(err) {
  const apiMessage =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.response?.data?.title ||
    err?.message;

  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage;
  }
  return 'Login failed. Please try again.';
}

function validateFields({ userName, password, setUserNameError, setPasswordError }) {
  let ok = true;

  const trimmedUser = userName.trim();
  if (!trimmedUser) {
    setUserNameError('Username is required.');
    ok = false;
  } else {
    setUserNameError('');
  }

  if (!password) {
    setPasswordError('Password is required.');
    ok = false;
  } else if (password.length < 6) {
    setPasswordError('Password must be at least 6 characters.');
    ok = false;
  } else {
    setPasswordError('');
  }

  return ok;
}

export default function LoginScreen({ navigation, route }) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userNameError, setUserNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const hospitalName =
    route?.params?.hospitalName || DEFAULT_HOSPITAL_NAME;
  const hospitalTagline =
    route?.params?.hospitalTagline || DEFAULT_HOSPITAL_TAGLINE;
  const hospitalLogo = route?.params?.hospitalLogo ?? DEFAULT_HOSPITAL_LOGO;

  const canSubmit = useMemo(() => {
    return (
      userName.trim().length > 0 &&
      password.length >= 6 &&
      !loading
    );
  }, [userName, password, loading]);

  async function onPressLogin() {
    setError('');
    if (
      !validateFields({
        userName,
        password,
        setUserNameError,
        setPasswordError,
      })
    ) {
      return;
    }

    if (!canSubmit) return;

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bg} pointerEvents="none">
        <View style={styles.bgBase} />
        <View style={styles.bgBlob1} />
        <View style={styles.bgBlob2} />
        <View style={styles.bgBlob3} />
        <View style={styles.bgWhiteCurve} />
      </View>

      <View style={styles.overlay}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          {/* Brand area inside the same card */}
          <View style={styles.topHeader}>
            <View style={styles.brandRow}>
              {hospitalLogo ? (
                <Image
                  source={hospitalLogo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoInitials}>
                    {(hospitalName || 'H').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.brandTextWrap}>
                <Text style={styles.brandName}>{hospitalName}</Text>
              </View>
            </View>

            {!!hospitalTagline && (
              <Text style={styles.tagline}>{`'${hospitalTagline}'`}</Text>
            )}
          </View>

          <Text style={styles.label}>Username</Text>
          <TextInput
            value={userName}
            onChangeText={text => {
              setUserName(text);
              if (userNameError) setUserNameError('');
              if (error) setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter username"
            style={styles.input}
            editable={!loading}
            returnKeyType="next"
          />
          {!!userNameError && (
            <Text style={styles.fieldError}>{userNameError}</Text>
          )}

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (passwordError) setPasswordError('');
              if (error) setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter password"
            secureTextEntry
            style={styles.input}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={onPressLogin}
          />
          {!!passwordError && (
            <Text style={styles.fieldError}>{passwordError}</Text>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={onPressLogin}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.loginButton,
              (!canSubmit || loading) && styles.loginButtonDisabled,
              pressed && canSubmit && !loading ? styles.loginButtonPressed : null,
            ]}
          >
            <View style={styles.loginBg} />
            <View style={styles.loginInner}>
              <Text style={styles.loginText}>Login</Text>

            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{FOOTER_TEXT}</Text>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0EA5E9',
  },
  bgBlob1: {
    position: 'absolute',
    top: -100,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#38BDF8',
    opacity: 0.55,
  },
  bgBlob2: {
    position: 'absolute',
    bottom: -140,
    right: -150,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#0B5FA5',
    opacity: 0.65,
  },
  bgBlob3: {
    position: 'absolute',
    top: 140,
    right: 40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#22C55E',
    opacity: 0.12,
  },
  bgWhiteCurve: {
    position: 'absolute',
    left: -80,
    right: -80,
    bottom: -160,
    height: 360,
    borderRadius: 220,
    backgroundColor: '#FFFFFF',
    opacity: 0.92,
  },
  overlay: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 18,
    alignItems: 'center',
  },
  brandRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logo: {
    width: 92,
    height: 68,
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 84,
    height: 62,
    borderRadius: 10,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: {
    color: '#ECFEFF',
    fontSize: 22,
    fontWeight: '900',
  },
  brandTextWrap: {
    flex: 0,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  tagline: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: 'center',
    paddingBottom: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 34,
    borderWidth: 0,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#0B5FA5',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 2,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    color: '#111827',
  },
  fieldError: {
    marginTop: 4,
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  error: {
    marginTop: 12,
    color: '#B91C1C',
    fontWeight: '700',
  },
  loginButton: {
    marginTop: 18,
    height: 48,
    borderRadius: 24,
    borderWidth: 0,
    backgroundColor: '#0B79C7',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loginButtonPressed: {
    opacity: 0.92,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loginBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1D4ED8',
    opacity: 0.22,
  },
  loginText: {
    color: '#0B3B5A',
    fontWeight: '900',
    fontSize: 16,
  },
  arrowCircle: {
    position: 'absolute',
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#111827',
    fontWeight: '900',
  },
});


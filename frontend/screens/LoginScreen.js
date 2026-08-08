import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister, onNavigateToForgotPassword }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Required Fields', 'Please fill in both phone and password.');
      return;
    }

    setLoading(true);
    try {
      onLoginSuccess({ phone, password });
    } catch (error) {
      Alert.alert('Login Error', 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image source={require('../assets/logo.png')} style={styles.logoImg} />
        <Text style={styles.appTitle}>Ketero ቀጠሮ</Text>
        <Text style={styles.subtitle}>Sign in to your Ketero dating profile</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 0911223344"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            autoCapitalize="none"
          />

          <View style={styles.passwordLabelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={onNavigateToForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.textLink} onPress={onNavigateToRegister}>
            <Text style={styles.textLinkLabel}>New to Ketero? Create an Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#F5B800',
    marginBottom: 16,
    shadowColor: '#F5B800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#F5B800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E4A853',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  forgotPasswordText: {
    color: '#E4A853',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#151515',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  button: {
    backgroundColor: '#E4A853',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  textLinkLabel: {
    color: '#888',
    fontSize: 14,
  },
});

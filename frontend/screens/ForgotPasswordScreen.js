import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Theme from '../styles/theme';

export default function ForgotPasswordScreen({ apiBaseUrl, onNavigateToLogin }) {
  const [step, setStep] = useState(1); // 1: Email Input, 2: Token Input, 3: New Password Input
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Submit email to receive OTP
  const handleRequestToken = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          'Code Sent',
          data.message + (data.devOtp ? `\n\n[Dev Code]: ${data.devOtp}` : '')
        );
        if (data.devOtp) {
          setToken(data.devOtp);
        }
        setStep(2);
      } else {
        Alert.alert('Error', data.error || 'Failed to process request');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error requesting verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate token entry
  const handleVerifyToken = () => {
    if (!token || token.trim().length !== 6) {
      Alert.alert('Invalid Token', 'Please enter the 6-digit verification code sent to your email.');
      return;
    }
    setStep(3);
  };

  // Step 3: Reset password with bcrypt backend verification
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          token: token.trim(),
          newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success 🎉', 'Your password has been reset! Please log in with your new password.', [
          { text: 'Go to Login', onPress: onNavigateToLogin },
        ]);
      } else {
        Alert.alert('Reset Failed', data.error || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>KETERO ቀጠሮ</Text>
          <Text style={styles.title}>Password Recovery</Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'Enter your registered email address to receive a 6-digit security reset code.'}
            {step === 2 && `Enter the 6-digit verification code sent to ${email}.`}
            {step === 3 && 'Create a new secure password for your account.'}
          </Text>
        </View>

        {/* Step Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]} />
        </View>

        {/* Form Container */}
        <View style={styles.card}>
          {step === 1 && (
            <View>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. user@example.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestToken} disabled={loading}>
                {loading ? <ActivityIndicator color="#0B0B0D" /> : <Text style={styles.primaryBtnText}>Send Verification Code</Text>}
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.label}>6-Digit Security Code</Text>
              <TextInput
                style={[styles.input, styles.tokenInput]}
                placeholder="123456"
                placeholderTextColor="#666"
                value={token}
                onChangeText={setToken}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyToken}>
                <Text style={styles.primaryBtnText}>Verify Code</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={() => setStep(1)}>
                <Text style={styles.resendBtnText}>← Change Email / Resend</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor="#666"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleResetPassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#0B0B0D" /> : <Text style={styles.primaryBtnText}>Reset Password Now</Text>}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onNavigateToLogin}>
            <Text style={styles.cancelBtnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    color: '#FFB800',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'center',
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#FFB800',
  },
  card: {
    backgroundColor: 'rgba(22, 20, 28, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
    borderRadius: 24,
    padding: 24,
  },
  label: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    marginBottom: 20,
  },
  tokenInput: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#FFB800',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#0B0B0D',
    fontWeight: 'bold',
    fontSize: 15,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 15,
  },
  resendBtnText: {
    color: '#FFB800',
    fontSize: 12,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
});

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const ETHIOPIAN_CITIES = ['Addis Ababa', 'Hawassa', 'Adama', 'Bahir Dar', 'Mekelle', 'Gondar', 'Dire Dawa', 'Jimma'];
const RELIGIONS = ['Orthodox', 'Protestant', 'Muslim', 'Catholic', 'Other'];
const LANGUAGES = ['Amharic', 'Afaan Oromoo', 'Tigrinya', 'Somali', 'English'];

export default function OnboardingScreen({ onRegisterSuccess, onNavigateToLogin }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    age: '',
    location: 'Addis Ababa',
    religion: 'Orthodox',
    languages: [],
    hobbies: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('SMS'); // 'SMS' | 'WHATSAPP' | 'EMAIL'
  const [simulatedAlert, setSimulatedAlert] = useState(null); // { header, body, brandColor }

  const toggleLanguage = (lang) => {
    setFormData((prev) => {
      const langs = [...prev.languages];
      if (langs.includes(lang)) {
        return { ...prev, languages: langs.filter((l) => l !== lang) };
      } else {
        return { ...prev, languages: [...langs, lang] };
      }
    });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.age) {
        if (Platform.OS === 'web') {
          alert('Please fill out all credentials including your Email.');
        } else {
          Alert.alert('Missing Info', 'Please fill out all credentials including your Email.');
        }
        return;
      }
      if (parseInt(formData.age) < 18) {
        if (Platform.OS === 'web') {
          alert('You must be 18 or older to use Ketero.');
        } else {
          Alert.alert('Age Restriction', 'You must be 18 or older to use Ketero.');
        }
        return;
      }
      setStep(2);
    }
  };

  const handleGoToVerification = () => {
    if (!formData.location || !formData.religion) {
      if (Platform.OS === 'web') {
        alert('Please complete your matching preferences.');
      } else {
        Alert.alert('Missing Preferences', 'Please complete your matching preferences.');
      }
      return;
    }
    setStep(3);
  };

  const handleSendVerificationCode = () => {
    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    
    let header = '💬 Ketero SMS Gateway';
    let body = `ቀጠሮ Verification Code: ${code}. Enter this code on your screen to verify your phone number.`;
    let brandColor = '#E4A853';

    if (verificationMethod === 'WHATSAPP') {
      header = '🟢 WhatsApp Business';
      body = `[Ketero ቀጠሮ] Selam! Your verification code is: ${code}. Valid for 5 minutes.`;
      brandColor = '#25D366';
    } else if (verificationMethod === 'EMAIL') {
      header = '✉️ Ketero Mailer';
      body = `Hello! Please verify your Ketero account with code: ${code}. If you did not request this, ignore.`;
      brandColor = '#1A73E8';
    }

    setSimulatedAlert({ header, body, brandColor });

    // Fallback alerts for redundancy
    if (Platform.OS === 'web') {
      setTimeout(() => {
        alert(`[${header}]\n\n${body}`);
      }, 200);
    } else {
      setTimeout(() => {
        Alert.alert(header, body, [{ text: 'OK' }]);
      }, 200);
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (!generatedOtp) {
      if (Platform.OS === 'web') {
        alert('Please request a verification code first.');
      } else {
        Alert.alert('Verification Required', 'Please request a verification code first.');
      }
      return;
    }
    if (!otpCode) {
      if (Platform.OS === 'web') {
        alert('Please enter the 4-digit code.');
      } else {
        Alert.alert('Verification Required', 'Please enter the 4-digit code.');
      }
      return;
    }
    if (otpCode !== generatedOtp) {
      if (Platform.OS === 'web') {
        alert('The verification code you entered is incorrect.');
      } else {
        Alert.alert('Invalid Code', 'The verification code you entered is incorrect.');
      }
      return;
    }

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        hobbies: formData.hobbies ? formData.hobbies.split(',').map((h) => h.trim()) : [],
        verifiedStatus: true,
      };

      onRegisterSuccess(payload);
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('Failed to register. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to register. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.appTitle}>Ketero ቀጠሮ</Text>
        <Text style={styles.subtitle}>Find your cultural match in Ethiopia</Text>

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Step 1: Your Account</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Almaz Yosef"
              placeholderTextColor="#666"
              value={formData.name}
              onChangeText={(val) => setFormData({ ...formData, name: val })}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., almaz@gmail.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(val) => setFormData({ ...formData, email: val })}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 0911223344"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(val) => setFormData({ ...formData, phone: val })}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor="#666"
              secureTextEntry
              value={formData.password}
              onChangeText={(val) => setFormData({ ...formData, password: val })}
            />

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Must be 18+"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(val) => setFormData({ ...formData, age: val })}
            />

            <TouchableOpacity style={styles.button} onPress={handleNextStep}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.textLink} onPress={onNavigateToLogin}>
              <Text style={styles.textLinkLabel}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        ) : step === 2 ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Step 2: Matching Preferences</Text>

            <Text style={styles.label}>Location / City</Text>
            <View style={styles.pickerContainer}>
              {ETHIOPIAN_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.pickerItem,
                    formData.location === city && styles.pickerItemActive,
                  ]}
                  onPress={() => setFormData({ ...formData, location: city })}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      formData.location === city && styles.pickerItemTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Religion (Culturally relevant matching)</Text>
            <View style={styles.pickerContainer}>
              {RELIGIONS.map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[
                    styles.pickerItem,
                    formData.religion === rel && styles.pickerItemActive,
                  ]}
                  onPress={() => setFormData({ ...formData, religion: rel })}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      formData.religion === rel && styles.pickerItemTextActive,
                    ]}
                  >
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Languages Spoken</Text>
            <View style={styles.pickerContainer}>
              {LANGUAGES.map((lang) => {
                const isSelected = formData.languages.includes(lang);
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => toggleLanguage(lang)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextActive,
                      ]}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Hobbies & Bio (Comma separated)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Traditional Dance, Coffee Ceremony, Hiking"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              value={formData.hobbies}
              onChangeText={(val) => setFormData({ ...formData, hobbies: val })}
            />

             <View style={styles.rowButtons}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setStep(1)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleGoToVerification}>
                <Text style={styles.buttonText}>Find Matches</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Step 3: Security Verification</Text>
            
            <Text style={styles.label}>Choose Verification Method</Text>
            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[styles.methodBtn, verificationMethod === 'SMS' && styles.methodBtnActive]}
                onPress={() => {
                  setVerificationMethod('SMS');
                  setSimulatedAlert(null);
                }}
              >
                <Text style={[styles.methodText, verificationMethod === 'SMS' && styles.methodTextActive]}>SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodBtn, verificationMethod === 'WHATSAPP' && styles.methodBtnActive]}
                onPress={() => {
                  setVerificationMethod('WHATSAPP');
                  setSimulatedAlert(null);
                }}
              >
                <Text style={[styles.methodText, verificationMethod === 'WHATSAPP' && styles.methodTextActive]}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodBtn, verificationMethod === 'EMAIL' && styles.methodBtnActive]}
                onPress={() => {
                  setVerificationMethod('EMAIL');
                  setSimulatedAlert(null);
                }}
              >
                <Text style={[styles.methodText, verificationMethod === 'EMAIL' && styles.methodTextActive]}>Email</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.button, { marginBottom: 20 }]} onPress={handleSendVerificationCode}>
              <Text style={styles.buttonText}>
                Send Code via {verificationMethod === 'SMS' ? 'SMS' : verificationMethod === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
              </Text>
            </TouchableOpacity>

            {simulatedAlert && (
              <View style={[styles.simulationCard, { borderColor: simulatedAlert.brandColor }]}>
                <Text style={[styles.simulationHeader, { color: simulatedAlert.brandColor }]}>
                  {simulatedAlert.header}
                </Text>
                <Text style={styles.simulationBody}>{simulatedAlert.body}</Text>
              </View>
            )}

            <Text style={styles.label}>Enter 4-Digit Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 4-digit code"
              placeholderTextColor="#666"
              keyboardType="numeric"
              maxLength={4}
              value={otpCode}
              onChangeText={setOtpCode}
            />

            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setStep(2)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleVerifyAndSubmit}>
                <Text style={styles.buttonText}>Verify & Create Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFB800', // Ketero gold
    letterSpacing: 1.5,
    marginBottom: 4,
    textShadowColor: 'rgba(255, 184, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0AA',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(22, 20, 28, 0.75)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.15)',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: '#FFF',
    borderBottomWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  pickerItem: {
    backgroundColor: 'rgba(22, 20, 28, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.12)',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderColor: '#FFB800',
  },
  pickerItemText: {
    color: '#A0A0AA',
    fontSize: 13,
  },
  pickerItemTextActive: {
    color: '#FFB800',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FFB800',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    color: '#0B0B0D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flex: 1,
    marginRight: 8,
  },
  primaryButton: {
    flex: 2,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#A0A0AA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  infoLabel: {
    color: '#A0A0AA',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  textLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  textLinkLabel: {
    color: '#71717A',
    fontSize: 14,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: 'rgba(22, 20, 28, 0.6)',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.12)',
    alignItems: 'center',
  },
  methodBtnActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderColor: '#FFB800',
  },
  methodText: {
    color: '#A0A0AA',
    fontSize: 12,
    fontWeight: 'bold',
  },
  methodTextActive: {
    color: '#FFB800',
  },
  simulationCard: {
    backgroundColor: '#131018',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  simulationHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  simulationBody: {
    color: '#FAFAFA',
    fontSize: 13,
    lineHeight: 18,
  },
});

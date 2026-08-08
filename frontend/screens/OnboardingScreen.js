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
  Image,
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
    gender: 'female', // Default selection chip
    location: 'Addis Ababa',
    religion: 'Orthodox',
    languages: [],
    hobbies: '',
  });

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
      if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.age || !formData.gender) {
        const msg = 'Please fill out all required credentials including Age and Gender.';
        if (Platform.OS === 'web') alert(msg); else Alert.alert('Missing Info', msg);
        return;
      }
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
        const msg = 'You must be between 18 and 100 years old to use Ketero.';
        if (Platform.OS === 'web') alert(msg); else Alert.alert('Age Restriction', msg);
        return;
      }
      setStep(2);
    } else {
      handleCompleteRegistration();
    }
  };

  const handleCompleteRegistration = () => {
    if (!formData.location || !formData.religion) {
      const msg = 'Please complete your matching preferences.';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Missing Preferences', msg);
      return;
    }

    const payload = {
      ...formData,
      age: parseInt(formData.age),
      gender: formData.gender.toLowerCase(),
      hobbies: formData.hobbies ? (typeof formData.hobbies === 'string' ? formData.hobbies.split(',').map((h) => h.trim()) : formData.hobbies) : [],
      verifiedStatus: false,
      isVerified: false,
      badgeType: 'none',
      isPremium: false,
    };
    onRegisterSuccess(payload);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={require('../assets/logo.png')} style={styles.logoImg} />
        <Text style={styles.appTitle}>Ketero ቀጠሮ</Text>
        <Text style={styles.subtitle}>Find your cultural match in Ethiopia</Text>

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Create Account (Step 1 of 2)</Text>

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

            <Text style={styles.label}>Gender / Sex (Mandatory)</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.pickerItem, formData.gender === 'female' && styles.pickerItemActive]}
                onPress={() => setFormData({ ...formData, gender: 'female' })}
              >
                <Text style={[styles.pickerItemText, formData.gender === 'female' && styles.pickerItemTextActive]}>
                  👩 Female
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickerItem, formData.gender === 'male' && styles.pickerItemActive]}
                onPress={() => setFormData({ ...formData, gender: 'male' })}
              >
                <Text style={[styles.pickerItemText, formData.gender === 'male' && styles.pickerItemTextActive]}>
                  👨 Male
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Age (Mandatory)</Text>
            <TextInput
              style={styles.input}
              placeholder="Must be 18+"
              placeholderTextColor="#666"
              keyboardType="numeric"
              maxLength={3}
              value={formData.age}
              onChangeText={(val) => setFormData({ ...formData, age: val })}
            />

            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleNextStep}>
              <Text style={styles.buttonText}>Next: Matching Profile →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={onNavigateToLogin}>
              <Text style={styles.linkText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Matching Preferences (Step 2 of 2)</Text>

            <Text style={styles.label}>City / Location</Text>
            <View style={styles.pickerContainer}>
              {ETHIOPIAN_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.pickerItem, formData.location === city && styles.pickerItemActive]}
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

            <Text style={styles.label}>Religion / Cultural Belief</Text>
            <View style={styles.pickerContainer}>
              {RELIGIONS.map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[styles.pickerItem, formData.religion === rel && styles.pickerItemActive]}
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

              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleCompleteRegistration}>
                <Text style={styles.buttonText}>Create Profile & Start Dating 🎉</Text>
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
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  logoImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#F5B800',
    alignSelf: 'center',
    marginBottom: 12,
    shadowColor: '#F5B800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F5B800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A5B5',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  pickerItem: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(228, 168, 83, 0.2)',
    borderColor: '#E4A853',
  },
  pickerItemText: {
    color: '#AAA',
    fontSize: 13,
  },
  pickerItemTextActive: {
    color: '#E4A853',
    fontWeight: 'bold',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#E4A853',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#E4A853',
    fontSize: 13,
  },
});

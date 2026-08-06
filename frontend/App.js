import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, SafeAreaView, Platform, TouchableOpacity } from 'react-native';
// import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppStore } from './store/useAppStore';
import { API_BASE_URL } from './config/api';

import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import DiscoveryScreen from './screens/DiscoveryScreen';
import ChatScreen from './screens/ChatScreen';
import CallScreen from './screens/CallScreen';
import PaymentScreen from './screens/PaymentScreen';
import DashboardScreen from './screens/DashboardScreen';
import ContactsScreen from './screens/ContactsScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import SettingsScreen from './screens/SettingsScreen';
import VideoCallModal from './components/VideoCallModal';

// Configurable API base url imported from config/api.js

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B0D', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ color: '#FFB800', fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
            Application Connection Warning
          </Text>
          <Text style={{ color: '#DDD', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
            {this.state.error?.toString() || 'An unexpected rendering error occurred.'}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#FFB800', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            onPress={() => window.location.reload()}
          >
            <Text style={{ color: '#0B0B0D', fontWeight: 'bold', fontSize: 14 }}>Reload Application</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

// High-fidelity fallback database for mock offline demonstration mode
const MOCK_PROFILES = [
  {
    _id: 'mock_user_1',
    name: 'Selamawit Kebede',
    age: 24,
    location: 'Addis Ababa',
    religion: 'Orthodox',
    languages: ['Amharic', 'English'],
    hobbies: ['Traditional Coffee', 'Jazz Music', 'Reading'],
    profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
    verifiedStatus: true,
    isPremium: false,
  },
  {
    _id: 'mock_user_2',
    name: 'Bekele Desta',
    age: 27,
    location: 'Hawassa',
    religion: 'Protestant',
    languages: ['Afaan Oromoo', 'Amharic'],
    hobbies: ['Lakeside walks', 'Fish Cutlets', 'Football'],
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500',
    verifiedStatus: true,
    isPremium: true,
  },
  {
    _id: 'mock_user_3',
    name: 'Fatuma Mohammed',
    age: 22,
    location: 'Adama',
    religion: 'Muslim',
    languages: ['Amharic', 'Afaan Oromoo', 'English'],
    hobbies: ['Traditional spices', 'Baking', 'Volunteering'],
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    verifiedStatus: false,
    isPremium: false,
  },
  {
    _id: 'mock_user_4',
    name: 'Dawit Yohannes',
    age: 29,
    location: 'Bahir Dar',
    religion: 'Orthodox',
    languages: ['Amharic', 'Tigrinya'],
    hobbies: ['Lake Tana tours', 'Monastery History', 'Biking'],
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
    verifiedStatus: false,
    isPremium: false,
  }
];

export default function App() {
  const {
    currentScreen,
    setCurrentScreen,
    token,
    setToken,
    user,
    setUser,
    activeChatUser,
    setActiveChatUser,
    activeCallData,
    setActiveCallData,
    activePaywallData,
    setActivePaywallData,
    apiUrl,
    setApiUrl,
    logout,
  } = useAppStore();

  const offlineMode = false; // Force online database mode only (no offline demo cheating)
  const [connecting, setConnecting] = useState(false);

  // Check if server is running on startup with longer timeout for Render cold starts
  useEffect(() => {
    const testConnection = async () => {
      const targetApi = API_BASE_URL || 'https://ketero-app.onrender.com';
      setApiUrl(targetApi);

      try {
        console.log(`Checking connection to primary API: ${targetApi}`);
        const response = await fetch(`${targetApi}/`, { signal: AbortSignal.timeout(8000) });
        if (response.ok) {
          console.log('Connected to Ketero primary API');
          return;
        }
      } catch (err) {
        console.warn('Primary API cold starting or offline...');
      }
    };
    testConnection();
  }, []);

  const handleLogin = async (credentials) => {
    setConnecting(true);
    try {
      const targetApi = apiUrl || API_BASE_URL;
      const response = await fetch(`${targetApi}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        setToken(data.token);
        const userObj = data.user || data;
        setUser(userObj);
        setCurrentScreen('DASHBOARD');
      } else {
        const errorMsg = data.error || 'Failed to Login';
        if (Platform.OS === 'web') alert(errorMsg); else Alert.alert('Login Error', errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Network error during login. Please check connection.';
      if (Platform.OS === 'web') alert(errorMsg); else Alert.alert('Network Error', errorMsg);
    } finally {
      setConnecting(false);
    }
  };

  const handleRegister = async (profileData) => {
    setConnecting(true);
    try {
      const targetApi = apiUrl || API_BASE_URL;
      const response = await fetch(`${targetApi}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        setToken(data.token);
        const userObj = data.user || data;
        setUser(userObj);
        setCurrentScreen('DASHBOARD');
      } else {
        const errorMsg = data.error || 'Failed to Register';
        if (Platform.OS === 'web') alert(errorMsg); else Alert.alert('Registration Error', errorMsg);
      }
    } catch (err) {
      console.error('Registration fetch error:', err);
      const errorMsg = 'Network error during registration. Please try again.';
      if (Platform.OS === 'web') alert(errorMsg); else Alert.alert('Network Error', errorMsg);
    } finally {
      setConnecting(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Syncs user status (especially after premium webhook payments)
  const syncProfile = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);
      }
    } catch (err) {
      console.error('Error syncing profile:', err);
    }
  };

  if (connecting) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#E4A853" />
        <Text style={styles.loaderText}>Connecting to Ketero...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
      {token ? (
        <View style={styles.mainAppContainer}>
          <View style={styles.screenContainer}>
            {currentScreen === 'DASHBOARD' && (
              <DashboardScreen
                token={token}
                apiBaseUrl={apiUrl}
                user={user}
                onNavigateToDiscovery={() => setCurrentScreen('DISCOVERY')}
                onNavigateToContacts={() => setCurrentScreen('CONTACTS')}
                onNavigateToProfile={() => setCurrentScreen('PROFILE')}
                onNavigateToPayment={() => setCurrentScreen('PAYMENT')}
              />
            )}

            {currentScreen === 'DISCOVERY' && (
              <DiscoveryScreen
                token={token}
                apiBaseUrl={apiUrl}
                onMatchPress={(matchedUser) => {
                  setActiveChatUser(matchedUser);
                  setCurrentScreen('CHAT');
                }}
                onNavigateToProfile={() => setCurrentScreen('PROFILE')}
              />
            )}

            {currentScreen === 'CONTACTS' && (
              <ContactsScreen
                token={token}
                apiBaseUrl={apiUrl}
                onSelectContact={(matchedUser) => {
                  setActiveChatUser(matchedUser);
                  setCurrentScreen('CHAT');
                }}
                onNavigateToDiscovery={() => setCurrentScreen('DISCOVERY')}
              />
            )}

            {currentScreen === 'PROFILE' && (
              <ProfileScreen
                token={token}
                apiBaseUrl={apiUrl}
                user={user}
                onUpdateProfile={(updatedUser) => setUser(updatedUser)}
                onLogout={handleLogout}
                onNavigateToSettings={() => setCurrentScreen('SETTINGS')}
              />
            )}

            {currentScreen === 'SETTINGS' && (
              <SettingsScreen
                token={token}
                apiBaseUrl={apiUrl}
                user={user}
                onNavigateBack={() => setCurrentScreen('PROFILE')}
                onNavigateToAdmin={() => setCurrentScreen('ADMIN')}
              />
            )}

            {currentScreen === 'ADMIN' && (
              <AdminDashboardScreen
                token={token}
                apiBaseUrl={apiUrl}
                onNavigateBack={() => setCurrentScreen('DASHBOARD')}
              />
            )}

            {currentScreen === 'CHAT' && (
              <ChatScreen
                token={token}
                apiBaseUrl={apiUrl}
                matchedUser={activeChatUser}
                currentUserIsPremium={user?.isPremium}
                onNavigateBack={() => setCurrentScreen('CONTACTS')}
                onNavigateToCall={(callData) => {
                  setActiveCallData(callData);
                  setCurrentScreen('CALL');
                }}
                onShowPaymentPaywall={(paywallDetails) => {
                  setActivePaywallData({
                    ...paywallDetails,
                    userId: user._id,
                  });
                  setCurrentScreen('PAYMENT');
                }}
              />
            )}

            {currentScreen === 'CALL' && (
              <CallScreen
                callData={activeCallData}
                onHangUp={() => {
                  setCurrentScreen('CHAT');
                  setActiveCallData(null);
                }}
              />
            )}

            {currentScreen === 'PAYMENT' && (
              <PaymentScreen
                token={token}
                apiBaseUrl={apiUrl}
                paywallData={activePaywallData}
                onPaymentSuccess={() => {
                  setUser({ ...user, isPremium: true });
                  syncProfile();
                  setCurrentScreen('CHAT');
                  setActivePaywallData(null);
                }}
                onCancel={() => {
                  setCurrentScreen('CHAT');
                  setActivePaywallData(null);
                }}
              />
            )}
          </View>

          {/* Bottom Navigation Tab Bar */}
          {['DASHBOARD', 'DISCOVERY', 'CONTACTS', 'PROFILE', 'ADMIN'].includes(currentScreen) && (
            <View style={styles.bottomTabBar}>
              <TouchableOpacity
                style={[styles.tabItem, currentScreen === 'DASHBOARD' && styles.tabItemActive]}
                onPress={() => setCurrentScreen('DASHBOARD')}
              >
                <Text style={styles.tabIcon}>📊</Text>
                <Text style={[styles.tabLabel, currentScreen === 'DASHBOARD' && styles.tabLabelActive]}>
                  Dashboard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, currentScreen === 'DISCOVERY' && styles.tabItemActive]}
                onPress={() => setCurrentScreen('DISCOVERY')}
              >
                <Text style={styles.tabIcon}>🔍</Text>
                <Text style={[styles.tabLabel, currentScreen === 'DISCOVERY' && styles.tabLabelActive]}>
                  Discovery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, currentScreen === 'CONTACTS' && styles.tabItemActive]}
                onPress={() => setCurrentScreen('CONTACTS')}
              >
                <Text style={styles.tabIcon}>👥</Text>
                <Text style={[styles.tabLabel, currentScreen === 'CONTACTS' && styles.tabLabelActive]}>
                  Contacts
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, currentScreen === 'PROFILE' && styles.tabItemActive]}
                onPress={() => setCurrentScreen('PROFILE')}
              >
                <Text style={styles.tabIcon}>👤</Text>
                <Text style={[styles.tabLabel, currentScreen === 'PROFILE' && styles.tabLabelActive]}>
                  Profile
                </Text>
              </TouchableOpacity>

              {user?.role === 'admin' && (
                <TouchableOpacity
                  style={[styles.tabItem, currentScreen === 'ADMIN' && styles.tabItemActive]}
                  onPress={() => setCurrentScreen('ADMIN')}
                >
                  <Text style={styles.tabIcon}>🛡️</Text>
                  <Text style={[styles.tabLabel, currentScreen === 'ADMIN' && styles.tabLabelActive, { color: '#EF4444' }]}>
                    Admin
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {currentScreen === 'FORGOT_PASSWORD' ? (
            <ForgotPasswordScreen
              apiBaseUrl={apiUrl}
              onNavigateToLogin={() => setCurrentScreen('LOGIN')}
            />
          ) : currentScreen === 'ONBOARDING' ? (
            <OnboardingScreen
              onRegisterSuccess={handleRegister}
              onNavigateToLogin={() => setCurrentScreen('LOGIN')}
            />
          ) : (
            <LoginScreen
              onLoginSuccess={handleLogin}
              onNavigateToRegister={() => setCurrentScreen('ONBOARDING')}
              onNavigateToForgotPassword={() => setCurrentScreen('FORGOT_PASSWORD')}
            />
          )}
        </View>
      )}

      {/* Global WebRTC Video Call Modal */}
      <VideoCallModal
        visible={!!activeCallData}
        targetUser={activeCallData?.targetUser || (activeCallData ? { _id: activeCallData.callerId, name: activeCallData.callerName, profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' } : null)}
        sdpOffer={activeCallData?.sdpOffer}
        onClose={() => setActiveCallData(null)}
      />
    </SafeAreaView>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#E4A853',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  mainAppContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    height: 65,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderColor: '#2C2C2C',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  tabLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#E4A853',
  },
});

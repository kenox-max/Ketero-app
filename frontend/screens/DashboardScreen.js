import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Pattern, Defs, Rect, G, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import useAppStore from '../store/useAppStore';
import Theme from '../styles/theme';

const { width } = Dimensions.get('window');

// Ethiopian Woven Motif (Tilet) Repeating SVG Component
function TiletProgressBar({ percentage }) {
  return (
    <View style={styles.tiletContainer}>
      <Svg width="100%" height="24">
        <Defs>
          <Pattern id="tilet" width="30" height="24" patternUnits="userSpaceOnUse">
            {/* Diamond shape woven background */}
            <Path d="M0,12 L15,0 L30,12 L15,24 Z" fill="#FFB800" opacity="0.15" />
            {/* Diamond boundary borders */}
            <Path d="M0,12 L15,0 L30,12" fill="none" stroke="#FFB800" strokeWidth="1.5" />
            <Path d="M0,12 L15,24 L30,12" fill="none" stroke="#E59800" strokeWidth="1.5" />
            {/* Center woven vertical line */}
            <Path d="M15,0 L15,24" stroke="#FFB800" strokeWidth="1" strokeDasharray="3,3" />
            {/* Small horizontal cross threads */}
            <Path d="M0,12 L30,12" stroke="#E59800" strokeWidth="0.5" opacity="0.4" />
          </Pattern>
        </Defs>
        <Rect width={`${percentage}%`} height="100%" fill="url(#tilet)" rx="12" ry="12" />
      </Svg>
    </View>
  );
}

// Ethiopian traditional dancer SVG Character
function AnimatedDancer({ style }) {
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Shoulder shaking (Eskesta wobble)
    rotation.value = withRepeat(
      withTiming(6, { duration: 120 }),
      -1, // infinite
      true // reverse
    );
    // Bouncing animation
    translateY.value = withRepeat(
      withTiming(-6, { duration: 500 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.dancerWrapper, animatedStyle, style]}>
      <Svg width="50" height="60" viewBox="0 0 50 60">
        {/* Afro Hair */}
        <Circle cx="25" cy="14" r="9" fill="#1C1917" />
        <Circle cx="20" cy="11" r="5" fill="#1C1917" />
        <Circle cx="30" cy="11" r="5" fill="#1C1917" />
        <Circle cx="25" cy="8" r="6" fill="#1C1917" />
        
        {/* Face */}
        <Circle cx="25" cy="15" r="6" fill="#854D0E" />
        
        {/* Neck */}
        <Rect x="23" y="20" width="4" height="4" fill="#854D0E" />
        
        {/* Habesha Kemis (Traditional White Dress) */}
        {/* Trapezoid body */}
        <Path d="M20,24 L30,24 L36,46 L14,46 Z" fill="#FAFAFA" />
        
        {/* Woven border trims (Tilet) - Red, Yellow, Green stripes */}
        <Path d="M14,42 L36,42" stroke="#EF4444" strokeWidth="1.5" />
        <Path d="M14,44 L36,44" stroke="#FFB800" strokeWidth="1.5" />
        <Path d="M14,46 L36,46" stroke="#10B981" strokeWidth="1.5" />
        
        {/* Collar trim */}
        <Path d="M20,24 L25,28 L30,24" fill="none" stroke="#FFB800" strokeWidth="1.5" />
        
        {/* Arms raised in Eskesta shoulder dance */}
        {/* Left Arm */}
        <Path d="M20,25 Q10,18 8,10" fill="none" stroke="#854D0E" strokeWidth="3" strokeLinecap="round" />
        {/* Right Arm */}
        <Path d="M30,25 Q40,18 42,10" fill="none" stroke="#854D0E" strokeWidth="3" strokeLinecap="round" />
        
        {/* Headband */}
        <Path d="M19,13 Q25,10 31,13" fill="none" stroke="#EF4444" strokeWidth="1.5" />
      </Svg>
    </Animated.View>
  );
}

// Falling Cultural Icons overlay inside spotlight
function SpotlightOverlay() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Golden Ethiopian Traditional Cross Motif */}
      <View style={[styles.culturalIcon, { top: '15%', right: '15%' }]}>
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path d="M12,2 L12,22 M2,12 L22,12" stroke="#FFB800" strokeWidth="2" opacity="0.6" />
          <Path d="M8,8 L16,16 M16,8 L8,16" stroke="#FFB800" strokeWidth="1.5" opacity="0.6" />
          <Circle cx="12" cy="12" r="3" stroke="#FFB800" strokeWidth="1.5" fill="none" opacity="0.6" />
        </Svg>
      </View>
      
      {/* Floating geometric stars & sparkle motifs */}
      <View style={[styles.culturalIcon, { top: '25%', left: '10%', transform: [{ rotate: '45deg' }] }]}>
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="#FFB800" opacity="0.5">
          <Path d="M12,0 L15,9 L24,12 L15,15 L12,24 L9,15 L0,12 L9,9 Z" />
        </Svg>
      </View>

      <View style={[styles.culturalIcon, { top: '45%', right: '10%' }]}>
        <Svg width="16" height="16" viewBox="0 0 24 24" fill="#E59800" opacity="0.4">
          <Path d="M12,0 L15,9 L24,12 L15,15 L12,24 L9,15 L0,12 L9,9 Z" />
        </Svg>
      </View>

      <View style={[styles.culturalIcon, { top: '65%', left: '15%', transform: [{ rotate: '15deg' }] }]}>
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <Path d="M12,4 L12,20 M4,12 L20,12" stroke="#E59800" strokeWidth="1.5" opacity="0.5" />
          <Rect x="8" y="8" width="8" height="8" stroke="#E59800" strokeWidth="1.5" fill="none" opacity="0.5" />
        </Svg>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const {
    user,
    token,
    apiUrl,
    setCurrentScreen,
    setUser,
  } = useAppStore();

  const [stats, setStats] = useState({
    connectionsCount: 0,
    likesCount: user?.likes?.length || 0,
    profileViews: 12,
  });
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile fields for the spotlight editor
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  // Pulsing neon border shared values
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Pulse animation for the "Unlock Premium" glow
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      borderColor: `rgba(255, 184, 0, ${glowOpacity.value})`,
      shadowColor: '#FFB800',
      shadowOpacity: glowOpacity.value * 0.5,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 0 },
    };
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!apiUrl || !token) return;
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/api/matches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const matches = await response.json();
          setStats((prev) => ({
            ...prev,
            connectionsCount: matches.length,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [apiUrl, token]);

  const handleSaveProfile = async () => {
    if (!apiUrl || !token) return;
    try {
      setIsSaving(true);
      const response = await fetch(`${apiUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        alert('Profile details updated successfully!');
      } else {
        alert(data.error || 'Failed to update profile details');
      }
    } catch (err) {
      alert('Error updating profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  const completionPercent = 85;
  const isWebWide = width > 768;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.responsiveLayout, isWebWide && styles.rowLayout]}>
        
        {/* Left Column / Main Onboarding Flow */}
        <View style={[styles.mainColumn, isWebWide && styles.flexLeft]}>
          {/* Header Info */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.welcomeText}>Melkam Ken, 👋</Text>
              <Text style={styles.userName}>{user?.name || 'Ketero Member'}</Text>
              <View style={styles.badgeRow}>
                {user?.verifiedStatus && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.badgeText}>✓ Verified Member</Text>
                  </View>
                )}
                {user?.isPremium && (
                  <View style={styles.vipBadge}>
                    <Text style={styles.badgeText}>👑 VIP Gold</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Completion Bar with Repeating Tilet Pattern and Animated Dancer */}
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionTitle}>Profile Completion</Text>
              <Text style={styles.completionVal}>{completionPercent}%</Text>
            </View>
            
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarBg}>
                <TiletProgressBar percentage={completionPercent} />
              </View>
              {/* Position Dancer cartoon at 85% */}
              <AnimatedDancer style={{ left: `${completionPercent - 6}%` }} />
            </View>
            
            <Text style={styles.completionTip}>
              Tip: Add more languages and hobbies in settings to stand out!
            </Text>
          </View>

          {/* Quick Stats Grid */}
          <Text style={styles.sectionTitle}>Your Match Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>👥</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#FFB800" />
              ) : (
                <Text style={styles.statVal}>{stats.connectionsCount}</Text>
              )}
              <Text style={styles.statLabel}>Connections</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>♥</Text>
              <Text style={styles.statVal}>{stats.likesCount}</Text>
              <Text style={styles.statLabel}>Likes Sent</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>👁️‍🗨️</Text>
              <Text style={styles.statVal}>{stats.profileViews}</Text>
              <Text style={styles.statLabel}>Profile Views</Text>
            </View>
          </View>

          {/* Pulsing Neon Glow Premium Promo Card */}
          {!user?.isPremium ? (
            <Animated.View style={[animatedGlowStyle]}>
              <TouchableOpacity
                style={styles.premiumCard}
                onPress={() => setCurrentScreen('PAYMENT')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 184, 0, 0.25)', 'rgba(229, 152, 0, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumGradient}
                >
                  <View style={styles.premiumTextContainer}>
                    <Text style={styles.premiumTitle}>Unlock Premium 👑</Text>
                    <Text style={styles.premiumDesc}>
                      Make unlimited voice & video calls directly with your connections via Telebirr or Chapa.
                    </Text>
                  </View>
                  <Text style={styles.premiumArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={[styles.premiumCard, styles.premiumActiveCard]}>
              <View style={styles.premiumTextContainer}>
                <Text style={[styles.premiumTitle, styles.premiumActiveTitle]}>Premium Unlocked 👑</Text>
                <Text style={styles.premiumActiveDesc}>
                  You are on the VIP Membership plan. Unlimited voice and video calls are fully active!
                </Text>
              </View>
            </View>
          )}

          {/* Engine Guidelines */}
          <Text style={styles.sectionTitle}>💡 Match Compatibility Engine</Text>
          <View style={styles.engineCard}>
            <View style={styles.engineRow}>
              <Text style={styles.engineIcon}>🕊️</Text>
              <View style={styles.engineTextContainer}>
                <Text style={styles.engineTitle}>Religious Matching (High Weight)</Text>
                <Text style={styles.engineDesc}>
                  Prioritizes matches within your religious background for cultural alignment.
                </Text>
              </View>
            </View>
            <View style={styles.engineRow}>
              <Text style={styles.engineIcon}>📍</Text>
              <View style={styles.engineTextContainer}>
                <Text style={styles.engineTitle}>Regional Proximity (Medium Weight)</Text>
                <Text style={styles.engineDesc}>
                  Filters connections located in your chosen city to facilitate real-world dates.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column / Spotlight Banner Overlay */}
        <View style={[styles.spotlightColumn, isWebWide && styles.flexRight]}>
          <Text style={styles.spotlightHeaderTitle}>Ketero ቀጠሮ!</Text>
          
          {/* Spotlight glowing visual beam with floating icons */}
          <View style={styles.spotlightContainer}>
            <LinearGradient
              colors={['rgba(255, 184, 0, 0.25)', 'rgba(11, 11, 13, 0)']}
              style={styles.spotlightBeam}
            />
            <SpotlightOverlay />
            
            {/* Spotlight Profile Details Card */}
            <View style={styles.glassProfileCard}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{
                    uri: user?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250',
                  }}
                  style={styles.spotlightAvatar}
                />
              </View>
              
              <Text style={styles.spotlightNameAge}>
                {user?.name || 'Ketero Member'}, {user?.age || 20}
              </Text>
              
              {/* Form Input fields formatted inside the Card */}
              <View style={styles.detailsForm}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>📞 Phone Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Enter Phone"
                    placeholderTextColor="#71717A"
                    keyboardType="phone-pad"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>✉️ Email Address</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Enter Email"
                    placeholderTextColor="#71717A"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>👤 Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter Full Name"
                    placeholderTextColor="#71717A"
                  />
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#0B0B0D" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Profile Details</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  responsiveLayout: {
    flexDirection: 'column',
    gap: 30,
  },
  rowLayout: {
    flexDirection: 'row',
  },
  flexLeft: {
    flex: 1.1,
  },
  flexRight: {
    flex: 0.9,
    alignItems: 'center',
  },
  mainColumn: {
    gap: 20,
  },
  spotlightColumn: {
    alignItems: 'center',
    gap: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  welcomeText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    color: Theme.colors.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vipBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.primaryGold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: Theme.colors.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  completionCard: {
    backgroundColor: Theme.colors.glassBg,
    borderWidth: 1,
    borderColor: Theme.colors.goldBorder,
    borderRadius: 20,
    padding: 20,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  completionTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  completionVal: {
    color: Theme.colors.primaryGold,
    fontSize: 15,
    fontWeight: 'bold',
  },
  progressBarWrapper: {
    height: 60,
    justifyContent: 'center',
    marginBottom: 5,
  },
  progressBarBg: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.goldBorder,
    overflow: 'hidden',
  },
  tiletContainer: {
    width: '100%',
    height: '100%',
  },
  dancerWrapper: {
    position: 'absolute',
    top: -24,
    width: 50,
    height: 60,
    zIndex: 10,
  },
  completionTip: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 10,
  },
  sectionTitle: {
    color: Theme.colors.primaryGold,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.glassBg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  statVal: {
    color: Theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  premiumCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.goldBorder,
    overflow: 'hidden',
    backgroundColor: Theme.colors.glassBg,
  },
  premiumGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumActiveCard: {
    borderColor: Theme.colors.success,
    backgroundColor: Theme.colors.glassBg,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  premiumTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  premiumTitle: {
    color: Theme.colors.primaryGold,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  premiumActiveTitle: {
    color: Theme.colors.success,
  },
  premiumDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  premiumActiveDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  premiumArrow: {
    color: Theme.colors.primaryGold,
    fontSize: 24,
    fontWeight: 'bold',
  },
  engineCard: {
    backgroundColor: Theme.colors.glassBg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  engineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  engineIcon: {
    fontSize: 22,
  },
  engineTextContainer: {
    flex: 1,
  },
  engineTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  engineDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  spotlightHeaderTitle: {
    color: Theme.colors.primaryGold,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 184, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  spotlightContainer: {
    width: '100%',
    maxWidth: 360,
    height: 480,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },
  spotlightBeam: {
    position: 'absolute',
    top: -100,
    width: 260,
    height: 580,
    opacity: 0.8,
    borderRadius: 130,
    transform: [{ scaleX: 1.8 }],
  },
  culturalIcon: {
    position: 'absolute',
    zIndex: 5,
  },
  glassProfileCard: {
    ...Theme.glassCard,
    width: '90%',
    alignItems: 'center',
    padding: 24,
    zIndex: 10,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: Theme.colors.primaryGold,
    shadowColor: Theme.colors.primaryGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: '#000',
    overflow: 'hidden',
    marginBottom: 16,
  },
  spotlightAvatar: {
    width: '100%',
    height: '100%',
  },
  spotlightNameAge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginBottom: 16,
  },
  detailsForm: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  textInput: {
    height: 38,
    borderColor: Theme.colors.goldBorder,
    borderBottomWidth: 1,
    color: Theme.colors.textPrimary,
    fontSize: 13,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  saveButton: {
    backgroundColor: Theme.colors.primaryGold,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: Theme.colors.primaryGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  saveButtonText: {
    color: '#0B0B0D',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

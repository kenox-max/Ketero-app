import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import useAppStore from '../store/useAppStore';
import Theme from '../styles/theme';
import Svg, { Circle, Path } from 'react-native-svg';
import StoryBar from '../components/StoryBar';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

// Individual Particle for Festive Burst
function MatchParticle({ index }) {
  const progress = useSharedValue(0);
  const angle = (index * 2 * Math.PI) / 16 + (Math.random() - 0.5) * 0.2; // 16 particles spread evenly
  const distance = 90 + Math.random() * 70;

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1200 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const x = Math.cos(angle) * distance * progress.value;
    const y = Math.sin(angle) * distance * progress.value;
    const scale = 1.6 * (1 - progress.value);
    const opacity = 1 - progress.value;
    
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: scale },
      ],
      opacity: opacity,
    };
  });

  const particleChars = ['✨', '⭐', '💛', '🌟'];
  const char = particleChars[index % particleChars.length];

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Text style={{ fontSize: 16 }}>{char}</Text>
    </Animated.View>
  );
}

export default function DiscoveryScreen() {
  const {
    token,
    user,
    apiUrl: apiBaseUrl,
    setCurrentScreen,
    setActiveChatUser,
  } = useAppStore();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchResult, setMatchResult] = useState(null); // Mutual match overlay state

  // Shared Animation Values for swiping
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    fetchDiscovery();
  }, []);

  const fetchDiscovery = async () => {
    try {
      setLoading(true);
      if (!apiBaseUrl) {
        // Fallback Mock Profiles
        const mockData = [
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
        setProfiles(mockData);
        return;
      }
      const response = await fetch(`${apiBaseUrl}/api/matches/discovery`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProfiles(data);
      }
    } catch (err) {
      console.error('Fetch discovery failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (targetUserId) => {
    try {
      if (!apiBaseUrl) {
        // Simulate a mutual match for mock profiles
        const profile = profiles.find(p => p._id === targetUserId);
        const shouldMatch = targetUserId === 'mock_user_1' || targetUserId === 'mock_user_2';
        
        if (shouldMatch) {
          setTimeout(() => {
            setMatchResult(profile);
          }, 300);
        }
        return;
      }
      const response = await fetch(`${apiBaseUrl}/api/matches/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await response.json();
      if (response.ok && data.match) {
        setMatchResult(data.targetUser);
      }
    } catch (err) {
      console.error('Like request failed:', err);
    }
  };

  // Callback executed on main thread completion of swipe
  const onSwipeCompleteJS = (direction) => {
    const item = profiles[currentIndex];
    if (item && direction === 'right') {
      handleLike(item._id);
    }
    translateX.value = 0;
    translateY.value = 0;
    setCurrentIndex(currentIndex + 1);
  };

  // Reanimated Animated Gesture Handler for Swiping
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: (event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(width + 150, { damping: 15 }, () => {
          runOnJS(onSwipeCompleteJS)('right');
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-width - 150, { damping: 15 }, () => {
          runOnJS(onSwipeCompleteJS)('left');
        });
      } else {
        translateX.value = withSpring(0, { damping: 12 });
        translateY.value = withSpring(0, { damping: 12 });
      }
    },
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = `${translateX.value / 16}deg`;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: rotate },
      ],
    };
  });

  const forceSwipe = (direction) => {
    if (direction === 'right') {
      translateX.value = withTiming(width + 150, { duration: 250 }, () => {
        runOnJS(onSwipeCompleteJS)('right');
      });
    } else {
      translateX.value = withTiming(-width - 150, { duration: 250 }, () => {
        runOnJS(onSwipeCompleteJS)('left');
      });
    }
  };

  const renderCard = () => {
    if (currentIndex >= profiles.length) {
      return (
        <View style={styles.noMoreCards}>
          <Text style={styles.noMoreText}>No more profiles near you</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchDiscovery}>
            <Text style={styles.refreshButtonText}>Reload Profiles</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const currentProfile = profiles[currentIndex];
    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <Image source={{ uri: currentProfile.profilePhoto }} style={styles.image} />
          
          <View style={styles.glassOverlayContainer}>
            <View style={styles.tagRow}>
              {currentProfile.verifiedStatus && (
                <View style={[styles.badge, styles.verifiedBadge]}>
                  <Text style={styles.badgeText}>✓ Verified</Text>
                </View>
              )}
              {currentProfile.isPremium && (
                <View style={[styles.badge, styles.premiumBadge]}>
                  <Text style={styles.badgeText}>👑 VIP</Text>
                </View>
              )}
              <View style={[styles.badge, styles.religionBadge]}>
                <Text style={styles.badgeText}>{currentProfile.religion}</Text>
              </View>
            </View>

            <View style={styles.bioContainer}>
              <Text style={styles.nameAge}>
                {currentProfile.name}, {currentProfile.age}
              </Text>
              <Text style={styles.detailsText}>📍 {currentProfile.location}</Text>
              
              {currentProfile.languages && currentProfile.languages.length > 0 && (
                <Text style={styles.detailsText}>
                  🗣 {currentProfile.languages.join(' • ')}
                </Text>
              )}

              {currentProfile.hobbies && currentProfile.hobbies.length > 0 && (
                <Text style={styles.hobbiesText}>
                  🎭 {currentProfile.hobbies.join(', ')}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB800" />
        <Text style={styles.loadingText}>Finding local vibes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ketero Discovery</Text>
        <TouchableOpacity style={styles.profileNav} onPress={() => setCurrentScreen('PROFILE')}>
          <Text style={styles.profileNavText}>👤 Profile</Text>
        </TouchableOpacity>
      </View>

      {/* 24H User Stories Bar */}
      <StoryBar token={token} apiBaseUrl={apiBaseUrl} currentUser={user} />

      <View style={styles.cardContainer}>
        {renderCard()}
      </View>

      {/* Manual Swiping Buttons */}
      {currentIndex < profiles.length && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={() => forceSwipe('left')}>
            <Text style={styles.actionBtnTextPass}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => forceSwipe('right')}>
            <Text style={styles.actionBtnTextLike}>♥</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mutual Match Overlay with Starburst Particles */}
      {matchResult && (
        <View style={styles.matchOverlay}>
          {/* Confetti Particle Emitters */}
          {Array.from({ length: 16 }).map((_, i) => (
            <MatchParticle key={i} index={i} />
          ))}

          <Text style={styles.matchTitle}>ቀጠሮ! (Ketero)</Text>
          <Text style={styles.matchSubtitle}>It's a Match! You and {matchResult.name} matched.</Text>
          
          <View style={styles.matchImageContainer}>
            <Image source={{ uri: matchResult.profilePhoto }} style={styles.matchImage} />
          </View>

          <Text style={styles.matchMessage}>Text chatting is completely free between matched partners!</Text>

          <TouchableOpacity
            style={styles.matchButton}
            onPress={() => {
              const matchedUser = matchResult;
              setMatchResult(null);
              setActiveChatUser(matchedUser);
              setCurrentScreen('CHAT');
            }}
          >
            <Text style={styles.matchButtonText}>Open Free Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.matchCloseButton}
            onPress={() => setMatchResult(null)}
          >
            <Text style={styles.matchCloseButtonText}>Keep Swiping</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.primaryGold,
  },
  profileNav: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileNavText: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  card: {
    width: width * 0.9,
    maxWidth: 380,
    height: height * 0.58,
    maxHeight: 520,
    borderRadius: 24,
    backgroundColor: Theme.colors.glassBg,
    borderWidth: 1,
    borderColor: Theme.colors.goldBorder,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  glassOverlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11, 11, 13, 0.4)',
    padding: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  verifiedBadge: {
    backgroundColor: '#1DA1F2',
  },
  premiumBadge: {
    backgroundColor: Theme.colors.primaryGold,
  },
  religionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bioContainer: {
    backgroundColor: 'rgba(22, 20, 28, 0.85)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.12)',
  },
  nameAge: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  hobbiesText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
  },
  noMoreCards: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  noMoreText: {
    fontSize: 18,
    color: Theme.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: Theme.colors.primaryGold,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 25,
  },
  actionBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  passBtn: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderWidth: 1.5,
    borderColor: '#E63946',
  },
  likeBtn: {
    backgroundColor: Theme.colors.primaryGold,
  },
  actionBtnTextPass: {
    fontSize: 20,
    color: '#E63946',
    fontWeight: 'bold',
  },
  actionBtnTextLike: {
    fontSize: 24,
    color: '#0B0B0D',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Theme.colors.textSecondary,
    marginTop: 15,
    fontSize: 15,
  },
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 11, 13, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 1000,
  },
  matchTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: Theme.colors.primaryGold,
    marginBottom: 8,
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 184, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  matchSubtitle: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 30,
  },
  matchImageContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: Theme.colors.primaryGold,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: Theme.colors.primaryGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  matchImage: {
    width: '100%',
    height: '100%',
  },
  matchMessage: {
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  matchButton: {
    width: '85%',
    maxWidth: 300,
    backgroundColor: Theme.colors.primaryGold,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: Theme.colors.primaryGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  matchButtonText: {
    color: '#0B0B0D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchCloseButton: {
    paddingVertical: 10,
  },
  matchCloseButtonText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  particle: {
    position: 'absolute',
    zIndex: 100,
  },
});

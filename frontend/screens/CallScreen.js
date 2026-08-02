import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function CallScreen({ callData, onHangUp }) {
  const { callType, targetUser } = callData;
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Animated values for voice call ripple effect
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  // Connection timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Voice call ripple animation loop
  useEffect(() => {
    if (callType === 'voice') {
      const animatePulse = () => {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, {
              toValue: 2,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim1, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim2, {
              toValue: 2.5,
              duration: 2000,
              delay: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => animatePulse());
      };

      animatePulse();
    }
  }, [callType]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {callType === 'video' ? (
        // --- VIDEO CALL UI ---
        <View style={styles.fullscreenContent}>
          {/* Main Remote User Video Mockup */}
          {isVideoOff ? (
            <View style={styles.videoPlaceholder}>
              <Image source={{ uri: targetUser.profilePhoto }} style={styles.blurredAvatar} blurRadius={10} />
              <Text style={styles.videoPlaceholderText}>{targetUser.name}'s camera is off</Text>
            </View>
          ) : (
            <Image source={{ uri: targetUser.profilePhoto }} style={styles.fullVideoFeed} />
          )}

          {/* Mini Local Video self-preview */}
          <View style={styles.localVideoPreview}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' }}
              style={styles.localVideoFeed}
            />
          </View>

          {/* Caller Details Card Overlay */}
          <View style={styles.topDetails}>
            <Text style={styles.callerName}>{targetUser.name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.liveIndicator} />
              <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            </View>
          </View>
        </View>
      ) : (
        // --- VOICE CALL UI ---
        <View style={styles.voiceContent}>
          <Text style={styles.voiceTitle}>Ketero P2P Voice Call</Text>
          <Text style={styles.timerTextVoice}>{formatTime(seconds)}</Text>

          {/* Rippling profile photo */}
          <View style={styles.avatarWrapper}>
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [{ scale: pulseAnim1 }],
                  opacity: pulseAnim1.interpolate({
                    inputRange: [1, 2],
                    outputRange: [0.6, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [{ scale: pulseAnim2 }],
                  opacity: pulseAnim2.interpolate({
                    inputRange: [1, 2.5],
                    outputRange: [0.4, 0],
                  }),
                },
              ]}
            />
            <Image source={{ uri: targetUser.profilePhoto }} style={styles.voiceAvatar} />
          </View>

          <Text style={styles.voiceCallerName}>{targetUser.name}</Text>
          <Text style={styles.voiceLocation}>📍 {targetUser.location}</Text>
        </View>
      )}

      {/* CALL CONTROLS */}
      <View style={styles.controlsBar}>
        {/* Toggle Mute */}
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Text style={styles.controlIcon}>{isMuted ? '🎙️' : '🎙️'}</Text>
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {/* Hang Up */}
        <TouchableOpacity style={[styles.controlBtn, styles.hangUpBtn]} onPress={onHangUp}>
          <Text style={styles.hangUpIcon}>📞</Text>
          <Text style={styles.controlLabel}>End</Text>
        </TouchableOpacity>

        {/* Toggle Video Feed */}
        {callType === 'video' ? (
          <TouchableOpacity
            style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]}
            onPress={() => setIsVideoOff(!isVideoOff)}
          >
            <Text style={styles.controlIcon}>📹</Text>
            <Text style={styles.controlLabel}>{isVideoOff ? 'Cam On' : 'Cam Off'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.controlBtn} onPress={() => {}}>
            <Text style={styles.controlIcon}>🔊</Text>
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  fullscreenContent: {
    flex: 1,
    position: 'relative',
  },
  fullVideoFeed: {
    width: width,
    height: height,
    position: 'absolute',
  },
  videoPlaceholder: {
    width: width,
    height: height,
    position: 'absolute',
    backgroundColor: '#1F1F1F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurredAvatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'absolute',
    opacity: 0.3,
  },
  videoPlaceholderText: {
    color: '#FFF',
    fontSize: 16,
    zIndex: 10,
  },
  localVideoPreview: {
    position: 'absolute',
    right: 20,
    top: 70,
    width: 100,
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E4A853',
    overflow: 'hidden',
    backgroundColor: '#222',
    zIndex: 100,
    elevation: 10,
  },
  localVideoFeed: {
    width: '100%',
    height: '100%',
  },
  topDetails: {
    position: 'absolute',
    left: 20,
    top: 70,
    zIndex: 90,
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  timerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  voiceContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  voiceTitle: {
    fontSize: 16,
    color: '#E4A853',
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  timerTextVoice: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 10,
    fontWeight: '600',
  },
  avatarWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 60,
    position: 'relative',
  },
  voiceAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#E4A853',
    zIndex: 10,
  },
  rippleRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#E4A853',
    zIndex: 1,
  },
  voiceCallerName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
  },
  voiceLocation: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlBtn: {
    alignItems: 'center',
    width: 70,
  },
  controlBtnActive: {
    opacity: 0.5,
  },
  controlIcon: {
    fontSize: 24,
    color: '#FFF',
    backgroundColor: '#2C2C2C',
    width: 50,
    height: 50,
    borderRadius: 25,
    textAlign: 'center',
    lineHeight: 50,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  controlLabel: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 6,
  },
  hangUpBtn: {
    width: 80,
  },
  hangUpIcon: {
    fontSize: 24,
    color: '#FFF',
    backgroundColor: '#E63946',
    width: 60,
    height: 60,
    borderRadius: 30,
    textAlign: 'center',
    lineHeight: 60,
    transform: [{ rotate: '135deg' }],
  },
});

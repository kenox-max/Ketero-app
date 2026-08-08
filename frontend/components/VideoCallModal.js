import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { VideoView } from '../services/webrtcShim';
import { useWebRTC } from '../services/webrtcService';
import Theme from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function VideoCallModal({ visible, targetUser, sdpOffer, onClose }) {
  if (!visible || !targetUser) return null;

  const [callTime, setCallTime] = useState(0);
  const {
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    callStatus,
    initiateCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useWebRTC(targetUser._id);

  // Auto-initiate or accept call when modal opens
  useEffect(() => {
    if (visible) {
      if (sdpOffer) {
        console.log('Incoming call offer detected. Accepting call...');
        acceptCall(sdpOffer);
      } else {
        console.log('Outbound call initiated. Dialing peer...');
        initiateCall('video');
      }
    }
    return () => {
      endCall();
    };
  }, [visible]);

  // Call duration timer
  useEffect(() => {
    let timer = null;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallTime((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHangUp = () => {
    endCall();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleHangUp}
    >
      <SafeAreaView style={styles.container}>
        {/* Fullscreen Remote Stream */}
        <View style={styles.videoContainer}>
          {remoteStream ? (
            <VideoView stream={remoteStream} style={styles.remoteVideo} />
          ) : (
            <View style={styles.placeholderBg}>
              <Image
                source={{ uri: targetUser.profilePhoto }}
                style={styles.placeholderAvatar}
                blurRadius={Platform.OS === 'web' ? 8 : 15}
              />
              <View style={styles.placeholderOverlay}>
                <Text style={styles.connectingText}>
                  {callStatus === 'dialing'
                    ? 'Calling...'
                    : callStatus === 'incoming'
                    ? 'Incoming Call...'
                    : 'Connecting Video...'}
                </Text>
                <Text style={styles.userName}>{targetUser.name}</Text>
              </View>
            </View>
          )}

          {/* Floating Picture-in-Picture Local Video Stream */}
          {localStream && !isCameraOff && (
            <View style={styles.pipContainer}>
              <VideoView stream={localStream} style={styles.localVideo} mirror={true} />
            </View>
          )}

          {/* Top Info Bar */}
          <View style={styles.topInfoBar}>
            <Text style={styles.callerLabel}>{targetUser.name}</Text>
            {callStatus === 'connected' && (
              <View style={styles.timeBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.timeText}>{formatDuration(callTime)}</Text>
              </View>
            )}
          </View>

          {/* Bottom Controls Glass Panel */}
          <View style={styles.controlsOverlay}>
            <View style={styles.glassControlsBar}>
              {/* Toggle Audio Mute */}
              <TouchableOpacity
                style={[styles.controlBtn, isMuted && styles.activeControlBtn]}
                onPress={toggleMute}
              >
                <Text style={styles.controlIcon}>{isMuted ? '🎙️' : '🎙️'}</Text>
                <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
              </TouchableOpacity>

              {/* End Call (Red Button) */}
              <TouchableOpacity style={styles.hangUpBtn} onPress={handleHangUp}>
                <Text style={styles.hangUpIcon}>📞</Text>
              </TouchableOpacity>

              {/* Toggle Camera Off */}
              <TouchableOpacity
                style={[styles.controlBtn, isCameraOff && styles.activeControlBtn]}
                onPress={toggleCamera}
              >
                <Text style={styles.controlIcon}>{isCameraOff ? '📹' : '📹'}</Text>
                <Text style={styles.controlLabel}>{isCameraOff ? 'Cam On' : 'Cam Off'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  placeholderBg: {
    flex: 1,
    backgroundColor: '#131018',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderAvatar: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    opacity: 0.35,
  },
  placeholderOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  connectingText: {
    color: Theme.colors.primaryGold,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  userName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  pipContainer: {
    position: 'absolute',
    top: 30,
    right: 20,
    width: 105,
    height: 150,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Theme.colors.primaryGold,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  topInfoBar: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 90,
  },
  callerLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 11, 13, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
    marginRight: 6,
  },
  timeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  glassControlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
    backgroundColor: 'rgba(22, 20, 28, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 30,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  controlBtn: {
    alignItems: 'center',
    opacity: 0.9,
  },
  activeControlBtn: {
    opacity: 0.45,
  },
  controlIcon: {
    fontSize: 20,
    color: '#FFF',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 44,
    height: 44,
    borderRadius: 22,
    textAlign: 'center',
    lineHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlLabel: {
    color: '#A0A0AA',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  hangUpBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  hangUpIcon: {
    fontSize: 22,
    color: '#FFF',
    transform: [{ rotate: '135deg' }],
  },
});

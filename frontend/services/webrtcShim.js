import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

let RTCPeerConnectionShim;
let RTCIceCandidateShim;
let RTCSessionDescriptionShim;
let mediaDevicesShim;
let RTCViewShim;

if (Platform.OS === 'web') {
  RTCPeerConnectionShim = window.RTCPeerConnection;
  RTCIceCandidateShim = window.RTCIceCandidate;
  RTCSessionDescriptionShim = window.RTCSessionDescription;
  mediaDevicesShim = window.navigator.mediaDevices;
} else {
  // Using require to prevent Metro from compiling native imports on Web
  const WebRTC = require('react-native-webrtc');
  RTCPeerConnectionShim = WebRTC.RTCPeerConnection;
  RTCIceCandidateShim = WebRTC.RTCIceCandidate;
  RTCSessionDescriptionShim = WebRTC.RTCSessionDescription;
  mediaDevicesShim = WebRTC.mediaDevices;
  RTCViewShim = WebRTC.RTCView;
}

// Cross-Platform Video stream rendering component
export function VideoView({ stream, style, mirror = false }) {
  const videoRef = useRef(null);

  if (Platform.OS === 'web') {
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    if (!stream) return <View style={[styles.fallbackBg, style]} />;

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={mirror} // Mute local stream preview to prevent echo
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: mirror ? 'scaleX(-1)' : 'none',
          ...StyleSheet.flatten(style),
        }}
      />
    );
  } else {
    // Native Mobile Implementation
    if (!stream || !RTCViewShim) return <View style={[styles.fallbackBg, style]} />;

    return (
      <RTCViewShim
        streamURL={stream.toURL()}
        style={style}
        objectFit="cover"
        mirror={mirror}
      />
    );
  }
}

const styles = StyleSheet.create({
  fallbackBg: {
    backgroundColor: '#1C1917',
  },
});

export {
  RTCPeerConnectionShim as RTCPeerConnection,
  RTCIceCandidateShim as RTCIceCandidate,
  RTCSessionDescriptionShim as RTCSessionDescription,
  mediaDevicesShim as mediaDevices,
};

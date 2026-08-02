import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices } from './webrtcShim';
import useAppStore from '../store/useAppStore';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTC(targetUserId) {
  const { socket, activeCallData, setActiveCallData, setCurrentScreen } = useAppStore();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'dialing' | 'incoming' | 'connected'
  
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  // Initialize Media Stream
  const startLocalStream = async (videoEnabled = true, audioEnabled = true) => {
    try {
      console.log('Requesting local media stream (camera & mic)...');
      const stream = await mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Error getting local user media:', error);
      alert('Camera and Microphone permissions are required to place a call.');
      return null;
    }
  };

  // Setup RTCPeerConnection
  const setupPeerConnection = (stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Add local tracks to peer connection
    if (stream) {
      if (Platform.OS === 'web') {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      } else {
        // react-native-webrtc addStream support
        pc.addStream(stream);
      }
    }

    // Handle remote track/stream addition
    pc.ontrack = (event) => {
      console.log('ontrack received remote stream');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };
    pc.onaddstream = (event) => {
      console.log('onaddstream received remote stream');
      setRemoteStream(event.stream);
    };

    // Send ICE candidates to target user
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && targetUserId) {
        socket.emit('ice-candidate', {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  };

  // Place outbound call
  const initiateCall = async (type = 'video') => {
    setCallStatus('dialing');
    const isVideo = type === 'video';
    const stream = await startLocalStream(isVideo, true);
    if (!stream) {
      setCallStatus('idle');
      return;
    }

    const pc = setupPeerConnection(stream);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket && targetUserId) {
        socket.emit('call-user', {
          targetUserId,
          sdpOffer: offer,
        });
      }
    } catch (err) {
      console.error('Failed to create offer:', err);
      endCall();
    }
  };

  // Accept inbound call
  const acceptCall = async (sdpOffer) => {
    setCallStatus('connected');
    const stream = await startLocalStream(true, true);
    if (!stream) {
      endCall();
      return;
    }

    const pc = setupPeerConnection(stream);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket && targetUserId) {
        socket.emit('answer-call', {
          targetUserId,
          sdpAnswer: answer,
        });
      }
    } catch (err) {
      console.error('Failed to accept call & set SDP Answer:', err);
      endCall();
    }
  };

  // Clean up Peer Connection & Media tracks
  const endCall = (emitEvent = true) => {
    console.log('Ending call and cleaning WebRTC connections...');
    
    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteStream(null);

    // Close PeerConnection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Emit socket event to remote peer
    if (emitEvent && socket && targetUserId) {
      socket.emit('end-call', { targetUserId });
    }

    setCallStatus('idle');
    setActiveCallData(null);
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera Off
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  // Socket.io WebRTC Listeners lifecycle
  useEffect(() => {
    if (!socket || !targetUserId) return;

    socket.on('incoming-call', ({ callerId, callerName, sdpOffer }) => {
      console.log(`Incoming call from: ${callerName}`);
      setCallStatus('incoming');
      setActiveCallData({
        sessionId: `call_${callerId}_${Date.now()}`,
        callerId,
        callerName,
        sdpOffer,
        callType: 'video',
      });
    });

    socket.on('call-answered', ({ sdpAnswer }) => {
      console.log('Call answered. Finalizing remote description SDP Answer');
      setCallStatus('connected');
      if (pcRef.current) {
        pcRef.current.setRemoteDescription(new RTCSessionDescription(sdpAnswer))
          .catch((err) => console.error('Error setting remote description:', err));
      }
    });

    socket.on('ice-candidate', ({ candidate }) => {
      if (pcRef.current && candidate) {
        console.log('Adding remote ICE Candidate...');
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          .catch((err) => console.error('Error adding remote ICE candidate:', err));
      }
    });

    socket.on('end-call', () => {
      console.log('Remote peer hung up. Ending call...');
      endCall(false);
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-answered');
      socket.off('ice-candidate');
      socket.off('end-call');
    };
  }, [socket, targetUserId]);

  return {
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
  };
}

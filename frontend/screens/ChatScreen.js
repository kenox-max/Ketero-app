import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import io from 'socket.io-client';
import useAppStore from '../store/useAppStore';

export default function ChatScreen({
  token,
  apiBaseUrl,
  matchedUser,
  currentUserIsPremium,
  onNavigateBack,
  onNavigateToCall,
  onShowPaymentPaywall,
}) {
  const { setActiveCallData } = useAppStore();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    // If running in local simulation (offline mode), load welcome messages
    if (!apiBaseUrl) {
      setMessages([
        {
          senderId: matchedUser._id,
          senderName: matchedUser.name,
          text: `Selam! I'm so glad we matched on Ketero. 😊`,
          timestamp: new Date(Date.now() - 60000),
        },
      ]);
      return;
    }

    // Fetch message history from backend
    const fetchChatHistory = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/messages/${matchedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setMessages(data);
          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 150);
        } else {
          console.warn('Failed to load chat history:', data.error);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    fetchChatHistory();

    // 1. Initialize Socket Connection
    socketRef.current = io(apiBaseUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    // 2. Listen to Connection events
    socket.on('connect', () => {
      console.log('Connected to socket server');
      // Join the private chat room for this match
      socket.emit('join_match_room', { targetUserId: matchedUser._id });
    });

    socket.on('room_joined', ({ roomId }) => {
      console.log(`Successfully joined room: ${roomId}`);
    });

    socket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    socket.on('error_message', (data) => {
      Alert.alert('Chat Notice', data.message);
    });

    // Clean up on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [matchedUser._id, token, apiBaseUrl]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    if (!apiBaseUrl) {
      // Local simulation: append message locally
      const myMessage = {
        senderId: 'mock_me',
        senderName: 'Me',
        text: inputText.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, myMessage]);
      setInputText('');
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        targetUserId: matchedUser._id,
        text: inputText.trim(),
      });
      setInputText('');
    }
  };

  // Triggers call check (voice: free for all, video: premium gated)
  const handleInitiateCall = async (type) => {
    if (!apiBaseUrl) {
      if (type === 'video' && !currentUserIsPremium) {
        onShowPaymentPaywall({
          providerOptions: ['Telebirr', 'Chapa'],
          message: 'Upgrade to Premium using Telebirr or Chapa to access Video Calls. Voice calls are 100% free!',
        });
        return;
      }
      setActiveCallData({
        sessionId: `mock_call_${Date.now()}`,
        callType: type,
        targetUser: matchedUser,
      });
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: matchedUser._id,
          callType: type,
        }),
      });

      const data = await response.json();

      if (response.status === 200 && data.success) {
        setActiveCallData({
          sessionId: data.sessionId,
          callType: type,
          targetUser: matchedUser,
        });
      } else if (response.status === 403 && data.code === 'PREMIUM_REQUIRED') {
        onShowPaymentPaywall({
          providerOptions: data.paymentGateways,
          message: data.message,
        });
      } else {
        Alert.alert('Call Error', data.error || 'Unable to connect call.');
      }
    } catch (err) {
      console.error('Call initiation request failed:', err);
      Alert.alert('Call Error', 'Could not establish connection to the server.');
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.senderId !== matchedUser._id;
    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
        {!isMe && (
          <Image source={{ uri: matchedUser.profilePhoto }} style={styles.chatAvatar} />
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
            {item.text}
          </Text>
          <Text style={styles.timeText}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Chat Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={onNavigateBack}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Image source={{ uri: matchedUser.profilePhoto }} style={styles.avatar} />
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.headerName}>{matchedUser.name}</Text>
              {matchedUser.verifiedStatus && (
                <Text style={styles.verifiedIcon}>✓</Text>
              )}
            </View>
            <Text style={styles.statusText}>Connected (Free Chat)</Text>
          </View>
        </View>

        {/* Video & Voice call buttons (Premium Gated) */}
        <View style={styles.callControls}>
          <TouchableOpacity style={styles.callBtn} onPress={() => handleInitiateCall('voice')}>
            <Text style={styles.callBtnText}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={() => handleInitiateCall('video')}>
            <Text style={styles.callBtnText}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
    backgroundColor: '#1E1E1E',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingRight: 12,
  },
  backBtnText: {
    color: '#E4A853',
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifiedIcon: {
    color: '#1DA1F2',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#888',
    fontSize: 11,
  },
  callControls: {
    flexDirection: 'row',
    gap: 12,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  callBtnText: {
    fontSize: 16,
  },
  messageList: {
    padding: 16,
    paddingBottom: 30,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  myRow: {
    alignSelf: 'flex-end',
  },
  theirRow: {
    alignSelf: 'flex-start',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: '#E4A853', // Ethiopian Gold
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: {
    color: '#121212',
    fontWeight: '500',
  },
  theirText: {
    color: '#FFF',
  },
  timeText: {
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderColor: '#2C2C2C',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#151515',
    color: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: '#E4A853',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

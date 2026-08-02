import { create } from 'zustand';
import io from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '../config/api';

export const useAppStore = create((set, get) => ({
  // Authentication & Profile State
  user: null,
  token: null,
  isPremium: false,
  
  // Socket State
  socket: null,

  // Navigation & Screen routing State
  currentScreen: 'LOGIN', // 'LOGIN', 'ONBOARDING', 'DASHBOARD', 'DISCOVERY', 'CONTACTS', 'PROFILE', 'CHAT', 'CALL', 'PAYMENT'
  
  // Active context States
  activeChatUser: null,
  activeCallData: null,
  activePaywallData: null,
  
  // API Endpoint configuration
  apiUrl: API_BASE_URL,

  // Actions
  setUser: (user) => set({ 
    user, 
    isPremium: !!user?.isPremium 
  }),
  
  setToken: (token) => {
    set({ token });
    if (token) {
      get().connectSocket(token);
    }
  },
  
  connectSocket: (tokenToUse) => {
    const { apiUrl, socket } = get();
    if (socket) {
      socket.disconnect();
    }
    const jwt = tokenToUse || get().token;
    const targetSocketUrl = SOCKET_URL || apiUrl;
    if (!jwt || !targetSocketUrl) return;

    console.log(`Initializing global Socket.io client to ${targetSocketUrl}...`);
    const newSocket = io(targetSocketUrl, {
      auth: { token: jwt },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Global socket connected');
    });

    newSocket.on('incoming-call', ({ callerId, callerName, sdpOffer }) => {
      console.log(`Incoming call from: ${callerName}`);
      set({
        activeCallData: {
          sessionId: `call_${callerId}_${Date.now()}`,
          callerId,
          callerName,
          sdpOffer,
          callType: 'video',
          targetUser: {
            _id: callerId,
            name: callerName,
            profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
          }
        }
      });
    });

    newSocket.on('end-call', () => {
      console.log('Call ended by remote peer');
      set({ activeCallData: null });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  
  setActiveChatUser: (chatUser) => set({ activeChatUser: chatUser }),
  
  setActiveCallData: (callData) => set({ activeCallData: callData }),
  
  setActivePaywallData: (paywallData) => set({ activePaywallData: paywallData }),
  
  setApiUrl: (url) => set({ apiUrl: url }),
  
  logout: () => {
    get().disconnectSocket();
    set({
      user: null,
      token: null,
      isPremium: false,
      currentScreen: 'LOGIN',
      activeChatUser: null,
      activeCallData: null,
      activePaywallData: null
    });
  },
}));

export default useAppStore;

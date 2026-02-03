import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import environment from '@/environment/environment';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import axios from 'axios';

// ========================== TYPES ==========================
interface Notification {
  id: number;
  orderId: number;
  title: string;
  readStatus: boolean;
  createdAt: string;
  invNo: string;
  orderStatus: string;
  cusId: string;
  customerId: string;
  customerName: string;
  phoneNumber: string;
  orderid: number;
  status: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  popupNotification: Notification | null;
  clearPopup: () => void;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  testSound: () => Promise<void>;
  testNotification: () => void;
}

// ========================== CONTEXT ==========================
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  popupNotification: null,
  clearPopup: () => {},
  refreshNotifications: async () => {},
  isLoading: true,
  error: null,
  testSound: async () => {},
  testNotification: () => {},
});

export const useSocket = () => useContext(SocketContext);

// ========================== PROVIDER ==========================
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupNotification, setPopupNotification] = useState<Notification | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const isMounted = useRef(true);
  const isFirstLoad = useRef(true);
  const player = useAudioPlayer(require("@/assets/sounds/p2.mp3"));

  // ========================== AUDIO FUNCTIONS ==========================
  
  /**
   * Initialize audio with proper settings for notifications
   */
  const initializeAudio = async () => {
    try {
      console.log('🎵 Initializing audio...');
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionModeAndroid: 'duckOthers',
        interruptionMode: 'mixWithOthers',
        allowsRecording: false,
      });
      setIsAudioInitialized(true);
      console.log('✅ Audio initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize audio:', error);
    }
  };

  /**
   * Play notification sound
   */
  const playNotificationSound = async () => {
    console.log('🔊 ========== PLAY NOTIFICATION SOUND ==========');
    console.log('🔊 playNotificationSound called');
    console.log('   - isMounted:', isMounted.current);
    console.log('   - isAudioInitialized:', isAudioInitialized);
    
    if (!isMounted.current) {
      console.log('⏭️ Skipping sound - component unmounted');
      return;
    }
    
    try {
      if (!isAudioInitialized) {
        console.log('🎵 Audio not initialized, initializing now...');
        await initializeAudio();
      }
      
      console.log('🎵 Seeking to start...');
      player.seekTo(0);
      
      console.log('🎵 Playing...');
      await player.play();
      
      console.log('✅ Notification sound played successfully');
    } catch (error) {
      console.error("❌ Error playing sound:", error);
    }
    console.log('🔊 ==========================================');
  };

  /**
   * Test sound function (for debugging)
   */
  const testSound = async () => {
    console.log('🧪 Testing sound manually...');
    await playNotificationSound();
  };

  // ========================== API FUNCTIONS ==========================
  
  /**
   * Fetch notifications from REST API
   */
  const fetchNotificationsFromAPI = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        console.log('⏭️ No auth token - skipping notification fetch');
        setIsLoading(false);
        return;
      }

      console.log('📥 Fetching notifications from API...');
      console.log('   - URL:', `${environment.API_BASE_URL}api/notifications/`);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/notifications/`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        }
      );

      if (!isMounted.current) {
        console.log('⏭️ Component unmounted during fetch, skipping state update');
        return;
      }

      const data = response.data.data || {};
      const fetchedNotifications = data.notifications || [];
      const fetchedUnreadCount = data.unreadCount || 0;
      
      console.log('📊 API Response:');
      console.log('   - Total notifications:', fetchedNotifications.length);
      console.log('   - Unread count:', fetchedUnreadCount);
      
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedUnreadCount);
      setIsLoading(false);
      setError(null);
      
      console.log(`✅ Fetched ${fetchedNotifications.length} notifications, ${fetchedUnreadCount} unread`);
      
    } catch (err: any) {
      console.error('❌ Failed to fetch notifications:', err.message);
      console.error('   - Error details:', err.response?.data || err);
      if (isMounted.current) {
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        setError('Failed to load notifications');
      }
    }
  };

  /**
   * Refresh notifications - callable from any component
   */
  const refreshNotifications = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      console.log('🔄 Refreshing notifications...');

      // Try socket first if connected
      if (socketRef.current?.connected) {
        console.log('📤 Using socket to fetch notifications');
        socketRef.current.emit('fetch_notifications');
      } else {
        console.log('📡 Socket not connected, using API fallback');
        await fetchNotificationsFromAPI();
      }
    } catch (error) {
      console.error('❌ Failed to refresh notifications:', error);
      // Fallback to API on error
      await fetchNotificationsFromAPI();
    }
  };

  // ========================== SOCKET FUNCTIONS ==========================
  
  /**
   * Initialize Socket.IO connection
   */
  const initializeSocket = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      
      if (!token) {
        console.log('⏭️ No auth token - skipping socket initialization');
        setIsLoading(false);
        return;
      }

      // Disconnect existing socket if any
      if (socketRef.current) {
        console.log('🔌 Disconnecting existing socket...');
        socketRef.current.disconnect();
      }

      // Extract base URL (remove the path)
      const baseUrl = environment.API_BASE_URL
        .replace('/agro-api/salesdash/', '')
        .replace('/agro-api/salesdash', '');
      
      console.log('🔍 ========== SOCKET INITIALIZATION ==========');
      console.log('   - Base URL:', baseUrl);
      console.log('   - Path: /agro-api/salesdash/socket.io');
      console.log('   - Token length:', token.length);
      console.log('===============================================');

      // Create socket connection
      const newSocket = io(baseUrl, {
        path: '/agro-api/salesdash/socket.io',
        auth: {
          token: token
        },
        transports: ['polling', 'websocket'], // Try polling first
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        timeout: 20000,
        autoConnect: true,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // ============ EVENT HANDLERS ============
      
      /**
       * Socket connected successfully
       */
      newSocket.on('connect', async () => {
        console.log('✅ ========== SOCKET CONNECTED ==========');
        console.log('   - Socket ID:', newSocket.id);
        console.log('   - Transport:', newSocket.io.engine.transport.name);
        console.log('   - Time:', new Date().toISOString());
        console.log('=========================================');
        
        if (isMounted.current) {
          setIsConnected(true);
          setError(null);
          
          // IMPORTANT: Fetch notifications when socket connects
          console.log('📥 Fetching notifications after socket connection...');
          await fetchNotificationsFromAPI();
        }
      });

      /**
       * Received connection confirmation from server
       */
      newSocket.on('connected', async (data) => {
        console.log('📱 ========== SERVER CONNECTION CONFIRMED ==========');
        console.log('   - Message:', data.message);
        console.log('   - Sales Agent ID:', data.salesAgentId);
        console.log('   - Socket ID:', data.socketId);
        console.log('   - Timestamp:', data.timestamp);
        console.log('===================================================');
        
        // Fetch notifications on server confirmation
        if (isMounted.current) {
          console.log('📥 Fetching notifications after server confirmation...');
          await fetchNotificationsFromAPI();
        }
      });

      /**
       * Socket disconnected
       */
      newSocket.on('disconnect', (reason) => {
        console.log('❌ ========== SOCKET DISCONNECTED ==========');
        console.log('   - Reason:', reason);
        console.log('   - Time:', new Date().toISOString());
        console.log('===========================================');
        
        if (isMounted.current) {
          setIsConnected(false);
          if (reason === 'io server disconnect') {
            // Server disconnected, try to reconnect
            console.log('🔄 Server initiated disconnect, attempting reconnection...');
            newSocket.connect();
          }
        }
      });

      /**
       * Connection error
       */
      newSocket.on('connect_error', (error) => {
        console.error('❌ ========== SOCKET CONNECTION ERROR ==========');
        console.error('   - Message:', error.message);
        console.error('   - Details:', error);
        console.error('===============================================');
        
        if (isMounted.current) {
          setIsConnected(false);
          setError('Connection error. Retrying...');
        }
      });

      /**
       * Reconnection attempt
       */
      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      });

      /**
       * Successfully reconnected
       */
      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`✅ ========== RECONNECTED ==========`);
        console.log(`   - After ${attemptNumber} attempts`);
        console.log(`===================================`);
        
        if (isMounted.current) {
          setIsConnected(true);
          setError(null);
          fetchNotificationsFromAPI();
        }
      });

      /**
       * Failed to reconnect after all attempts
       */
      newSocket.on('reconnect_failed', () => {
        console.error('❌ Failed to reconnect after all attempts');
        if (isMounted.current) {
          setError('Connection lost. Please restart the app.');
        }
      });

      /**
       * New notification received in real-time
       */
      newSocket.on('new_notification', async (data) => {
        console.log('🔔 ========== NEW NOTIFICATION EVENT ==========');
        console.log('🔔 Received at:', new Date().toISOString());
        console.log('🔔 Raw data:', JSON.stringify(data, null, 2));
        console.log('🔔 Current state:');
        console.log('   - isMounted:', isMounted.current);
        console.log('   - isFirstLoad:', isFirstLoad.current);
        console.log('   - isConnected:', isConnected);
        
        if (!isMounted.current) {
          console.log('⚠️ Component unmounted, ignoring notification');
          console.log('==============================================');
          return;
        }
        
        // Update notifications list
        if (data.notifications) {
          console.log('📝 Updating notifications list:');
          console.log('   - New count:', data.notifications.length);
          console.log('   - First notification:', data.notifications[0]?.title);
          setNotifications(data.notifications);
        } else {
          console.log('⚠️ No notifications array in data');
        }
        
        if (data.unreadCount !== undefined) {
          console.log('🔢 Updating unread count:', data.unreadCount);
          setUnreadCount(data.unreadCount);
        } else {
          console.log('⚠️ No unreadCount in data');
        }
        
        // Show popup and play sound (skip on first load)
        console.log('🎯 Checking if should show popup...');
        console.log('   - data.notification exists:', !!data.notification);
        console.log('   - data.notification:', data.notification);
        console.log('   - isFirstLoad:', isFirstLoad.current);
        
        if (data.notification && !isFirstLoad.current) {
          console.log('✅ Conditions met - showing popup and playing sound');
          console.log('   - Notification title:', data.notification.title);
          console.log('   - Notification ID:', data.notification.id);
          
          setPopupNotification(data.notification);
          console.log('🎨 Popup state updated');
          
          console.log('🔊 Triggering sound...');
          await playNotificationSound();
        } else {
          console.log('⏭️ Skipping popup/sound');
          if (!data.notification) {
            console.log('   - Reason: No notification object in data');
          }
          if (isFirstLoad.current) {
            console.log('   - Reason: Still in first load period');
          }
        }
        
        console.log('🔔 ==============================================');
      });

      /**
       * Notifications list updated (from fetch_notifications response)
       */
      newSocket.on('notifications_update', (data) => {
        console.log('🔄 ========== NOTIFICATIONS UPDATE ==========');
        console.log('   - Notifications count:', data.notifications?.length || 0);
        console.log('   - Unread count:', data.unreadCount);
        console.log('============================================');
        
        if (isMounted.current) {
          if (data.notifications) {
            setNotifications(data.notifications);
          }
          if (data.unreadCount !== undefined) {
            setUnreadCount(data.unreadCount);
          }
        }
      });

      /**
       * Notification error from server
       */
      newSocket.on('notification_error', (error) => {
        console.error('❌ ========== NOTIFICATION ERROR ==========');
        console.error('   - Message:', error.message);
        console.error('   - Error:', error);
        console.error('===========================================');
        
        if (isMounted.current) {
          setError(error.message || 'Notification error occurred');
        }
      });

      /**
       * Transport changed (polling -> websocket or vice versa)
       */
      newSocket.io.engine.on('upgrade', (transport) => {
        console.log('🔄 ========== TRANSPORT UPGRADE ==========');
        console.log('   - New transport:', transport.name);
        console.log('=========================================');
      });

      console.log('✅ Socket event handlers registered');

    } catch (error) {
      console.error('❌ ========== SOCKET INITIALIZATION ERROR ==========');
      console.error('   - Error:', error);
      console.error('===================================================');
      
      if (isMounted.current) {
        setError('Failed to connect to notification service');
        setIsLoading(false);
      }
    }
  };

  /**
   * Test notification function (for debugging)
   */
  const testNotification = () => {
    console.log('🧪 ========== TEST NOTIFICATION ==========');
    
    const testNotif: Notification = {
      id: 9999,
      orderId: 9999,
      title: 'Test Notification',
      readStatus: false,
      createdAt: new Date().toISOString(),
      invNo: 'TEST-001',
      orderStatus: 'Processing',
      cusId: '1',
      customerId: '1',
      customerName: 'Test Customer',
      phoneNumber: '1234567890',
      orderid: 9999,
      status: 'Processing'
    };

    console.log('   - Creating test notification:', testNotif);
    console.log('   - isFirstLoad:', isFirstLoad.current);
    
    // Temporarily set isFirstLoad to false for testing
    const wasFirstLoad = isFirstLoad.current;
    isFirstLoad.current = false;
    
    setPopupNotification(testNotif);
    playNotificationSound();
    
    console.log('   - Popup state updated');
    console.log('   - Sound triggered');
    
    // Restore isFirstLoad state after 5 seconds
    setTimeout(() => {
      isFirstLoad.current = wasFirstLoad;
      console.log('   - Restored isFirstLoad state');
    }, 5000);
    
    console.log('=========================================');
  };

  // ========================== LIFECYCLE ==========================
  
  /**
   * Initialize on mount
   */
  useEffect(() => {
    isMounted.current = true;

    const setup = async () => {
      console.log('🚀 ========== SOCKET PROVIDER INITIALIZATION ==========');
      console.log('   - Time:', new Date().toISOString());
      console.log('======================================================');
      
      await initializeAudio();
      await initializeSocket();
      
      // Mark as not first load after delay
      setTimeout(() => {
        isFirstLoad.current = false;
        console.log('✅ ========== FIRST LOAD COMPLETE ==========');
        console.log('   - Notifications will now trigger popups');
        console.log('   - Time:', new Date().toISOString());
        console.log('===========================================');
      }, 2000);
    };

    setup();

    // Cleanup on unmount
    return () => {
      console.log('🧹 ========== SOCKET PROVIDER CLEANUP ==========');
      console.log('   - Time:', new Date().toISOString());
      
      isMounted.current = false;
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('🔌 Socket disconnected on unmount');
      }
      
      try {
        if (player) {
          player.pause();
          player.seekTo(0);
          console.log('🔇 Audio player cleaned up');
        }
      } catch (error) {
        console.log('⏭️ Audio cleanup skipped (already released)');
      }
      
      console.log('===============================================');
    };
  }, []);

  // ========================== UTILITIES ==========================
  
  /**
   * Clear popup notification
   */
  const clearPopup = () => {
    console.log('🗑️ Clearing popup notification');
    setPopupNotification(null);
  };

  // ========================== CONTEXT VALUE ==========================
  
  const value: SocketContextType = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    popupNotification,
    clearPopup,
    refreshNotifications,
    isLoading,
    error,
    testSound,
    testNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
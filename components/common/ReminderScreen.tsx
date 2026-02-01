// Here's the corrected implementation with better sound handling:

import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import ReminderScreenSkeleton from "../Skeleton/ReminderSkeleton";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import {  useAudioPlayer,setAudioModeAsync } from 'expo-audio';
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Global state management
let globalUnreadCount = 0;
let unreadCountListeners: ((count: number) => void)[] = [];

export const subscribeToUnreadCount = (listener: (count: number) => void) => {
  unreadCountListeners.push(listener);
  listener(globalUnreadCount);
  
  return () => {
    unreadCountListeners = unreadCountListeners.filter(l => l !== listener);
  };
};

const updateGlobalUnreadCount = (count: number) => {
  globalUnreadCount = count;
  unreadCountListeners.forEach(listener => listener(count));
};

// Interfaces
type ReminderScreenNavigationProp = StackNavigationProp<RootStackParamList, "ReminderScreen">;

interface ReminderScreenProps {
  navigation: ReminderScreenNavigationProp;
}

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
  status:string
}

const ReminderScreen: React.FC<ReminderScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [ status ,setStatus] = useState('')
  const insets = useSafeAreaInsets();
  
  const previousNotificationsCount = useRef(0);
 const player = useAudioPlayer(require("../../assets/sounds/p2.mp3"));
   const highestNotificationId = useRef(0);
  const isFirstLoad = useRef(true);

  // Update global unread count whenever local unreadCount changes
  useEffect(() => {
    updateGlobalUnreadCount(unreadCount);
  }, [unreadCount]);

  // Initialize audio properly
  const initializeAudio = async () => {
    try {

      await setAudioModeAsync({
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionModeAndroid: 'duckOthers',
  interruptionMode: 'mixWithOthers',
  allowsRecording: false,
  
});
      
      setIsAudioInitialized(true);
    } catch (error) {
      console.error('❌ Failed to initialize audio:', error);
    }
  };


  const playNotificationSound = async () => {
    try {
      if (!isAudioInitialized) await initializeAudio();

      // If already at end, reset to beginning
      player.seekTo(0);
      await player.play();
    } catch (error) {
      console.error("Error playing sound via expo-audio:", error);
    }
  };
const fetchNotifications = async () => {
  try {
    setError(null);
    
    const storedToken = await AsyncStorage.getItem("authToken");
    const response = await axios.get(`${environment.API_BASE_URL}api/notifications/`, {
      headers: {
        Authorization: `Bearer ${storedToken}`
      }
    });

    const data = response.data.data || {};
    const newNotifications = data.notifications || [];
    const newUnreadCount = data.unreadCount || 0;
    
    
    // Update state
    setNotifications(newNotifications);
    setUnreadCount(newUnreadCount);
    setIsLoading(false);
    
    // Check for new notifications and play sound if needed
    if (newNotifications.length > 0) {
      const maxId = Math.max(...newNotifications.map((n: Notification) => n.id));
      
      if (!isFirstLoad.current && maxId > highestNotificationId.current) {
        await playNotificationSound();
      }
      
      highestNotificationId.current = maxId;
    }
    
  } catch (err) {
    console.error('❌ Failed to fetch notifications:', err);
    setError('Failed to load notifications. Please try again.');
    setNotifications([]);
    setUnreadCount(0);
    setIsLoading(false);
  } finally {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
  }
};



useEffect(() => {
  const setupComponent = async () => {
    await initializeAudio();
    await fetchNotifications();
  };

  setupComponent();

  const intervalId = setInterval(() => {
    fetchNotifications();
  }, 12000);

  return () => {
    clearInterval(intervalId);
    player.pause();
    player.seekTo(0);
  };
}, []);




  const showDeleteModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const markAsRead = async (id: number) => {
  try {
    const notificationToUpdate = notifications.find(n => n.id === id);
    
    if (notificationToUpdate && !notificationToUpdate.readStatus) {
      const storedToken = await AsyncStorage.getItem("authToken");
      await axios.patch(`${environment.API_BASE_URL}api/notifications/mark-read/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      });

      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, readStatus: true } : n
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    if (notificationToUpdate) {
      // Pass all necessary data including status to View_CancelOrderScreen
      navigation.navigate("View_CancelOrderScreen" as any, {
        orderId: notificationToUpdate.orderid,
        userId: notificationToUpdate.cusId || notificationToUpdate.customerId,
        status: notificationToUpdate.status
       
      });
    }
  } catch (err) {
    console.error('❌ Failed to mark as read:', err);
  }
};

  const deleteNotification = async () => {
    if (!selectedNotification) return;
  
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      await axios.delete(`${environment.API_BASE_URL}api/notifications/${selectedNotification.id}`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      });
  
      setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
      
      if (!selectedNotification.readStatus) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setModalVisible(false);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setError('Failed to delete notification');
    }
  };

  const getNotificationIcon = (title: string) => {
    switch(title) {
      case 'Payment reminder ':
        return require("../../assets/images/payment-method.webp");
      case 'Order is Processing':
        return require("../../assets/images/time-management.webp");
      case 'Order is Out for Delivery':
        return require("../../assets/images/fast-shipping.webp");
      case 'Order is Cancelled':
        return require("../../assets/images/OrderisCancelled.webp");
      case 'Driver has collected the order':
        return require("../../assets/images/delivery-courier.webp")
      default:
        return require("../../assets/images/notification.webp");
    }
  };

  const isEmpty = !notifications || notifications.length === 0;

  return (
    <View className="flex-1 bg-white">
      {isLoading ? (
        <ReminderScreenSkeleton />
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 text-lg">{error}</Text>
          <TouchableOpacity 
            onPress={fetchNotifications}
            className="mt-4 bg-blue-500 px-4 py-2 rounded"
          >
            <Text className="text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <LinearGradient
            colors={["#854BDA", "#6E3DD1"]}
            style={{
              height: hp(10),
              width: wp(100),
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: wp(4.5), color: 'white', fontWeight: 'bold' }}>
              {unreadCount} Unread Notifications
            </Text>
          </LinearGradient>

          <View style={{ flex: 1, paddingVertical: hp(2) }}>
            {isEmpty ? (
              <View className="flex-1 justify-center items-center px-4 ">
                <Image 
                  source={require("../../assets/images/notification.webp")} 
                  style={{ width: wp("50%"), height: hp("20%"), resizeMode: "contain" }} 
                />
                <Text className="text-black text-center mt-4 font-bold text-1xl">
                  No Notification Yet
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 120 }}
                renderItem={({ item }) => {
                  const itemStyle = item.readStatus ? "bg-white" : "bg-[#F4EDFF]";
                  return (
                    <TouchableOpacity 
                      onPress={() => markAsRead(item.id)} 
                      activeOpacity={0.8}
                    >
                      <View className={`shadow-md p-4 mb-3  flex-row justify-between items-center rounded-lg ${itemStyle}`}>
                        <Image 
                          source={getNotificationIcon(item.title)} 
                          style={{ width: 30, height: 30 }} 
                        />
                        <View className="flex-1 ml-5">
                          <Text className="text-gray-800 font-bold">{item.title}</Text>
                          <Text className="text-gray-600">Order No: {item.invNo}</Text>
                          <Text className="text-gray-600">Customer ID: {item.customerId}</Text>
                        </View>

                        <TouchableOpacity onPress={() => showDeleteModal(item)}>
                          <MaterialIcons name="more-vert" size={24} color="black" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          <Modal
  animationType="fade"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
  statusBarTranslucent={true}
>
  <View 
    className="flex-1 justify-end bg-black/20 mb-5"
    style={{ paddingBottom: insets.bottom }}
  >
    {/* Backdrop - tap to close */}
    <TouchableOpacity 
      className="flex-1" 
      activeOpacity={1} 
      onPress={() => setModalVisible(false)}
    />
    
    {/* Modal content */}
    <View className="bg-white rounded-t-3xl px-4 py-5">
      <TouchableOpacity
        className="flex-row items-center p-3 rounded-lg active:bg-gray-100"
        onPress={deleteNotification}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../assets/images/cancel.webp")}
          className="w-6 h-6"
        />
        <Text className="ml-4 text-base font-semibold text-gray-800">
          Remove this notification
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
        </>
      )}
    </View>
  );
};

export default ReminderScreen;
import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import ReminderScreenSkeleton from "../components/Skeleton/ReminderSkeleton";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import { Audio } from "expo-av"; 

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
  customerName: string;
  phoneNumber: string;
}

const ReminderScreen: React.FC<ReminderScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousNotificationsCount = useRef(0); // Keep track of the previous notification count
  const sound = useRef<Audio.Sound | null>(null);

  // Function to play notification sound
  const playNotificationSound = async () => {
    try {
      if (sound.current) {
        await sound.current.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../assets/sounds/p2.mp3'), // Make sure to add this MP3 file to your assets
        { shouldPlay: true }
      );
      
      sound.current = newSound;
      
      // Unload sound after it finishes playing
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          sound.current?.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const highestNotificationId = useRef(0);

  const fetchNotifications = async () => {
    console.log("Fetching notifications...");
    try {
      setIsLoading(false);
      setError(null);
      
      const storedToken = await AsyncStorage.getItem("authToken");
      const response = await axios.get(`${environment.API_BASE_URL}api/notifications/`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      });

      console.log("responsesblkvadj",response.data)
      
      const data = response.data.data || {};
      const newNotifications = data.notifications || [];
      const newUnreadCount = data.unreadCount || 0;
      
      // Find the highest notification ID in the new data
      if (newNotifications.length > 0) {
        const maxId = Math.max(...newNotifications.map((n: { id: any; }) => n.id));
        console.log("Max ID:", maxId);
        console.log("Previous Max ID:", highestNotificationId.current);
        
        // Check if we have a new highest ID and we're not on the first load
        if (!isLoading && maxId > highestNotificationId.current) {
          console.log("✅ New notifications detected! Playing sound...");
          playNotificationSound();
        } else {
          console.log("❌ No new notifications detected");
        }
        
        // Update our reference for next time
        highestNotificationId.current = maxId;
      }

      console.log("unreadjkdhsvla",newUnreadCount)
      
      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again.');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load sound on component mount
    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Failed to set audio mode:', error);
      }
    };
    
    loadSound();
    
    // Initial fetch
    fetchNotifications();
  
    // Set up interval for periodic fetching (every 2 minutes)
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 12000); // 2 minutes in milliseconds
  
    // Clean up interval and sound on component unmount
    return () => {
      clearInterval(intervalId);
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  const showDeleteModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const markAsRead = async (id: number) => {
    try {
      // Find the notification first
      const notificationToUpdate = notifications.find(n => n.id === id);
      
      // Only proceed if the notification exists and is unread
      if (notificationToUpdate && !notificationToUpdate.readStatus) {
        const storedToken = await AsyncStorage.getItem("authToken");
        await axios.patch(`${environment.API_BASE_URL}api/notifications/mark-read/${id}`, {}, {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });
  
        // Update local state
        setNotifications(prev => prev.map(n => 
          n.id === id ? { ...n, readStatus: true } : n
        ));
        
        // Only decrement if it was previously unread
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const deleteNotification = async () => {
    if (!selectedNotification) return;
  
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      // Change to delete by notification ID (not orderId)
      await axios.delete(`${environment.API_BASE_URL}api/notifications/${selectedNotification.id}`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      });
  
      // Filter by the same ID we deleted
      setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
      
      // Update unread count if needed
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
        return require("../assets/images/payment-method.webp");
      case 'Order is Processing':
        return require("../assets/images/time-management.webp");
      case 'Order is Out for Delivery':
        return require("../assets/images/fast-shipping.webp");
      default:
        return require("../assets/images/notification.webp");
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

          <View style={{ flex: 1, paddingVertical: hp(2),padding:8 }}>
            {isEmpty ? (
              <View className="flex-1 justify-center items-center px-4 ">
                <Image 
                  source={require("../assets/images/notification.webp")} 
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
                      <View className={`shadow-md p-4 mb-3 mx-3 flex-row justify-between items-center rounded-lg ${itemStyle}`}>
                        <Image 
                          source={getNotificationIcon(item.title)} 
                          style={{ width: 30, height: 30 }} 
                        />
                        <View className="flex-1 ml-5">
                          <Text className="text-gray-800 font-bold">{item.title}</Text>
                          <Text className="text-gray-600">Order No: {item.invNo}</Text>
                          <Text className="text-gray-600">Customer ID: {item.cusId}</Text>
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
          >
            <View className="flex-1 justify-end bg-[#00000033]">
              <View className="bg-white w-full p-2 rounded-t-lg mr-4">
                <View className="flex-row justify-between mt-3">
                  <TouchableOpacity 
                    className="flex-1 p-2 rounded-lg mr-4" 
                    onPress={deleteNotification}
                  >
                    <View className="flex-row">
                      <Image 
                        source={require("../assets/images/cancel.webp")} 
                        style={{ width: 24, height: 24, marginRight: 6 }} 
                      />
                      <Text className="items-center ml-4 text-bold">
                        Remove this notification
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

export default ReminderScreen;
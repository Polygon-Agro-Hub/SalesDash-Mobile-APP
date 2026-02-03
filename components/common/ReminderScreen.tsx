import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Modal, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import ReminderScreenSkeleton from "../Skeleton/ReminderSkeleton";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSocket } from "@/context/SocketContext"; // USE CONTEXT

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
  status: string;
}

// Notification Popup Component
const NotificationPopup = ({ 
  notification, 
  onClose 
}: { 
  notification: Notification | null; 
  onClose: () => void;
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (notification) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(4000),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onClose());
    }
  }, [notification]);

  if (!notification) return null;

  return (
    <Animated.View 
      style={{
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        transform: [{ translateY: slideAnim }],
        zIndex: 9999,
      }}
    >
      <TouchableOpacity onPress={onClose} activeOpacity={0.9}>
        <View 
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            borderLeftWidth: 4,
            borderLeftColor: '#854BDA',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Image 
            source={require("../../assets/images/notification.webp")} 
            style={{ width: 40, height: 40 }} 
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: 'bold', color: '#1F2937', fontSize: 16 }}>
              {notification.title}
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>
              Order: {notification.invNo}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
              {notification.customerName}
            </Text>
          </View>
          <MaterialIcons name="close" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ReminderScreen: React.FC<ReminderScreenProps> = ({ navigation }) => {
  // USE SOCKET CONTEXT
  const { 
    isConnected, 
    notifications, 
    unreadCount, 
    popupNotification, 
    clearPopup,
    refreshNotifications 
  } = useSocket();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const insets = useSafeAreaInsets();

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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
        await axios.patch(
          `${environment.API_BASE_URL}api/notifications/mark-read/${id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${storedToken}`
            }
          }
        );

        // Refresh notifications
        await refreshNotifications();
      }

      if (notificationToUpdate) {
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
      await axios.delete(
        `${environment.API_BASE_URL}api/notifications/${selectedNotification.id}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        }
      );
  
      // Refresh notifications
      await refreshNotifications();
      setModalVisible(false);
    } catch (err) {
      console.error('❌ Failed to delete notification:', err);
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
        return require("../../assets/images/delivery-courier.webp");
      default:
        return require("../../assets/images/notification.webp");
    }
  };

  const isEmpty = !notifications || notifications.length === 0;

  return (
    <View className="flex-1 bg-white">
      {/* Notification Popup */}
      <NotificationPopup 
        notification={popupNotification} 
        onClose={clearPopup} 
      />

      {isLoading ? (
        <ReminderScreenSkeleton />
      ) : error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-500 text-lg text-center mb-4">{error}</Text>
          <TouchableOpacity 
            onPress={refreshNotifications}
            className="bg-purple-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <LinearGradient
            colors={["#854BDA", "#6E3DD1"]}
            style={{
              height: hp(12),
              width: wp(100),
              justifyContent: "center",
              alignItems: "center",
              paddingTop: insets.top,
            }}
          >
            <View className="flex-row items-center">
              <View 
                className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} 
              />
              <Text style={{ fontSize: wp(5), color: 'white', fontWeight: 'bold' }}>
                {unreadCount} Unread Notification{unreadCount !== 1 ? 's' : ''}
              </Text>
            </View>
            {!isConnected && (
              <Text style={{ fontSize: wp(3), color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                Reconnecting...
              </Text>
            )}
          </LinearGradient>

          <View style={{ flex: 1, paddingVertical: hp(2) }}>
            {isEmpty ? (
              <View className="flex-1 justify-center items-center px-4">
                <Image 
                  source={require("../../assets/images/notification.webp")} 
                  style={{ width: wp("50%"), height: hp("20%"), resizeMode: "contain" }} 
                />
                <Text className="text-gray-800 text-center mt-6 font-bold text-xl">
                  No Notifications Yet
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  You'll see notifications here when you receive them
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
                renderItem={({ item }) => {
                  const itemStyle = item.readStatus ? "bg-white" : "bg-[#F4EDFF]";
                  return (
                    <TouchableOpacity 
                      onPress={() => markAsRead(item.id)} 
                      activeOpacity={0.8}
                    >
                      <View 
                        className={`shadow-md p-4 mb-3 flex-row justify-between items-center rounded-xl ${itemStyle}`}
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor: item.readStatus ? '#E5E7EB' : '#854BDA',
                        }}
                      >
                        <Image 
                          source={getNotificationIcon(item.title)} 
                          style={{ width: 36, height: 36 }} 
                        />
                        <View className="flex-1 ml-4">
                          <Text className="text-gray-800 font-bold text-base">
                            {item.title}
                          </Text>
                          <Text className="text-gray-600 text-sm mt-1">
                            Order: {item.invNo}
                          </Text>
                          <Text className="text-gray-500 text-xs mt-1">
                            Customer: {item.customerName}
                          </Text>
                        </View>

                        <TouchableOpacity 
                          onPress={() => showDeleteModal(item)}
                          className="p-2"
                        >
                          <MaterialIcons name="more-vert" size={24} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          {/* Delete Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
            statusBarTranslucent={true}
          >
            <View 
              className="flex-1 justify-end bg-black/20"
              style={{ paddingBottom: insets.bottom }}
            >
              <TouchableOpacity 
                className="flex-1" 
                activeOpacity={1} 
                onPress={() => setModalVisible(false)}
              />
              
              <View className="bg-white rounded-t-3xl px-4 py-6">
                <TouchableOpacity
                  className="flex-row items-center p-4 rounded-xl active:bg-gray-100"
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
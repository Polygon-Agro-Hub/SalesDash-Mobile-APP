import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import ReminderScreenSkeleton from "./ReminderSkeleton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

let globalUnreadCount = 0;
let unreadCountListeners: ((count: number) => void)[] = [];

export const subscribeToUnreadCount = (listener: (count: number) => void) => {
  unreadCountListeners.push(listener);
  listener(globalUnreadCount);

  return () => {
    unreadCountListeners = unreadCountListeners.filter((l) => l !== listener);
  };
};

export const updateGlobalUnreadCount = (count: number) => {
  globalUnreadCount = count;
  unreadCountListeners.forEach((listener) => listener(count));
};

type ReminderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReminderScreen"
>;

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
  reportStatus: string;
  cusId: string;
  customerId: string;
  customerName: string;
  phoneNumber: string;
  orderid: number;
  status: string;
}

// Module-level persistent dummy notifications
let localDummyNotifications: Notification[] = [
  {
    id: 1,
    orderId: 1024,
    title: "Order is Processing",
    readStatus: false,
    createdAt: new Date().toISOString(),
    invNo: "78394",
    orderStatus: "Processing",
    reportStatus: "Pending",
    cusId: "406",
    customerId: "406",
    customerName: "Pasindu Perera",
    phoneNumber: "+94771234567",
    orderid: 1024,
    status: "Processing",
  },
  {
    id: 2,
    orderId: 1025,
    title: "Payment Reminder",
    readStatus: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    invNo: "78395",
    orderStatus: "Ordered",
    reportStatus: "Approved",
    cusId: "407",
    customerId: "407",
    customerName: "Pasindu Perera",
    phoneNumber: "+94771234567",
    orderid: 1025,
    status: "Ordered",
  },
  {
    id: 3,
    orderId: 1026,
    title: "Order is Delivered",
    readStatus: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    invNo: "78396",
    orderStatus: "Delivered",
    reportStatus: "Delivered",
    cusId: "408",
    customerId: "408",
    customerName: "Pasindu Perera",
    phoneNumber: "+94771234567",
    orderid: 1026,
    status: "Delivered",
  }
];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReminderScreen: React.FC<ReminderScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>(localDummyNotifications);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const highestNotificationId = useRef(0);
  const isFirstLoad = useRef(true);

  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, []),
  );

  useEffect(() => {
    updateGlobalUnreadCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    const unsubscribe = subscribeToUnreadCount((count) => {
      if (count !== unreadCount && !isLoading) {
        fetchNotifications();
      }
    });
    return unsubscribe;
  }, [unreadCount, isLoading]);

  const fetchNotifications = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setNotifications([...localDummyNotifications]);
      setIsLoading(false);
    }, 400); // Small delay to simulate loading
  };

  // Update unread count automatically when notifications state updates
  useEffect(() => {
    const unread = notifications.filter((n) => !n.readStatus).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 12000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const showDeleteModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const markAsRead = (id: number) => {
    localDummyNotifications = localDummyNotifications.map((n) =>
      n.id === id ? { ...n, readStatus: true } : n
    );
    setNotifications([...localDummyNotifications]);

    const notificationToUpdate = localDummyNotifications.find((n) => n.id === id);
    if (notificationToUpdate) {
      navigation.navigate("View_CancelOrderScreen" as any, {
        orderId: notificationToUpdate.orderid,
        userId: notificationToUpdate.cusId || notificationToUpdate.customerId,
        status: notificationToUpdate.status,
        reportStatus: notificationToUpdate.reportStatus,
      });
    }
  };

  const deleteNotification = () => {
    if (!selectedNotification) return;

    localDummyNotifications = localDummyNotifications.filter(
      (n) => n.id !== selectedNotification.id
    );
    setNotifications([...localDummyNotifications]);
    setModalVisible(false);
  };

  const getNotificationIcon = (title: string) => {
    switch (title) {
      case "Payment Reminder":
        return require("@/assets/images/reminder/payment-method.webp");
      case "Order is Processing":
        return require("@/assets/images/reminder/time-management.webp");
      case "Order is Out for Delivery":
        return require("@/assets/images/reminder/out-for-delivery.webp");
      case "Order is Cancelled":
        return require("@/assets/images/reminder/order-cancelled.webp");
      case "Order is Delivered":
        return require("@/assets/images/reminder/order-is-elivered.webp");
      case "Driver has collected the order":
        return require("@/assets/images/reminder/delivery-courier.webp");
      case "Order is on the way":
        return require("@/assets/images/reminder/fast-shipping.webp");
      default:
        return require("@/assets/images/reminder/reminder.webp");
    }
  };

  const isEmpty = !notifications || notifications.length === 0;

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={["#854BDA", "#6E3DD1"]}
        style={{
          height: 80,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View className="w-full max-w-[500px] items-center justify-center">
          <Text
            className="text-white font-bold"
            style={{ fontSize: SCREEN_HEIGHT > 900 ? 20 : 18 }}
          >
            {unreadCount} Unread Notifications
          </Text>
        </View>
      </LinearGradient>

      {isLoading && isFirstLoad.current ? (
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
        <View className="flex-1 mx-auto w-full max-w-[500px] px-6">
          <View style={{ flex: 1, paddingVertical: 16 }}>
            {isEmpty ? (
              <View className="flex-1 justify-center items-center mb-10">
                <Image
                  source={require("@/assets/images/reminder/reminder.webp")}
                  style={{
                    width: wp("50%"),
                    height: hp("20%"),
                    resizeMode: "contain",
                  }}
                />
                <Text className="text-black text-center mt-4 font-bold text-xl">
                  No Notification Yet
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                ref={flatListRef}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 120 }}
                renderItem={({ item }) => {
                  const itemStyle = item.readStatus
                    ? "bg-white"
                    : "bg-[#F4EDFF]";
                  return (
                    <View
                      className={`shadow-md p-4 mb-3  flex-row justify-between items-center rounded-lg ${itemStyle}`}
                    >
                      <Image
                        source={getNotificationIcon(item.title)}
                        style={{ width: 45, height: 45 }}
                      />
                      <View className="flex-1 ml-5">
                        <Text
                          className="text-gray-800 font-bold"
                          style={{ fontSize: SCREEN_HEIGHT > 900 ? 18 : 14 }}
                        >
                          {item.title}
                        </Text>
                        <Text
                          className="text-gray-600"
                          style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                        >
                          Order No: #{item.invNo}
                        </Text>
                        <Text
                          className="text-gray-600"
                          style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                        >
                          Customer ID: {item.customerId}
                        </Text>
                      </View>

                      <TouchableOpacity onPress={() => showDeleteModal(item)}>
                        <MaterialIcons
                          name="more-vert"
                          size={24}
                          color="black"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )}
          </View>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
            statusBarTranslucent={true}
          >
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}>
              {/* Backdrop - tap to close */}
              <TouchableOpacity
                className="flex-1"
                activeOpacity={1}
                onPress={() => setModalVisible(false)}
              />

              <View
                className="bg-white rounded-t-3xl mx-auto w-full"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingBottom: insets.bottom,
                }}
              >
                <TouchableOpacity
                  className="flex-row items-center p-4 pt-6 active:bg-gray-50 px-6"
                  onPress={deleteNotification}
                  activeOpacity={0.7}
                >
                  <View className="w-12 h-12 bg-[#D4D4D44D] rounded-full items-center justify-center">
                    <Image
                      source={require("@/assets/images/reminder/cancel.webp")}
                      className="w-10 h-10"
                      resizeMode="contain"
                    />
                  </View>

                  <Text className="ml-4 text-base font-semibold text-gray-800">
                    Remove this notification
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
};

export default ReminderScreen;

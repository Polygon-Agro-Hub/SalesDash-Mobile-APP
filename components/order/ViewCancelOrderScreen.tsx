import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  Linking,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import environment from "@/environment/environment";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "../common/CustomHeader";
import LoadingPage from "../common/LoadingPage";

type View_CancelOrderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "View_CancelOrderScreen"
>;
type View_CancelOrderScreenRouteProp = RouteProp<
  RootStackParamList,
  "View_CancelOrderScreen"
>;

interface View_CancelOrderScreenProps {
  navigation: View_CancelOrderScreenNavigationProp;
  route: View_CancelOrderScreenRouteProp;
}

interface Order {
  orderId: number;
  userId: number;
  deliveryType: string;
  scheduleDate: string;
  scheduleTimeSlot: string;
  weeklyDate: string;
  total: string;
  discount: string;
  fullTotal: string;
  paymentMethod: string;
  paymentStatus: number;
  orderStatus: string;
  createdAt: string;
  InvNo: string;
  reportStatus: string;
  status: string;
  fullSubTotal: string | null;
  fullDiscount: string | null;
  deleteStatus: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  buildingType: string;
  fullAddress: string;
  invoiceNumber?: string;
  sheduleDate?: string;
  sheduleTime?: string;
  sheduleType?: string;
  title?: string;
}

interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
}

interface CustomerData {
  title?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  buildingType?: string;
  buildingDetails?: {
    buildingNo?: string;
    unitNo?: string;
    buildingName?: string;
    floorNo?: string;
    houseNo?: string;
    streetName?: string;
    city?: string;
  };
}

interface HoldEvent {
  holdReason: string | null;
  otherReason?: string | null;
  isHold: boolean;
  restartedTime: string | null;
}

const View_CancelOrderScreen: React.FC<View_CancelOrderScreenProps> = ({
  navigation,
  route,
}) => {
  const { orderId, userId, status, reportStatus } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportOption, setSelectedReportOption] = useState<
    string | null
  >(null);
  const [tempSelectedReportOption, setTempSelectedReportOption] = useState<
    string | null
  >(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isPackage, setIsPackage] = useState();
  const [returnReason, setReturnReason] = useState<string | null>(null);

  const [holdEvents, setHoldEvents] = useState<HoldEvent[]>([]);

  const isHoldOrder = holdEvents.some((e) => e.isHold);
  const wasOnHold = holdEvents.length > 0;

  const holdReason =
    holdEvents.length > 0
      ? holdEvents[holdEvents.length - 1].holdReason === "Other" &&
        holdEvents[holdEvents.length - 1].otherReason
        ? holdEvents[holdEvents.length - 1].otherReason!
        : holdEvents[holdEvents.length - 1].holdReason
      : null;

  useEffect(() => {
    if (reportStatus) setSelectedReportOption(reportStatus);
  }, [reportStatus]);

  const fetchHoldStatus = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get(
        `${environment.API_BASE_URL}api/orders/get-hold-reason/${orderId}`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
      );

      if (response.data.success && response.data.data) {
        const raw = response.data.data;

        const events: HoldEvent[] = (Array.isArray(raw) ? raw : [raw])

          .filter(
            (item: any) =>
              item.isHold === true ||
              item.isHold === 1 ||
              item.holdReason != null,
          )
          .map((item: any) => ({
            holdReason: item.holdReason ?? null,
            otherReason: item.otherReason ?? null,
            isHold: Boolean(item.isHold),
            restartedTime: item.restartedTime ?? null,
          }));

        setHoldEvents(events);
      } else {
        setHoldEvents([]);
      }
    } catch (error) {
      console.error("Error fetching hold status:", error);
      setHoldEvents([]);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      const fetchOrderDetails = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            `${environment.API_BASE_URL}api/orders/get-order/${orderId}`,
          );
          if (response.data.success) {
            setOrder(response.data.data);
            const orderData = response.data.data;
            if (orderData.fullAddress) {
              await fetchDeliveryFee(
                orderData.fullAddress,
                orderData.userId || userId,
              );
              setIsPackage(orderData.isPackage);
            }
          } else {
            setError("Failed to load order details");
          }
        } catch (err) {
          console.error("Error fetching order details:", err);
          setError("An error occurred while fetching order details");
        } finally {
          setLoading(false);
        }
      };

      fetchOrderDetails();
      fetchHoldStatus();
    }, [orderId, userId, fetchHoldStatus]),
  );

  useEffect(() => {
    fetchHoldStatus();
  }, [fetchHoldStatus]);

  const fetchDeliveryFee = async (
    fullAddress: string,
    customerUserId?: number,
  ) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;
      if (customerUserId || userId) {
        const custData = await fetchCustomerData(customerUserId || userId);
        if (custData && custData.buildingDetails?.city) {
          const cityName = custData.buildingDetails.city;
          const cityResponse = await axios.get<{ data: City[] }>(
            `${environment.API_BASE_URL}api/customer/get-city`,
            { headers: { Authorization: `Bearer ${storedToken}` } },
          );
          if (cityResponse.data && cityResponse.data.data) {
            const cityData = cityResponse.data.data.find(
              (c) => c.city.toLowerCase() === cityName.toLowerCase(),
            );
            if (cityData) setDeliveryFee(parseFloat(cityData.charge) || 0);
          }
          return;
        }
      }
      const addressParts = fullAddress.split(", ");
      let cityName =
        addressParts.length >= 2
          ? addressParts[addressParts.length - 2].trim()
          : "";
      if (cityName) {
        const cityResponse = await axios.get<{ data: City[] }>(
          `${environment.API_BASE_URL}api/customer/get-city`,
          { headers: { Authorization: `Bearer ${storedToken}` } },
        );
        if (cityResponse.data && cityResponse.data.data) {
          const cityData = cityResponse.data.data.find(
            (c) => c.city.toLowerCase() === cityName.toLowerCase(),
          );
          if (cityData) setDeliveryFee(parseFloat(cityData.charge) || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching delivery fee:", error);
    }
  };

  const fetchCustomerData = async (
    customerUserId: number,
  ): Promise<CustomerData | null> => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return null;
      const response = await axios.get(
        `${environment.API_BASE_URL}api/orders/get-customer-data/${customerUserId}`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
      );
      if (response.data && response.data.success) {
        setCustomerData(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      console.error("Error fetching customer data:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchReturnReason = async () => {
      if (status === "Return") {
        try {
          const storedToken = await AsyncStorage.getItem("authToken");
          if (!storedToken) return;
          const response = await axios.get(
            `${environment.API_BASE_URL}api/orders/get-return-reason/${orderId}`,
            { headers: { Authorization: `Bearer ${storedToken}` } },
          );
          if (response.data.success && response.data.data) {
            const { returnReason: reason, otherReason } = response.data.data;
            setReturnReason(
              reason === "Other" && otherReason ? otherReason : reason,
            );
          }
        } catch (error) {
          console.error("Error fetching return reason:", error);
        }
      }
    };
    fetchReturnReason();
  }, [orderId, status]);

  const formatDateShort = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `on ${date.getDate()}${getDaySuffix(date.getDate())} ${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
  };

  const getDaySuffix = (day: number) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const isAfter6PM = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString).getHours() >= 18;
  };

  const getActualStatus = () => {
    if (!order) return "";
    if (status === "Cancelled") return "Cancelled";
    if (status === "Ordered" && isAfter6PM(order.createdAt))
      return "Processing";
    return status;
  };

  const isCancelDisabled = () => {
    if (!order) return true;
    const actualStatus = getActualStatus();
    return [
      "On the way",
      "Processing",
      "Out For Delivery",
      "Collected",
      "Delivered",
      "Return",
      "Cancelled",
      "Hold",
    ].includes(actualStatus);
  };

  const handleReportStatus = () => {
    setTempSelectedReportOption(selectedReportOption);
    setReportModalVisible(true);
  };

  const handleConfirmReport = async () => {
    if (!tempSelectedReportOption) {
      Alert.alert(
        "Please select an option",
        "You must select a report status option.",
      );
      return;
    }
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert(
          "Error",
          "Authentication token not found. Please log in again.",
        );
        setLoading(false);
        return;
      }
      const response = await axios.post(
        `${environment.API_BASE_URL}api/orders/report-order/${orderId}`,
        { reportStatus: tempSelectedReportOption },
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.data.success) {
        setSelectedReportOption(tempSelectedReportOption);
        setReportModalVisible(false);
        setTempSelectedReportOption(null);
      } else
        Alert.alert(
          "Error",
          response.data.message || "Failed to update report status",
        );
    } catch (error) {
      console.error("Error updating report status:", error);
      Alert.alert("Error", "Failed to update report status. Please try again.");
    }
  };

  const handleCloseReportModal = () => {
    setReportModalVisible(false);
    setTempSelectedReportOption(null);
  };

  const isTimelineItemActive = (itemStatus: string) => {
    if (!order) return false;
    const orderStatuses = [
      "Ordered",
      "Processing",
      "Out For Delivery",
      "Collected",
      "On the way",
      "Hold",
      "Delivered",
    ];
    const actualStatus = getActualStatus();
    if (actualStatus === "Cancelled")
      return itemStatus === "Ordered" || itemStatus === "Cancelled";
    if (actualStatus === "Return")
      return itemStatus !== "Delivered" && itemStatus !== "Cancelled";
    if (itemStatus === "Hold")
      return (
        actualStatus === "Hold" ||
        (wasOnHold &&
          ["On the way", "Delivered", "Return"].includes(actualStatus))
      );
    if (
      itemStatus === "Delivered" &&
      isHoldOrder &&
      actualStatus === "Delivered"
    )
      return true;
    const currentIndex = orderStatuses.indexOf(actualStatus);
    const itemIndex = orderStatuses.indexOf(itemStatus);
    if (itemIndex === -1) return false;
    return itemIndex <= currentIndex;
  };

  const handleGetACall = () => {
    const phoneNumber = customerData?.phoneNumber || order?.phoneNumber;
    if (!phoneNumber) {
      Alert.alert("Error", "Phone number not available");
      return;
    }
    let cleanedNumber = phoneNumber.replace(/[^\d+]/g, "");
    if (cleanedNumber.startsWith("+")) {
      if (cleanedNumber.length < 10) {
        Alert.alert("Error", "Invalid international phone number format");
        return;
      }
    } else if (cleanedNumber.startsWith("94"))
      cleanedNumber = `+${cleanedNumber}`;
    else if (cleanedNumber.startsWith("0"))
      cleanedNumber = `+94${cleanedNumber.substring(1)}`;
    else cleanedNumber = `+94${cleanedNumber}`;
    if (!/^\+94\d{9}$/.test(cleanedNumber)) {
      Alert.alert("Error", "Invalid phone number format");
      return;
    }
    Linking.openURL(`tel:${cleanedNumber}`).catch(() =>
      Alert.alert("Error", "Could not open phone dialer"),
    );
  };

  const handleCancelOrder = () => {
    if (isCancelDisabled()) {
      Alert.alert(
        "Cannot Cancel Order",
        "Orders that are on the way or delivered cannot be canceled.",
      );
      return;
    }
    setCancelModalVisible(true);
  };

  const formatPrice = (price: string | number): string =>
    parseFloat(price.toString()).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const confirmCancelOrder = async () => {
    try {
      setLoading(true);
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert(
          "Error",
          "Authentication token not found. Please log in again.",
        );
        setLoading(false);
        return;
      }
      const response = await axios.post(
        `${environment.API_BASE_URL}api/orders/cancel-order/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.data.success) {
        setCancelModalVisible(false);
        Alert.alert(
          "Order Cancelled",
          "Your order has been successfully cancelled.",
        );
        navigation.goBack();
      } else
        Alert.alert(
          "Error",
          response.data.message || "Failed to cancel the order.",
        );
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to cancel the order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          navigation.goBack();
          return true;
        },
      );
      return () => backHandler.remove();
    }, [navigation]),
  );

  const resolveHoldLabel = (event: HoldEvent): string =>
    event.holdReason === "Other" && event.otherReason
      ? event.otherReason
      : (event.holdReason ?? "");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="bg-white"
      style={{ flex: 1 }}
    >
      <CustomHeader
        title="Order Status"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        rightComponent={
          <TouchableOpacity onPress={handleGetACall}>
            <Feather name="phone" size={24} color="#6C3CD1" />
          </TouchableOpacity>
        }
      />
      <View className="bg-white flex-1">
        {loading ? (
          <LoadingPage message="Loading Order Details..." fullScreen={true} />
        ) : error ? (
          <View className="flex-1 justify-center items-center p-5">
            <Text className="text-red-500">{error}</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mt-4 bg-[#6C3CD1] px-4 py-2 rounded-lg"
            >
              <Text className="text-white">Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : order ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <View className="mx-6 my-4 ml-8">
              <View className="border-l-2 border-[#D9D9D9] pl-5 relative">
                <View className="flex-row items-center mb-10">
                  <View
                    className={`p-1.5 rounded-full absolute -left-8 ${isTimelineItemActive("Ordered") ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`}
                  />
                  <Text className="text-[#5E5E5E] font-medium">
                    Order Placed {formatDateShort(order.createdAt)}
                  </Text>
                </View>

                <View className="flex-row items-center mb-10">
                  <View
                    className={`p-1.5 rounded-full absolute -left-8 ${isTimelineItemActive("Processing") ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`}
                  />
                  <Text className="text-[#5E5E5E] font-medium">
                    Order is Processing
                  </Text>
                </View>

                <View className="flex-row items-center mb-10">
                  <View
                    className={`p-1.5 rounded-full absolute -left-8 ${isTimelineItemActive("Out For Delivery") ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`}
                  />
                  <Text className="text-[#5E5E5E] font-medium">
                    Order is Out for Delivery
                  </Text>
                </View>

                <View className="flex-row items-center mb-10">
                  <View
                    className={`p-1.5 rounded-full absolute -left-8 ${isTimelineItemActive("Collected") ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`}
                  />
                  <Text className="text-[#5E5E5E] font-medium">
                    Driver has Collected the order
                  </Text>
                </View>

                <View className="flex-row items-center mb-10">
                  <View
                    className={`p-1.5 rounded-full absolute -left-8 ${isTimelineItemActive("On the way") ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`}
                  />
                  <Text className="text-[#5E5E5E] font-medium">
                    Order is On the way
                  </Text>
                </View>

                {holdEvents.map((event, index) => {
                  const label = resolveHoldLabel(event);
                  const isLastHold = index === holdEvents.length - 1;

                  const showRestartAfterThisHold =
                    event.restartedTime != null ||
                    (isLastHold &&
                      ["On the way", "Delivered", "Return"].includes(status));

                  return (
                    <View key={`hold-event-${index}`}>
                      <View className="flex-row items-center mb-2">
                        <View className="p-1.5 rounded-full absolute -left-8 bg-[#6C3CD1] border-4 border-[#F4EDFF]" />
                        <Text className="text-[#5E5E5E] font-medium">
                          Driver marked order as Hold
                        </Text>
                      </View>

                      {label ? (
                        <View className="pb-2">
                          <Text className="font-semibold text-[#5E5E5E]">
                            Reason:{" "}
                            <Text className="text-black font-medium">
                              "{label}"
                            </Text>
                          </Text>
                        </View>
                      ) : (
                        <View className="mb-6" />
                      )}

                      {showRestartAfterThisHold && (
                        <View className="flex-row items-center mb-10">
                          <View className="p-1.5 rounded-full absolute -left-8 bg-[#6C3CD1] border-4 border-[#F4EDFF]" />
                          <Text className="text-[#5E5E5E] font-medium">
                            Order is On the way
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {status === "Return" && (
                  <View className="flex-row items-center">
                    <View className="p-1.5 rounded-full absolute -left-8 bg-[#6C3CD1] border-4 border-[#F4EDFF]" />
                    <Text className="font-medium text-[#5E5E5E]">
                      Order marked as Return
                    </Text>
                  </View>
                )}

                {status === "Return" && returnReason && (
                  <View style={{ marginTop: 8 }}>
                    <View className="mt-[-7]  pt-4">
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                        }}
                      >
                        <Text className="font-semibold text-[#5E5E5E]">
                          Reason :{" "}
                        </Text>
                        <Text
                          className="text-black font-medium"
                          style={{ flex: 1 }}
                        >
                          "{returnReason}"
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {status !== "Return" &&
                  status !== "Cancelled" &&
                  status !== "Hold" && (
                    <View className="flex-row items-center">
                      <View
                        className={`p-1.5 rounded-full absolute -left-8 ${
                          status === "Delivered"
                            ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]"
                            : "bg-[#D9D9D9] border-4 border-[#EDEDED]"
                        }`}
                      />
                      <Text className="text-[#5E5E5E] font-medium">
                        Order is Delivered
                      </Text>
                    </View>
                  )}

                {status === "Hold" && (
                  <>
                    <View className="flex-row items-center mb-10">
                      <View className="p-1.5 rounded-full absolute -left-8 bg-[#D9D9D9] border-4 border-[#EDEDED]" />
                      <Text className="text-[#5E5E5E] font-medium">
                        Order is On the way
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <View className="p-1.5 rounded-full absolute -left-8 bg-[#D9D9D9] border-4 border-[#EDEDED]" />
                      <Text className="text-[#5E5E5E] font-medium">
                        Order is Delivered
                      </Text>
                    </View>
                  </>
                )}

                {status === "Cancelled" && (
                  <View className="flex-row items-center ">
                    <View className="p-1.5 rounded-full absolute -left-8 bg-[#6C3CD1] border-4 border-[#F4EDFF]" />
                    <Text className="text-red-500 font-medium">
                      Order is Cancelled
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-4 p-4 mb-4">
              <Text className="text-[#808FA2] font-medium mb-1">
                Customer's Name
              </Text>
              <Text className="text-black font-medium mb-3">
                {customerData
                  ? `${customerData.title || ""}. ${customerData.firstName || ""} ${customerData.lastName || ""}`.trim() ||
                    "Not Available"
                  : `${order.title || ""}  ${order.firstName || ""} ${order.lastName || ""}`.trim() ||
                    "Not Available"}
              </Text>
              <Text className="text-[#808FA2] font-medium mb-1">
                Customer's Mobile Number
              </Text>
              <Text className="text-black font-medium mb-3">
                {customerData?.phoneNumber ||
                  order.phoneNumber ||
                  "Not Available"}
              </Text>
              <Text className="text-[#808FA2] font-medium mb-1">
                Building Type
              </Text>
              <Text className="text-black font-medium mb-3">
                {customerData?.buildingType ||
                  order.buildingType ||
                  "Not Available"}
              </Text>
              <Text className="text-[#808FA2] font-medium mb-1">Address</Text>
              <Text className="text-black font-medium">
                {customerData?.buildingDetails
                  ? (() => {
                      const buildingType =
                        customerData?.buildingType || order.buildingType;
                      if (buildingType === "Apartment") {
                        return (
                          `${customerData.buildingDetails.houseNo || ""}, ${customerData.buildingDetails.floorNo || ""}, ${customerData.buildingDetails.buildingNo || ""}, ${customerData.buildingDetails.buildingName || ""}, ${customerData.buildingDetails.unitNo || ""}, ${customerData.buildingDetails.streetName || ""}, ${customerData.buildingDetails.city || ""}`
                            .replace(/,\s*,/g, ",")
                            .replace(/^,\s*|,\s*$/g, "")
                            .trim() ||
                          order.fullAddress ||
                          "Not Available"
                        );
                      } else if (buildingType === "House") {
                        return (
                          `${customerData.buildingDetails.houseNo || ""}, ${customerData.buildingDetails.streetName || ""}, ${customerData.buildingDetails.city || ""}`.trim() ||
                          order.fullAddress ||
                          "Not Available"
                        );
                      } else {
                        return order.fullAddress || "Not Available";
                      }
                    })()
                  : order.fullAddress || "Not Available"}
              </Text>
            </View>

            {order.fullTotal && (
              <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-4 p-4 mb-4">
                <Text className="text-black font-semibold mb-2">
                  Payment Summary
                </Text>
                {isPackage === 1 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-[#8492A3]">Subtotal</Text>
                    <Text className="text-[#8492A3]">
                      Rs.{" "}
                      {formatPrice(
                        parseFloat(order.total || "0") - deliveryFee,
                      )}
                    </Text>
                  </View>
                )}
                {isPackage === 0 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-[#8492A3]">Subtotal</Text>
                    <Text className="text-[#8492A3]">
                      Rs.{" "}
                      {new Intl.NumberFormat("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(
                        parseFloat(order.total || "0") - deliveryFee - 180,
                      )}
                    </Text>
                  </View>
                )}
                {order.discount && parseFloat(order.discount) > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-[#8492A3]">Discount</Text>
                    <Text className="text-[#8492A3]">
                      Rs. {formatPrice(order.discount)}
                    </Text>
                  </View>
                )}
                <View className="flex-row justify-between mb-2">
                  <Text className="text-[#8492A3]">Delivery</Text>
                  <Text className="text-[#8492A3]">
                    Rs. {formatPrice(deliveryFee)}
                  </Text>
                </View>
                {isPackage === 0 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-[#8492A3]">Service Fee</Text>
                    <Text className="text-[#8492A3]">Rs. 180.00</Text>
                  </View>
                )}
                <View className="flex-row justify-between pt-2">
                  <Text className="font-semibold text-black">Grand Total</Text>
                  <Text className="font-bold text-black">
                    Rs. {formatPrice(order.fullTotal || "0")}
                  </Text>
                </View>
              </View>
            )}

            <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-4 p-4 mb-6">
              <Text className="text-black font-semibold mb-1">
                Payment Method
              </Text>
              <Text className="text-[#8492A3]">
                {order.paymentMethod === "Credit Card"
                  ? "Online Payment"
                  : "Cash on Delivery"}
              </Text>
            </View>

            <Text className="text-red-500 font-medium text-center mb-2">
              {selectedReportOption}{" "}
            </Text>
            <View className="flex w-3/5 mx-auto">
              {status !== "Cancelled" && status !== "Ordered" && (
                <View
                  style={{
                    marginHorizontal: 20,
                    marginBottom: 12,
                    borderRadius: 30,
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={handleReportStatus}
                    activeOpacity={0.8}
                    style={{ borderRadius: 30 }}
                  >
                    <LinearGradient
                      colors={["#6839CF", "#874DDB"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 12,
                        borderRadius: 30,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        Report Status
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
              {!isCancelDisabled() && (
                <View
                  style={{
                    marginHorizontal: 20,
                    marginBottom: 20,
                    borderRadius: 30,
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowOffset: { width: 0, height: 5 },
                    shadowRadius: 7,
                    elevation: 6,
                  }}
                >
                  <TouchableOpacity
                    onPress={handleCancelOrder}
                    activeOpacity={0.8}
                    style={{ borderRadius: 30 }}
                  >
                    <View
                      style={{
                        backgroundColor: "#000000",
                        paddingVertical: 12,
                        borderRadius: 30,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                        Cancel Order
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center p-5">
            <Text className="text-gray-600">No order information found</Text>
          </View>
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-5 w-5/6 max-w-[500px]">
            <Text className="text-xl font-bold text-center mb-2">
              Are you sure?
            </Text>
            <Text className="text-center text-gray-600 mb-8">
              This will permanently delete the order placed by customer and
              cannot be undone.
            </Text>
            <View
              style={{
                borderRadius: 24,
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 6,
                elevation: 4,
                marginBottom: 12,
              }}
            >
              <TouchableOpacity
                onPress={confirmCancelOrder}
                activeOpacity={0.8}
                style={{ borderRadius: 24 }}
              >
                <View
                  style={{
                    backgroundColor: "#000",
                    paddingVertical: 14,
                    borderRadius: 24,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}
                  >
                    Confirm
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View
              style={{
                borderRadius: 24,
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowOffset: { width: 0, height: 3 },
                shadowRadius: 5,
                elevation: 3,
              }}
            >
              <TouchableOpacity
                onPress={() => setCancelModalVisible(false)}
                activeOpacity={0.8}
                style={{ borderRadius: 24 }}
              >
                <View
                  style={{
                    backgroundColor: "#E5E7EB",
                    paddingVertical: 14,
                    borderRadius: 24,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#000", fontWeight: "600", fontSize: 15 }}
                  >
                    Cancel
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={handleCloseReportModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-5 w-5/6 max-w-[500px]">
            <View className="mb-4">
              {["Confirmed", "Not-Confirmed", "Not-Answered"].map(
                (option, index) => (
                  <TouchableOpacity
                    key={option}
                    className={`flex-row items-center justify-between p-3 ${index < 2 ? "mb-2" : "mb-6"} rounded-lg`}
                    onPress={() => setTempSelectedReportOption(option)}
                  >
                    <Text className="text-black font-medium">{option}</Text>
                    <View
                      className={`w-6 h-6 rounded-lg border-2 ${tempSelectedReportOption === option ? "border-[#6C3CD1] bg-[#6C3CD1]" : "border-gray-400 bg-white"}`}
                    >
                      {tempSelectedReportOption === option && (
                        <View className="flex-1 items-center justify-center">
                          <Feather name="check" size={16} color="white" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ),
              )}
            </View>
            <View
              style={{
                marginHorizontal: 28,
                marginBottom: 12,
                borderRadius: 999,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <TouchableOpacity
                onPress={handleConfirmReport}
                disabled={!tempSelectedReportOption}
                activeOpacity={0.8}
                style={{ borderRadius: 999, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={
                    tempSelectedReportOption
                      ? ["#040404ff", "#030203ff"]
                      : ["#E5E7EB", "#E5E7EB"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 12, alignItems: "center" }}
                >
                  <Text
                    style={{
                      color: tempSelectedReportOption ? "#fff" : "#000",
                      fontWeight: "600",
                    }}
                  >
                    Confirm
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View
              style={{
                marginHorizontal: 28,
                borderRadius: 999,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 5,
                marginTop: 10,
              }}
            >
              <TouchableOpacity
                onPress={handleCloseReportModal}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#E5E7EB",
                  paddingVertical: 12,
                  borderRadius: 999,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#000" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default View_CancelOrderScreen;

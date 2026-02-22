import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "../common/CustomHeader";

type OrderSummeryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OrderSummeryScreen"
>;
type OrderSummeryScreenRouteProp = RouteProp<
  RootStackParamList,
  "OrderSummeryScreen"
>;

interface ItemDetails {
  name: string;
  displayName: string;
  price: number;
  discount?: number;
  mpItemId?: number | null;
  quantityType?: string;
  unitType?: string;
  changeby?: string;
  startValue?: string;
}
interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
}
interface OrderSummeryScreenProps {
  navigation: OrderSummeryScreenNavigationProp;
  route: OrderSummeryScreenRouteProp;
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

const OrderSummeryScreen: React.FC<OrderSummeryScreenProps> = ({
  navigation,
  route,
}) => {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [additionalItemDetails, setAdditionalItemDetails] = useState<
    Record<string, ItemDetails>
  >({});
  const [packageItemDetails, setPackageItemDetails] = useState<
    Record<string, ItemDetails>
  >({});
  const [packageDisplayName, setPackageDisplayName] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const {
    items = [],
    subtotal = 0,
    discount = 0,
    total = 0,
    fullTotal = 0,
    selectedDate = "",
    selectedTimeSlot = "",
    paymentMethod = "",
    customerId = "",
    customerid = "",
    isPackage: isPackageRaw = 0,
    orderItems = [],
    customerscreencustomerid = "",
  } = route.params || {};

  const isPackage =
    typeof isPackageRaw === "string"
      ? parseInt(isPackageRaw) || 0
      : Number(isPackageRaw);

  const safeItems = Array.isArray(items) ? items : [];
  const safeOrderItems = Array.isArray(orderItems) ? orderItems : [];
  const timeDisplay = selectedTimeSlot || "Not set";
  const totalDeliveryPlus = fullTotal;
  const subTotalDeliveryPlus = totalDeliveryPlus + discount;

  // Single consolidated effect: fetches customer data AND delivery fee together
  // so the address and all screen content appear at the same time.
  useEffect(() => {
    const fetchCustomerDataAndDeliveryFee = async () => {
      const customerIdValue =
        customerId || route.params?.customerId || route.params?.customerid;

      if (!customerIdValue) {
        setIsDataLoaded(true);
        setLoading(false);
        return;
      }

      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          setError("No authentication token found");
          setIsDataLoaded(true);
          setLoading(false);
          return;
        }

        const customerResponse = await axios.get(
          `${environment.API_BASE_URL}api/orders/get-customer-data/${customerIdValue}`,
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          },
        );

        if (customerResponse.data?.success) {
          const fetchedCustomerData = customerResponse.data.data;
          setCustomerData(fetchedCustomerData);
          const customerCity = fetchedCustomerData.buildingDetails?.city;

          if (customerCity) {
            try {
              const cityResponse = await axios.get<{ data: City[] }>(
                `${environment.API_BASE_URL}api/customer/get-city`,
                { headers: { Authorization: `Bearer ${storedToken}` } },
              );

              if (cityResponse.data?.data) {
                const cityData = cityResponse.data.data.find(
                  (c) => c.city === customerCity,
                );
                setDeliveryFee(cityData ? parseFloat(cityData.charge) || 0 : 0);
              }
            } catch (cityError) {
              console.error("Error fetching cities:", cityError);
              setDeliveryFee(0);
            }
          } else {
            setDeliveryFee(0);
          }
        } else {
          const errorMsg =
            customerResponse.data?.message || "Failed to fetch customer data";
          setError(errorMsg);
        }
      } catch (error: any) {
        console.error("Error fetching customer data:", error);
        if (axios.isAxiosError(error)) {
          setError(error.response?.data?.message || error.message);
        } else {
          setError("Failed to fetch customer data");
        }
      } finally {
        setIsDataLoaded(true);
        setLoading(false);
      }
    };

    if (customerId || route.params?.customerId || route.params?.customerid) {
      fetchCustomerDataAndDeliveryFee();
    } else {
      setIsDataLoaded(true);
      setLoading(false);
    }
  }, [customerId, route.params?.customerId, route.params?.customerid]);

  const handleConfirmOrder = async () => {
    if (isSubmitting || isSubmitted) {
      return;
    }

    setIsSubmitting(true);

    if (!customerId && !customerid) {
      Alert.alert("Error", "Customer information is missing");
      setIsSubmitting(false);
      return;
    }

    try {
      const storedToken = await AsyncStorage.getItem("authToken");

      if (!storedToken) {
        Alert.alert(
          "Error",
          "Authentication token not found. Please log in again.",
        );
        setIsSubmitting(false);
        return;
      }

      let orderPayload;

      if (isPackage === 0) {
        const orderData = {
          userId: customerId || customerid,
          isPackage: 0,
          total: fullTotal + discount,
          fullTotal: fullTotal,
          discount: discount,
          sheduleDate: selectedDate,
          sheduleTime: selectedTimeSlot,
          paymentMethod: paymentMethod,
          isPaid: 0,
          status: "confirmed",
          items: safeItems.map((item) => ({
            productId: item.id,
            qty: item.qty === "g" ? Number(item.qty) / 1000 : item.qty,
            unit: item.unitType === "g" ? "g" : "kg",
            price: item.price,
            discount: item.discount,
          })),
        };

        orderPayload = {
          orderData: orderData,
        };
      } else {
        const currentPackageItem = safeOrderItems[0] || {};
        const additionalItems =
          currentPackageItem.additionalItems ||
          route.params?.orderData?.additionalItems ||
          [];
        const packageItems = additionalItems.map((item: any) => ({
          productId: item.productId || item.id,
          qty: item.qty || item.quantity,
          unit: item.unit || "kg",
          price: item.price,
          discount: item.discount,
        }));

        const packageOrderData = {
          userId: customerId || customerid,
          isPackage: 1,
          packageId: currentPackageItem.packageId || route.params?.packageId,
          total: fullTotal + discount,
          fullTotal: fullTotal,
          discount: discount,
          sheduleDate: selectedDate,
          sheduleTime: selectedTimeSlot,
          transactionId: null,
          paymentMethod: paymentMethod,
          isPaid: 1,
          status: "confirmed",
          items: packageItems,
        };

        orderPayload = {
          orderData: packageOrderData,
        };
      }

      const apiUrl = `${environment.API_BASE_URL}api/orders/create-order`;
      const response = await axios.post(apiUrl, orderPayload, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setIsSubmitted(true);
        setIsSubmitting(false);

        navigation.navigate("Main", {
          screen: "OrderConfirmedScreen",
          params: {
            orderId: response.data.data.orderId,
            isPackage: isPackage,
            total: total,
            subtotal: fullTotal,
            discount: discount,
            paymentMethod: paymentMethod,
            userId: customerId || (customerid as string),
            selectedDate: selectedDate,
            selectedTimeSlot: selectedTimeSlot,
          },
        });
      } else {
        setIsSubmitting(false);
        Alert.alert("Error", response.data.message || "Failed to create order");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      setIsSubmitting(false);

      let errorMessage = "Failed to create order";
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
    }
  };

  const getCustomerInfo = () => {
    if (customerData) {
      const address = customerData.buildingDetails
        ? `${customerData.buildingDetails.buildingNo || ""} ${customerData.buildingDetails.unitNo || ""}, 
  ${customerData.buildingDetails.buildingName || ""}, 
  ${customerData.buildingDetails.floorNo ? "Apartment " + customerData.buildingDetails.floorNo + ", " : ""}
  ${customerData.buildingDetails.houseNo ? "House " + customerData.buildingDetails.houseNo + ", " : ""}
  ${customerData.buildingDetails.streetName || ""}, 
  ${customerData.buildingDetails.city || ""}`
        : "No address found";

      const cleanedAddress = address.replace(/\s+/g, " ").trim();

      return {
        name: `${customerData.title || ""}. ${customerData.firstName || ""} ${customerData.lastName || ""}`,
        phone: customerData.phoneNumber || "No phone",
        buildingType: customerData.buildingType || "Not specified",
        address: cleanedAddress,
      };
    }

    return {
      name: "Guest User",
      phone: "Not available",
      buildingType: "Not specified",
      address: "Address not available",
    };
  };

  const customerInfo = getCustomerInfo();

  const fetchItemDetails = async () => {
    if (isPackage !== 1 || !safeOrderItems.length) return;

    const packageItem = safeOrderItems[0];

    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const additionalDetails: Record<string, ItemDetails> = {};
      const packageItemDetailsLocal: Record<string, ItemDetails> = {};
      let packageDisplayNameLocal = "";

      if (packageItem.packageId) {
        try {
          const response = await axios.get(
            `${environment.API_BASE_URL}api/packages/marketplace-package/${packageItem.packageId}`,
            {
              headers: { Authorization: `Bearer ${storedToken}` },
            },
          );

          if (response.data && response.data.data) {
            packageDisplayNameLocal = response.data.data.displayName;
          }
        } catch (error) {
          console.error(
            `Error fetching package ${packageItem.packageId} details:`,
            error,
          );
          packageDisplayNameLocal = `Package ${packageItem.packageId}`;
        }
      }
      if (
        packageItem.additionalItems &&
        packageItem.additionalItems.length > 0
      ) {
        for (const item of packageItem.additionalItems) {
          try {
            const response = await axios.get(
              `${environment.API_BASE_URL}api/packages/marketplace-item/${item.id}`,
              {
                headers: { Authorization: `Bearer ${storedToken}` },
              },
            );

            if (response.data && response.data.data) {
              const itemIdKey = item.id.toString();

              additionalDetails[itemIdKey] = {
                name:
                  response.data.data.name ||
                  response.data.data.displayName ||
                  `Item ${item.id}`,
                displayName:
                  response.data.data.displayName ||
                  response.data.data.name ||
                  `Item ${item.id}`,
                price:
                  response.data.data.discountedPrice ||
                  response.data.data.normalPrice ||
                  0,
                changeby: response.data.data.changeby || "1",
                startValue: response.data.data.startValue || "1",
                unitType: response.data.data.unitType || "kg",
              };
            }
          } catch (error) {
            console.error(
              `Error fetching additional item ${item.id} details:`,
              error,
            );
            const itemIdKey = item.id.toString();
            additionalDetails[itemIdKey] = {
              name: `Item ${item.id}`,
              displayName: `Item ${item.id}`,
              price: 0,
              changeby: "1",
              startValue: "1",
              unitType: "kg",
            };
          }
        }
      }

      setAdditionalItemDetails(additionalDetails);
      setPackageItemDetails(packageItemDetailsLocal);
      setPackageDisplayName(packageDisplayNameLocal);
    } catch (error) {
      console.error("Error fetching item details:", error);
    }
  };

  useEffect(() => {
    if (isPackage === 1 && safeOrderItems.length > 0) {
      fetchItemDetails();
    }
  }, [isPackage, safeOrderItems]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";

    // Handle "DD MMM YYYY" format e.g. "20 Feb 2026"
    const monthMap: Record<string, string> = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const ddMmmYyyy = dateStr.match(/^(\d{1,2})\s([A-Za-z]{3})\s(\d{4})$/);
    if (ddMmmYyyy) {
      const dd = ddMmmYyyy[1].padStart(2, "0");
      const mmm = ddMmmYyyy[2];
      const yyyy = ddMmmYyyy[3];
      const mm =
        monthMap[mmm.charAt(0).toUpperCase() + mmm.slice(1).toLowerCase()];
      if (mm) return `${yyyy}/${mm}/${dd}`;
    }

    // Fallback: try native Date parsing for ISO / other formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}/${mm}/${dd}`;
    }

    return dateStr;
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("SelectPaymentMethod" as any, {
          items,
          subtotal,
          discount,
          total,
          id: customerId,
          title: customerData?.title,
          name: `${customerData?.firstName} ${customerData?.lastName}`,
          number: customerData?.phoneNumber,
          customerscreencustomerid: customerscreencustomerid,
          fullTotal,
          selectedDate,
          timeDisplay,
          isPackage,
          packageId: route.params?.packageId,
          selectedTimeSlot,
          customerId,
          customerid: customerid?.toString() || customerId?.toString(),
          orderItems,
          selectedMethod: paymentMethod,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation]),
  );

  const formatPrice = (amount: number) => {
    const hasDecimals = amount % 1 !== 0;

    if (hasDecimals) {
      return amount.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
    } else {
      return (
        amount.toLocaleString("en-US", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        }) + ".00"
      );
    }
  };

  if (!isDataLoaded) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled
        className="bg-white"
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <CustomHeader
          title="Order Summary"
          titleColor="#6C3CD1"
          showBackButton={true}
          navigation={navigation}
        />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#6C3CD1" />
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      className=" bg-white"
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <CustomHeader
        title="Order Summary"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() =>
          navigation.navigate("SelectPaymentMethod" as any, {
            items,
            subtotal,
            discount,
            total,
            fullTotal,
            id: customerId,
            title: customerData?.title,
            number: customerData?.phoneNumber,
            customerscreencustomerid: customerscreencustomerid,
            name: `${customerData?.firstName} ${customerData?.lastName}`,
            selectedDate,
            timeDisplay,
            isPackage,
            packageId: route.params?.packageId,
            selectedTimeSlot,
            customerId,
            customerid: customerid?.toString() || customerId?.toString(),
            orderItems,
            selectedMethod: paymentMethod,
          })
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 20 }}
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <View className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="flex-row items-center justify-between flex-1 ">
                <Image
                  source={require("@/assets/images/order/delivery.webp")}
                  className="w-10 h-10"
                />

                <View>
                  <View className="flex-row justify-between">
                    <Text className="text-base font-semibold">
                      Delivery - One Time
                    </Text>
                  </View>
                  <Text className="text-[#808FA2] text-sm font-medium">
                    Scheduled to {formatDate(selectedDate)}
                  </Text>
                  <Text className="text-[#808FA2] text-sm">{timeDisplay}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate("ScheduleScreen" as any, {
                      total,
                      packageId: route.params?.packageId,
                      items,
                      subtotal,
                      id: customerId,
                      title: customerData?.title,
                      customerscreencustomerid: customerscreencustomerid,
                      name: `${customerData?.firstName} ${customerData?.lastName}`,
                      number: customerData?.phoneNumber,
                      discount,
                      selectedDate,
                      timeDisplay,
                      isPackage,
                      customerId,
                      customerid:
                        customerid.toString() || customerId.toString(),
                      orderItems,
                      orderData: route.params?.orderData,
                    });
                  }}
                  disabled={isSubmitting || isSubmitted}
                  style={{ opacity: isSubmitting || isSubmitted ? 0.6 : 1 }}
                  className="mb-10"
                >
                  <View className="border border-[#6C3CD1] px-3 rounded-full ml-2 ">
                    <Text className="text-[#6C3CD1] font-medium">Edit</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Customer Info */}
          <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
            <Text className="text-[#808FA2] text-xs">Customer's Name</Text>
            <Text className="text-black font-medium">{customerInfo.name}</Text>

            <Text className="text-[#808FA2] text-xs mt-2">
              Customer's Phone Number
            </Text>
            <Text className="text-black font-medium">{customerInfo.phone}</Text>

            <Text className="text-[#808FA2] text-xs mt-2">Building Type</Text>
            <Text className="text-black font-medium">
              {customerInfo.buildingType}
            </Text>

            <Text className="text-[#808FA2] text-xs mt-2">Address</Text>
            {customerData && customerData.buildingDetails ? (
              <View className="-m-1">
                {customerData.buildingDetails.buildingNo && (
                  <Text className="text-black font-medium">
                    {" "}
                    {customerData.buildingDetails.buildingNo},
                  </Text>
                )}
                {customerData.buildingDetails.unitNo && (
                  <Text className="text-black font-medium">
                    {" "}
                    {customerData.buildingDetails.unitNo},
                  </Text>
                )}
                {customerData.buildingDetails.buildingName && (
                  <Text className="text-black font-medium">
                    {" "}
                    {customerData.buildingDetails.buildingName},
                  </Text>
                )}
                {customerData.buildingDetails.floorNo && (
                  <Text className="text-black font-medium">
                    {" "}
                    {customerData.buildingDetails.floorNo},
                  </Text>
                )}
                {customerData.buildingDetails.houseNo && (
                  <Text className="text-black font-medium">
                    {" "}
                    {customerData.buildingDetails.houseNo},
                  </Text>
                )}
                {customerData.buildingDetails.streetName && (
                  <Text className="text-black font-medium">
                    {" "}
                    {customerData.buildingDetails.streetName},
                  </Text>
                )}
                {customerData.buildingDetails.city && (
                  <Text className="text-black font-medium">
                    {" "}
                    {customerData.buildingDetails.city}
                  </Text>
                )}
              </View>
            ) : (
              <Text className="text-black font-medium">
                Address not available
              </Text>
            )}
          </View>

          <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="text-black font-medium">Payment Summary</Text>

              <TouchableOpacity
                onPress={() => {
                  if (isPackage === 0) {
                    navigation.navigate("CratScreen" as any, {
                      id: customerId || customerid,
                      customerId: customerId || customerid,
                      isPackage: 0,
                      number: customerData?.phoneNumber,
                      title: customerData?.title,
                      customerscreencustomerid: customerscreencustomerid,
                      name: `${customerData?.firstName} ${customerData?.lastName}`,
                      items: safeItems.map((item) => ({
                        id: item.id,
                        name: item.name || `Item ${item.id}`,
                        price: item.price,
                        normalPrice:
                          item.normalPrice || item.price + (item.discount || 0),
                        discountedPrice: item.price,
                        discount: item.discount || 0,
                        qty: item.qty,
                        unitType: item.unitType || "kg",
                        startValue: item.startValue || 0.5,
                        quantity: item.qty,
                      })),
                      selectedProducts: safeItems.map((item) => ({
                        id: item.id,
                        name: item.name || `Item ${item.id}`,
                        price: item.price,
                        normalPrice:
                          item.normalPrice || item.price + (item.discount || 0),
                        discountedPrice: item.price,
                        discount: item.discount || 0,
                        quantity: item.qty,
                        selected: false,
                        unitType: item.unitType || "kg",
                        startValue: item.startValue || 0.5,
                        changeby:
                          item.unitType === "g"
                            ? Number(item.qty) * 1000
                            : item.qty,
                      })),
                      subtotal,
                      discount,
                      total,
                      fullTotal,
                      selectedDate,
                      timeDisplay,
                      selectedTimeSlot,
                      paymentMethod,
                      fromOrderSummary: true,
                    });
                  } else if (isPackage === 1) {
                    const currentOrderItem = safeOrderItems[0] || {};
                    const additionalItems =
                      route.params?.orderData?.additionalItems || [];

                    const packageItems =
                      currentOrderItem.finalOrderPackageList?.map((item) => ({
                        id: item.productId,
                        name:
                          packageItemDetails[item.productId.toString()]
                            ?.displayName || `Item ${item.productId}`,
                        quantity: item.quantity.toString(),
                        quantityType: "kg",
                        price:
                          typeof item.price === "string"
                            ? parseFloat(item.price)
                            : item.price,
                        discount: item.discount || 0,
                      })) || [];

                    const mappedAdditionalItems = additionalItems.map(
                      (item) => {
                        const itemDetail =
                          additionalItemDetails[item.productId.toString()];

                        const quantity = parseFloat(item.qty) || 1;
                        const unit = (item.unit || "kg").toLowerCase();
                        const quantityInKg =
                          unit === "kg" ? quantity : quantity / 1000;

                        const totalPrice = Number(item.price) || 0;
                        const totalDiscount = Number(item.discount) || 0;

                        const discountedPricePerKg =
                          quantityInKg > 0 ? totalPrice / quantityInKg : 0;
                        const normalPricePerKg =
                          quantityInKg > 0
                            ? (totalPrice + totalDiscount) / quantityInKg
                            : 0;

                        return {
                          productId: item.productId,
                          mpItemId: item.productId,
                          cropId: item.productId,
                          name:
                            itemDetail?.displayName || `Item ${item.productId}`,
                          quantity: quantity.toString(),
                          quantityType: unit,
                          pricePerKg: normalPricePerKg,
                          discountedPricePerKg: discountedPricePerKg,
                          price: totalPrice,
                          discount: totalDiscount,
                          changeby: itemDetail?.changeby || "1",
                          startValue: itemDetail?.startValue || "1",
                          unitType: itemDetail?.unitType || "kg",
                        };
                      },
                    );

                    navigation.navigate("OrderScreen" as any, {
                      id: customerId || customerid,
                      isPackage: "1",
                      orderItems: safeOrderItems,
                      number: customerData?.phoneNumber,
                      title: customerData?.title,
                      customerscreencustomerid: customerscreencustomerid,
                      name: `${customerData?.firstName} ${customerData?.lastName}`,
                      packageId:
                        currentOrderItem.packageId || route.params?.packageId,
                      packageItems: packageItems,
                      additionalItems: mappedAdditionalItems,
                      subtotal,
                      discount,
                      total,
                      fullTotal,
                      selectedDate,
                      selectedTimeSlot,
                      timeDisplay,
                      paymentMethod,
                      isEdit: true,
                      orderData: route.params?.orderData,
                    });
                  } else {
                    navigation.navigate("CratScreen" as any, {
                      id: customerId || customerid,
                      customerId: customerId || customerid,
                      items: safeItems,
                      selectedProducts: safeItems.map((item) => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        normalPrice: item.normalPrice || item.price,
                        customerscreencustomerid: customerscreencustomerid,
                        discountedPrice: item.discountedPrice || item.price,
                        quantity: item.quantity,
                        selected: true,
                        unitType: item.unitType || "kg",
                        startValue: item.startValue || 0.1,
                        changeby: item.quantity,
                      })),
                      subtotal,
                      discount,
                      total,
                      fullTotal,
                      selectedDate,
                      timeDisplay,
                      selectedTimeSlot,
                      paymentMethod,
                      fromOrderSummary: true,
                    });
                  }
                }}
                className="border border-[#6C3CD1] px-3 rounded-full"
                disabled={isSubmitting || isSubmitted}
                style={{ opacity: isSubmitting || isSubmitted ? 0.6 : 1 }}
              >
                <Text className="text-[#6C3CD1] font-medium">Edit</Text>
              </TouchableOpacity>
            </View>

            {isPackage === 1 && (
              <View className="flex-row justify-between mt-3">
                <Text className="text-[#8492A3] font-medium">Subtotal</Text>
                <Text className="text-black font-medium mr-14">
                  Rs. {formatPrice(subTotalDeliveryPlus - deliveryFee)}
                </Text>
              </View>
            )}

            {isPackage === 0 && (
              <View className="flex-row justify-between mt-3">
                <Text className="text-[#8492A3] font-medium">Subtotal</Text>
                <Text className="text-black font-medium mr-14">
                  Rs. {formatPrice(subTotalDeliveryPlus - 180 - deliveryFee)}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between mt-2">
              <Text className="text-[#8492A3]">Discount</Text>
              <Text className="text-gray-500 mr-14">
                Rs. {formatPrice(discount)}
              </Text>
            </View>

            <View className="flex-row justify-between mt-2">
              <Text className="text-[#8492A3]">Delivery Fee</Text>
              <Text className="text-gray-500 mr-14">
                Rs. {formatPrice(deliveryFee)}
              </Text>
            </View>

            {isPackage === 0 && (
              <View className="flex-row justify-between mt-2">
                <Text className="text-[#8492A3]">Service Fee</Text>
                <Text className="text-gray-500 mr-14">Rs. 180.00</Text>
              </View>
            )}

            <View className="flex-row justify-between mt-2">
              <Text className="text-black font-semibold">Grand Total</Text>
              <Text className="text-black font-semibold mr-14">
                Rs. {formatPrice(totalDeliveryPlus)}
              </Text>
            </View>
          </View>

          <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="text-black font-medium">Payment Method</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("SelectPaymentMethod" as any, {
                    items,
                    subtotal,
                    discount,
                    id: customerId,
                    title: customerData?.title,
                    customerscreencustomerid: customerscreencustomerid,
                    name: `${customerData?.firstName} ${customerData?.lastName}`,
                    number: customerData?.phoneNumber,
                    total,
                    fullTotal,
                    selectedDate,
                    timeDisplay,
                    isPackage,
                    packageId: route.params?.packageId,
                    selectedTimeSlot,
                    customerId,
                    customerid:
                      customerid?.toString() || customerId?.toString(),
                    orderItems,
                    selectedMethod: paymentMethod,
                  })
                }
                className="border border-[#6C3CD1] px-3 rounded-full"
                disabled={isSubmitting || isSubmitted}
                style={{ opacity: isSubmitting || isSubmitted ? 0.6 : 1 }}
              >
                <Text className="text-[#6C3CD1] font-medium">Edit</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-[#8492A3] mt-1">Cash On Delivery</Text>
          </View>
        </View>

        {/* Confirm Button with ActivityIndicator */}
        <View
          style={{
            marginTop: "10%",
            marginBottom: "10%",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "50%",
              borderRadius: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isSubmitted ? 0.15 : 0.25,
              shadowRadius: 8,
              elevation: 10,
              backgroundColor: "#fff",
            }}
          >
            <TouchableOpacity
              onPress={handleConfirmOrder}
              disabled={isSubmitting || isSubmitted}
              activeOpacity={0.8}
              style={{
                borderRadius: 24,
                opacity: isSubmitted ? 0.6 : 1,
              }}
            >
              <LinearGradient
                colors={["#6839CF", "#874DDB"]}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {isSubmitted ? "Order Confirmed" : "Confirm"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OrderSummeryScreen;

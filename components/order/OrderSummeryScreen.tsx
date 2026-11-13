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
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { StackActions } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "../common/CustomHeader";
import { getMinDeliveryDate } from "../common/CustomCalendarModal";

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
  buyerType?: string;
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

const toLocalPhoneFormat = (phone?: string | null) => {
  if (!phone) return phone || "";
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (!cleaned) return phone;

  if (!cleaned.startsWith("0")) {
    if (cleaned.startsWith("94")) {
      cleaned = cleaned.slice(2);
    }
    cleaned = "0" + cleaned;
  }

  return cleaned;
};

const buildRestoredAdditionalItems = (rawAdditionalItems: any[]) =>
  (rawAdditionalItems || []).map((item: any) => ({
    productId: item.id,
    mpItemId: item.id,
    id: item.id,
    name: item.name,
    quantity: item.quantity.toString(),
    quantityType: item.unit?.toLowerCase() === "kg" ? "kg" : "g",
    pricePerKg: item.pricePerKg,
    discountedPricePerKg: item.discountedPricePerKg,
    price: item.totalAmount,
    discount: item.discount,
    changeby: item.changeby || "1",
    startValue: item.startValue || "1",
    unitType: item.unit?.toLowerCase() || "kg",
  }));

const buildRestoredPackageItems = (rawPackageItems: any[]) =>
  (rawPackageItems || []).map((item: { name: string; qty: string }) => ({
    id: 0,
    name: item.name,
    quantity: item.qty,
    quantityType: "kg",
    price: 0,
  }));

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
    id,
  } = route.params || {};

  const incomingBuyerType = (route.params as any)?.buyerType;
  const incomingFrom = (route.params as any)?.from;
  // isWholesale is determined by buyerType or wholesale flow
  const isWholesale =
    Boolean((route.params as any)?.isWholesale) ||
    String(incomingBuyerType || customerData?.buyerType || "").toLowerCase() ===
      "wholesale" || incomingFrom === "ViewCustomerScreen";
  const effectiveBuyerType = isWholesale
    ? "Wholesale"
    : incomingBuyerType || customerData?.buyerType || "Retail";
  const effectiveFrom =
    incomingFrom || (isWholesale ? "ViewCustomerScreen" : undefined);

  const scheduleType: "One Time" | "Once a Week" | "Twice a Week" =
    (route.params as any)?.scheduleType ||
    (route.params as any)?.sheduleType ||
    "One Time";
  const selectedDays: string[] =
    (route.params as any)?.selectedDays ||
    (route.params as any)?.recurringDays ||
    [];
  const validityWeeks: string =
    (route.params as any)?.validityWeeks ||
    (route.params as any)?.validityPeriod?.toString() ||
    "04";
  const validityPeriod: number | null =
    scheduleType === "One Time" ? null : parseInt(validityWeeks, 10) || 4;
  const calculatedOrders: Array<{
    index: number;
    label: string;
    date: string;
  }> = (route.params as any)?.calculatedOrders || [];

  const isPackage =
    typeof isPackageRaw === "string"
      ? parseInt(isPackageRaw) || 0
      : Number(isPackageRaw);

  const safeItems = Array.isArray(items) ? items : [];
  const safeOrderItems = Array.isArray(orderItems) ? orderItems : [];
  const timeDisplay = selectedTimeSlot || "Not set";
  const displayDate =
    selectedDate ||
    calculatedOrders?.[0]?.date ||
    (calculatedOrders?.[0] as any)?.dateStr ||
    "";
  const totalDeliveryPlus = fullTotal;
  const subTotalDeliveryPlus = totalDeliveryPlus + discount;
  const serviceFee = isWholesale ? 0 : 180;

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
          { headers: { Authorization: `Bearer ${storedToken}` } },
        );

        if (customerResponse.data?.success) {
          const fetchedCustomerData = customerResponse.data.data;
          try {
            const profileResponse = await axios.get(
              `${environment.API_BASE_URL}api/customer/get-customer-data/${customerIdValue}`,
              { headers: { Authorization: `Bearer ${storedToken}` } },
            );
            const bType =
              profileResponse.data?.customer?.buyerType ||
              profileResponse.data?.data?.buyerType ||
              profileResponse.data?.buyerType;
            if (bType) {
              fetchedCustomerData.buyerType = bType;
            }
          } catch (profileErr) {
            console.warn(
              "Could not fetch customer buyerType profile:",
              profileErr,
            );
          }
          setCustomerData(fetchedCustomerData);
          const customerCity =
            route.params?.selectedAddress?.city ||
            fetchedCustomerData.buildingDetails?.city;

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
          setError(
            customerResponse.data?.message || "Failed to fetch customer data",
          );
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
    if (isSubmitting || isSubmitted) return;

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

      // ── Determine EPSD and auto-confirm status ──────────────────────────
      const isEpsdDate = (dateStr?: string | null) => {
        if (!dateStr) return false;
        const normalized = dateStr.replace(/\//g, "-").trim();
        let targetYear: number, targetMonth: number, targetDay: number;

        const ymd = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        const dmy = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
        if (ymd) {
          targetYear = parseInt(ymd[1], 10);
          targetMonth = parseInt(ymd[2], 10) - 1;
          targetDay = parseInt(ymd[3], 10);
        } else if (dmy) {
          targetDay = parseInt(dmy[1], 10);
          targetMonth = parseInt(dmy[2], 10) - 1;
          targetYear = parseInt(dmy[3], 10);
        } else {
          const target = new Date(normalized);
          if (isNaN(target.getTime())) return false;
          targetYear = target.getFullYear();
          targetMonth = target.getMonth();
          targetDay = target.getDate();
        }

        const effectiveIsWholesale =
          isWholesale ||
          (route.params as any)?.isWholesale ||
          incomingFrom === "ViewCustomerScreen" ||
          (route.params as any)?.from === "ViewCustomerScreen" ||
          String(customerData?.buyerType || "").toLowerCase() === "wholesale" ||
          String((route.params as any)?.buyerType || "").toLowerCase() ===
            "wholesale";

        const now = new Date();
        const todayYear = now.getFullYear();
        const todayMonth = now.getMonth();
        const todayDate = now.getDate();
        const isAfter6PM = now.getHours() >= 18;

        const targetDateObj = new Date(targetYear, targetMonth, targetDay);
        targetDateObj.setHours(0, 0, 0, 0);

        const todayObj = new Date(todayYear, todayMonth, todayDate);
        todayObj.setHours(0, 0, 0, 0);

        const diffDays = Math.round(
          (targetDateObj.getTime() - todayObj.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (effectiveIsWholesale) {
          // For wholesale:
          // Before 6 PM: Only Today + 2 days (Nov 13 when today is Nov 11) is EPSD (isConfirmed: 1)
          if (!isAfter6PM && diffDays === 2) return true;
          // After 6 PM: Only Today + 3 days (Nov 14) is post-cutoff EPSD (isConfirmed: 1)
          if (isAfter6PM && diffDays === 3) return true;
          return false;
        } else {
          // For retail:
          // Before 6 PM: Today + 3 days (Nov 14) is EPSD (isConfirmed: 1)
          if (!isAfter6PM && diffDays === 3) return true;
          // After 6 PM: Today + 4 days (Nov 15) is EPSD (isConfirmed: 1)
          if (isAfter6PM && diffDays === 4) return true;
          return false;
        }
      };

      const targetDateForCheck =
        scheduleType === "One Time"
          ? selectedDate
          : calculatedOrders?.[0]?.date ||
            (calculatedOrders?.[0] as any)?.dateStr;

      const isEpsdSelected = isEpsdDate(targetDateForCheck);

      const effectiveIsWholesale =
        isWholesale ||
        (route.params as any)?.isWholesale ||
        incomingFrom === "ViewCustomerScreen" ||
        (route.params as any)?.from === "ViewCustomerScreen" ||
        String(customerData?.buyerType || "").toLowerCase() === "wholesale" ||
        String((route.params as any)?.buyerType || "").toLowerCase() ===
          "wholesale";

      if (isPackage === 0) {
        const isCardPayment = paymentMethod === "Card";
        const isConfirmed = isEpsdSelected ? 1 : 0;
        const orderData = {
          userId: Number(id || customerId || customerid),
          isPackage: 0,
          total: Number(fullTotal + discount),
          fullTotal: Number(fullTotal),
          discount: Number(discount),
          deliveryCharge: Number(deliveryFee),
          sheduleType: scheduleType,
          scheduleType: scheduleType,
          validityPeriod: validityPeriod,
          validityWeeks: validityWeeks,
          selectedDays: selectedDays,
          recurringDays: selectedDays,
          calculatedOrders: calculatedOrders,
          sheduleDate: scheduleType === "One Time" ? selectedDate : null,
          sheduleTime: selectedTimeSlot,
          paymentMethod: paymentMethod,
          isPaid: isCardPayment ? 0 : 1,
          status: "confirmed",
          isFinalizeImdt: 0,
          isConfirmed: isConfirmed,
          buyerType: effectiveBuyerType,
          isWholesale: effectiveIsWholesale ? 1 : 0,
          deliveryAddress: route.params?.selectedAddress,
          items: safeItems.map((item) => ({
            productId: Number(item.id),
            qty: Number(item.qty === "g" ? Number(item.qty) / 1000 : item.qty),
            unit: item.unitType === "g" ? "g" : "kg",
            price: Math.max(0, Number(item.price || 0)),
            discount: Math.max(0, Number(item.discount || 0)),
          })),
        };
        orderPayload = { orderData };
      } else {
        const currentPackageItem = safeOrderItems[0] || {};
        const additionalItems =
          currentPackageItem.additionalItems ||
          route.params?.orderData?.additionalItems ||
          [];
        const packageItems = additionalItems.map((item: any) => ({
          productId: Number(item.productId || item.id),
          qty: Number(item.qty || item.quantity),
          unit: item.unit || "kg",
          price: Math.max(0, Number(item.price || 0)),
          discount: Math.max(0, Number(item.discount || 0)),
        }));

        const isCardPaymentPkg = paymentMethod === "Card";
        const isFinalizeImmediate =
          Number(route.params?.isFinalizeImdt ?? 0) === 1;
        const isConfirmed = isFinalizeImmediate && isEpsdSelected ? 1 : 0;

        const packageOrderData = {
          userId: Number(id || customerId || customerid),
          isPackage: 1,
          packageId: Number(
            currentPackageItem.packageId || route.params?.packageId,
          ),
          total: Number(fullTotal + discount),
          fullTotal: Number(fullTotal),
          discount: Number(discount),
          deliveryCharge: Number(deliveryFee),
          sheduleType: scheduleType,
          scheduleType: scheduleType,
          validityPeriod: validityPeriod,
          validityWeeks: validityWeeks,
          selectedDays: selectedDays,
          recurringDays: selectedDays,
          calculatedOrders: calculatedOrders,
          sheduleDate: scheduleType === "One Time" ? selectedDate : null,
          sheduleTime: selectedTimeSlot,
          transactionId: null,
          paymentMethod: paymentMethod,
          isPaid: isCardPaymentPkg ? 0 : 1,
          status: "confirmed",
          isFinalizeImdt: isFinalizeImmediate ? 1 : 0,
          isConfirmed: isConfirmed,
          buyerType: effectiveBuyerType,
          isWholesale: effectiveIsWholesale ? 1 : 0,
          deliveryAddress: route.params?.selectedAddress,
          items: packageItems,
        };

        orderPayload = { orderData: packageOrderData };
      }

      const phoneNumberForOtp =
        customerData?.phoneNumber ||
        route.params?.selectedAddress?.billingPhone1 ||
        "";

      if (!phoneNumberForOtp) {
        Alert.alert("Error", "Customer's phone number was not found.");
        setIsSubmitting(false);
        return;
      }

      await AsyncStorage.setItem(
        "pendingOrderData",
        JSON.stringify(orderPayload),
      );

      const otpApiUrl = `${environment.API_BASE_URL}api/otp/send`;
      const cleanedPhoneNumber = phoneNumberForOtp.replace(/[^\d]/g, "");
      const otpBody = {
        source: "Polygon",
        transport: "sms",
        content: {
          sms: "Thank you for your order with Polygon. Please use the below OTP to confirm your order. {{code}}",
        },
        destination: cleanedPhoneNumber,
      };

      const otpSendResponse = await axios.post(otpApiUrl, otpBody);
      console.log("📲 [OTP ORDER SEND] Response Data:", otpSendResponse.data);

      if (!otpSendResponse.data?.referenceId) {
        setIsSubmitting(false);
        Alert.alert("Error", "Failed to send OTP. Please try again.");
        return;
      }

      if (otpSendResponse.data?.referenceId) {
        Alert.alert("Success", "OTP sent successfully.");
      }

      await AsyncStorage.setItem(
        "referenceId",
        otpSendResponse.data.referenceId,
      );

      navigation.navigate("OrderConfimedOTPScreen" as any, {
        phoneNumber: phoneNumberForOtp,
        id: customerId || customerid,
        token: storedToken,
        paymentMethod: paymentMethod,
        customerName:
          `${customerData?.firstName || ""} ${customerData?.lastName || ""}`.trim(),
        customerTitle: customerData?.title || "",

        isPackage,
        total,
        fullTotal,
        subtotal: fullTotal,
        discount,
        selectedDate,
        selectedTimeSlot,
        items: safeItems,
        orderItems: safeOrderItems,
        rawPackageItems: route.params?.rawPackageItems,
        rawAdditionalItems: route.params?.rawAdditionalItems,
        selectedAddress: route.params?.selectedAddress,
        customerid: customerid || customerId,
        customerscreencustomerid,
        isFinalizeImdt: route.params?.isFinalizeImdt,
        deliveryCharge: deliveryFee,
        scheduleType,
        sheduleType: scheduleType,
        selectedDays,
        recurringDays: selectedDays,
        validityWeeks,
        validityPeriod,
        calculatedOrders,
        buyerType: effectiveBuyerType,
        isWholesale: isWholesale,
      });

      setIsSubmitting(false);
    } catch (error: any) {
      console.error("Error preparing order / sending OTP:", error);
      setIsSubmitting(false);

      let errorMessage = "Failed to send OTP";
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
    }
  };

  const getCustomerInfo = () => {
    const name = customerData
      ? `${customerData.title || ""}. ${customerData.firstName || ""} ${customerData.lastName || ""}`.trim()
      : "Guest User";

    if (route.params?.selectedAddress) {
      const address = route.params.selectedAddress;
      const formatted =
        address.type === "Apartment"
          ? `${address.buildingNo || ""}, ${address.buildingName || ""}, ${address.unitNo || ""}, ${address.floorNo ? address.floorNo + ", " : ""}${address.houseNo ? "House " + address.houseNo + ", " : ""}${address.streetName || ""}, ${address.city || ""}`
          : `${address.houseNo || ""}, ${address.streetName || ""}, ${address.city || ""}`;
      const cleaned = formatted.replace(/\s+/g, " ").trim();

      const rawPhone =
        customerData?.phoneNumber ||
        [address.billingPhone1, address.billingPhone2]
          .filter(Boolean)
          .map(toLocalPhoneFormat)
          .join(", ") ||
        "No phone";

      return {
        name,
        phone:
          rawPhone === "No phone" ? rawPhone : toLocalPhoneFormat(rawPhone),
        buildingType: address.type || "Not specified",
        address: cleaned,
      };
    }

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
        name,
        phone: customerData.phoneNumber
          ? toLocalPhoneFormat(customerData.phoneNumber)
          : "No phone",
        buildingType: customerData.buildingType || "Not specified",
        address: cleanedAddress,
      };
    }

    return {
      name,
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
            { headers: { Authorization: `Bearer ${storedToken}` } },
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
              { headers: { Authorization: `Bearer ${storedToken}` } },
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

    const monthMap: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };

    const str = String(dateStr).trim();

    // yyyy-mm-dd, yyyy/mm/dd (also with a time part)
    const ymd = str.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
    if (ymd) {
      return `${ymd[1]}/${ymd[2].padStart(2, "0")}/${ymd[3].padStart(2, "0")}`;
    }

    // dd-mm-yyyy or dd/mm/yyyy
    const dmy = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (dmy) {
      return `${dmy[3]}/${dmy[2].padStart(2, "0")}/${dmy[1].padStart(2, "0")}`;
    }

    // "17 Nov 2026", "17 November 2026", "17 Nov, 2026"
    const dMonY = str.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
    if (dMonY) {
      const mm = monthMap[dMonY[2].slice(0, 3).toLowerCase()];
      if (mm) return `${dMonY[3]}/${mm}/${dMonY[1].padStart(2, "0")}`;
    }

    // "November 17, 2026", "Nov 17 2026", "Tuesday, November 17, 2026"
    const monDY = str.match(
      /([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/,
    );
    if (monDY) {
      const mm = monthMap[monDY[1].slice(0, 3).toLowerCase()];
      if (mm) return `${monDY[3]}/${mm}/${monDY[2].padStart(2, "0")}`;
    }

    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}/${mm}/${dd}`;
    }

    return str;
  };

  const navigateBackToOrderScreen = useCallback(() => {
    const currentOrderItem = safeOrderItems[0] || {};

    const restoredPackageItems = buildRestoredPackageItems(
      route.params?.rawPackageItems || [],
    );

    const restoredAdditionalItems = buildRestoredAdditionalItems(
      route.params?.rawAdditionalItems || [],
    );

    navigation.navigate("OrderScreen" as any, {
      id: customerId || customerid,
      isPackage: "1",
      orderItems: safeOrderItems,
      number: customerData?.phoneNumber,
      title: customerData?.title,
      customerscreencustomerid: customerscreencustomerid,
      name: `${customerData?.firstName} ${customerData?.lastName}`,
      packageId: currentOrderItem.packageId || route.params?.packageId,
      packageItems: restoredPackageItems,
      additionalItems: restoredAdditionalItems,
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

      rawPackageItems: route.params?.rawPackageItems,
      rawAdditionalItems: route.params?.rawAdditionalItems,
      selectedAddress: route.params?.selectedAddress,
      deliveryCharge: deliveryFee,
      isFinalizeImdt: route.params?.isFinalizeImdt,
      scheduleType,
      sheduleType: scheduleType,
      selectedDays,
      recurringDays: selectedDays,
      validityWeeks,
      validityPeriod,
      calculatedOrders,
      buyerType: effectiveBuyerType,
      from: effectiveFrom,
      isWholesale: isWholesale,
      epsdDate: (route.params as any)?.epsdDate,
      fromOrderSummary: true,
    });
  }, [
    safeOrderItems,
    customerId,
    customerid,
    customerData,
    customerscreencustomerid,
    route.params,
    subtotal,
    discount,
    total,
    fullTotal,
    selectedDate,
    selectedTimeSlot,
    timeDisplay,
    paymentMethod,
    navigation,
  ]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          StackActions.popTo("SelectPaymentMethod", {
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
            orderData: route.params?.orderData,
            rawPackageItems: route.params?.rawPackageItems,
            rawAdditionalItems: route.params?.rawAdditionalItems,
            selectedAddress: route.params?.selectedAddress,
            deliveryCharge: deliveryFee,
            isFinalizeImdt: route.params?.isFinalizeImdt,
            scheduleType,
            sheduleType: scheduleType,
            selectedDays,
            recurringDays: selectedDays,
            validityWeeks,
            validityPeriod,
            calculatedOrders,
            buyerType: effectiveBuyerType,
            from: effectiveFrom,
            isWholesale: isWholesale,
            epsdDate: (route.params as any)?.epsdDate,
          }),
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, customerData, deliveryFee, route.params]),
  );

  useFocusEffect(
    useCallback(() => {
      setIsSubmitting(false);
    }, []),
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
      className="bg-white"
      style={{ flex: 1 }}
    >
      {/* ── Header ── */}
      <CustomHeader
        title="Order Summary"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() =>
          navigation.dispatch(
            StackActions.popTo("SelectPaymentMethod", {
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
              orderData: route.params?.orderData,
              rawPackageItems: route.params?.rawPackageItems,
              rawAdditionalItems: route.params?.rawAdditionalItems,
              selectedAddress: route.params?.selectedAddress,
              deliveryCharge: deliveryFee,
              isFinalizeImdt: route.params?.isFinalizeImdt,
              scheduleType,
              sheduleType: scheduleType,
              selectedDays,
              recurringDays: selectedDays,
              validityWeeks,
              validityPeriod,
              calculatedOrders,
              buyerType: effectiveBuyerType,
              from: effectiveFrom,
              isWholesale: isWholesale,
              epsdDate: (route.params as any)?.epsdDate,
            }),
          )
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 20 }}
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View>
          {/* ── Delivery card ── */}
          <View className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="flex-row items-center justify-between flex-1">
                <Image
                  source={require("@/assets/images/order/delivery.webp")}
                  className="w-10 h-10"
                />

                <View>
                  <View className="flex-row justify-between">
                    <Text className="text-base font-semibold">
                      Delivery - {scheduleType}
                    </Text>
                  </View>

                  <Text className="text-[#808FA2] text-sm ">
                    Scheduled to {formatDate(displayDate)}
                  </Text>

                  <Text className="text-[#808FA2] text-sm">{timeDisplay}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    navigation.dispatch(
                      StackActions.popTo("ScheduleScreen", {
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
                        rawPackageItems: route.params?.rawPackageItems,
                        rawAdditionalItems: route.params?.rawAdditionalItems,
                        selectedAddress: route.params?.selectedAddress,
                        deliveryCharge: deliveryFee,
                        fullTotal,
                        isFinalizeImdt: route.params?.isFinalizeImdt,
                        scheduleType,
                        sheduleType: scheduleType,
                        selectedDays,
                        recurringDays: selectedDays,
                        validityWeeks,
                        validityPeriod,
                        calculatedOrders,
                        buyerType: effectiveBuyerType,
                        from: effectiveFrom,
                        isWholesale: isWholesale,
                        epsdDate: (route.params as any)?.epsdDate,
                      }),
                    );
                  }}
                  disabled={isSubmitting || isSubmitted}
                  style={{ opacity: isSubmitting || isSubmitted ? 0.6 : 1 }}
                  className="mb-10"
                >
                  <View className="border border-[#6C3CD1] px-3 rounded-full ml-2">
                    <Text className="text-[#6C3CD1] font-medium">Edit</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Customer info ── */}
          <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
            <Text className="text-[#808FA2] text-s mb-2">Customer's Name</Text>
            <Text className="text-black font-medium">{customerInfo.name}</Text>

            <Text className="text-[#808FA2] text-s mt-3 mb-2">
              Customer's Phone Number
            </Text>
            <Text className="text-black font-medium">{customerInfo.phone}</Text>

            <Text className="text-[#808FA2] text-s mt-3 mb-2">
              Building Type
            </Text>
            <Text className="text-black font-medium">
              {customerInfo.buildingType}
            </Text>

            <Text className="text-[#808FA2] text-s mt-3 mb-2">Address</Text>
            <Text className="text-black font-medium">
              {customerInfo.address}
            </Text>
          </View>

          {/* ── Payment summary ── */}
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
                      buyerType: effectiveBuyerType,
                      from: effectiveFrom,
                      scheduleType,
                      sheduleType: scheduleType,
                      selectedDays,
                      recurringDays: selectedDays,
                      validityWeeks,
                      validityPeriod,
                      calculatedOrders,
                      isWholesale: isWholesale,
                      epsdDate: (route.params as any)?.epsdDate,
                      selectedAddress: route.params?.selectedAddress,
                      deliveryCharge: deliveryFee,
                      isFinalizeImdt: route.params?.isFinalizeImdt,
                      packageId: route.params?.packageId,
                    });
                  } else if (isPackage === 1) {
                    navigateBackToOrderScreen();
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
                      buyerType: effectiveBuyerType,
                      from: effectiveFrom,
                      scheduleType,
                      sheduleType: scheduleType,
                      selectedDays,
                      recurringDays: selectedDays,
                      validityWeeks,
                      validityPeriod,
                      calculatedOrders,
                      isWholesale: isWholesale,
                      epsdDate: (route.params as any)?.epsdDate,
                      selectedAddress: route.params?.selectedAddress,
                      deliveryCharge: deliveryFee,
                      isFinalizeImdt: route.params?.isFinalizeImdt,
                      packageId: route.params?.packageId,
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
                <Text className="text-black font-semibold mr-14">
                  Rs. {formatPrice(subTotalDeliveryPlus - deliveryFee)}
                </Text>
              </View>
            )}

            {isPackage === 0 && (
              <View className="flex-row justify-between mt-3">
                <Text className="text-[#8492A3] font-medium">Subtotal</Text>
                <Text className="text-black font-semibold mr-14">
                  Rs. {formatPrice(subTotalDeliveryPlus - serviceFee - deliveryFee)}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between mt-2">
              <Text className="text-[#8492A3] font-medium">Discount</Text>
              <Text className="text-gray-500 mr-14 font-medium">
                Rs. {formatPrice(discount)}
              </Text>
            </View>

            <View className="flex-row justify-between mt-2">
              <Text className="text-[#8492A3] font-medium">Delivery Fee</Text>
              <Text className="text-gray-500 mr-14 font-medium">
                Rs. {formatPrice(deliveryFee)}
              </Text>
            </View>

            {isPackage === 0 && !isWholesale && (
              <View className="flex-row justify-between mt-2">
                <Text className="text-[#8492A3] font-medium">Service Fee</Text>
                <Text className="text-gray-500 mr-14 font-medium">
                  Rs. 180.00
                </Text>
              </View>
            )}

            <View className="flex-row justify-between mt-2">
              <Text className="text-black font-semibold">Grand Total</Text>
              <Text className="text-black font-semibold mr-14">
                Rs. {formatPrice(totalDeliveryPlus)}
              </Text>
            </View>
          </View>

          {/* ── Payment method ── */}
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
                    orderData: route.params?.orderData,
                    rawPackageItems: route.params?.rawPackageItems,
                    rawAdditionalItems: route.params?.rawAdditionalItems,
                    selectedAddress: route.params?.selectedAddress,
                    deliveryCharge: deliveryFee,
                    isFinalizeImdt: route.params?.isFinalizeImdt,
                    buyerType: effectiveBuyerType,
                    from: effectiveFrom,
                    scheduleType,
                    sheduleType: scheduleType,
                    selectedDays,
                    recurringDays: selectedDays,
                    validityWeeks,
                    validityPeriod,
                    calculatedOrders,
                    isWholesale: isWholesale,
                    epsdDate: (route.params as any)?.epsdDate,
                    fromOrderSummary: true,
                  })
                }
                className="border border-[#6C3CD1] px-3 rounded-full"
                disabled={isSubmitting || isSubmitted}
                style={{ opacity: isSubmitting || isSubmitted ? 0.6 : 1 }}
              >
                <Text className="text-[#6C3CD1] font-medium">Edit</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-[#8492A3] mt-1">
              {paymentMethod === "Card" ? "Online Payment" : "Cash On Delivery"}
            </Text>
          </View>
        </View>

        {/* ── Confirm button ── */}
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
              style={{ borderRadius: 24, opacity: isSubmitted ? 0.6 : 1 }}
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

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TIME_SLOTS } from "./constants";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  BackHandler,
  Dimensions,
} from "react-native";
import { Feather, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import CustomHeader from "../common/CustomHeader";
import LoadingPage from "../common/LoadingPage";
import GlobalSearchModal from "../common/GlobalSearchModal";
import CustomCalendarModal, {
  validateDeliveryDate,
  getMinDeliveryDate,
} from "../common/CustomCalendarModal";
import { useFocusEffect } from "@react-navigation/native";

type ScheduleScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ScheduleScreen"
>;

interface AdditionalItem {
  discount: number;
  mpItemId: number;
  unitType: string;
  price: number;
  quantity: number;
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

interface OrderData {
  userId: number;
  isPackage: number;
  packageId: number | null;
  total: number;
  fullTotal: number;
  discount: number;
  additionalItems: Array<{
    productId: number;
    qty: number;
    unit: string;
    price: number;
    discount: number;
  }>;
}

interface ScheduleScreenProps {
  navigation: ScheduleScreenNavigationProp;
  route: {
    params: {
      selectedTimeSlot: any;
      packageId: number | null | undefined;
      customerId: string;
      title: string;
      name: string;
      number: string;
      customerscreencustomerid: string;
      items?: Array<{
        id: number;
        name: string;
        price: number;
        normalPrice: number;
        discountedPrice: number;
        quantity: number;
        selected: boolean;
        unitType: string;
        startValue: number;
        changeby: number;
      }>;
      total?: number;
      subtotal?: number;
      discount?: number;
      id?: string;
      isPackage?: string;
      orderData?: OrderData;
      customerid?: string;
      selectedDate?: string;
      timeDisplay?: string;
      rawPackageItems?: Array<{ name: string; qty: string }>;
      rawAdditionalItems?: Array<{
        id: number;
        name: string;
        quantity: number;
        unit: string;
        pricePerKg: number;
        discountedPricePerKg: number;
        discount: number;
        totalAmount: number;
        selected: boolean;
        changeby?: string;
        startValue?: string;
      }>;

      orderItems?: Array<{
        additionalItems?: Array<AdditionalItem>;
        isAdditionalItems: boolean;
        customerid?: string;
        isModifiedMin: boolean;
        isModifiedPlus: boolean;
        modifiedMinItems: Array<{
          additionalDiscount: number;
          additionalPrice: number;
          modifiedQuantity: number;
          originalPrice: string;
          originalQuantity: number;
          packageDetailsId: number;
        }>;
        modifiedPlusItems: Array<{
          additionalDiscount: number;
          additionalPrice: number;
          modifiedQuantity: number;
          originalPrice: string;
          originalQuantity: number;
          packageDetailsId: number;
        }>;
        packageDiscount: number;
        packageId: number;
        packageTotal: number;
      }>;
      selectedAddress?: any;
      deliveryCharge?: number;
      fullTotal?: number;
      isFinalizeImdt?: number;
      isNewCustomer?: boolean;
      scheduleType?: "One Time" | "Once a Week" | "Twice a Week";
      recurringDays?: string[];
      validityWeeks?: string;
      calculatedOrders?: Array<{ index: number; label: string; date: string }>;
    };
  };
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  normalPrice: number;
  discountedPrice: number;
  quantity: number;
  selected: boolean;
  unitType: string;
  startValue: number;
  changeby: number;
  currentTotal?: number;
  currentSubtotal?: number;
  discount?: number;
}

const SCHEDULE_TYPE_OPTIONS = [
  { label: "One Time", value: "One Time" },
  { label: "Once a Week", value: "Once a Week" },
  { label: "Twice a Week", value: "Twice a Week" },
];

const WEEK_OPTIONS = [
  { label: "02 Weeks", value: "02" },
  { label: "03 Weeks", value: "03" },
  { label: "04 Weeks", value: "04" },
  { label: "05 Weeks", value: "05" },
  { label: "06 Weeks", value: "06" },
  { label: "07 Weeks", value: "07" },
  { label: "08 Weeks", value: "08" },
  { label: "09 Weeks", value: "09" },
  { label: "10 Weeks", value: "10" },
  { label: "11 Weeks", value: "11" },
  { label: "12 Weeks", value: "12" },
];

const DAYS_OF_WEEK = [
  { id: "Mo", label: "Mo", dayIndex: 1 },
  { id: "Tu", label: "Tu", dayIndex: 2 },
  { id: "We", label: "We", dayIndex: 3 },
  { id: "Th", label: "Th", dayIndex: 4 },
  { id: "Fr", label: "Fr", dayIndex: 5 },
  { id: "Sa", label: "Sa", dayIndex: 6 },
  { id: "Su", label: "Su", dayIndex: 0 },
];

const DAYS_ROW_1 = DAYS_OF_WEEK.slice(0, 4);
const DAYS_ROW_2 = DAYS_OF_WEEK.slice(4, 7);

const ALL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    total: originalTotal = 0,
    subtotal: originalSubtotal = 0,
    discount: originalDiscount = 0,
    items: originalItems = [],
    id: customerId = "",
    isPackage = "",
    orderData,
    customerid = "",
    orderItems = [],
    selectedDate: previousSelectedDate = null,
    timeDisplay: previousTimeSlot = null,
    id,
    title,
    name,
    number,
    customerscreencustomerid,
    deliveryCharge: incomingDeliveryCharge = 0,
    selectedAddress,
  } = route.params || {};

  const [items, setItems] = useState<CartItem[]>(() => {
    return processInitialData(originalItems, orderItems);
  });
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);

  const [total, setTotal] = useState(() => {
    if (originalTotal > 0) return originalTotal;
    if (orderData) return orderData.total;
    return calculateInitialTotal(originalTotal, orderItems);
  });

  const [subtotal, setSubtotal] = useState(() => {
    if (originalSubtotal > 0) return originalSubtotal;
    if (orderData) {
      return orderData.fullTotal + orderData.discount;
    }
    return calculateInitialSubtotal(originalSubtotal, orderItems);
  });

  const [discount, setDiscount] = useState(() => {
    if (originalDiscount > 0) return originalDiscount;
    if (orderData) return orderData.discount;
    return calculateInitialDiscount(originalDiscount, orderItems);
  });

  const [scheduleType, setScheduleType] = useState<
    "One Time" | "Once a Week" | "Twice a Week"
  >(route.params?.scheduleType || "One Time");

  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    previousTimeSlot || "",
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    previousSelectedDate || null,
  );
  const [isDateSelected, setIsDateSelected] = useState(!!previousSelectedDate);
  const [showDateModal, setShowDateModal] = useState(false);

  const [selectedDays, setSelectedDays] = useState<string[]>(
    route.params?.recurringDays && route.params.recurringDays.length > 0
      ? route.params.recurringDays
      : ["Tu"],
  );

  const [selectedWeeks, setSelectedWeeks] = useState<string>(
    route.params?.validityWeeks || "",
  );

  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [weeksModalVisible, setWeeksModalVisible] = useState(false);
  const [viewOrdersModalVisible, setViewOrdersModalVisible] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState<number>(
    incomingDeliveryCharge || 0,
  );

  const isDeliveryFeeReady =
    !!selectedAddress && typeof route.params?.deliveryCharge === "number";

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);

        const customerIdi = route.params?.customerid || customerId;

        if (!customerIdi) {
          setError("No customer ID found");
          setLoading(false);
          return;
        }

        const storedToken = await AsyncStorage.getItem("authToken");

        if (!storedToken) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const apiUrl = `${environment.API_BASE_URL}api/orders/get-customer-data/${customerIdi}`;
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (response.data && response.data.success) {
          setCustomerData(response.data.data);
        } else {
          const errorMsg =
            response.data?.message || "Failed to fetch customer data";
          console.error("❌ API error:", errorMsg);
          setError(errorMsg);
        }
      } catch (error: any) {
        console.error("❌ Error fetching customer data:", error);
        if (axios.isAxiosError(error)) {
          const errorMsg = error.response?.data?.message || error.message;
          console.error("❌ Axios error details:", errorMsg);
          setError(errorMsg);
        } else {
          setError("Failed to fetch customer data");
        }
      } finally {
        setLoading(false);
      }
    };

    if (customerid || customerId) {
      fetchCustomerData();
    } else {
      console.warn("⚠️ No customer ID in route params");
    }
  }, [route.params]);

  const fullTotal = total + deliveryFee;

  const timeSlots = TIME_SLOTS;

  useEffect(() => {
    if (previousSelectedDate) {
      setSelectedDate(previousSelectedDate);
      setIsDateSelected(true);
    }

    if (previousTimeSlot) {
      setSelectedTimeSlot(previousTimeSlot);
    }
  }, [previousSelectedDate, previousTimeSlot]);

  function processInitialData(originalItems: any[], orderItems: any[]) {
    if (orderItems && orderItems.length > 0) {
      const processedItems: CartItem[] = [];
      return processedItems;
    } else if (originalItems && originalItems.length > 0) {
      return originalItems;
    } else if (
      route.params?.rawAdditionalItems &&
      route.params?.rawAdditionalItems.length > 0
    ) {
      return route.params.rawAdditionalItems.map((item: any) => ({
        id: item.id || item.productId,
        name: item.name || "",
        qty: item.quantity || item.qty || 0,
        unitType: item.unit || item.unitType || "kg",
        price: item.totalAmount || item.price || 0,
        discount: item.discount || 0,
        pricePerKg: item.pricePerKg || 0,
        discountedPricePerKg: item.discountedPricePerKg || 0,
      }));
    }
    return [];
  }

  function calculateInitialTotal(originalTotal: number, orderItems: any[]) {
    if (orderItems && orderItems.length > 0) {
      return orderItems[0].packageTotal || 0;
    }
    return originalTotal;
  }

  function calculateInitialSubtotal(
    originalSubtotal: number,
    orderItems: any[],
  ) {
    if (orderItems && orderItems.length > 0) {
      const total = orderItems[0].packageTotal || 0;
      const discount = orderItems[0].packageDiscount || 0;
      return total + discount;
    }
    return originalSubtotal;
  }

  function calculateInitialDiscount(
    originalDiscount: number,
    orderItems: any[],
  ) {
    if (orderItems && orderItems.length > 0) {
      return orderItems[0].packageDiscount || 0;
    }
    return originalDiscount;
  }

  const handleScheduleDateSelection = () => {
    setShowDateModal(true);
  };

  const handleDayToggle = (dayId: string) => {
    if (scheduleType === "Once a Week") {
      setSelectedDays([dayId]);
    } else if (scheduleType === "Twice a Week") {
      if (selectedDays.includes(dayId)) {
        if (selectedDays.length > 1) {
          setSelectedDays(selectedDays.filter((id) => id !== dayId));
        }
      } else {
        if (selectedDays.length < 2) {
          setSelectedDays([...selectedDays, dayId]);
        } else {
          setSelectedDays([selectedDays[1], dayId]);
        }
      }
    }
  };

  const calculatedOrders = useMemo(() => {
    if (scheduleType === "One Time") return [];
    if (!selectedWeeks) return [];

    const numWeeks = parseInt(selectedWeeks, 10) || 4;
    const minDate = getMinDeliveryDate();

    const dayIndices = selectedDays.map((id) => {
      const found = DAYS_OF_WEEK.find((d) => d.id === id);
      return found !== undefined ? found.dayIndex : 1;
    });

    const allDates: Date[] = [];

    dayIndices.forEach((targetDayIndex) => {
      const firstDate = new Date(minDate);
      while (firstDate.getDay() !== targetDayIndex) {
        firstDate.setDate(firstDate.getDate() + 1);
      }

      for (let w = 0; w < numWeeks; w++) {
        const nextDate = new Date(firstDate);
        nextDate.setDate(firstDate.getDate() + w * 7);
        allDates.push(nextDate);
      }
    });

    allDates.sort((a, b) => a.getTime() - b.getTime());

    return allDates.map((date, idx) => {
      const month = ALL_MONTHS[date.getMonth()];
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      const formatted = `${month} ${day}, ${year}`;
      const label = `${getOrdinal(idx + 1)} Order`;
      return {
        index: idx + 1,
        label,
        dateStr: formatted,
        dateObj: date,
      };
    });
  }, [scheduleType, selectedDays, selectedWeeks]);

  const isScheduleReady = useMemo(() => {
    if (scheduleType === "One Time") {
      return !!selectedDate && !!selectedTimeSlot;
    }
    if (scheduleType === "Once a Week") {
      return selectedDays.length === 1 && !!selectedWeeks && !!selectedTimeSlot;
    }
    if (scheduleType === "Twice a Week") {
      return selectedDays.length === 2 && !!selectedWeeks && !!selectedTimeSlot;
    }
    return false;
  }, [
    scheduleType,
    selectedDate,
    selectedDays,
    selectedWeeks,
    selectedTimeSlot,
  ]);

  const isViewOrdersReady = useMemo(() => {
    if (scheduleType === "One Time") return false;
    if (!selectedWeeks || !selectedTimeSlot) return false;
    if (scheduleType === "Once a Week") return selectedDays.length === 1;
    if (scheduleType === "Twice a Week") return selectedDays.length === 2;
    return false;
  }, [scheduleType, selectedWeeks, selectedTimeSlot, selectedDays]);

  const handleTimeSlotSelection = (selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      const val = selectedValues[0];
      if (val !== selectedTimeSlot) {
        setSelectedTimeSlot(val);
      }
    }
    setShowTimeSlotModal(false);
  };

  const convertTimeSlotTo24Hour = (timeSlot: string): string => {
    return timeSlot;
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("DeliveryAddress" as any, {
          ...route.params,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, route.params]),
  );

  const handleGoBackToCart = () => {
    navigation.navigate("CratScreen" as any, {
      id: route.params?.id,
      customerId: route.params?.customerId,
      customerscreencustomerid: route.params?.customerscreencustomerid,
      number: route.params?.number,
      title: route.params?.title,
      name: route.params?.name,
      isPackage: route.params?.isPackage,
      items: route.params?.items,
      subtotal: route.params?.subtotal,
      discount: route.params?.discount,
      total: route.params?.total,
      fullTotal: route.params?.fullTotal,
      selectedDate: route.params?.selectedDate,
      timeDisplay: route.params?.timeDisplay,
      selectedTimeSlot: route.params?.selectedTimeSlot,
      paymentMethod: (route.params as any)?.paymentMethod,
      rawPackageItems: route.params?.rawPackageItems,
      rawAdditionalItems: route.params?.rawAdditionalItems,
      orderItems: route.params?.orderItems,
      orderData: route.params?.orderData,
      selectedAddress: selectedAddress ?? undefined,
      deliveryCharge: deliveryFee,
    });
  };

  const handleProceed = () => {
    if (!isDeliveryFeeReady) {
      Alert.alert(
        "Delivery Address Required",
        "Please go back and select a valid delivery address.",
      );
      return;
    }

    if (scheduleType === "One Time") {
      if (!selectedDate) {
        Alert.alert("Required", "Please select a delivery date.");
        return;
      }

      const dateValidation = validateDeliveryDate(selectedDate);
      if (!dateValidation.isValid) {
        Alert.alert("Invalid Date", dateValidation.error);
        return;
      }

      if (!selectedTimeSlot) {
        Alert.alert("Required", "Please select a time slot");
        return;
      }
    } else if (scheduleType === "Once a Week") {
      if (!selectedWeeks) {
        Alert.alert("Required", "Please select a valid period.");
        return;
      }
      if (selectedDays.length !== 1) {
        Alert.alert("Required", "Please select 1 delivery day for the week.");
        return;
      }
      if (!selectedTimeSlot) {
        Alert.alert("Required", "Please select a time slot.");
        return;
      }
    } else if (scheduleType === "Twice a Week") {
      if (!selectedWeeks) {
        Alert.alert("Required", "Please select a valid period.");
        return;
      }
      if (selectedDays.length !== 2) {
        Alert.alert("Required", "Please select 2 delivery days for the week.");
        return;
      }
      if (!selectedTimeSlot) {
        Alert.alert("Required", "Please select a time slot.");
        return;
      }
    }

    const scheduleTime = convertTimeSlotTo24Hour(selectedTimeSlot);

    const isPackageNum = Number(route.params?.isPackage) === 1 ? 1 : 0;

    const packageId =
      isPackageNum === 1
        ? route.params?.packageId ||
          (orderItems && orderItems.length > 0
            ? orderItems[0].packageId
            : orderData
              ? orderData.packageId
              : undefined)
        : null;

    const effectiveFirstDate =
      scheduleType === "One Time"
        ? selectedDate
        : calculatedOrders[0]?.dateStr || "";

    const navigationParams = {
      items: items,
      subtotal: subtotal,
      discount: discount,
      total: total,
      fullTotal: fullTotal,
      selectedDate: effectiveFirstDate,
      selectedTimeSlot: selectedTimeSlot,
      customerId: customerId,
      isPackage: isPackageNum,
      packageId: packageId,
      customerid: customerid,
      orderItems: orderItems,
      id: id,
      title: title,
      name: name,
      number: number,
      customerscreencustomerid: customerscreencustomerid,
      sheduleDate: effectiveFirstDate,
      sheduleTime: scheduleTime,
      isFinalizeImdt: route.params?.isFinalizeImdt,
      rawPackageItems: route.params?.rawPackageItems,
      rawAdditionalItems: route.params?.rawAdditionalItems,
      selectedAddress: selectedAddress,
      deliveryCharge: deliveryFee,
      isNewCustomer: route.params?.isNewCustomer,
      scheduleType: scheduleType,
      sheduleType: scheduleType,
      selectedDays: scheduleType === "One Time" ? undefined : selectedDays,
      recurringDays: scheduleType === "One Time" ? undefined : selectedDays,
      validityWeeks: scheduleType === "One Time" ? undefined : selectedWeeks,
      validityPeriod:
        scheduleType === "One Time"
          ? undefined
          : parseInt(selectedWeeks, 10) || 4,
      calculatedOrders:
        scheduleType === "One Time"
          ? undefined
          : calculatedOrders.map((o) => ({
              index: o.index,
              label: o.label,
              date: o.dateStr,
            })),
      ...(orderData && { orderData: orderData }),
    };

    navigation.navigate("SelectPaymentMethod" as any, navigationParams);
  };

  if (loading) {
    return (
      <LoadingPage
        message="Loading Delivery Information..."
        fullScreen={true}
      />
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-4">
        <Text className="text-red-500 text-lg mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-[#6C3CD1] px-6 py-3 rounded-full"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderDayPill = (day: (typeof DAYS_OF_WEEK)[number]) => {
    const isSelected = selectedDays.includes(day.id);
    return (
      <TouchableOpacity
        key={day.id}
        activeOpacity={0.8}
        onPress={() => handleDayToggle(day.id)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          margin: 4,
          backgroundColor: isSelected ? "#F0E9FC" : "#FFFFFF",
          borderWidth: 1,
          borderColor: isSelected ? "#6C3CD1" : "#D1D5DB",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: isSelected ? "700" : "500",
            color: isSelected ? "#6C3CD1" : "#6B7280",
          }}
        >
          {day.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-white items-center">
        <View className="flex-1 w-full">
          <CustomHeader
            title="Schedule"
            titleColor="#6C3CD1"
            showBackButton={true}
            navigation={navigation}
            onBackPress={() => {
              navigation.navigate("DeliveryAddress" as any, {
                ...route.params,
              });
            }}
          />
          <View className="flex-1 bg-white items-center">
            <View className="flex-1 w-full max-w-[500px]">
              <View className="px-6 py-3">
                {/* Delivery Type / Schedule Type Dropdown */}
                <Text className="text-[#000000] mb-2">Delivery Type</Text>
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3 bg-gray-100 rounded-full"
                  activeOpacity={0.7}
                  onPress={() => setTypeModalVisible(true)}
                >
                  <Text className="flex-1 text-black ">{scheduleType}</Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="px-6 mt-[-5]"
                keyboardShouldPersistTaps="handled"
              >
                {/* ─── ONE TIME FLOW ─────────────────────────────── */}
                {scheduleType === "One Time" && (
                  <>
                    <Text className="text-[#000000] mt-4 mb-2">
                      Schedule Date
                    </Text>
                    <TouchableOpacity
                      onPress={handleScheduleDateSelection}
                      className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
                    >
                      <Text
                        className={`flex-1 ${selectedDate ? "text-black " : "text-[#7F7F7F]"}`}
                      >
                        {selectedDate || "Select Date"}
                      </Text>
                      <FontAwesome name="calendar" size={20} color="#6839CF" />
                    </TouchableOpacity>

                    <Text className="text-[#000000] mt-4 mb-2">
                      Schedule Time Slot
                    </Text>

                    <TouchableOpacity
                      onPress={() => setShowTimeSlotModal(true)}
                      className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
                    >
                      <Text
                        className={`flex-1 ${selectedTimeSlot ? "text-black" : "text-[#7F7F7F]"}`}
                      >
                        {selectedTimeSlot || "Select Time Slot"}
                      </Text>
                      <MaterialIcons
                        name="arrow-drop-down"
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </>
                )}

                {/* ─── ONCE A WEEK / TWICE A WEEK FLOW ──────────────── */}
                {scheduleType !== "One Time" && (
                  <>
                    <Text className="text-[#000000] mt-4 mb-2">
                      Valid Period
                    </Text>
                    <TouchableOpacity
                      onPress={() => setWeeksModalVisible(true)}
                      className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
                    >
                      <Text
                        className={`flex-1 ${selectedWeeks ? "text-black" : "text-[#7F7F7F]"}`}
                      >
                        {selectedWeeks
                          ? `${selectedWeeks} Weeks`
                          : "Select Weeks"}
                      </Text>
                      <MaterialIcons
                        name="arrow-drop-down"
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>

                    <Text className="text-center text-[#000000]  mt-5 mb-3">
                      {scheduleType === "Once a Week"
                        ? "Select a day"
                        : "Select 2 days"}
                    </Text>

                    {/* Days grid: forced 4-then-3 layout via two explicit rows */}
                    <View className="items-center mb-2">
                      <View className="flex-row justify-center">
                        {DAYS_ROW_1.map(renderDayPill)}
                      </View>
                      <View className="flex-row justify-center">
                        {DAYS_ROW_2.map(renderDayPill)}
                      </View>
                    </View>

                    <Text className="text-[#000000] mt-4 mb-2">
                      Schedule Time Slot
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowTimeSlotModal(true)}
                      className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
                    >
                      <Text
                        className={`flex-1 ${selectedTimeSlot ? "text-black " : "text-[#7F7F7F]"}`}
                      >
                        {selectedTimeSlot || "Select Time Slot"}
                      </Text>

                      <MaterialIcons
                        name="arrow-drop-down"
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>

                    {/* View My Orders — only shows once Valid Period +
                        Time Slot (+ correct day count) are all selected */}
                    {isViewOrdersReady && (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setViewOrdersModalVisible(true)}
                        style={{
                          width: 170,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: "#000000",
                          alignSelf: "center",
                          justifyContent: "center",
                          alignItems: "center",
                          marginVertical: 16,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 5,
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          View My Orders
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </ScrollView>

              {/* ─── SCHEDULE DATE MODAL (One Time) ────────────────── */}
              <CustomCalendarModal
                visible={showDateModal}
                onClose={() => setShowDateModal(false)}
                selectedDate={selectedDate}
                onSelectDate={(newDate) => {
                  setSelectedDate(newDate);
                  setIsDateSelected(true);
                }}
              />
            </View>

            {/* ─── SCHEDULE TYPE MODAL ────────────────────────────────── */}
            <GlobalSearchModal
              visible={typeModalVisible}
              onClose={() => setTypeModalVisible(false)}
              title="Select Delivery Type"
              data={SCHEDULE_TYPE_OPTIONS}
              selectedItems={[scheduleType]}
              onSelect={(selectedValues) => {
                if (selectedValues.length > 0) {
                  const newType = selectedValues[0] as
                    | "One Time"
                    | "Once a Week"
                    | "Twice a Week";
                  setScheduleType(newType);
                  if (newType === "Once a Week" && selectedDays.length !== 1) {
                    setSelectedDays(["Tu"]);
                  } else if (
                    newType === "Twice a Week" &&
                    selectedDays.length !== 2
                  ) {
                    setSelectedDays(["Tu", "Sa"]);
                  }
                }
                setTypeModalVisible(false);
              }}
              searchPlaceholder="Search delivery type..."
              doneButtonText="Done"
              noResultsText="No options found"
              multiSelect={false}
              searchKeys={["label"]}
              showSearch={false}
            />

            {/* ─── VALIDITY WEEKS MODAL ───────────────────────────────── */}
            <GlobalSearchModal
              visible={weeksModalVisible}
              onClose={() => setWeeksModalVisible(false)}
              title="Select Validity Period"
              data={WEEK_OPTIONS}
              selectedItems={[selectedWeeks]}
              onSelect={(selectedValues) => {
                if (selectedValues.length > 0) {
                  setSelectedWeeks(selectedValues[0]);
                }
                setWeeksModalVisible(false);
              }}
              searchPlaceholder="Search weeks..."
              doneButtonText="Done"
              noResultsText="No options found"
              multiSelect={false}
              searchKeys={["label"]}
              showSearch={false}
            />

            {/* ─── TIME SLOT MODAL (shared) ───────────────────────────── */}
            <GlobalSearchModal
              visible={showTimeSlotModal}
              onClose={() => setShowTimeSlotModal(false)}
              title="Select Time Slot"
              data={timeSlots}
              selectedItems={selectedTimeSlot ? [selectedTimeSlot] : []}
              onSelect={handleTimeSlotSelection}
              searchPlaceholder="Search time slot..."
              doneButtonText="Done"
              noResultsText="No time slots found"
              multiSelect={false}
              searchKeys={["label"]}
              showSearch={false}
            />

            {/* ─── VIEW MY ORDERS MODAL ───────────────────────────────── */}
            <Modal
              visible={viewOrdersModalVisible}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setViewOrdersModalVisible(false)}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 16,
                }}
              >
                <View
                  style={{
                    width: "92%",
                    maxHeight: Dimensions.get("window").height * 0.65,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 20,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.18,
                    shadowRadius: 10,
                    elevation: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: "#000000",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "700",
                        color: "#111111",
                      }}
                    >
                      Total Orders (
                      {String(calculatedOrders.length).padStart(2, "0")})
                    </Text>

                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => setViewOrdersModalVisible(false)}
                      style={{
                        width: 25,
                        height: 25,
                        backgroundColor: "black",
                        justifyContent: "center",
                        borderRadius: 25,
                        alignItems: "center",
                      }}
                    >
                      <MaterialIcons name="close" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    style={{
                      maxHeight: Dimensions.get("window").height * 0.52,
                    }}
                    contentContainerStyle={{
                      paddingHorizontal: 20,
                      paddingTop: 14,
                      paddingBottom: 20,
                    }}
                  >
                    {calculatedOrders.map((order) => (
                      <View key={order.index} style={{ marginBottom: 12 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 6,
                            paddingHorizontal: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "500",
                              color: "#626269",
                              width: 95,
                            }}
                          >
                            {order.label}
                          </Text>

                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: "#111111",
                              flex: 1,
                            }}
                          >
                            : {order.dateStr}
                          </Text>
                        </View>

                        {order.index === 1 && (
                          <View
                            style={{
                              width: "100%",
                              alignSelf: "stretch",
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: "#6156FF",
                              alignItems: "center",
                              justifyContent: "center",
                              marginVertical: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: "#6156FF",
                                fontSize: 13,
                                fontWeight: "400",
                                textAlign: "center",
                              }}
                            >
                              Only need to pay for this 1st order today.
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* ─── FOOTER: DELIVERY FEE / TOTAL / PROCEED ─────────────── */}
            <View
              className="bg-white flex-row justify-between items-center py-4 px-6 rounded-t-3xl shadow-lg"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 10,
                marginTop: -10,
              }}
            >
              <View className="flex-1">
                <View className="flex-row justify-between max-w-[500px]">
                  <Text className="text-[#5C5C5C]">
                    Delivery Fee :{" "}
                    <Text className="font-semibold text-[#5C5C5C]">
                      + Rs. {deliveryFee.toFixed(2)}
                    </Text>
                  </Text>
                </View>

                <View className="flex-row justify-between mt-2">
                  <Text className="font-semibold text-base">
                    Full Total :{" "}
                    <Text className="font-bold text-base">
                      Rs.{" "}
                      {fullTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </Text>
                </View>
              </View>

              <View className="py-4 items-center">
                <View
                  style={{
                    width: "100%",
                    borderRadius: 30,
                    shadowColor: "#00000033",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={handleProceed}
                    activeOpacity={0.8}
                    disabled={!isDeliveryFeeReady || !isScheduleReady}
                    style={{
                      borderRadius: 30,
                      opacity: isDeliveryFeeReady && isScheduleReady ? 1 : 0.5,
                    }}
                  >
                    <LinearGradient
                      colors={
                        isDeliveryFeeReady && isScheduleReady
                          ? ["#854BDA", "#6E3DD1"]
                          : ["#B9B9B9", "#A0A0A0"]
                      }
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        borderRadius: 30,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text className="text-white font-bold text-lg mr-2">
                        Proceed
                      </Text>
                      <Feather name="check" size={20} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ScheduleScreen;

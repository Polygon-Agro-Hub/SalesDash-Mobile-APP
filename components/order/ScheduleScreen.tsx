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
import { AlertModal } from "../common/AlertModal";

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
      packageType?: string;
      startDate?: string;
      endDate?: string;
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

  const [currentPackageType, setCurrentPackageType] = useState<string>(
    route.params?.packageId ? "" : (route.params?.packageType || ""),
  );
  const [currentStartDate, setCurrentStartDate] = useState<string | undefined>(
    route.params?.packageId ? undefined : route.params?.startDate,
  );
  const [currentEndDate, setCurrentEndDate] = useState<string | undefined>(
    route.params?.packageId ? undefined : route.params?.endDate,
  );

  const fetchLivePackageDetails = useCallback(async () => {
    const pkgId = route.params?.packageId || (orderData as any)?.packageId;
    if (!pkgId) return;
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;
      const res = await axios.get<{
        data: { packageType?: string; endDate?: string; startDate?: string };
      }>(
        `${environment.API_BASE_URL}api/packages/marketplace-package/${pkgId}?_t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
      if (res.data?.data) {
        if (res.data.data.packageType !== undefined) {
          setCurrentPackageType(res.data.data.packageType);
        }
        if (res.data.data.endDate !== undefined) {
          setCurrentEndDate(res.data.data.endDate);
        }
        if (res.data.data.startDate !== undefined) {
          setCurrentStartDate(res.data.data.startDate);
        }
      }
    } catch (e) {
      console.warn("Could not fetch live package details in ScheduleScreen:", e);
    }
  }, [route.params?.packageId, (orderData as any)?.packageId]);

  useEffect(() => {
    fetchLivePackageDetails();
  }, [fetchLivePackageDetails]);

  useFocusEffect(
    useCallback(() => {
      fetchLivePackageDetails();
    }, [fetchLivePackageDetails]),
  );
  const [isDateSelected, setIsDateSelected] = useState(!!previousSelectedDate);
  const [showDateModal, setShowDateModal] = useState(false);

  const [selectedDays, setSelectedDays] = useState<string[]>(
    route.params?.recurringDays && route.params.recurringDays.length > 0
      ? route.params.recurringDays
      : ["Tu"],
  );

  const [selectedWeeks, setSelectedWeeks] = useState<string>(() => {
    const passed = route.params?.validityWeeks;
    if (passed === "01") return "02";
    return passed || "";
  });

  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [weeksModalVisible, setWeeksModalVisible] = useState(false);
  const [viewOrdersModalVisible, setViewOrdersModalVisible] = useState(false);
  const [zeroOrdersAlertVisible, setZeroOrdersAlertVisible] = useState(false);

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

  // ─── SEASONAL PACKAGE CUTOFF & BANNER LOGIC ─────────────────────────────
  const seasonalInfo = useMemo(() => {
    const rawType =
      currentPackageType ||
      (!route.params?.packageId ? route.params?.packageType || "" : "");
    const rawEndDate =
      currentEndDate !== undefined
        ? currentEndDate
        : (!route.params?.packageId ? route.params?.endDate : undefined);
    const rawStartDate =
      currentStartDate !== undefined
        ? currentStartDate
        : (!route.params?.packageId ? route.params?.startDate : undefined);

    if (!rawEndDate) return null;

    const isOneTime =
      rawType.trim().toLowerCase() === "one time" ||
      rawType.toLowerCase().includes("one") ||
      !rawType;

    if (!isOneTime) return null;

    const parseDateStr = (dateStr: any) => {
      if (!dateStr) return null;
      if (dateStr instanceof Date) return dateStr;
      const str = String(dateStr).trim();
      if (str.includes("T") || str.includes("Z")) {
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
          return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        }
      }
      if (str.includes("-")) {
        const parts = str.split("T")[0].split("-");
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m, d);
        }
      }
      const parsed = new Date(str);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const earliestExpiryDate = parseDateStr(rawEndDate);
    if (!earliestExpiryDate) return null;

    const earliestStartDate = parseDateStr(rawStartDate);

    const expiryDay = earliestExpiryDate.getDate();

    // Cutoff date is [Expire Date] - 2 days
    const cutoffDate = new Date(earliestExpiryDate.getTime());
    cutoffDate.setDate(cutoffDate.getDate() - 2);
    cutoffDate.setHours(23, 59, 59, 999);

    // Current hour gap check (6:00 PM cutoff)
    const now = new Date();
    const isAfter6PM = now.getHours() >= 18;
    const gapDays = isAfter6PM ? 3 : 2;

    const minAvailDate = getMinDeliveryDate(); // today + (>=18 ? 4 : 3) days
    minAvailDate.setHours(0, 0, 0, 0);

    const effectiveStartDate =
      earliestStartDate && earliestStartDate > minAvailDate
        ? earliestStartDate
        : minAvailDate;

    const MONTH_SHORT = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const MONTH_LONG = [
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

    const expiryDayOrdinal = getOrdinal(expiryDay);
    const expiryMonthFull = MONTH_LONG[earliestExpiryDate.getMonth()];

    const startMonth = MONTH_SHORT[effectiveStartDate.getMonth()];
    const startDay = effectiveStartDate.getDate();
    const startDayOrdinal = getOrdinal(startDay);

    const endMonth = MONTH_SHORT[cutoffDate.getMonth()];
    const endDay = cutoffDate.getDate();
    const endDayOrdinal = getOrdinal(endDay);

    const rangeTextLong = `${startMonth} ${startDayOrdinal} - ${endMonth} ${endDayOrdinal}`;
    const rangeTextShort = `${startMonth} ${startDay} – ${endMonth} ${endDay}`;

    const isAvailableNow = effectiveStartDate <= cutoffDate;

    return {
      gapDays,
      expiryDay,
      expiryDayOrdinal,
      expiryMonthFull,
      cutoffDate,
      minAvailDate,
      earliestStartDate,
      effectiveStartDate,
      rangeTextLong,
      rangeTextShort,
      startDateFormatted: `${startMonth} ${startDay}`,
      isAvailableNow,
    };
  }, [
    currentPackageType,
    currentEndDate,
    currentStartDate,
    route.params?.packageId,
    route.params?.packageType,
    route.params?.endDate,
    route.params?.startDate,
  ]);

  const { calculatedOrders, unfilteredFirstScheduledDate } = useMemo<{
    calculatedOrders: Array<{
      index: number;
      label: string;
      dateStr: string;
      dateObj: Date;
    }>;
    unfilteredFirstScheduledDate: Date | null;
  }>(() => {
    if (scheduleType === "One Time") {
      return { calculatedOrders: [], unfilteredFirstScheduledDate: null };
    }
    if (!selectedWeeks) {
      return { calculatedOrders: [], unfilteredFirstScheduledDate: null };
    }

    const numWeeks = parseInt(selectedWeeks, 10) || 4;
    const minDate = getMinDeliveryDate();

    const dayIndices = selectedDays.map((id) => {
      const found = DAYS_OF_WEEK.find((d) => d.id === id);
      return found !== undefined ? found.dayIndex : 1;
    });

    let rawFirstDate: Date | null = null;
    let allDates: Date[] = [];

    dayIndices.forEach((targetDayIndex) => {
      const firstDate = new Date(minDate);
      while (firstDate.getDay() !== targetDayIndex) {
        firstDate.setDate(firstDate.getDate() + 1);
      }
      if (!rawFirstDate || firstDate < rawFirstDate) {
        rawFirstDate = firstDate;
      }

      for (let w = 0; w < numWeeks; w++) {
        const nextDate = new Date(firstDate);
        nextDate.setDate(firstDate.getDate() + w * 7);
        allDates.push(nextDate);
      }
    });

    allDates.sort((a, b) => a.getTime() - b.getTime());

    if (seasonalInfo) {
      if (seasonalInfo.earliestStartDate) {
        allDates = allDates.filter((d) => d >= seasonalInfo.earliestStartDate!);
      }
      if (seasonalInfo.cutoffDate) {
        allDates = allDates.filter((d) => d <= seasonalInfo.cutoffDate);
      }
    }

    const formattedOrders = allDates.map((date, idx) => {
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

    return {
      calculatedOrders: formattedOrders,
      unfilteredFirstScheduledDate: rawFirstDate,
    };
  }, [scheduleType, selectedDays, selectedWeeks, seasonalInfo]);

  const isFirstDateAvailable = useMemo(() => {
    if (!seasonalInfo) return true;
    if (!seasonalInfo.isAvailableNow) return false;
    if (scheduleType === "One Time") {
      if (!selectedDate) return true;
      const parsedSel = new Date(selectedDate);
      parsedSel.setHours(0, 0, 0, 0);
      if (
        seasonalInfo.earliestStartDate &&
        parsedSel < seasonalInfo.earliestStartDate
      ) {
        return false;
      }
      if (
        seasonalInfo.cutoffDate &&
        parsedSel > seasonalInfo.cutoffDate
      ) {
        return false;
      }
      return true;
    }
    if (calculatedOrders.length === 0) return false;
    if (unfilteredFirstScheduledDate) {
      if (
        seasonalInfo.earliestStartDate &&
        unfilteredFirstScheduledDate < seasonalInfo.earliestStartDate
      ) {
        return false;
      }
      if (
        seasonalInfo.cutoffDate &&
        unfilteredFirstScheduledDate > seasonalInfo.cutoffDate
      ) {
        return false;
      }
    }
    return true;
  }, [
    seasonalInfo,
    scheduleType,
    selectedDate,
    calculatedOrders.length,
    unfilteredFirstScheduledDate,
  ]);

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

  const handleOpenViewOrders = () => {
    if (calculatedOrders.length === 0) {
      setZeroOrdersAlertVisible(true);
    } else {
      setViewOrdersModalVisible(true);
    }
  };

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

      if (seasonalInfo && seasonalInfo.cutoffDate) {
        const chosen = new Date(selectedDate.replace(/\//g, "-"));
        if (chosen > seasonalInfo.cutoffDate) {
          Alert.alert(
            "Package Expired",
            `This package is only available for delivery until ${seasonalInfo.rangeTextShort}. Please select an earlier date.`
          );
          return;
        }
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
      if (calculatedOrders.length === 0) {
        setZeroOrdersAlertVisible(true);
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
      if (calculatedOrders.length === 0) {
        setZeroOrdersAlertVisible(true);
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
                {/* ─── SEASONAL PACKAGE BANNER ───────────────────────────── */}
                {seasonalInfo && (
                  <View
                    style={{
                      backgroundColor: "#F4EDFF",
                      borderWidth: 1,
                      borderColor: "#D8C5F8",
                      borderRadius: 16,
                      padding: 14,
                      marginTop: 10,
                      marginBottom: 10,
                    }}
                  >
                    {isFirstDateAvailable ? (
                      <>
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#1E293B",
                            lineHeight: 19,
                          }}
                        >
                          <Text style={{ fontWeight: "700" }}>Note : </Text>
                          A {seasonalInfo.gapDays}-day gap is required. Packages
                          expiring on the {seasonalInfo.expiryDayOrdinal} can be ordered
                          between the {seasonalInfo.rangeTextLong}.
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "#6B3BCF",
                              marginRight: 8,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#1E293B",
                            }}
                          >
                            Available schedule dates:{" "}
                            <Text style={{ fontWeight: "700" }}>
                              {seasonalInfo.rangeTextShort}
                            </Text>
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#1E293B",
                            lineHeight: 19,
                          }}
                        >
                          <Text style={{ fontWeight: "700" }}>Note : </Text>
                          A {seasonalInfo.gapDays}-day gap is required.
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#1E293B",
                            lineHeight: 19,
                            marginTop: 4,
                          }}
                        >
                          Scheduling available from{" "}
                          <Text style={{ fontWeight: "700" }}>
                            {seasonalInfo.startDateFormatted}
                          </Text>{" "}
                          onward.
                        </Text>
                      </>
                    )}
                  </View>
                )}

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
                        onPress={handleOpenViewOrders}
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
                minDate={seasonalInfo?.effectiveStartDate ? seasonalInfo.effectiveStartDate : undefined}
                maxDate={seasonalInfo?.cutoffDate ? seasonalInfo.cutoffDate : undefined}
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
                    maxHeight: Dimensions.get("window").height * 0.72,
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
                  {/* Header matching Global popup modal style */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: "#E5E7EB",
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
                    >
                      <MaterialIcons name="close" size={24} color="#666666" />
                    </TouchableOpacity>
                  </View>

                  {/* Order Dates List */}
                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    style={{
                      maxHeight: Dimensions.get("window").height * 0.58,
                    }}
                    contentContainerStyle={{
                      paddingHorizontal: 20,
                      paddingTop: 14,
                      paddingBottom: 20,
                    }}
                  >
                    {/* Seasonal Package Info Banner in Recurring Modal */}
                    {seasonalInfo && (
                      <View
                        style={{
                          backgroundColor: "#F4EDFF",
                          borderWidth: 1,
                          borderColor: "#D8C5F8",
                          borderRadius: 16,
                          padding: 14,
                          marginBottom: 16,
                        }}
                      >
                        {isFirstDateAvailable ? (
                          <>
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#1E293B",
                                lineHeight: 19,
                              }}
                            >
                              <Text style={{ fontWeight: "700" }}>Note : </Text>
                              A {seasonalInfo.gapDays}-day gap is required. Packages
                              expiring on the {seasonalInfo.expiryDayOrdinal} can be ordered
                              between the {seasonalInfo.rangeTextLong}.
                            </Text>

                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 10,
                              }}
                            >
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: "#6B3BCF",
                                  marginRight: 8,
                                }}
                              />
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: "#1E293B",
                                }}
                              >
                                Available schedule dates:{" "}
                                <Text style={{ fontWeight: "700" }}>
                                  {seasonalInfo.rangeTextShort}
                                </Text>
                              </Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#1E293B",
                                lineHeight: 19,
                              }}
                            >
                              <Text style={{ fontWeight: "700" }}>Note : </Text>
                              A {seasonalInfo.gapDays}-day gap is required.
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#1E293B",
                                lineHeight: 19,
                                marginTop: 4,
                              }}
                            >
                              Scheduling available from{" "}
                              <Text style={{ fontWeight: "700" }}>
                                {seasonalInfo.startDateFormatted}
                              </Text>{" "}
                              onward.
                            </Text>
                          </>
                        )}
                      </View>
                    )}

                    {calculatedOrders.map((order) => (
                      <View key={order.index} style={{ marginBottom: 12 }}>
                        {/* Order row with increased font size and px */}
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
                              color: "#64748B",
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

                        {/* Badge for 1st order - full width box */}
                        {order.index === 1 && (
                          <View
                            style={{
                              width: "100%",
                              alignSelf: "stretch",
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: "#818CF8",
                              backgroundColor: "#F5F6FF",
                              alignItems: "center",
                              justifyContent: "center",
                              marginVertical: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: "#4F46E5",
                                fontSize: 13,
                                fontWeight: "600",
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

      {/* ─── ALERT MODAL FOR 0 AVAILABLE DATES ───────────────────────── */}
      <AlertModal
        visible={zeroOrdersAlertVisible}
        type="error"
        title="We’re Sorry"
        message={`We’re sorry, but we’re unable to fulfill your request at this time. Unfortunately, there are no available dates within the next two weeks, and your package expires on ${seasonalInfo ? `${seasonalInfo.expiryMonthFull} ${seasonalInfo.expiryDay}` : "this date"}.\n\nWe apologize for the inconvenience and appreciate your understanding.`}
        onClose={() => setZeroOrdersAlertVisible(false)}
        showOkButton={true}
        okButtonText="OK"
      />
    </KeyboardAvoidingView>
  );
};

export default ScheduleScreen;

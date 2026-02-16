import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  StatusBar,
} from "react-native";
import { Feather, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import CustomHeader from "../common/CustomHeader";
import LoadingPage from "../common/LoadingPage";
import GlobalSearchModal from "../common/GlobalSearchModal";

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
      packageId: number | null | undefined;
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
  } = route.params || {};

  const [items, setItems] = useState<CartItem[]>(() => {
    return processInitialData(originalItems, orderItems);
  });
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [total, setTotal] = useState(() => {
    if (orderData) {
      return orderData.total;
    }
    return calculateInitialTotal(originalTotal, orderItems);
  });

  const [subtotal, setSubtotal] = useState(() => {
    if (orderData) {
      return orderData.fullTotal;
    }
    return calculateInitialSubtotal(originalSubtotal, orderItems);
  });

  const [discount, setDiscount] = useState(() => {
    if (orderData) {
      return orderData.discount;
    }
    return calculateInitialDiscount(originalDiscount, orderItems);
  });

  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    previousTimeSlot || "",
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    previousSelectedDate || null,
  );
  const [isDateSelected, setIsDateSelected] = useState(!!previousSelectedDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [date, setDate] = useState(() => {
    if (previousSelectedDate) {
      const parts = previousSelectedDate.split(" ");
      if (parts.length >= 3) {
        const day = parseInt(parts[0]);
        const monthStr = parts[1];
        const year = parseInt(parts[2]);

        const months = {
          Jan: 0,
          Feb: 1,
          Mar: 2,
          Apr: 3,
          May: 4,
          Jun: 5,
          Jul: 6,
          Aug: 7,
          Sep: 8,
          Oct: 9,
          Nov: 10,
          Dec: 11,
        };

        if (!isNaN(day) && !isNaN(year) && monthStr in months) {
          const newDate = new Date(
            year,
            months[monthStr as keyof typeof months],
            day,
          );
          if (!isNaN(newDate.getTime())) {
            return newDate;
          }
        }
      }
    }
    return new Date();
  });

  const getMinimumSelectableDate = () => {
    const today = new Date(); // Current date and time
    const currentHour = today.getHours(); // Get the current hour before modifying the date

    const minDate = new Date(today); // Create a new date object for minDate

    // If the current time is between 6 PM and 6 AM
    if (currentHour >= 18 || currentHour < 6) {
      minDate.setDate(today.getDate() + 4); // Set the minimum date to 4 days from today
    } else {
      minDate.setDate(today.getDate() + 3); // Set the minimum date to 3 days from today
    }

    return minDate;
  };

  const minimumDate = getMinimumSelectableDate();

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

        // Fetch customer data
        const apiUrl = `${environment.API_BASE_URL}api/orders/get-customer-data/${customerIdi}`;
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (response.data && response.data.success) {
          setCustomerData(response.data.data);

          // Fetch cities to get delivery charge
          const cityResponse = await axios.get<{ data: City[] }>(
            `${environment.API_BASE_URL}api/customer/get-city`,
            { headers: { Authorization: `Bearer ${storedToken}` } },
          );

          if (cityResponse.data && cityResponse.data.data) {
            const customerCity = response.data.data.buildingDetails?.city;
            if (customerCity) {
              const cityData = cityResponse.data.data.find(
                (c) => c.city === customerCity,
              );
              if (cityData) {
                const fee = parseFloat(cityData.charge) || 0;
                setDeliveryFee(fee);
              }
            }
          }
        } else {
          const errorMsg =
            response.data?.message || "Failed to fetch customer data";
          console.log("API error:", errorMsg);
          setError(errorMsg);
        }
      } catch (error: any) {
        console.error("Error fetching customer data:", error);
        if (axios.isAxiosError(error)) {
          const errorMsg = error.response?.data?.message || error.message;
          console.log("Axios error details:", errorMsg);
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
      console.log("No customer ID in route params");
    }
  }, [route.params]);

  const fullTotal = total + deliveryFee;

  const timeSlots = [
    { label: "Within 8AM - 2PM", value: "Within 8AM - 2PM" },
    { label: "Within 2PM - 8PM", value: "Within 2PM - 8PM" },
  ];

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
    if (!isDateSelected) {
      setDate(minimumDate);
    }
    setShowDatePicker(true);
  };

  const getSelectableDates = () => {
    const today = new Date();
    const currentHour = today.getHours(); // Get the current hour before resetting to midnight

    today.setHours(0, 0, 0, 0); // Reset to midnight

    const minDate = new Date(today);

    // If the current time is between 6 PM and 6 AM
    if (currentHour >= 18 || currentHour < 6) {
      minDate.setDate(today.getDate() + 4); // Set the minimum date to 4 days from today
    } else {
      minDate.setDate(today.getDate() + 3); // Set the minimum date to 3 days from today
    }

    return { minDate };
  };

  const { minDate } = getSelectableDates();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");

    if (selectedDate) {
      const selectedWithoutTime = new Date(selectedDate);
      selectedWithoutTime.setHours(0, 0, 0, 0);

      if (selectedWithoutTime.getTime() >= minDate.getTime()) {
        setDate(selectedDate);

        const day = selectedDate.getDate();
        const month = selectedDate.toLocaleString("en-US", { month: "short" });
        const year = selectedDate.getFullYear();
        const formattedDate = `${day} ${month} ${year}`;

        setSelectedDate(formattedDate);
        setIsDateSelected(true);
      } else {
        const minDay = minDate.getDate();
        const minMonth = minDate.toLocaleString("en-US", { month: "short" });

        Alert.alert(
          "Invalid Date",
          `Please select a date between ${minDay} ${minMonth} (inclusive)`,
        );

        setDate(minDate);
      }
    }
  };

  const handleIOSDateConfirm = () => {
    const dateWithoutTime = new Date(date);
    dateWithoutTime.setHours(0, 0, 0, 0);

    if (dateWithoutTime.getTime() >= minDate.getTime()) {
      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "short" });
      const year = date.getFullYear();
      const formattedDate = `${day} ${month} ${year}`;

      setSelectedDate(formattedDate);
      setIsDateSelected(true);
      setShowDatePicker(false);
    } else {
      const minDay = minDate.getDate();
      const minMonth = minDate.toLocaleString("en-US", { month: "short" });

      Alert.alert(
        "Invalid Date",
        `Please select a date between ${minDay} ${minMonth} (inclusive)`,
      );

      setDate(minDate);
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

  // Helper function to convert time slot to 24-hour format
  const convertTimeSlotTo24Hour = (timeSlot: string): string => {
    switch (timeSlot) {
      case "Within 8-12 PM":
        return "10:00";
      case "Within 12-4 PM":
        return "14:00";
      case "Within 4-8 PM":
        return "18:00";
      default:
        return "12:00";
    }
  };

  const handleProceed = () => {
    if (!selectedDate && !selectedTimeSlot) {
      Alert.alert("Required", "Please select a delivery date & time slot");
      return;
    }
    if (!selectedDate) {
      Alert.alert("Required", "Please select a delivery date");
      return;
    }

    if (!selectedTimeSlot) {
      Alert.alert("Required", "Please select a time slot");
      return;
    }

    // Convert selected time slot to 24-hour format
    const scheduleTime = convertTimeSlotTo24Hour(selectedTimeSlot);

    // Get packageId from the correct source
    const packageId =
      route.params?.packageId ||
      (orderItems && orderItems.length > 0
        ? orderItems[0].packageId
        : orderData
          ? orderData.packageId
          : undefined);

    // Prepare the data to pass to SelectPaymentMethod
    const navigationParams = {
      items: items,
      subtotal: subtotal,
      discount: discount,
      total: total,
      fullTotal: fullTotal,
      selectedDate: selectedDate,
      selectedTimeSlot: selectedTimeSlot,
      customerId: customerId,
      isPackage: isPackage,
      packageId: packageId,
      customerid: customerid,
      orderItems: orderItems,

      // Add the formatted schedule data
      sheduleDate: selectedDate,
      sheduleTime: scheduleTime,

      // Include orderData if it exists
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

  // Error state
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <CustomHeader
        title="Schedule"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
      />
      <View className="flex-1 bg-white">
        <View className="px-6 py-3">
          {/* Delivery Type Dropdown */}
          <Text className="text-[#000000] mb-2">Delivery Type</Text>
          <TouchableOpacity
            className="flex-row items-center px-4 py-3 bg-gray-100 rounded-full"
            activeOpacity={0.7}
          >
            <Text className="text-gray-700 font-semibold">One Time</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="px-6 mt-[-5]"
          keyboardShouldPersistTaps="handled"
        >
          {/* Schedule Date section */}
          <Text className="text-[#000000] mt-4 mb-2">Schedule Date</Text>
          <TouchableOpacity
            onPress={handleScheduleDateSelection}
            className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
          >
            <Text className="flex-1 text-[#7F7F7F]">
              {selectedDate || "Select Date"}
            </Text>
            <FontAwesome name="calendar" size={20} color="#6839CF" />
          </TouchableOpacity>

          <Text className="text-[#000000] mt-4 mb-2">Schedule Time Slot</Text>

          <TouchableOpacity
            onPress={() => setShowTimeSlotModal(true)}
            className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
          >
            <Text className="flex-1 text-[#7F7F7F]">
              {selectedTimeSlot || "Select Time Slot"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={minimumDate}
          />
        )}

        {Platform.OS === "ios" && showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
          >
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-white p-4 rounded-t-2xl">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-bold text-[#6C3CD1]">
                    Select Date
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Feather name="x" size={24} color="#6C3CD1" />
                  </TouchableOpacity>
                </View>

                <DateTimePicker
                  value={date}
                  mode="date"
                  display="inline"
                  style={{ width: 320, height: 260 }}
                  minimumDate={minimumDate}
                  onChange={handleDateChange}
                />

                <View className="flex-row justify-between mt-2">
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    className="px-4 py-2"
                  >
                    <Text className="text-[#6C3CD1] font-semibold">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleIOSDateConfirm}
                    className="px-4 py-2"
                  >
                    <Text className="text-[#6C3CD1] font-semibold">
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

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
            <View className="flex-row justify-between">
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
                  {fullTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </Text>
            </View>
          </View>

          <View
            style={{
              borderRadius: 30,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            <TouchableOpacity
              onPress={handleProceed}
              activeOpacity={0.8}
              style={{ borderRadius: 30 }}
            >
              <LinearGradient
                colors={["#854BDA", "#6E3DD1"]}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 30,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "white", fontWeight: "600", marginRight: 8 }}
                >
                  Proceed
                </Text>
                <Feather name="check" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ScheduleScreen;

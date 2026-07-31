import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Entypo, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import LoadingPage from "../common/LoadingPage";
import LottieView from "lottie-react-native";

type DeliveryAddressNavigationProp = StackNavigationProp<
  RootStackParamList,
  "DeliveryAddress"
>;

interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
}

interface DeliveryAddressProps {
  navigation: DeliveryAddressNavigationProp;
  route: {
    params: {
      customerId: string;
      selectedAddressId?: number;
      onSelectAddress?: (address: AddressBookItem) => void;
      items?: any[];
      subtotal?: number;
      discount?: number;
      total?: number;
      fullTotal?: number;
      id?: string;
      isPackage?: any;
      customerscreencustomerid?: string;
      number?: string;
      title?: string;
      name?: string;
      rawPackageItems?: any[];
      rawAdditionalItems?: any[];
      orderItems?: any[];
      orderData?: any;
      selectedDate?: string;
      timeDisplay?: string;
      selectedTimeSlot?: string;
      paymentMethod?: string;
      isFinalizeImdt?: number;
    };
  };
}

interface AddressBookItem {
  id: number;
  type: "House" | "Apartment";
  label: string;
  billingTitle?: string;
  billingName?: string;
  billingPhone1?: string;
  billingPhone2?: string;
  houseNo?: string;
  streetName?: string;
  buildingNo?: string;
  buildingName?: string;
  unitNo?: string;
  floorNo?: string;
  city?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

const DeliveryAddress: React.FC<DeliveryAddressProps> = ({
  navigation,
  route,
}) => {
  const { customerId, selectedAddressId, onSelectAddress, id } =
    route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addresses, setAddresses] = useState<AddressBookItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(
    selectedAddressId ?? null,
  );
  const [cityCharges, setCityCharges] = useState<City[]>([]);

  useEffect(() => {
    const fetchCityCharges = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        const cityResponse = await axios.get<{ data: City[] }>(
          `${environment.API_BASE_URL}api/customer/get-city`,
          storedToken
            ? { headers: { Authorization: `Bearer ${storedToken}` } }
            : undefined,
        );
        if (cityResponse.data && cityResponse.data.data) {
          setCityCharges(cityResponse.data.data);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };
    fetchCityCharges();
  }, []);

  const fetchAddressBook = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const storedToken = await AsyncStorage.getItem("authToken");
        const response = await axios.get<{ data: AddressBookItem[] }>(
          `${environment.API_BASE_URL}api/customer/get-address-book/${id}`,
          storedToken
            ? { headers: { Authorization: `Bearer ${storedToken}` } }
            : undefined,
        );

        const data = response.data?.data || [];
        setAddresses(data);

        setSelectedId((prev) => {
          if (prev && data.some((a) => a.id === prev)) return prev;
          return data.length > 0 ? data[0].id : null;
        });
      } catch (error) {
        console.error("Error fetching address book:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customerId],
  );

  useFocusEffect(
    useCallback(() => {
      fetchAddressBook();
    }, [fetchAddressBook]),
  );

  const selectedAddress = addresses.find((a) => a.id === selectedId);
  const selectedCity = selectedAddress?.city;
  const matchedCityCharge = selectedCity
    ? cityCharges.find((c) => c.city === selectedCity)
    : undefined;
  const deliveryFee = matchedCityCharge
    ? parseFloat(matchedCityCharge.charge || "0")
    : 0;

  const isDeliveryFeeReady = !!selectedAddress && !!matchedCityCharge;

  const handleGoBack = () => {
    const isPackage = route.params?.isPackage;

    if (isPackage === 1 || isPackage === "1") {
      navigation.navigate("OrderScreen" as any, {
        id: route.params?.id,
        customerId: route.params?.customerId,
        customerscreencustomerid: route.params?.customerscreencustomerid,
        number: route.params?.number,
        title: route.params?.title,
        name: route.params?.name,
        isPackage: route.params?.isPackage,
        packageId: route.params?.orderData?.packageId ?? undefined,
        rawPackageItems: route.params?.rawPackageItems,
        rawAdditionalItems: route.params?.rawAdditionalItems,
        orderData: route.params?.orderData,
        total: route.params?.total,
        fullTotal: route.params?.fullTotal,
        discount: route.params?.discount,
        selectedDate: route.params?.selectedDate,
        selectedTimeSlot: route.params?.selectedTimeSlot,
      });
    } else {
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
        fullTotal: route.params?.total,
        selectedDate: route.params?.selectedDate,
        timeDisplay: route.params?.timeDisplay,
        selectedTimeSlot: route.params?.selectedTimeSlot,
        paymentMethod: route.params?.paymentMethod,
        rawPackageItems: route.params?.rawPackageItems,
        rawAdditionalItems: route.params?.rawAdditionalItems,
        orderItems: route.params?.orderItems,
        orderData: route.params?.orderData,
        selectedAddress: selectedAddress ?? undefined,
        deliveryCharge: 0,
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!onSelectAddress) {
          handleGoBack();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [
      navigation,
      route.params,
      onSelectAddress,
      selectedAddress,
      deliveryFee,
    ]),
  );

  const handleSelect = (address: AddressBookItem) => {
    setSelectedId(address.id);
    if (onSelectAddress) {
      onSelectAddress(address);
      navigation.goBack();
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedAddress) return;

    const city = selectedAddress.city;
    const charge = city
      ? parseFloat(cityCharges.find((c) => c.city === city)?.charge || "0")
      : 0;
    const baseTotal = route.params?.total || 0;
    const computedFullTotal = baseTotal + charge;

    navigation.navigate("ScheduleScreen" as any, {
      ...route.params,
      selectedAddress: selectedAddress,
      deliveryCharge: charge,
      fullTotal: computedFullTotal,
    });
  };

  const handleAddNewAddress = () => {
    navigation.navigate("AddDeliveryAddress" as any, { customerId: id });
  };

  const handleEditAddress = (address: AddressBookItem) => {
    navigation.navigate("AddDeliveryAddress" as any, {
      customerId: id || customerId,
      addressId: address.id,
      addressType: address.type,
    });
  };

  const handleViewLocation = (address: AddressBookItem) => {
    if (!address.latitude || !address.longitude) return;
    navigation.navigate("ViewLocationScreen" as any, {
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
      locationName: address.label,
    });
  };

  const formatAddressLine = (address: AddressBookItem) => {
    const parts: string[] = [];

    if (address.type === "Apartment") {
      if (address.houseNo) parts.push(address.houseNo);
      if (address.buildingName) parts.push(address.buildingName);
      if (address.unitNo) parts.push(`${address.unitNo}`);
      if (address.floorNo) parts.push(`${address.floorNo}`);
      if (address.buildingNo) parts.push(address.buildingNo);
    } else {
      if (address.houseNo) parts.push(address.houseNo);
    }

    if (address.streetName) parts.push(address.streetName);
    if (address.city) parts.push(address.city);
    parts.push("Sri Lanka");

    return parts.filter(Boolean).join(", ");
  };

  const formatPhones = (address: AddressBookItem) => {
    return [address.billingPhone1, address.billingPhone2]
      .filter(Boolean)
      .join(", ");
  };

  const renderAddressCard = (address: AddressBookItem) => {
    const isSelected = address.id === selectedId;
    const hasLocation = !!(address.latitude && address.longitude);

    return (
      <TouchableOpacity
        key={`${address.type}-${address.id}`}
        activeOpacity={0.85}
        onPress={() => handleSelect(address)}
        onLongPress={() => handleEditAddress(address)}
        className="rounded-2xl px-4 py-4 mb-4"
        style={{
          borderWidth: 1.5,
          borderColor: isSelected ? "#7C52D5" : "#7C52D5",
          backgroundColor: isSelected ? "#F8F3FE" : "#FFFFFF",
        }}
      >
        <View className="flex-row items-start justify-between">
          <Text className="text-[13px] font-semibold text-black">
            {address.label}
          </Text>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: "#7B3FE4",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isSelected ? "#7B3FE4" : "transparent",
            }}
          >
            {isSelected && (
              <MaterialIcons name="check" size={13} color="#FFFFFF" />
            )}
          </View>
        </View>

        <Text className="text-[14px] font-semibold text-black mt-2">
          {[address.billingTitle, address.billingName]
            .filter(Boolean)
            .join(" ")}
        </Text>

        <Text
          className="text-[13px] text-gray-500 mt-1"
          style={{ lineHeight: 18 }}
        >
          {formatAddressLine(address)}
        </Text>

        {!!formatPhones(address) && (
          <Text className="text-[13px] text-gray-500 mt-1">
            {formatPhones(address)}
          </Text>
        )}

        {hasLocation && (
          <TouchableOpacity
            onPress={() => handleViewLocation(address)}
            activeOpacity={0.7}
            className="flex-row items-center mt-2 self-start"
          >
            <MaterialIcons name="location-on" size={14} color="#DC2626" />
            <Text
              className="ml-1 text-[12px] font-medium"
              style={{ color: "#DC2626", textDecorationLine: "underline" }}
            >
              View Location
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="items-center mt-20 ">
      <LottieView
        source={require("../../assets/json/address.json")}
        autoPlay
        loop
        style={{ width: 150, height: 150 }}
      />
    </View>
  );

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      className="flex-1 bg-white"
    >
      <CustomHeader
        title="Delivery Address"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => {
          if (!onSelectAddress) {
            handleGoBack();
          } else {
            navigation.goBack();
          }
        }}
      />

      {loading ? (
        <LoadingPage fullScreen={true} />
      ) : (
        <ScrollView
          className="flex-1 px-6 pt-5"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAddressBook(true)}
              colors={["#7B3FE4"]}
              tintColor="#7B3FE4"
            />
          }
        >
          {/* Add New Address */}
          <TouchableOpacity
            onPress={handleAddNewAddress}
            activeOpacity={0.85}
            className="flex-row items-center justify-between rounded-2xl px-4 py-4 mb-6 border"
            style={{
              backgroundColor: "#FAF6FE",
              borderColor: "#E6E1F3",
            }}
          >
            <View className="flex-row items-center flex-1">
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#FAF6FE",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: "#7B3FE4",
                }}
              >
                <Entypo name="location-pin" size={24} color="#7B3FE4" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[14px] font-semibold"
                  style={{ color: "#7B3FE4" }}
                >
                  Add New Address
                </Text>
                <Text className="text-[12px] text-gray-500 mt-0.5">
                  Enter a new delivery address
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#7B3FE4" />
          </TouchableOpacity>

          {/* Saved Addresses */}
          <Text className="text-[13px] font-semibold text-black mb-3">
            Saved Addresses (
            {addresses.length === 0
              ? "0"
              : String(addresses.length).padStart(2, "0")}
            )
          </Text>

          {addresses.length === 0
            ? renderEmptyState()
            : addresses.map((address) => renderAddressCard(address))}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Bottom Footer for checkout flow */}
      {!onSelectAddress && !loading && (
        <View className="px-6 py-4 bg-white border-t border-gray-100 flex-row items-center justify-between pb-8 shadow-lg">
          <View>
            <Text className="text-[12px] text-gray-500 font-medium">
              Delivery Fee : + Rs. {deliveryFee.toFixed(2)}
            </Text>
            <Text className="text-[16px] font-bold text-black mt-1">
              Full Total : Rs.{" "}
              {formatCurrency((route.params?.total || 0) + deliveryFee)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleConfirmSelection}
            disabled={!isDeliveryFeeReady}
            className="py-4 rounded-full items-center justify-center flex-row px-8"
            style={{
              backgroundColor: isDeliveryFeeReady ? "#6C3CD1" : "#C4C4C4",
              shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 10,
            }}
          >
            <Text className="text-white font-bold text-lg mr-2">Confirm</Text>
            <FontAwesome6 name="check" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default DeliveryAddress;

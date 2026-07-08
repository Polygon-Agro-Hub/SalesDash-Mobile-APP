import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import LoadingPage from "../common/LoadingPage";

type DeliveryAddressBooksNavigationProp = StackNavigationProp<
  RootStackParamList,
  "DeliveryAddressBooks"
>;

interface DeliveryAddressBooksProps {
  navigation: DeliveryAddressBooksNavigationProp;
  route: {
    params: {
      customerId: string;
    };
  };
}

interface SavedAddress {
  id: number;
  label: string;
  type: "House" | "Apartment";
  houseNo?: string;
  streetName?: string;
  buildingNo?: string;
  buildingName?: string;
  unitNo?: string;
  floorNo?: string;
  nearestCity?: string;
  billingTitle?: string;
  billingName?: string;
  billingPhone1?: string;
  billingPhone2?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface MenuPosition {
  top: number;
  right: number;
}

interface BillingInfoRow {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
}

const getBillingInfoRows = (address: SavedAddress | null): BillingInfoRow[] => {
  if (!address) return [];

  const rows: BillingInfoRow[] = [];
  const purpleIcon = { iconColor: "#7B3FE4", iconBg: "#F3EEFC" };
  const greenIcon = { iconColor: "#16A34A", iconBg: "#EAFBF1" };

  const billingTo = [address.billingTitle, address.billingName]
    .filter(Boolean)
    .join(" ");

  rows.push({
    label: "Billing To",
    value: billingTo || "—",
    icon: "account-circle-outline",
    ...purpleIcon,
  });

  if (address.type === "House") {
    rows.push({
      label: "Building No",
      value: address.houseNo || "—",
      icon: "office-building-outline",
      ...purpleIcon,
    });
    rows.push({
      label: "Street Name",
      value: address.streetName || "—",
      icon: "road-variant",
      ...purpleIcon,
    });
    rows.push({
      label: "Nearest City",
      value: address.nearestCity || "—",
      icon: "map-marker-outline",
      ...purpleIcon,
    });
  } else {
    rows.push({
      label: "Building No",
      value: address.buildingNo || "—",
      icon: "office-building-outline",
      ...purpleIcon,
    });
    rows.push({
      label: "Building Name",
      value: address.buildingName || "—",
      icon: "tag-outline",
      ...purpleIcon,
    });
    rows.push({
      label: "Unit No",
      value: address.unitNo || "—",
      icon: "door",
      ...purpleIcon,
    });
    rows.push({
      label: "Floor No",
      value: address.floorNo || "—",
      icon: "stairs",
      ...purpleIcon,
    });
    rows.push({
      label: "House No",
      value: address.houseNo || "—",
      icon: "home-outline",
      ...purpleIcon,
    });
    rows.push({
      label: "Street Name",
      value: address.streetName || "—",
      icon: "road-variant",
      ...purpleIcon,
    });
    rows.push({
      label: "Nearest City",
      value: address.nearestCity || "—",
      icon: "map-marker-outline",
      ...purpleIcon,
    });
  }

  rows.push({
    label: "Phone Num 1",
    value: address.billingPhone1 || "—",
    icon: "phone-outline",
    ...greenIcon,
  });

  if (address.billingPhone2) {
    rows.push({
      label: "Phone Num 2",
      value: address.billingPhone2,
      icon: "phone-outline",
      ...greenIcon,
    });
  }

  return rows;
};

const DeliveryAddressBooks: React.FC<DeliveryAddressBooksProps> = ({
  navigation,
  route,
}) => {
  const { customerId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    right: 0,
  });
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [billingModalVisible, setBillingModalVisible] = useState(false);

  const menuButtonRefs = useRef<{ [key: string]: View | null }>({});

  const fetchAddresses = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      const response = await axios.get(
        `${environment.API_BASE_URL}api/customer/get-address-book/${customerId}`,
        storedToken
          ? { headers: { Authorization: `Bearer ${storedToken}` } }
          : undefined,
      );
      setAddresses(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching address book:", error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      if (customerId) {
        setLoading(true);
        fetchAddresses();
      }
    }, [customerId, fetchAddresses]),
  );

  const openMenu = (address: SavedAddress) => {
    const key = `${address.type}-${address.id}`;
    const buttonRef = menuButtonRefs.current[key];

    if (buttonRef) {
      buttonRef.measure((_fx, _fy, width, height, pageX, pageY) => {
        const screenWidth = Dimensions.get("window").width;
        setMenuPosition({
          top: pageY + height + 4,
          right: screenWidth - (pageX + width),
        });
        setSelectedAddress(address);
        setMenuVisible(true);
      });
    } else {
      setSelectedAddress(address);
      setMenuVisible(true);
    }
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedAddress(null);
  };

  const handleEdit = () => {
    if (!selectedAddress) return;
    const address = selectedAddress;
    closeMenu();
    navigation.navigate("AddDeliveryAddress" as any, {
      customerId,
      addressId: address.id,
      addressType: address.type,
    });
  };

  const handleViewBillingInfo = () => {
    if (!selectedAddress) return;
    setMenuVisible(false);
    setBillingModalVisible(true);
  };

  const closeBillingModal = () => {
    setBillingModalVisible(false);
    setSelectedAddress(null);
  };

  const handleViewLocation = () => {
    if (!selectedAddress) return;
    const address = selectedAddress;
    closeMenu();

    const lat = address.latitude;
    const lng = address.longitude;

    if (!lat || !lng) {
      Alert.alert(
        "Location Unavailable",
        "No pinned location was saved for this address.",
      );
      return;
    }

    navigation.navigate("ViewLocationScreen" as any, {
      latitude: typeof lat === "string" ? parseFloat(lat) : lat,
      longitude: typeof lng === "string" ? parseFloat(lng) : lng,
      locationName: address.label,
    });
  };

  const filteredAddresses = addresses.filter((a) =>
    a.label.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const handleAddNew = () => {
    navigation.navigate("AddDeliveryAddress" as any, { customerId });
  };

  if (loading) {
    return <LoadingPage fullScreen={true} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      className="flex-1 bg-white"
    >
      <CustomHeader
        title="Delivery Address Book"
        titleColor="#000000"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
      />

      <Text className="text-center text-gray-400 text-[13px] px-10 mt-1 mb-4">
        Manage and select delivery addresses for your customer's orders.
      </Text>

      {/* Search */}
      <View className="px-5 mb-4">
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-3xl px-4 h-[46px]">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Address"
            placeholderTextColor="#B0A9C7"
            className="flex-1 text-[14px] text-black"
          />
          <MaterialIcons name="search" size={20} color="#6C3CD1" />
        </View>
      </View>

      {/* List / Empty state */}
      {filteredAddresses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10 -mt-16">
          <View className="w-28 h-28 rounded-2xl bg-gray-100 items-center justify-center mb-5">
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={48}
              color="#7B3FE4"
            />
          </View>
          <Text className="text-gray-800 text-[15px] font-semibold mb-1">
            No saved addresses yet
          </Text>
          <Text className="text-gray-400 text-[13px] text-center">
            {searchQuery
              ? "No addresses match your search."
              : "Add a delivery address to get started."}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {filteredAddresses.map((address) => (
            <View
              key={`${address.type}-${address.id}`}
              className="flex-row items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 h-[56px] mb-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
                opacity: deletingId === address.id ? 0.5 : 1,
              }}
            >
              <Text className="text-black text-[15px] font-medium">
                {address.label}
              </Text>
              <View
                ref={(node) => {
                  menuButtonRefs.current[`${address.type}-${address.id}`] =
                    node;
                }}
                collapsable={false}
              >
                <TouchableOpacity
                  onPress={() => openMenu(address)}
                  disabled={deletingId === address.id}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="more-vert" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Floating add button */}
      <TouchableOpacity
        onPress={handleAddNew}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          right: 20,
          bottom: 28,
          shadowColor: "#5B2CC9",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <LinearGradient
          colors={["#7B3FE4", "#5B2CC9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Row action dropdown — anchored directly under the tapped "..." */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={{ flex: 1 }} onPress={closeMenu}>
          <View
            style={{
              position: "absolute",
              top: menuPosition.top,
              right: menuPosition.right,
              backgroundColor: "white",
              borderRadius: 12,
              minWidth: 160,
              paddingVertical: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <TouchableOpacity
              onPress={handleViewBillingInfo}
              className="px-4 py-3"
            >
              <Text className="text-gray-700 text-[13px]">
                View Billing Info
              </Text>
            </TouchableOpacity>

            <View className="h-[1px] bg-gray-100 mx-2" />

            <TouchableOpacity
              onPress={handleViewLocation}
              className="px-4 py-3"
            >
              <Text className="text-gray-700 text-[13px]">View Location</Text>
            </TouchableOpacity>

            <View className="h-[1px] bg-gray-100 mx-2" />

            <TouchableOpacity onPress={handleEdit} className="px-4 py-3">
              <Text className="text-gray-700 text-[13px]">Edit</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Billing info modal — reads straight from the already-fetched
          address, no extra API call needed. */}
      <Modal
        visible={billingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeBillingModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
          onPress={closeBillingModal}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: 22,
              width: "100%",
              maxWidth: 340,
              paddingBottom: 18,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-4">
              <View className="flex-row items-center">
                <View
                  className="items-center justify-center rounded-full mr-3"
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor: "#F3EEFC",
                  }}
                >
                  <MaterialIcons name="location-on" size={18} color="#7B3FE4" />
                </View>
                <View className="items-center">
                  <Text className="text-black text-[16px] font-semibold">
                    {selectedAddress?.type || "Address"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={closeBillingModal}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "#111827",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View className="h-[1px] bg-gray-100 mx-5 mb-1" />

            {/* Fields */}
            <View className="px-5 pt-2">
              {getBillingInfoRows(selectedAddress).map((row, idx) => (
                <View
                  key={row.label}
                  className="flex-row items-center py-2.5"
                  style={{
                    borderBottomWidth:
                      idx < getBillingInfoRows(selectedAddress).length - 1
                        ? 0
                        : 0,
                  }}
                >
                  <View
                    className="items-center justify-center rounded-full mr-3"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: row.iconBg,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={row.icon}
                      size={14}
                      color={row.iconColor}
                    />
                  </View>
                  <Text
                    className="text-gray-400 text-[12.5px]"
                    style={{ width: 92 }}
                  >
                    {row.label}
                  </Text>
                  <Text className="text-gray-800 text-[13px] flex-1">
                    : {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default DeliveryAddressBooks;

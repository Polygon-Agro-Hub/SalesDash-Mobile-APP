import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import LoadingPage from "../common/LoadingPage";
import CustomHeader from "../common/CustomHeader";
import GlobalSearchModal from "../common/GlobalSearchModal";
import CityDeliveryStatus from "../common/CityDeliveryStatus";

type ResidentialAddressNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ResidentialAddress"
>;

interface ResidentialAddressProps {
  navigation: ResidentialAddressNavigationProp;
  route: {
    params: {
      customerId: string;
    };
  };
}

interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
  hasCenter: boolean | number;
}

const ResidentialAddress: React.FC<ResidentialAddressProps> = ({
  navigation,
  route,
}) => {
  const { customerId } = route.params || {};


  const BUILDING_TYPES = [
    { label: "House", value: "House" },
    { label: "Apartment", value: "Apartment" },
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [buildingType, setBuildingType] = useState<string>("House");
  const [buildingTypeModalVisible, setBuildingTypeModalVisible] =
    useState(false);

  const [houseNo, setHouseNo] = useState("");
  const [streetName, setStreetName] = useState("");
  const [nearestCity, setNearestCity] = useState("");
  const [nearestCityError, setNearestCityError] = useState("");
  const [canEditNearestCity, setCanEditNearestCity] = useState(false);

  const [buildingNo, setBuildingNo] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [unitNo, setUnitNo] = useState("");
  const [floorNo, setFloorNo] = useState("");

  const [cityItems, setCityItems] = useState<
    { label: string; value: string; deliverable: boolean }[]
  >([]);
  const [filteredCities, setFilteredCities] = useState<
    { label: string; value: string }[]
  >([]);
  const [cityModalVisible, setCityModalVisible] = useState(false);


  const matchedCity = cityItems.find(
    (item) =>
      item.label.trim().toLowerCase() === nearestCity.trim().toLowerCase(),
  );
  const isCityKnown = nearestCity.trim().length > 0 && !!matchedCity;
  const isCityDeliverable = isCityKnown && matchedCity!.deliverable;

  const capitalizeWords = (text: string) => {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const resetFormState = useCallback(() => {
    setBuildingType("House");
    setHouseNo("");
    setStreetName("");
    setNearestCity("");
    setNearestCityError("");
    setCanEditNearestCity(false);
    setBuildingNo("");
    setBuildingName("");
    setUnitNo("");
    setFloorNo("");
    setFilteredCities([]);
  }, []);

  const fetchCity = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{ data: City[] }>(
        `${environment.API_BASE_URL}api/customer/get-city`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        },
      );

      if (response.data && response.data.data) {
        const formattedCities = response.data.data.map((c) => ({
          label: c.city,
          value: c.city,
          deliverable: !!c.hasCenter,
        }));
        setCityItems(formattedCities);
      }
    } catch (error) {
      console.error("City fetch error:", error);
    }
  }, []);

  const fetchCustomerData = useCallback(async () => {
    try {
      const detailResponse = await axios.get(
        `${environment.API_BASE_URL}api/customer/get-customer-data/${customerId}`,
      );

      if (detailResponse.status === 200) {
        const building = detailResponse.data.building;
        const type = detailResponse.data.customer?.buildingType || "House";
        const nearestCityValue = detailResponse.data.customer?.nearesCity;

        setBuildingType(type);
        setNearestCity(nearestCityValue || "");

        if (type === "Apartment" && building) {
          setBuildingNo(building.buildingNo || "");
          setBuildingName(building.buildingName || "");
          setUnitNo(building.unitNo || "");
          setFloorNo(building.floorNo || "");
          setHouseNo(building.houseNo || "");
          setStreetName(building.streetName || "");
        } else if (building) {
          setHouseNo(building.houseNo || "");
          setStreetName(building.streetName || "");
        }
      }
    } catch (detailError) {
      console.error("Error fetching customer building address:", detailError);
      Alert.alert("Error", "Failed to load address data.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const checkDeliveredOrder = useCallback(async () => {
    try {
      const response = await axios.get(
        `${environment.API_BASE_URL}api/customer/check-delivered-order/${customerId}`,
      );
      setCanEditNearestCity(response.data?.isHaveDeliveryOrder === 1);
    } catch (error) {
      console.error("Error checking delivered order:", error);
      setCanEditNearestCity(false);
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      if (customerId) {
        setLoading(true);
        resetFormState();
        fetchCustomerData();
        checkDeliveredOrder();
        fetchCity();
      }
    }, [
      customerId,
      fetchCustomerData,
      checkDeliveredOrder,
      fetchCity,
      resetFormState,
    ]),
  );

  const handleUpdate = async () => {
    if (!streetName.trim() || !nearestCity.trim()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    if (buildingType === "House") {
      if (!houseNo.trim()) {
        Alert.alert("Missing Fields", "Please fill in all required fields.");
        return;
      }
    } else {
      if (
        !buildingNo.trim() ||
        !buildingName.trim() ||
        !unitNo.trim() ||
        !floorNo.trim() ||
        !houseNo.trim()
      ) {
        Alert.alert(
          "Missing Fields",
          "Please fill in all required apartment fields.",
        );
        return;
      }
    }

    if (canEditNearestCity) {
      if (!isCityKnown) {
        setNearestCityError("Please select a valid city from the list.");
        Alert.alert(
          "Invalid City",
          "Please select a valid city from the list.",
        );
        return;
      }
      if (!isCityDeliverable) {
        setNearestCityError("This city is not currently in our delivery area.");
        Alert.alert(
          "Not Deliverable",
          "This city is not currently in our delivery area.",
        );
        return;
      }
    }

    const payload =
      buildingType === "House"
        ? {
            buildingType,
            houseNo,
            streetName,
            ...(canEditNearestCity ? { nearestCity } : {}),
          }
        : {
            buildingType,
            buildingNo,
            buildingName,
            unitNo,
            floorNo,
            houseNo,
            streetName,
            ...(canEditNearestCity ? { nearestCity } : {}),
          };

    try {
      setSaving(true);
      await axios.put(
        `${environment.API_BASE_URL}api/customer/update-residential-address/${customerId}`,
        payload,
      );
      Alert.alert("Success", "Residential address updated successfully.");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Error updating residential address:", error);
      Alert.alert("Error", "Failed to update residential address.");
    } finally {
      setSaving(false);
    }
  };



  const renderNearestCityField = () => (
    <>
      <Text className="text-sm mb-2">Nearest City *</Text>

      {canEditNearestCity ? (
        <View className="mb-5">
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              setCityModalVisible(true);
            }}
            className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] flex-row items-center justify-between"
          >
            <Text style={{ color: nearestCity ? "black" : "#9CA3AF", fontSize: 15 }}>
              {nearestCity || "Select Nearest City"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          {nearestCityError ? (
            <Text className="text-red-500 text-xs pl-4 pt-1">
              {nearestCityError}
            </Text>
          ) : null}

          <CityDeliveryStatus
            city={nearestCity}
            filteredCities={[]}
            isCityKnown={isCityKnown}
            isCityDeliverable={isCityDeliverable}
            canEdit={canEditNearestCity}
          />
        </View>
      ) : (
        <View className="mb-5">
          <TextInput
            value={nearestCity}
            editable={false}
            placeholder=""
            placeholderTextColor="#9CA3AF"
            className="bg-gray-50 text-gray-400 rounded-3xl px-4 h-[50px] text-[15px]"
          />
        </View>
      )}
    </>
  );

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
        title="Update Residential Address"
        titleColor="#000000"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 px-6 pt-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Building Type */}
        <Text className="text-sm mb-2">Building Type *</Text>
        <View className="mb-5">
          <TouchableOpacity
            onPress={() => setBuildingTypeModalVisible(true)}
            className="bg-gray-100 rounded-3xl px-4 h-[50px] flex-row items-center justify-between"
          >
            <Text className="text-black text-[15px]">{buildingType}</Text>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* ===================== HOUSE FIELDS ===================== */}
        {buildingType === "House" && (
          <>
            <Text className="text-sm mb-2">Building / House No *</Text>
            <TextInput
              value={houseNo}
              onChangeText={(text) => setHouseNo(capitalizeWords(text))}
              placeholder="e.g. 14/B"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-gray-100 rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Street Name *</Text>
            <TextInput
              value={streetName}
              onChangeText={(text) => setStreetName(capitalizeWords(text))}
              placeholder="e.g. Diyagama Road"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-gray-100 rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            {renderNearestCityField()}
          </>
        )}

        {/* ==================== APARTMENT FIELDS ==================== */}
        {/* Mirrors dashuserapartment: buildingNo, buildingName, unitNo,
            floorNo, houseNo, streetName */}
        {buildingType === "Apartment" && (
          <>
            <Text className="text-sm mb-2">Apartment / Building No *</Text>
            <TextInput
              value={buildingNo}
              onChangeText={(text) => setBuildingNo(capitalizeWords(text))}
              placeholder="e.g. Building B"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-gray-100 rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Apartment / Building Name *</Text>
            <TextInput
              value={buildingName}
              onChangeText={(text) => setBuildingName(capitalizeWords(text))}
              placeholder="e.g. Elite Residencies"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-gray-100 rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Flat / Unit Number *</Text>
            <TextInput
              value={unitNo}
              onChangeText={(text) => setUnitNo(capitalizeWords(text))}
              placeholder="e.g. Unit 4B"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-gray-100 rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Floor Number *</Text>
            <TextInput
              value={floorNo}
              onChangeText={(text) => setFloorNo(capitalizeWords(text))}
              placeholder="e.g. 3rd Floor"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-gray-100 rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">House No *</Text>
            <TextInput
              value={houseNo}
              onChangeText={(text) => setHouseNo(capitalizeWords(text))}
              placeholder="e.g. 14"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-gray-100 rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Street Name *</Text>
            <TextInput
              value={streetName}
              onChangeText={(text) => setStreetName(capitalizeWords(text))}
              placeholder="e.g. Diyagama Road"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-gray-100 rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            {renderNearestCityField()}
          </>
        )}

        {/* Update Button */}
        <View className="px-4 pb-8 pt-5">
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#7B3FE4", "#5B2CC9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-full py-4 items-center justify-center"
              style={{ borderRadius: 999, paddingVertical: 16 }}
            >
              <Text className="text-white text-base font-semibold">
                {saving ? "Updating..." : "Update"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Building Type Selection Modal */}
      <GlobalSearchModal
        visible={buildingTypeModalVisible}
        onClose={() => setBuildingTypeModalVisible(false)}
        title="Select Building Type"
        data={BUILDING_TYPES}
        selectedItems={buildingType ? [buildingType] : []}
        onSelect={(items) => {
          if (items.length > 0) {
            setBuildingType(items[0]);
          }
          setBuildingTypeModalVisible(false);
        }}
        searchPlaceholder="Search building type..."
        multiSelect={false}
        showSearch={false}
      />

      {/* City Selection Modal (only used when nearest city is editable) */}
      <GlobalSearchModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        title="Select Nearest City"
        data={cityItems}
        selectedItems={nearestCity ? [nearestCity] : []}
        onSelect={(items) => {
          if (items.length > 0) {
            setNearestCity(items[0]);
            setNearestCityError("");
            setFilteredCities([]);
          }
          setCityModalVisible(false);
        }}
        searchPlaceholder="Search city..."
        multiSelect={false}
        showSearch={true}
      />
    </KeyboardAvoidingView>
  );
};

export default ResidentialAddress;

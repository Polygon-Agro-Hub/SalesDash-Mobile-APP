import React, { useState, useCallback, useRef, useEffect } from "react";
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
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import LoadingPage from "../common/LoadingPage";
import GlobalSearchModal from "../common/GlobalSearchModal";
import CityDeliveryStatus from "../common/CityDeliveryStatus";

type AddDeliveryAddressNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddDeliveryAddress"
>;

interface AddDeliveryAddressProps {
  navigation: AddDeliveryAddressNavigationProp;
  route: {
    params: {
      customerId: string;
      addressId?: number;
      addressType?: "House" | "Apartment";
    };
  };
}

const TITLE_OPTIONS = [
  { label: "Mr.", value: "Mr." },
  { label: "Ms.", value: "Ms." },
  { label: "Mrs.", value: "Mrs." },
  { label: "Dr.", value: "Dr." },
];

const BUILDING_TYPES = [
  { label: "House", value: "House" },
  { label: "Apartment", value: "Apartment" },
];

const AddDeliveryAddress: React.FC<AddDeliveryAddressProps> = ({
  navigation,
  route,
}) => {
  const { customerId, addressId, addressType } = route.params;
  const isEditMode = !!addressId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const [saveAddressAs, setSaveAddressAs] = useState("");
  const [title, setTitle] = useState("Mr.");
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [billingName, setBillingName] = useState("");
  const [phoneNumber1, setPhoneNumber1] = useState("");
  const [phoneNumber2, setPhoneNumber2] = useState("");

  const [buildingType, setBuildingType] = useState<string>(
    addressType || "House",
  );
  const [buildingTypeModalVisible, setBuildingTypeModalVisible] =
    useState(false);

  const [houseNo, setHouseNo] = useState("");
  const [streetName, setStreetName] = useState("");
  const [nearestCity, setNearestCity] = useState("");
  const [nearestCityError, setNearestCityError] = useState("");
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [cityItems, setCityItems] = useState<
    { label: string; value: string; deliverable: boolean }[]
  >([]);
  const [filteredCities, setFilteredCities] = useState<
    { label: string; value: string }[]
  >([]);


  const [canEditNearestCity, setCanEditNearestCity] = useState(false);

  const [buildingNo, setBuildingNo] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [unitNo, setUnitNo] = useState("");
  const [floorNo, setFloorNo] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setIsKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setIsKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const matchedCity = cityItems.find(
    (item) =>
      item.label.trim().toLowerCase() === nearestCity.trim().toLowerCase(),
  );
  const isCityKnown = nearestCity.trim().length > 0 && !!matchedCity;
  const isCityDeliverable = isCityKnown && matchedCity!.deliverable;

  const capitalizeWords = (text: string) =>
    text.replace(/\b\w/g, (char) => char.toUpperCase());

  const fetchCity = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{ data: any[] }>(
        `${environment.API_BASE_URL}api/customer/get-city`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
      );

      if (response.data?.data) {
        setCityItems(
          response.data.data.map((c) => ({
            label: c.city,
            value: c.city,
            deliverable: !!c.hasCenter,
          })),
        );
      }
    } catch (error) {
      console.error("City fetch error:", error);
    }
  }, []);

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

  const fetchProfileNearestCity = useCallback(async () => {
    try {
      const response = await axios.get(
        `${environment.API_BASE_URL}api/customer/get-customer-data/${customerId}`,
      );
      const profileNearestCity = response.data?.customer?.nearesCity;
      if (profileNearestCity) {
        setNearestCity(profileNearestCity);
      }
    } catch (error) {
      console.error("Error fetching profile nearest city:", error);
    }
  }, [customerId]);

  const fetchExistingAddress = useCallback(async () => {
    if (!addressId) return;
    try {
      const response = await axios.get(
        `${environment.API_BASE_URL}api/customer/get-saved-address/${addressId}`,
        { params: { type: addressType } },
      );
      const data = response.data?.data;
      if (!data) return;

      setSaveAddressAs(data.saveAs || "");
      setTitle(data.billingTitle || "Mr.");
      setBillingName(data.billingName || "");
      setPhoneNumber1(data.billingPhone1 || "");
      setPhoneNumber2(data.billingPhone2 || "");
      setBuildingType(data.type || addressType || "House");
      setHouseNo(data.houseNo || "");
      setStreetName(data.streetName || "");
      setNearestCity(data.nearestCity || "");
      setBuildingNo(data.buildingNo || "");
      setBuildingName(data.buildingName || "");
      setUnitNo(data.unitNo || "");
      setFloorNo(data.floorNo || "");
      if (data.latitude && data.longitude) {
        setLatitude(Number(data.latitude));
        setLongitude(Number(data.longitude));
      }
    } catch (error) {
      console.error("Error fetching saved address:", error);
      Alert.alert("Error", "Failed to load address data.");
    } finally {
      setLoading(false);
    }
  }, [addressId, addressType]);

  useFocusEffect(
    useCallback(() => {
      fetchCity();
      checkDeliveredOrder();
      if (isEditMode) {
        setLoading(true);
        fetchExistingAddress();
      } else {
        fetchProfileNearestCity();
      }
    }, [
      fetchCity,
      checkDeliveredOrder,
      fetchExistingAddress,
      fetchProfileNearestCity,
      isEditMode,
    ]),
  );

  const handlePickLocation = () => {
    navigation.navigate("AttachGeoLocationScreen" as any, {
      currentLatitude: latitude || undefined,
      currentLongitude: longitude || undefined,
      onLocationSelect: (
        selectedLatitude: number,
        selectedLongitude: number,
        selectedLocationName: string,
      ) => {
        setLatitude(selectedLatitude);
        setLongitude(selectedLongitude);
        setLocationName(selectedLocationName);
      },
    });
  };

  const handleSubmit = async () => {
    if (
      !saveAddressAs.trim() ||
      !billingName.trim() ||
      !phoneNumber1.trim() ||
      !streetName.trim() ||
      !nearestCity.trim() ||
      !houseNo.trim()
    ) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    if (
      buildingType === "Apartment" &&
      (!buildingNo.trim() ||
        !buildingName.trim() ||
        !unitNo.trim() ||
        !floorNo.trim())
    ) {
      Alert.alert(
        "Missing Fields",
        "Please fill in all required apartment fields.",
      );
      return;
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

    const payload = {
      customerId,
      saveAs: saveAddressAs,
      billingTitle: title,
      billingName,
      billingPhone1: phoneNumber1,
      billingPhone2: phoneNumber2,
      buildingType,
      houseNo,
      streetName,
      nearestCity,
      latitude,
      longitude,
      ...(buildingType === "Apartment"
        ? { buildingNo, buildingName, unitNo, floorNo }
        : {}),
    };

    try {
      setSaving(true);
      if (isEditMode) {
        await axios.put(
          `${environment.API_BASE_URL}api/customer/update-saved-address/${addressId}`,
          { ...payload, type: buildingType },
        );
      } else {
        await axios.post(
          `${environment.API_BASE_URL}api/customer/add-saved-address`,
          payload,
        );
      }
      Alert.alert(
        "Success",
        `Address ${isEditMode ? "updated" : "added"} successfully.`,
      );
      navigation.goBack();
    } catch (error) {
      console.error("Error saving address:", error);
      Alert.alert("Error", "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    return text.replace(/[^0-9]/g, "").slice(0, 10);
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
        title={isEditMode ? "Edit Delivery Address" : "Add Delivery Address"}
        titleColor="#000000"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 px-6 pt-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
      >
        {/* Save Address As */}
        <Text className="text-sm mb-2">Save Address As *</Text>
        <TextInput
          value={saveAddressAs}
          onChangeText={setSaveAddressAs}
          placeholder="e.g. Home"
          placeholderTextColor="#9CA3AF"
          className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
        />

        {/* Title + Billing Name */}
        <View className="flex-row mb-5" style={{ gap: 12 }}>
          <View style={{ width: 90 }}>
            <Text className="text-sm mb-2">Title *</Text>
            <TouchableOpacity
              onPress={() => setTitleModalVisible(true)}
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] flex-row items-center justify-between"
            >
              <Text className="text-black text-[15px]">{title}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View className="flex-1">
            <Text className="text-sm mb-2">Billing Name *</Text>
            <TextInput
              value={billingName}
              onChangeText={(text) => setBillingName(capitalizeWords(text))}
              placeholder="e.g. Billing Name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black"
            />
          </View>
        </View>

        {/* Phone Number 1 */}
        <Text className="text-sm mb-2">Phone Number - 1 *</Text>
        <TextInput
          value={phoneNumber1}
          onChangeText={(text) => setPhoneNumber1(formatPhoneNumber(text))}
          placeholder="e.g. 077 XXXX XXX"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
        />

        {/* Phone Number 2 */}
        <Text className="text-sm mb-2">Phone Number - 2</Text>
        <TextInput
          value={phoneNumber2}
          onChangeText={(text) => setPhoneNumber2(formatPhoneNumber(text))}
          placeholder="e.g. 077 XXXX XXX"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
        />

        {/* Building Type */}
        <Text className="text-sm mb-2">Building Type *</Text>
        <TouchableOpacity
          onPress={() => setBuildingTypeModalVisible(true)}
          className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] flex-row items-center justify-between mb-5"
        >
          <Text className="text-black text-[15px]">{buildingType}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        {/* ===================== APARTMENT FIELDS ===================== */}
        {buildingType === "Apartment" && (
          <>
            <Text className="text-sm mb-2">Apartment / Building No *</Text>
            <TextInput
              value={buildingNo}
              onChangeText={(text) => setBuildingNo(capitalizeWords(text))}
              placeholder="Apartment / Building No"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Apartment / Building Name *</Text>
            <TextInput
              value={buildingName}
              onChangeText={(text) => setBuildingName(capitalizeWords(text))}
              placeholder="Apartment / Building Name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Flat / Unit Number *</Text>
            <TextInput
              value={unitNo}
              onChangeText={(text) => setUnitNo(capitalizeWords(text))}
              placeholder="e.g. Building B"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Floor Number *</Text>
            <TextInput
              value={floorNo}
              onChangeText={(text) => setFloorNo(capitalizeWords(text))}
              placeholder="e.g. 3rd Floor"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Building / House No *</Text>
            <TextInput
              value={houseNo}
              onChangeText={(text) => setHouseNo(capitalizeWords(text))}
              placeholder="e.g. 14"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Street Name *</Text>
            <TextInput
              value={streetName}
              onChangeText={(text) => setStreetName(capitalizeWords(text))}
              placeholder="Street Name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            {renderNearestCityField()}
          </>
        )}

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
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            <Text className="text-sm mb-2">Street Name *</Text>
            <TextInput
              value={streetName}
              onChangeText={(text) => setStreetName(capitalizeWords(text))}
              placeholder="Street Name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-5"
            />

            {renderNearestCityField()}
          </>
        )}

        {/* Geo Location */}
        <TouchableOpacity
          onPress={handlePickLocation}
          activeOpacity={0.8}
          className="self-center flex-row items-center border rounded-full px-8 py-3 mb-2"
          style={{ borderColor: "#6C3CD1", maxWidth: "100%" }}
        >
          <FontAwesome6
            name={"location-crosshairs"}
            size={16}
            color="#7B3FE4"
          />
          <Text
            className="ml-2 text-[13px] font-medium"
            numberOfLines={1}
            style={{ color: "#7B3FE4", maxWidth: 220 }}
          >
            Geo Location
          </Text>
        </TouchableOpacity>

        {latitude && longitude ? (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ViewLocationScreen" as any, {
                latitude,
                longitude,
                locationName,
              })
            }
            activeOpacity={0.7}
            className="self-center flex-row items-center mb-6"
          >
            <MaterialIcons name="location-on" size={16} color="#DC2626" />
            <Text
              className="ml-1 text-[13px] font-medium"
              style={{ color: "#DC2626", textDecorationLine: "underline" }}
            >
              View Here
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="mb-6" />
        )}

        {/* Submit */}
        <View className="pb-8">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
            className="h-[50px] px-8"
          >
            <LinearGradient
              colors={["#7B3FE4", "#5B2CC9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 999,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-white text-base font-semibold">
                {saving
                  ? isEditMode
                    ? "Updating..."
                    : "Submitting..."
                  : "Submit"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        {isKeyboardVisible && <View style={{ height: 120 }} />}
      </ScrollView>

      {/* Title Modal */}
      <GlobalSearchModal
        visible={titleModalVisible}
        onClose={() => setTitleModalVisible(false)}
        title="Select Title"
        data={TITLE_OPTIONS}
        selectedItems={title ? [title] : []}
        onSelect={(items) => {
          if (items.length > 0) setTitle(items[0]);
          setTitleModalVisible(false);
        }}
        searchPlaceholder="Search title..."
        multiSelect={false}
        showSearch={false}
      />

      {/* Building Type Modal */}
      <GlobalSearchModal
        visible={buildingTypeModalVisible}
        onClose={() => setBuildingTypeModalVisible(false)}
        title="Select Building Type"
        data={BUILDING_TYPES}
        selectedItems={buildingType ? [buildingType] : []}
        onSelect={(items) => {
          if (items.length > 0) setBuildingType(items[0]);
          setBuildingTypeModalVisible(false);
        }}
        searchPlaceholder="Search building type..."
        multiSelect={false}
        showSearch={false}
      />

      {/* Nearest City Modal (only used when nearest city is editable) */}
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

export default AddDeliveryAddress;

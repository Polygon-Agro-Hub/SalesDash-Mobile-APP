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
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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
  { label: "Rev", value: "Rev" },
  { label: "Mr", value: "Mr" },
  { label: "Ms", value: "Ms" },
  { label: "Mrs", value: "Mrs" },
];

const BUILDING_TYPES = [
  { label: "House", value: "House" },
  { label: "Apartment", value: "Apartment" },
];

const SAVE_ADDRESS_AS_MAX_LENGTH = 30;

// Central place for field labels used in "X is required" messages,
// so the label text shown on-screen and the error text always match.
const FIELD_LABELS = {
  saveAddressAs: "Save Address As",
  billingName: "Billing Name",
  phoneNumber1: "Phone Number 1",
  buildingType: "Building Type",
  houseNo: "Building / House No",
  streetName: "Street Name",
  nearestCity: "Nearest City",
  buildingNo: "Apartment / Building No",
  buildingName: "Apartment / Building Name",
  unitNo: "Flat / Unit Number",
  floorNo: "Floor Number",
} as const;

const requiredMessage = (label: string) => `${label} is required`;

const AddDeliveryAddress: React.FC<AddDeliveryAddressProps> = ({
  navigation,
  route,
}) => {
  const { customerId, addressId, addressType } = route.params;
  const isEditMode = !!addressId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const dataLoaded = useRef(false);

  const [saveAddressAs, setSaveAddressAs] = useState("");
  const [saveAsError, setSaveAsError] = useState("");
  const [geoLocationError, setGeoLocationError] = useState("");
  const [addressLocationError, setAddressLocationError] = useState("");
  const [phoneError1, setPhoneError1] = useState("");
  const [phoneError2, setPhoneError2] = useState("");
  const [title, setTitle] = useState("");
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [billingName, setBillingName] = useState("");
  const [phoneNumber1, setPhoneNumber1] = useState("");
  const [phoneNumber2, setPhoneNumber2] = useState("");
  const [billingNameError, setBillingNameError] = useState("");
  const [houseNoError, setHouseNoError] = useState("");
  const [streetNameError, setStreetNameError] = useState("");
  const [buildingNoError, setBuildingNoError] = useState("");
  const [buildingNameError, setBuildingNameError] = useState("");
  const [unitNoError, setUnitNoError] = useState("");
  const [floorNoError, setFloorNoError] = useState("");

  const [buildingType, setBuildingType] = useState<string>(addressType || "");
  const [buildingTypeModalVisible, setBuildingTypeModalVisible] =
    useState(false);
  const [buildingTypeError, setBuildingTypeError] = useState("");

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

  const [citiesLoading, setCitiesLoading] = useState(true);

  const [canEditNearestCity, setCanEditNearestCity] = useState(false);

  const [buildingNo, setBuildingNo] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [unitNo, setUnitNo] = useState("");
  const [floorNo, setFloorNo] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("");

  const matchedCity = cityItems.find(
    (item) =>
      item.label.trim().toLowerCase() === nearestCity.trim().toLowerCase(),
  );
  const isCityKnown = nearestCity.trim().length > 0 && !!matchedCity;
  const isCityDeliverable = isCityKnown && matchedCity!.deliverable;

  const cityBlocksSubmit =
    canEditNearestCity &&
    !citiesLoading &&
    nearestCity.trim().length > 0 &&
    !isCityDeliverable;

  const stripLeadingSpace = (text: string) => text.replace(/^\s+/, "");

  const capitalizeWords = (text: string) =>
    stripLeadingSpace(text).replace(/\b\w/g, (char) => char.toUpperCase());

  const phoneRegex = /^\+947\d{8}$/;

  const validatePhoneNumber = (phone: string) => {
    if (!phone || phone.length > 12) return false;
    return phoneRegex.test(phone);
  };

  // fieldLabel is used to build the "[Field Name] is required" message.
  const handleRequiredFieldBlur = (
    value: string,
    setError: (value: string) => void,
    fieldLabel: string,
  ) => {
    if (!value.trim()) {
      setError(requiredMessage(fieldLabel));
    }
  };

  const handleRequiredFieldChange = (
    value: string,
    setter: (value: string) => void,
    setError: (value: string) => void,
    fieldLabel: string,
  ) => {
    setter(value);
    setError(value.trim() ? "" : requiredMessage(fieldLabel));
  };

  const formatPhoneNumber = (text: string) => {
    if (text.startsWith(" ")) return text;

    if (!text.startsWith("+94")) {
      if (text.length < 3) {
        return "+94";
      }
      text = "+94" + text.replace(/^\+?94?/, "");
    }

    if (text.length > 12) {
      text = text.substring(0, 12);
    }

    return text.substring(0, 3) + text.substring(3).replace(/[^0-9]/g, "");
  };

  const handlePhoneValidationChange = (
    value: string,
    field: "phone1" | "phone2",
  ) => {
    const nextValue = formatPhoneNumber(value);

    if (field === "phone1") {
      setPhoneNumber1(nextValue);

      if (!nextValue.trim()) {
        setPhoneError1(requiredMessage(FIELD_LABELS.phoneNumber1));
        return;
      }

      if (!validatePhoneNumber(nextValue)) {
        setPhoneError1(
          "Please enter a valid mobile number (format: +947XXXXXXXX)",
        );
        return;
      }

      setPhoneError1("");
      return;
    }

    setPhoneNumber2(nextValue);

    if (!nextValue.trim()) {
      setPhoneError2("");
      return;
    }

    if (!validatePhoneNumber(nextValue)) {
      setPhoneError2(
        "Please enter a valid mobile number (format: +947XXXXXXXX)",
      );
      return;
    }

    setPhoneError2("");
  };

  const normalizeLegacyPhoneNumber = (rawNumber: string) => {
    if (!rawNumber) return "";

    if (rawNumber.startsWith("+94")) {
      return formatPhoneNumber(rawNumber);
    }

    const digitsOnly = rawNumber.replace(/[^0-9]/g, "");
    const withoutLeadingZero = digitsOnly.startsWith("0")
      ? digitsOnly.slice(1)
      : digitsOnly;

    return formatPhoneNumber("+94" + withoutLeadingZero);
  };

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
    } finally {
      setCitiesLoading(false);
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
    if (dataLoaded.current) return;
    dataLoaded.current = true;
    try {
      const response = await axios.get(
        `${environment.API_BASE_URL}api/customer/get-saved-address/${addressId}`,
        { params: { type: addressType } },
      );
      const data = response.data?.data;
      if (!data) return;

      setSaveAddressAs(
        (data.saveAs || "").slice(0, SAVE_ADDRESS_AS_MAX_LENGTH),
      );
      setTitle(data.billingTitle || "");
      setBillingName(data.billingName || "");
      setPhoneNumber1(normalizeLegacyPhoneNumber(data.billingPhone1 || ""));
      setPhoneNumber2(normalizeLegacyPhoneNumber(data.billingPhone2 || ""));
      setBuildingType(data.type || addressType || "");
      setHouseNo(data.houseNo || "");
      setStreetName(data.streetName || "");
      setNearestCity(data.nearestCity || "");
      setBuildingNo(data.buildingNo || "");
      setBuildingName(data.buildingName || "");
      setUnitNo(data.unitNo || "");
      setFloorNo(data.floorNo || "");

      if (data.latitude != null && data.longitude != null) {
        setLatitude(Number(data.latitude));
        setLongitude(Number(data.longitude));
      }
    } catch (error) {
      console.error("Error fetching saved address:", error);
      Alert.alert("Error", "Failed to load address data.");
      dataLoaded.current = false;
    } finally {
      setLoading(false);
    }
  }, [addressId, addressType]);

  useFocusEffect(
    useCallback(() => {
      setCitiesLoading(true);
      fetchCity();
      checkDeliveredOrder();
      if (isEditMode) {
        // Only trigger the loading screen / fetch on the FIRST focus.
        // On later focuses (e.g. returning from ViewLocationScreen),
        // dataLoaded.current is already true, so fetchExistingAddress()
        // would bail out on its early `if (dataLoaded.current) return;`
        // line — before ever reaching the `finally { setLoading(false) }`.
        // That previously left `loading` stuck at true forever, so the
        // screen just showed <LoadingPage /> permanently after coming
        // back from the map picker.
        if (!dataLoaded.current) {
          setLoading(true);
          fetchExistingAddress();
        }
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
    let hasError = false;
    let alertTitle = "Required";
    let alertMessage = "Please fill in all required fields.";

    setSaveAsError("");
    setBillingNameError("");
    setPhoneError1("");
    setBuildingTypeError("");
    setHouseNoError("");
    setStreetNameError("");
    setBuildingNoError("");
    setBuildingNameError("");
    setUnitNoError("");
    setFloorNoError("");
    setNearestCityError("");
    setGeoLocationError("");
    setAddressLocationError("");
    setPhoneError2("");

    if (!saveAddressAs.trim()) {
      setSaveAsError(requiredMessage(FIELD_LABELS.saveAddressAs));
      hasError = true;
      alertTitle = "Required";
      alertMessage = "Please enter a save address name.";
    }
    if (!buildingType.trim()) {
      setBuildingTypeError(requiredMessage(FIELD_LABELS.buildingType));
      hasError = true;
      alertTitle = "Required";
      alertMessage = "Please select a building type.";
    }

    if (!billingName.trim()) {
      setBillingNameError(requiredMessage(FIELD_LABELS.billingName));
      hasError = true;
      alertTitle = "Required";
      alertMessage = "Please enter the billing name.";
    }

    if (!phoneNumber1.trim()) {
      setPhoneError1(requiredMessage(FIELD_LABELS.phoneNumber1));
      hasError = true;
      alertTitle = "Required";
      alertMessage = "Phone Number 1 is required.";
    } else if (!validatePhoneNumber(phoneNumber1)) {
      setPhoneError1(
        "Please enter a valid mobile number (format: +947XXXXXXXX)",
      );
      hasError = true;
      alertTitle = "Invalid Phone Number";
      alertMessage =
        "Please enter a valid mobile number (format: +947XXXXXXXX).";
    }

    if (!houseNo.trim()) {
      setHouseNoError(requiredMessage(FIELD_LABELS.houseNo));
      hasError = true;
      alertTitle = "Required";
      alertMessage = "Please enter the house or building number.";
    }

    if (!streetName.trim()) {
      setStreetNameError(requiredMessage(FIELD_LABELS.streetName));
      hasError = true;
      alertTitle = "Required";
      alertMessage = "Please enter the street name.";
    }

    if (!nearestCity.trim()) {
      setNearestCityError(requiredMessage(FIELD_LABELS.nearestCity));
      hasError = true;
      alertTitle = "Required";
      alertMessage = "Please select the nearest city.";
    }

    if (buildingType === "Apartment") {
      if (!buildingNo.trim()) {
        setBuildingNoError(requiredMessage(FIELD_LABELS.buildingNo));
        hasError = true;
        alertTitle = "Required";
        alertMessage = "Please enter the apartment or building number.";
      }
      if (!buildingName.trim()) {
        setBuildingNameError(requiredMessage(FIELD_LABELS.buildingName));
        hasError = true;
        alertTitle = "Required";
        alertMessage = "Please enter the apartment or building name.";
      }
      if (!unitNo.trim()) {
        setUnitNoError(requiredMessage(FIELD_LABELS.unitNo));
        hasError = true;
        alertTitle = "Required";
        alertMessage = "Please enter the flat or unit number.";
      }
      if (!floorNo.trim()) {
        setFloorNoError(requiredMessage(FIELD_LABELS.floorNo));
        hasError = true;
        alertTitle = "Required";
        alertMessage = "Please enter the floor number.";
      }
    }

    const phoneNumber2ToSubmit =
      phoneNumber2.trim() === "+94" ? "" : phoneNumber2.trim();

    if (phoneNumber2ToSubmit && !validatePhoneNumber(phoneNumber2ToSubmit)) {
      setPhoneError2(
        "Please enter a valid mobile number (format: +947XXXXXXXX)",
      );
      hasError = true;
      alertTitle = "Invalid Phone Number";
      alertMessage =
        "Please enter a valid second mobile number (format: +947XXXXXXXX).";
    }

    if (canEditNearestCity) {
      if (!isCityKnown) {
        setNearestCityError("Please select a valid city from the list.");
        hasError = true;
        alertTitle = "Invalid City";
        alertMessage = "Please select a valid city from the list.";
      } else if (!isCityDeliverable) {
        setNearestCityError("This city is not currently in our delivery area.");
        hasError = true;
        alertTitle = "Not Deliverable";
        alertMessage = "This city is not currently in our delivery area.";
      }
    }

    if (!latitude || !longitude) {
      setGeoLocationError(
        "Geo location is required. Please pin your location before submitting.",
      );
      hasError = true;
      alertTitle = "Geo Location Required";
      alertMessage = "Please add a geo location before submitting.";
    }

    if (hasError) {
      const hasSpecificRequiredFieldError =
        !saveAddressAs.trim() ||
        !billingName.trim() ||
        !phoneNumber1.trim() ||
        !buildingType.trim() ||
        !houseNo.trim() ||
        !streetName.trim() ||
        !nearestCity.trim() ||
        (buildingType === "Apartment" &&
          (!buildingNo.trim() ||
            !buildingName.trim() ||
            !unitNo.trim() ||
            !floorNo.trim()));

      Alert.alert(
        hasSpecificRequiredFieldError ? "Required" : alertTitle,
        hasSpecificRequiredFieldError
          ? "Please fill in all required fields"
          : alertMessage,
      );
      return;
    }

    const payload = {
      customerId,
      saveAs: saveAddressAs,
      billingTitle: title,
      billingName,
      billingPhone1: phoneNumber1,
      billingPhone2: phoneNumber2ToSubmit,
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
      if (axios.isAxiosError(error) && error.response) {
        console.error("Error saving address details:", error.response.data);

        if (error.response.status === 409) {
          const { errorCode, error: errMsg } = error.response.data || {};
          if (errorCode === "DUPLICATE_ADDRESS") {
            setAddressLocationError(
              errMsg ||
                "This address location already exists. Please use a different address.",
            );
            Alert.alert(
              "Duplicate Address",
              errMsg ||
                "This address already exists for this customer. Please enter a different address.",
            );
          } else {
            setSaveAsError(
              "This name is already used. Please choose a different name.",
            );
            Alert.alert(
              "Duplicate Name",
              "An address with this name already exists. Please use a different name.",
            );
          }
          return;
        }
      } else {
        console.error("Error saving address:", error);
      }
      Alert.alert("Error", "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneFocus = (value: string, setter: (v: string) => void) => {
    if (!value || value.length < 3) setter("+94");
  };

  const handlePhoneKeyPress = (e: any, value: string) => {
    const { key } = e.nativeEvent;
    if (key === "Backspace" && value.length <= 3) {
      e.preventDefault();
      return false;
    }
  };

  const handlePhoneBlur = (value: string, setter: (v: string) => void) => {
    if (value === "+94") setter("");
  };

  const renderNearestCityField = () => (
    <>
      <Text className="text-sm mb-2">Nearest City *</Text>

      {canEditNearestCity ? (
        <View className="mb-5">
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              if (!nearestCity.trim()) {
                setNearestCityError(requiredMessage(FIELD_LABELS.nearestCity));
              }
              setCityModalVisible(true);
            }}
            className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] flex-row items-center justify-between"
          >
            <Text
              style={{ color: nearestCity ? "black" : "#9CA3AF", fontSize: 15 }}
            >
              {nearestCity || "Select Nearest City"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          {nearestCityError ? (
            <Text className="text-red-500 text-xs pl-4 pt-1">
              {nearestCityError}
            </Text>
          ) : null}

          {!citiesLoading && (
            <CityDeliveryStatus
              city={nearestCity}
              filteredCities={[]}
              isCityKnown={isCityKnown}
              isCityDeliverable={isCityDeliverable}
              canEdit={canEditNearestCity}
            />
          )}
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
    <View className="flex-1 bg-white">
      <CustomHeader
        title={isEditMode ? "Edit Delivery Address" : "Add Delivery Address"}
        titleColor="#000000"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        className="px-6 pt-5"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.select({ ios: 20, android: 80 })}
        extraHeight={Platform.select({ ios: 75, android: 120 })}
        keyboardOpeningTime={0}
      >
        {/* Save Address As */}
        <Text className="text-sm mb-2">Save Address As *</Text>
        <TextInput
          value={saveAddressAs}
          onChangeText={(text) => {
            const nextValue = capitalizeWords(
              stripLeadingSpace(text).slice(0, SAVE_ADDRESS_AS_MAX_LENGTH),
            );
            handleRequiredFieldChange(
              nextValue,
              setSaveAddressAs,
              setSaveAsError,
              FIELD_LABELS.saveAddressAs,
            );
          }}
          onBlur={() =>
            handleRequiredFieldBlur(
              saveAddressAs,
              setSaveAsError,
              FIELD_LABELS.saveAddressAs,
            )
          }
          placeholder="e.g. : Home"
          placeholderTextColor="#9CA3AF"
          maxLength={SAVE_ADDRESS_AS_MAX_LENGTH}
          style={{
            borderWidth: saveAsError ? 1 : 0,
            borderColor: saveAsError ? "#DC2626" : "transparent",
            fontStyle: saveAddressAs ? "normal" : "italic",
          }}
          className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
        />
        {saveAsError ? (
          <Text className="text-red-500 text-xs pl-4 mb-4">{saveAsError}</Text>
        ) : (
          <View className="mb-4" />
        )}

        {/* Title + Billing Name */}
        <View className="flex-row mb-5" style={{ gap: 12 }}>
          <View style={{ width: 90 }}>
            <Text className="text-sm mb-2">Title *</Text>
            <TouchableOpacity
              onPress={() => setTitleModalVisible(true)}
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] flex-row items-center justify-between"
            >
              <Text
  style={{
    color: title ? "black" : "#9CA3AF",
    fontSize: 15,
    fontStyle: title ? "normal" : "italic",
  }}
>
  {title || "Title"}
</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View className="flex-1">
            <Text className="text-sm mb-2">Billing Name *</Text>
            <TextInput
              value={billingName}
              onChangeText={(text) => {
                const filteredText = text.replace(/[^A-Za-z\s]/g, "");
                const nextValue = capitalizeWords(filteredText);
                handleRequiredFieldChange(
                  nextValue,
                  setBillingName,
                  setBillingNameError,
                  FIELD_LABELS.billingName,
                );
              }}
              onBlur={() =>
                handleRequiredFieldBlur(
                  billingName,
                  setBillingNameError,
                  FIELD_LABELS.billingName,
                )
              }
              placeholder="e.g. : Billing Name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black"
              style={{
                borderWidth: billingNameError ? 1 : 0,
                borderColor: billingNameError ? "#DC2626" : "transparent",
                fontStyle: billingName ? "normal" : "italic",
              }}
            />
            {billingNameError ? (
              <Text className="text-red-500 text-xs pl-4 mt-1">
                {billingNameError}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Phone Number 1 */}
        <Text className="text-sm mb-2">Phone Number - 1 *</Text>
        <TextInput
          value={phoneNumber1}
          onChangeText={(text) => handlePhoneValidationChange(text, "phone1")}
          onFocus={() => handlePhoneFocus(phoneNumber1, setPhoneNumber1)}
          onBlur={() => {
            handlePhoneBlur(phoneNumber1, setPhoneNumber1);
            if (!phoneNumber1.trim()) {
              setPhoneError1(requiredMessage(FIELD_LABELS.phoneNumber1));
            } else if (!validatePhoneNumber(phoneNumber1)) {
              setPhoneError1(
                "Please enter a valid mobile number (format: +947XXXXXXXX)",
              );
            }
          }}
          onKeyPress={(e) => handlePhoneKeyPress(e, phoneNumber1)}
          placeholder="e.g. : 077 XXXX XXX"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={12}
          style={{
            borderWidth: phoneError1 ? 1 : 0,
            borderColor: phoneError1 ? "#DC2626" : "transparent",
            fontStyle: phoneNumber1 ? "normal" : "italic",
          }}
          className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
        />
        {phoneError1 ? (
          <Text className="text-red-500 text-xs pl-4 mb-4">{phoneError1}</Text>
        ) : (
          <View className="mb-4" />
        )}

        {/* Phone Number 2 */}
        <Text className="text-sm mb-2">Phone Number - 2</Text>
        <TextInput
          value={phoneNumber2}
          onChangeText={(text) => handlePhoneValidationChange(text, "phone2")}
          onFocus={() => handlePhoneFocus(phoneNumber2, setPhoneNumber2)}
          onBlur={() => {
            handlePhoneBlur(phoneNumber2, setPhoneNumber2);
            if (phoneNumber2.trim() && !validatePhoneNumber(phoneNumber2)) {
              setPhoneError2(
                "Please enter a valid mobile number (format: +947XXXXXXXX)",
              );
            } else {
              setPhoneError2("");
            }
          }}
          onKeyPress={(e) => handlePhoneKeyPress(e, phoneNumber2)}
          placeholder="e.g. : 077 XXXX XXX"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={12}
          style={{
            borderWidth: phoneError2 ? 1 : 0,
            borderColor: phoneError2 ? "#DC2626" : "transparent",
            fontStyle: phoneNumber2 ? "normal" : "italic",
          }}
          className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
        />
        {phoneError2 ? (
          <Text className="text-red-500 text-xs pl-4 mb-4">{phoneError2}</Text>
        ) : (
          <View className="mb-4" />
        )}

        {/* Building Type */}
        <Text className="text-sm mb-2">Building Type *</Text>
        <TouchableOpacity
          onPress={() => setBuildingTypeModalVisible(true)}
          className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] flex-row items-center justify-between"
          style={{
            borderWidth: buildingTypeError ? 1 : 0,
            borderColor: buildingTypeError ? "#DC2626" : "transparent",
          }}
        >
          <Text
  style={{
    color: buildingType ? "black" : "#9CA3AF",
    fontSize: 15,
    fontStyle: buildingType ? "normal" : "italic",
  }}
>
  {buildingType || "Select Building Type"}
</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>
        {buildingTypeError ? (
          <Text className="text-red-500 text-xs pl-4 mt-1 mb-4">
            {buildingTypeError}
          </Text>
        ) : (
          <View className="mb-5" />
        )}

        {/* ===================== APARTMENT FIELDS ===================== */}
        {buildingType === "Apartment" && (
          <>
            <Text className="text-sm mb-2">Apartment / Building No *</Text>
            <TextInput
              value={buildingNo}
              onChangeText={(text) => {
                const nextValue = capitalizeWords(text);
                handleRequiredFieldChange(
                  nextValue,
                  setBuildingNo,
                  setBuildingNoError,
                  FIELD_LABELS.buildingNo,
                );
                if (addressLocationError) setAddressLocationError("");
              }}
              onBlur={() =>
                handleRequiredFieldBlur(
                  buildingNo,
                  setBuildingNoError,
                  FIELD_LABELS.buildingNo,
                )
              }
              placeholder="Apartment / Building No"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              style={{
                borderWidth: buildingNoError ? 1 : 0,
                borderColor: buildingNoError ? "#DC2626" : "transparent",
                fontStyle: buildingNo ? "normal" : "italic",
              }}
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
            />
            {buildingNoError ? (
              <Text className="text-red-500 text-xs pl-4 mb-4">
                {buildingNoError}
              </Text>
            ) : null}

            <Text className="text-sm mb-2">Apartment / Building Name *</Text>
            <TextInput
              value={buildingName}
              onChangeText={(text) => {
                const nextValue = capitalizeWords(text);
                handleRequiredFieldChange(
                  nextValue,
                  setBuildingName,
                  setBuildingNameError,
                  FIELD_LABELS.buildingName,
                );
                if (addressLocationError) setAddressLocationError("");
              }}
              onBlur={() =>
                handleRequiredFieldBlur(
                  buildingName,
                  setBuildingNameError,
                  FIELD_LABELS.buildingName,
                )
              }
              placeholder="Apartment / Building Name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              style={{
                borderWidth: buildingNameError ? 1 : 0,
                borderColor: buildingNameError ? "#DC2626" : "transparent",
                fontStyle: buildingName ? "normal" : "italic",
              }}
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
            />
            {buildingNameError ? (
              <Text className="text-red-500 text-xs pl-4 mb-4">
                {buildingNameError}
              </Text>
            ) : null}

            <Text className="text-sm mb-2">Flat / Unit Number *</Text>
            <TextInput
              value={unitNo}
              onChangeText={(text) => {
                const nextValue = capitalizeWords(text);
                handleRequiredFieldChange(
                  nextValue,
                  setUnitNo,
                  setUnitNoError,
                  FIELD_LABELS.unitNo,
                );
                if (addressLocationError) setAddressLocationError("");
              }}
              onBlur={() =>
                handleRequiredFieldBlur(
                  unitNo,
                  setUnitNoError,
                  FIELD_LABELS.unitNo,
                )
              }
              placeholder="e.g. : Building B"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              style={{
                borderWidth: unitNoError ? 1 : 0,
                borderColor: unitNoError ? "#DC2626" : "transparent",
                fontStyle: unitNo ? "normal" : "italic",
              }}
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
            />
            {unitNoError ? (
              <Text className="text-red-500 text-xs pl-4 mb-4">
                {unitNoError}
              </Text>
            ) : null}

            <Text className="text-sm mb-2">Floor Number *</Text>
            <TextInput
              value={floorNo}
              onChangeText={(text) => {
                const nextValue = capitalizeWords(text);
                handleRequiredFieldChange(
                  nextValue,
                  setFloorNo,
                  setFloorNoError,
                  FIELD_LABELS.floorNo,
                );
                if (addressLocationError) setAddressLocationError("");
              }}
              onBlur={() =>
                handleRequiredFieldBlur(
                  floorNo,
                  setFloorNoError,
                  FIELD_LABELS.floorNo,
                )
              }
              placeholder="e.g. : 3rd Floor"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              style={{
                borderWidth: floorNoError ? 1 : 0,
                borderColor: floorNoError ? "#DC2626" : "transparent",
                fontStyle: floorNo ? "normal" : "italic",
              }}
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
            />
            {floorNoError ? (
              <Text className="text-red-500 text-xs pl-4 mb-4">
                {floorNoError}
              </Text>
            ) : null}

            <Text className="text-sm mb-2">Building / House No *</Text>
            <TextInput
              value={houseNo}
              onChangeText={(text) => {
                const nextValue = capitalizeWords(text);
                handleRequiredFieldChange(
                  nextValue,
                  setHouseNo,
                  setHouseNoError,
                  FIELD_LABELS.houseNo,
                );
                if (addressLocationError) setAddressLocationError("");
              }}
              onBlur={() =>
                handleRequiredFieldBlur(
                  houseNo,
                  setHouseNoError,
                  FIELD_LABELS.houseNo,
                )
              }
              placeholder="e.g. : 14"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              style={{
                borderWidth: houseNoError ? 1 : 0,
                borderColor: houseNoError ? "#DC2626" : "transparent",
                fontStyle: houseNo ? "normal" : "italic",
              }}
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
            />
            {houseNoError ? (
              <Text className="text-red-500 text-xs pl-4 mb-4">
                {houseNoError}
              </Text>
            ) : null}

            <Text className="text-sm mb-2">Street Name *</Text>
            <TextInput
              value={streetName}
              onChangeText={(text) => {
                const nextValue = capitalizeWords(text);
                handleRequiredFieldChange(
                  nextValue,
                  setStreetName,
                  setStreetNameError,
                  FIELD_LABELS.streetName,
                );
                if (addressLocationError) setAddressLocationError("");
              }}
              onBlur={() =>
                handleRequiredFieldBlur(
                  streetName,
                  setStreetNameError,
                  FIELD_LABELS.streetName,
                )
              }
              placeholder="Street Name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              style={{
                borderWidth: streetNameError ? 1 : 0,
                borderColor: streetNameError ? "#DC2626" : "transparent",
                fontStyle: streetName ? "normal" : "italic",
              }}
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
            />
            {streetNameError ? (
              <Text className="text-red-500 text-xs pl-4 mb-4">
                {streetNameError}
              </Text>
            ) : null}

            {/* Duplicate address location error */}
            {addressLocationError ? (
              <Text className="text-red-500 text-xs pl-1 -mt-3 mb-4">
                {addressLocationError}
              </Text>
            ) : null}

            {renderNearestCityField()}
          </>
        )}

        {/* ===================== HOUSE FIELDS ===================== */}
        {buildingType === "House" && (
          <>
            <Text className="text-sm mb-2">Building / House No *</Text>
            <TextInput
              value={houseNo}
              onChangeText={(text) => {
                const nextValue = capitalizeWords(text);
                handleRequiredFieldChange(
                  nextValue,
                  setHouseNo,
                  setHouseNoError,
                  FIELD_LABELS.houseNo,
                );
                if (addressLocationError) setAddressLocationError("");
              }}
              onBlur={() =>
                handleRequiredFieldBlur(
                  houseNo,
                  setHouseNoError,
                  FIELD_LABELS.houseNo,
                )
              }
              placeholder="e.g. : 14/B"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              style={{
                borderWidth: houseNoError ? 1 : 0,
                borderColor: houseNoError ? "#DC2626" : "transparent",
                fontStyle: houseNo ? "normal" : "italic",
              }}
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
            />
            {houseNoError ? (
              <Text className="text-red-500 text-xs pl-4 mb-4">
                {houseNoError}
              </Text>
            ) : null}

            <Text className="text-sm mb-2">Street Name *</Text>
            <TextInput
              value={streetName}
              onChangeText={(text) => {
                const nextValue = capitalizeWords(text);
                handleRequiredFieldChange(
                  nextValue,
                  setStreetName,
                  setStreetNameError,
                  FIELD_LABELS.streetName,
                );
                if (addressLocationError) setAddressLocationError("");
              }}
              onBlur={() =>
                handleRequiredFieldBlur(
                  streetName,
                  setStreetNameError,
                  FIELD_LABELS.streetName,
                )
              }
              placeholder="Street Name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              style={{
                borderWidth: streetNameError ? 1 : 0,
                borderColor: streetNameError ? "#DC2626" : "transparent",
                fontStyle: streetName ? "normal" : "italic",
              }}
              className="bg-[#F6F6F6] rounded-3xl px-4 h-[50px] text-[15px] text-black mb-1"
            />
            {streetNameError ? (
              <Text className="text-red-500 text-xs pl-4 mb-4">
                {streetNameError}
              </Text>
            ) : null}

            {/* Duplicate address location error */}
            {addressLocationError ? (
              <Text className="text-red-500 text-xs pl-1 -mt-3 mb-4">
                {addressLocationError}
              </Text>
            ) : null}

            {renderNearestCityField()}
          </>
        )}

        {/* Geo Location */}
        <TouchableOpacity
          onPress={() => {
            setGeoLocationError("");
            handlePickLocation();
          }}
          activeOpacity={0.8}
          className="self-center flex-row items-center border rounded-full px-8 py-3 mb-1"
          style={{
            borderColor: "#6C3CD1",
            borderWidth: 1,
            backgroundColor: "#FFF",
            // Border glow (iOS)
            shadowColor: "#6C3CD1",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 4,

            // Android
            elevation: 5,
          }}
        >
          <FontAwesome6
            name={"location-crosshairs"}
            size={16}
            color={"#7B3FE4"}
          />
          <Text
            className="ml-2 text-[13px] font-medium"
            numberOfLines={1}
            style={{
              color:  "#7B3FE4",
              maxWidth: 220,
            }}
          >
            {latitude && longitude
              ? "Update Geo Location"
              : "Add Geo Location "}
          </Text>
        </TouchableOpacity>

        {/* Geo location error message */}
        {geoLocationError ? (
          <Text className="text-red-500 text-xs text-center mb-2">
            {geoLocationError}
          </Text>
        ) : null}

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
          <View className="mb-4" />
        )}

        {/* Submit */}
        <View className="px-4 pb-8 pt-2">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving || cityBlocksSubmit}
            activeOpacity={0.85}
            style={{
              borderRadius: 999,
              overflow: "hidden",
              height: 50,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={
                saving || cityBlocksSubmit
                  ? ["#D1D5DB", "#9CA3AF"]
                  : ["#7B3FE4", "#5B2CC9"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 999,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-white text-base font-semibold">
                {saving
                  ? isEditMode
                    ? "Updating..."
                    : "Submitting..."
                  : isEditMode
                    ? "Update"
                    : "Submit"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* Modals stay outside, same as before */}
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

      <GlobalSearchModal
        visible={buildingTypeModalVisible}
        onClose={() => setBuildingTypeModalVisible(false)}
        title="Select Building Type"
        data={BUILDING_TYPES}
        selectedItems={buildingType ? [buildingType] : []}
        onSelect={(items) => {
          if (items.length > 0) {
            setBuildingType(items[0]);
            setBuildingTypeError("");
          }
          setBuildingTypeModalVisible(false);
        }}
        searchPlaceholder="Search building type..."
        multiSelect={false}
        showSearch={false}
      />

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
        noResultsText="No Results Found"
      />
    </View>
  );
};

export default AddDeliveryAddress;
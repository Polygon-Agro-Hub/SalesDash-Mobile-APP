import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Alert,
  Keyboard,
  Platform,
  Image,
  Modal,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import CustomHeader from "../common/CustomHeader";
import GlobalSearchModal from "../common/GlobalSearchModal";
import CityDeliveryStatus from "../common/CityDeliveryStatus";

type AddCustomersScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddCustomersScreen"
>;

interface AddCustomersScreenProps {
  params: any;
  navigation: AddCustomersScreenNavigationProp;
  route: AddCustomersScreenProps;
}

interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
  hasCenter: boolean | number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const AddCustomersScreen: React.FC<AddCustomersScreenProps> = ({
  navigation,
  route,
}) => {
  const [step, setStep] = useState<1 | "company" | 2>(1);
  const [buyerType, setBuyerType] = useState<"Retail" | "Wholesale">("Retail");
  const [docType, setDocType] = useState<"NIC" | "PASS">("NIC");
  const [companyName, setCompanyName] = useState<string>("");
  const [companyPhone, setCompanyPhone] = useState<string>("");
  const [companyNameError, setCompanyNameError] = useState<string>("");
  const [companyPhoneError, setCompanyPhoneError] = useState<string>("");
  const [brDocument, setBrDocument] = useState<{
    uri: string;
    name: string;
    sizeText: string;
    mimeType?: string;
    r2Url?: string;
  } | null>(null);
  const [isUploadingBR, setIsUploadingBR] = useState<boolean>(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [nic, setNic] = useState<string>("");
  const [houseNo, setHouseNo] = useState<string>("");
  const [streetName, setStreetName] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [filteredCities, setFilteredCities] = useState<
    { label: string; value: string }[]
  >([]);
  const [houseNoError, setHouseNoError] = useState<string>("");
  const [streetNameError, setStreetNameError] = useState<string>("");
  const [cityError, setCityError] = useState<string>("");
  const [buildingNoError, setBuildingNoError] = useState<string>("");
  const [buildingNameError, setBuildingNameError] = useState<string>("");
  const [unitNoError, setUnitNoError] = useState<string>("");
  const [floorNoError, setFloorNoError] = useState<string>("");
  const [buildingNo, setbuildingNo] = useState<string>("");
  const [floorNo, setfloorNo] = useState<string>("");
  const [unitNo, setunitNo] = useState<string>("");
  const [buildingName, setbuildingName] = useState<string>("");
  const [buildingType, setBuildingType] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [nicError, setNicError] = useState<string>("");
  const [touchedFields, setTouchedFields] = useState<{
    [key: string]: boolean;
  }>({
    email: false,
    phoneNumber: false,
    firstName: false,
    lastName: false,
    title: false,
    nic: false,
    buildingType: false,
    houseNo: false,
    streetName: false,
    city: false,
    buildingNo: false,
    buildingName: false,
    unitNo: false,
    floorNo: false,
  });

  const [firstNameError, setFirstNameError] = useState<string>("");
  const [lastNameError, setLastNameError] = useState<string>("");
  const [buildingTypeError, setBuildingTypeError] = useState<string>("");
  const [titleError, setTitleError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cityItems, setCityItems] = useState<
    { label: string; value: string; deliverable: boolean }[]
  >([]);
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [buildingTypeModalVisible, setBuildingTypeModalVisible] =
    useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Keyboard height tracking — replaces KeyboardAvoidingView / KeyboardAwareScrollView
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [titleItems, setTitleItems] = useState([
    { label: "Rev", value: "Rev" },
    { label: "Mr", value: "Mr" },
    { label: "Ms", value: "Ms" },
    { label: "Mrs", value: "Mrs" },
  ]);

  const [buildingTypeItems, setBuildingTypeItems] = useState([
    { label: "House", value: "House" },
    { label: "Apartment", value: "Apartment" },
  ]);

  const matchedCity = cityItems.find(
    (item) => item.label.trim().toLowerCase() === city.trim().toLowerCase(),
  );

  const isCityKnown = city.trim().length > 0 && !!matchedCity;
  const isCityDeliverable = isCityKnown && matchedCity!.deliverable;

  const cityBlocksRegistration = city.trim().length > 0 && !isCityDeliverable;

  const showAlert = (title: string, message: string, onClose?: () => void) => {
    Alert.alert(title, message, [{ text: "OK", onPress: onClose }]);
  };

  const getFieldValidationMessage = (fields: string[]) => {
    if (fields.length === 0) {
      return "Please fill in all required fields correctly.";
    }

    if (fields.length === 1) {
      return `Please enter a valid ${fields[0]}.`;
    }

    return `Please fill the following fields: ${fields.join(", ")}.`;
  };

  const isNavigatingToOtpScreen = useRef(false);

  const resetForm = () => {
    setStep(1);
    setBuyerType("Retail");
    setDocType("NIC");
    setCompanyName("");
    setCompanyPhone("");
    setCompanyNameError("");
    setCompanyPhoneError("");
    setBrDocument(null);
    setPreviewModalVisible(false);
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setSelectedCategory("");
    setEmail("");
    setNic("");
    setHouseNo("");
    setStreetName("");
    setCity("");
    setbuildingNo("");
    setfloorNo("");
    setunitNo("");
    setbuildingName("");
    setBuildingType("");
    setSelectedCategory("");
    setLoading(false);
    setEmailError("");
    setPhoneError("");
    setNicError("");
    setFirstNameError("");
    setLastNameError("");
    setBuildingTypeError("");
    setTitleError("");
    setHouseNoError("");
    setStreetNameError("");
    setCityError("");
    setBuildingNoError("");
    setBuildingNameError("");
    setUnitNoError("");
    setFloorNoError("");
    setIsSubmitting(false);
    setTouchedFields({
      email: false,
      phoneNumber: false,
      firstName: false,
      lastName: false,
      title: false,
      nic: false,
      buildingType: false,
      houseNo: false,
      streetName: false,
      city: false,
      buildingNo: false,
      buildingName: false,
      unitNo: false,
      floorNo: false,
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCity();

      if (isNavigatingToOtpScreen.current) {
        isNavigatingToOtpScreen.current = false;
        return;
      }

      const routes = navigation.getState()?.routes;
      const previousRoute = routes?.[routes.length - 2];

      const isComingFromOtpScreen = previousRoute?.name === "OtpScreen";

      if (isComingFromOtpScreen) {
        return;
      }

      resetForm();
    }, [navigation]),
  );

  const sendOTP = async () => {
    if (!phoneNumber) {
      showAlert("Error", "Please enter a mobile number.");
      return false;
    }

    try {
      setLoading(true);
      const cleanedPhoneNumber = phoneNumber.replace(/[^\d]/g, "");
      const apiUrl = `${environment.API_BASE_URL}api/otp/send`;

      const body = {
        source: "Polygon",
        transport: "sms",
        content: {
          sms: "Thank you for registering with us as a Polygon customer. Please use the below OTP to confirm the registration process. {{code}}",
        },
        destination: cleanedPhoneNumber,
      };

      const response = await axios.post(apiUrl, body);
      console.log("📲 [OTP SEND] Response Data:", response.data);
      await AsyncStorage.setItem("referenceId", response.data.referenceId);

      if (response.status === 200) {
        return true;
      } else {
        showAlert("Error", "Failed to send OTP.");
        return false;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "❌ Axios error details:",
          error.response ? error.response.data : error.message,
        );
        showAlert(
          "Error",
          `Error: ${error.response ? error.response.data.message : error.message}`,
        );
      } else {
        console.error("❌ Unexpected error:", error);
        showAlert("Error", "An unexpected error occurred.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const phoneRegex = /^\+947\d{8}$/;

  const validatePhoneNumber = (phone: string) => {
    if (phone.length > 12) return false;
    return phoneRegex.test(phone);
  };

  const validateName = (name: string) => {
    return /^[A-Z][a-z]*$/.test(name);
  };

  const nicRegex = /^([0-9]{9}[vV]|[0-9]{12})$/;

  const validateNIC = (value: string) => {
    return nicRegex.test(value.trim());
  };

  const formatNicInput = (text: string) => {
    if (!text) return text;

    if (docType === "PASS") {
      return text;
    }

    const cleaned = text.replace(/[^0-9vV]/g, "");
    const digitsOnly = cleaned.replace(/[vV]/g, "");
    const hasLetter = /[vVxX]$/.test(cleaned);

    if (hasLetter) {
      return digitsOnly.slice(0, 9) + cleaned.slice(-1).toUpperCase();
    }

    return digitsOnly.slice(0, 12);
  };

  const handleCompanyPhoneChange = (text: string) => {
    let cleaned = text.replace(/[^0-9+]/g, "");
    if (cleaned.startsWith("+94")) {
      const digits = cleaned.replace(/\D/g, "");
      cleaned = "+94" + digits.slice(2, 11);
    } else if (cleaned.startsWith("0")) {
      const digits = cleaned.replace(/\D/g, "");
      cleaned = digits.slice(0, 10);
    }
    setCompanyPhone(cleaned);
    if (companyPhoneError) setCompanyPhoneError("");
  };

  const validateCompanyPhone = (phone: string) => {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 11;
  };

  const uploadBRToR2 = async (fileUri: string, fileName: string, mimeType: string): Promise<string | null> => {
    try {
      setIsUploadingBR(true);
      let base64Data = "";
      try {
        base64Data = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (readErr) {
        try {
          const { File } = require("expo-file-system");
          const file = new File(fileUri);
          base64Data = await file.base64();
        } catch (fileErr) {
          throw readErr;
        }
      }

      const response = await axios.post(`${environment.API_BASE_URL}api/customer/upload-br`, {
        base64: `data:${mimeType};base64,${base64Data}`,
        fileName: fileName,
      });

      if (response.data && response.data.url) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error("Failed to upload BR to R2:", error);
      Alert.alert("Upload Error", "Failed to upload BR document to Cloudflare R2. Please try again.");
      return null;
    } finally {
      setIsUploadingBR(false);
    }
  };

  const pickBRImage = async (mode: "camera" | "gallery" | "document") => {
    try {
      if (mode === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required", "Camera permission is needed to take a photo of the BR document.");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          const fileName = asset.fileName || `BR_Photo_${Date.now()}.jpg`;
          const fileSizeMB = asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB` : "1.2 MB";
          const mimeType = asset.mimeType || "image/jpeg";
          const docObj = {
            uri: asset.uri,
            name: fileName,
            sizeText: fileSizeMB,
            mimeType: mimeType,
          };
          setBrDocument(docObj);
          const r2Url = await uploadBRToR2(asset.uri, fileName, mimeType);
          if (r2Url) {
            setBrDocument({ ...docObj, r2Url });
          }
        }
      } else if (mode === "gallery") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required", "Gallery permission is needed to select a BR document.");
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          const fileName = asset.fileName || `BR_Image_${Date.now()}.png`;
          const fileSizeMB = asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB` : "1.2 MB";
          const mimeType = asset.mimeType || "image/png";
          const docObj = {
            uri: asset.uri,
            name: fileName,
            sizeText: fileSizeMB,
            mimeType: mimeType,
          };
          setBrDocument(docObj);
          const r2Url = await uploadBRToR2(asset.uri, fileName, mimeType);
          if (r2Url) {
            setBrDocument({ ...docObj, r2Url });
          }
        }
      } else if (mode === "document") {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["image/*", "application/pdf"],
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          const fileSizeMB = asset.size ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB` : "1.2 MB";
          const mimeType = asset.mimeType || "application/pdf";
          const fileName = asset.name || `BR_Doc_${Date.now()}.pdf`;
          const docObj = {
            uri: asset.uri,
            name: fileName,
            sizeText: fileSizeMB,
            mimeType: mimeType,
          };
          setBrDocument(docObj);
          const r2Url = await uploadBRToR2(asset.uri, fileName, mimeType);
          if (r2Url) {
            setBrDocument({ ...docObj, r2Url });
          }
        }
      }
    } catch (err) {
      console.error("Error picking BR document:", err);
      Alert.alert("Error", "Could not pick document. Please try again.");
    }
  };

  const handleBRUploadPress = () => {
    Alert.alert(
      "Upload BR Document",
      "Choose an option to upload the official business certificate:",
      [
        { text: "Take Photo", onPress: () => pickBRImage("camera") },
        { text: "Choose from Gallery", onPress: () => pickBRImage("gallery") },
        { text: "Browse Documents (PDF/Image)", onPress: () => pickBRImage("document") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const validateEmail = (email: string): boolean => {
    const generalEmailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!generalEmailRegex.test(email)) {
      return false;
    }

    const emailLower = email.toLowerCase();
    const [localPart, domain] = emailLower.split("@");

    if (domain && domain.includes("..")) {
      return false;
    }

    const allowedTLDs = [".com", ".gov", ".lk"];

    if (domain === "gmail.com" || domain === "googlemail.com") {
      return validateGmailLocalPart(localPart);
    }

    if (domain === "yahoo.com") {
      return validateYahooLocalPart(localPart);
    }

    for (const tld of allowedTLDs) {
      if (domain.endsWith(tld)) {
        return validateGeneralLocalPart(localPart);
      }
    }

    return false;
  };

  const validateGmailLocalPart = (localPart: string): boolean => {
    const validCharsRegex = /^[a-zA-Z0-9.+]+$/;
    if (!validCharsRegex.test(localPart)) {
      return false;
    }

    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      return false;
    }

    if (localPart.includes("..")) {
      return false;
    }

    if (localPart.length === 0) {
      return false;
    }

    return true;
  };

  const validateYahooLocalPart = (localPart: string): boolean => {
    if (localPart.length < 4 || localPart.length > 32) {
      return false;
    }

    const validCharsRegex = /^[a-zA-Z0-9._-]+$/;
    if (!validCharsRegex.test(localPart)) {
      return false;
    }

    if (/^[._-]|[._-]$/.test(localPart)) {
      return false;
    }

    if (localPart.includes("..")) {
      return false;
    }

    return true;
  };

  const validateGeneralLocalPart = (localPart: string): boolean => {
    if (localPart.length < 1 || localPart.length > 64) {
      return false;
    }

    const validCharsRegex = /^[a-zA-Z0-9._%+-]+$/;
    if (!validCharsRegex.test(localPart)) {
      return false;
    }

    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      return false;
    }

    if (localPart.includes("..")) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (touchedFields.title) {
      if (!selectedCategory) {
        setTitleError("Title is required");
      } else {
        setTitleError("");
      }
    }
  }, [selectedCategory, touchedFields.title]);

  useEffect(() => {
    if (touchedFields.email) {
      if (!email) {
        setEmailError("Email is required");
      } else if (!validateEmail(email)) {
        const emailLower = email.toLowerCase();
        const [localPart, domain] = emailLower.split("@");

        const generalEmailRegex =
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!generalEmailRegex.test(email)) {
          setEmailError("Please enter a valid email address");
          return;
        }
        if (domain && domain.includes("..")) {
          setEmailError(
            "Email domain cannot contain consecutive dots (e.g., gmail..com is invalid)",
          );
          return;
        }

        if (domain === "gmail.com" || domain === "googlemail.com") {
          if (localPart.length > 30) {
            setEmailError(
              "Gmail addresses cannot exceed 30 characters before @",
            );
          } else if (/\.{2,}/.test(localPart)) {
            setEmailError("Gmail addresses cannot have consecutive dots");
          } else if (/^\.|\.$/.test(localPart)) {
            setEmailError("Gmail addresses cannot start or end with a dot");
          } else if (!/^[a-zA-Z0-9.+]+$/.test(localPart)) {
            setEmailError(
              "Gmail addresses can only contain letters, numbers, dots and plus signs",
            );
          } else {
            setEmailError("Please enter a valid Gmail address");
          }
        } else if (domain === "yahoo.com") {
          if (localPart.length > 32) {
            setEmailError(
              "Yahoo addresses cannot exceed 32 characters before @",
            );
          } else if (/\.{2,}/.test(localPart)) {
            setEmailError("Yahoo addresses cannot have consecutive dots");
          } else if (/^[._-]|[._-]$/.test(localPart)) {
            setEmailError(
              "Yahoo addresses cannot start or end with dots, underscores or hyphens",
            );
          } else if (!/^[a-zA-Z0-9._-]+$/.test(localPart)) {
            setEmailError(
              "Yahoo addresses can only contain letters, numbers, dots, underscores and hyphens",
            );
          } else {
            setEmailError("Please enter a valid Yahoo address");
          }
        } else {
          const allowedTLDs = [".com", ".gov", ".lk"];
          const isDomainSupported = allowedTLDs.some((tld) =>
            domain.endsWith(tld),
          );

          if (!isDomainSupported) {
            setEmailError(
              "Please enter a valid email address with a supported domain (.com, .gov, .lk)",
            );
          } else {
            if (localPart.length > 64) {
              setEmailError("Email address is too long");
            } else if (/\.{2,}/.test(localPart)) {
              setEmailError("Email addresses cannot have consecutive dots");
            } else if (/^\.|\.$/.test(localPart)) {
              setEmailError("Email addresses cannot start or end with a dot");
            } else if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
              setEmailError("Please enter a valid email address");
            } else {
              setEmailError("Please enter a valid email address");
            }
          }
        }
      } else {
        setEmailError("");
      }
    }
  }, [email, touchedFields.email]);

  useEffect(() => {
    if (touchedFields.phoneNumber) {
      if (!phoneNumber) {
        setPhoneError("Mobile number is required");
      } else if (!validatePhoneNumber(phoneNumber)) {
        setPhoneError(
          "Please enter a valid mobile number (format: +947XXXXXXXX)",
        );
      } else {
        setPhoneError("");
      }
    }
  }, [phoneNumber, touchedFields.phoneNumber]);

  useEffect(() => {
    if (touchedFields.nic) {
      if (docType === "PASS") {
        setNicError("");
        return;
      }
      if (!nic) {
        setNicError("NIC number is required");
      } else if (!validateNIC(nic)) {
        setNicError("Please enter a valid NIC (9 digits + V, or 12 digits)");
      } else {
        setNicError("");
      }
    }
  }, [nic, touchedFields.nic, docType]);

  useEffect(() => {
    if (touchedFields.firstName) {
      if (!firstName) {
        setFirstNameError("First name is required");
      } else if (!validateName(firstName)) {
        setFirstNameError("First name must start with a capital letter");
      } else {
        setFirstNameError("");
      }
    }
  }, [firstName, touchedFields.firstName]);

  useEffect(() => {
    if (touchedFields.lastName) {
      if (!lastName) {
        setLastNameError("Last name is required");
      } else if (!validateName(lastName)) {
        setLastNameError("Last name must start with a capital letter");
      } else {
        setLastNameError("");
      }
    }
  }, [lastName, touchedFields.lastName]);

  useEffect(() => {
    if (touchedFields.buildingType) {
      if (!buildingType) {
        setBuildingTypeError("Building type is required");
      } else {
        setBuildingTypeError("");
      }
    }
  }, [buildingType, touchedFields.buildingType]);

  useEffect(() => {
    if (touchedFields.houseNo) {
      if (!houseNo) {
        setHouseNoError("House number is required");
      } else {
        setHouseNoError("");
      }
    }
  }, [houseNo, touchedFields.houseNo]);

  useEffect(() => {
    if (touchedFields.streetName) {
      if (!streetName) {
        setStreetNameError("Street name is required");
      } else {
        setStreetNameError("");
      }
    }
  }, [streetName, touchedFields.streetName]);

  useEffect(() => {
    if (touchedFields.city) {
      if (!city) {
        setCityError("City is required");
      } else {
        setCityError("");
      }
    }
  }, [city, touchedFields.city, cityBlocksRegistration]);

  useEffect(() => {
    if (touchedFields.buildingNo) {
      if (!buildingNo) {
        setBuildingNoError("Building number is required");
      } else {
        setBuildingNoError("");
      }
    }
  }, [buildingNo, touchedFields.buildingNo]);

  useEffect(() => {
    if (touchedFields.buildingName) {
      if (!buildingName) {
        setBuildingNameError("Building name is required");
      } else {
        setBuildingNameError("");
      }
    }
  }, [buildingName, touchedFields.buildingName]);

  useEffect(() => {
    if (touchedFields.unitNo) {
      if (!unitNo) {
        setUnitNoError("Unit number is required");
      } else {
        setUnitNoError("");
      }
    }
  }, [unitNo, touchedFields.unitNo]);

  useEffect(() => {
    if (touchedFields.floorNo) {
      if (!floorNo) {
        setFloorNoError("Floor number is required");
      } else {
        setFloorNoError("");
      }
    }
  }, [floorNo, touchedFields.floorNo]);

  const formatNameInput = (text: string) => {
    if (!text) return text;

    if (text.startsWith(" ")) {
      return text.trim();
    }
    const filteredText = text.replace(/[^a-zA-Z]/g, "");
    return (
      filteredText.charAt(0).toUpperCase() + filteredText.slice(1).toLowerCase()
    );
  };

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  };

  const fetchCity = async () => {
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
        const formattedCities = response.data.data.map((city) => ({
          label: city.city,
          value: city.city,
          deliverable: !!city.hasCenter,
        }));
        setCityItems(formattedCities);
      }
    } catch (error) {
      console.error("City fetch error:", error);
    }
  };

  useEffect(() => {
    fetchCity();
    // Clean up any oversized leftover data from previous crashes
    AsyncStorage.removeItem("pendingCustomerData").catch(() => { });
  }, []);

  useEffect(() => {
    if (buyerType === "Wholesale") {
      setBuildingType("House");
      setBuildingTypeError("");
    }
  }, [buyerType]);

  const handleContinue = async () => {
    const isTitleValid = !!selectedCategory;
    const isFirstNameValid = firstName && validateName(firstName);
    const isLastNameValid = lastName && validateName(lastName);
    const isPhoneValid = phoneNumber && validatePhoneNumber(phoneNumber);
    const isEmailValid = email && validateEmail(email);
    const isNicValid =
      docType === "PASS"
        ? true
        : !!nic && validateNIC(nic);
    const isCompanyNameValid = !!companyName && companyName.trim().length > 0;
    const isCompanyPhoneValid = !companyPhone || validateCompanyPhone(companyPhone);
    const invalidFields: string[] = [];

    if (!isTitleValid) invalidFields.push("Title");
    if (!firstName || !isFirstNameValid) invalidFields.push("First Name");
    if (!lastName || !isLastNameValid) invalidFields.push("Last Name");
    if (!phoneNumber || !isPhoneValid) invalidFields.push("Mobile Number");
    if (!email || !isEmailValid) invalidFields.push("Email");
    if (docType === "NIC" && (!nic || !isNicValid)) invalidFields.push("NIC Number");
    if (docType === "PASS" && !nic) invalidFields.push("Passport ID");

    if (buyerType === "Wholesale") {
      if (!isCompanyNameValid) invalidFields.push("Company Name");
      if (!companyPhone || !validateCompanyPhone(companyPhone)) invalidFields.push("Company Phone Number");
    }

    if (invalidFields.length > 0) {
      setTouchedFields((prev) => ({
        ...prev,
        title: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true,
        nic: true,
        ...(buyerType === "Wholesale" ? { companyName: true, companyPhone: true } : {}),
      }));

      if (!selectedCategory) setTitleError("Title is required");
      if (!firstName) setFirstNameError("First name is required");
      else if (!validateName(firstName))
        setFirstNameError("First name must start with a capital letter");

      if (!lastName) setLastNameError("Last name is required");
      else if (!validateName(lastName))
        setLastNameError("Last name must start with a capital letter");

      if (!phoneNumber) setPhoneError("Mobile number is required");
      else if (!validatePhoneNumber(phoneNumber))
        setPhoneError(
          "Please enter a valid mobile number (format: +947XXXXXXXX)",
        );

      if (!email) setEmailError("Email is required");
      else if (!validateEmail(email))
        setEmailError("Please enter a valid email");

      if (docType === "NIC") {
        if (!nic) {
          setNicError("NIC number is required");
        } else if (!isNicValid) {
          setNicError("Please enter a valid NIC (9 digits + V/X, or 12 digits)");
        }
      } else {
        setNicError("");
      }

      if (buyerType === "Wholesale") {
        if (!companyName) setCompanyNameError("Company Name is required");
        if (!companyPhone) setCompanyPhoneError("Company Phone Number is required");
        else if (!isCompanyPhoneValid)
          setCompanyPhoneError("Please enter a valid company phone number");
      }

      showAlert("Error", getFieldValidationMessage(invalidFields));
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${environment.API_BASE_URL}api/customer/check-customer`,
        {
          phoneNumber,
          email: email,
          nic: nic,
        },
      );

      if (buyerType === "Wholesale") {
        setStep("company");
      } else {
        setStep(2);
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || "";

        if (status === 400 || status === 409) {
          if (message.includes("Mobile Number and Email")) {
            setPhoneError("This mobile number is already registered");
            setEmailError("This email is already registered");
            showAlert(
              "Account Already Exists",
              "Both mobile number and email are already registered. Please use different credentials.",
            );
          } else if (message.includes("Mobile Number")) {
            setPhoneError("This mobile number is already registered");
            showAlert(
              "Already registered",
              "This mobile number is already registered. Please use a different mobile number.",
            );
          } else if (message.includes("Email")) {
            setEmailError("This email is already registered");
            showAlert(
              "Already registered",
              "This email is already registered. Please use a different email.",
            );
          } else if (message.includes("NIC")) {
            if (docType === "NIC") {
              setNicError("This NIC is already registered");
            }
            showAlert(
              docType === "PASS" ? "Passport ID Already Exists" : "NIC Already Exists",
              docType === "PASS"
                ? "This Passport ID is already registered. Please use a different Passport ID."
                : "This NIC is already registered. Please use a different NIC.",
            );
          } else {
            const formattedMessage = (
              message || "Please check your details and try again."
            ).replace(/"email"/g, '"Email"');
            showAlert("Registration Error", formattedMessage);
          }
        } else if (status && status >= 500) {
          showAlert(
            "Server Error",
            "Our servers are experiencing issues. Please try again later.",
          );
        } else {
          showAlert(
            "Error",
            "Something went wrong while checking your details. Please try again.",
          );
        }
      } else {
        showAlert(
          "Network Error",
          "Please check your internet connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    setTouchedFields({
      email: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      title: true,
      nic: true,
      buildingType: true,
      houseNo: true,
      streetName: true,
      city: true,
      buildingNo: true,
      buildingName: true,
      unitNo: true,
      floorNo: true,
    });

    const missingRequiredFields: string[] = [];

    const effectiveBuildingType = buyerType === "Wholesale" ? "House" : buildingType;

    if (!selectedCategory) missingRequiredFields.push("Title");
    if (!firstName) missingRequiredFields.push("First Name");
    if (!lastName) missingRequiredFields.push("Last Name");
    if (!phoneNumber) missingRequiredFields.push("Mobile Number");
    if (!email) missingRequiredFields.push("Email");
    if (!nic) missingRequiredFields.push(docType === "PASS" ? "Passport ID" : "NIC Number");
    if (!effectiveBuildingType) missingRequiredFields.push("Building Type");

    if (missingRequiredFields.length > 0) {
      showAlert(
        "Error",
        `Please fill in the following required fields: ${missingRequiredFields.join(", ")}.`,
      );
      setIsSubmitting(false);
      return;
    }

    if (effectiveBuildingType === "House") {
      const missingHouseFields: string[] = [];
      if (!houseNo) missingHouseFields.push("House Number");
      if (!streetName) missingHouseFields.push("Street Name");
      if (!city) missingHouseFields.push("City");

      if (missingHouseFields.length > 0) {
        showAlert(
          "Error",
          `Please fill in the following house fields: ${missingHouseFields.join(", ")}.`,
        );
        setIsSubmitting(false);
        return;
      }
    } else if (effectiveBuildingType === "Apartment") {
      const missingApartmentFields: string[] = [];
      if (!buildingNo) missingApartmentFields.push("Building Number");
      if (!buildingName) missingApartmentFields.push("Building Name");
      if (!unitNo) missingApartmentFields.push("Unit Number");
      if (!floorNo) missingApartmentFields.push("Floor Number");
      if (!houseNo) missingApartmentFields.push("House Number");
      if (!streetName) missingApartmentFields.push("Street Name");
      if (!city) missingApartmentFields.push("City");

      if (missingApartmentFields.length > 0) {
        showAlert(
          "Error",
          `Please fill in the following apartment fields: ${missingApartmentFields.join(", ")}.`,
        );
        setIsSubmitting(false);
        return;
      }
    }

    if (cityBlocksRegistration) {
      showAlert("Error", "This city is not currently in our delivery area.");
      setIsSubmitting(false);
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      showAlert("Error", "Please enter a valid Mobile Number.");
      setIsSubmitting(false);
      return;
    }

    if (email && !validateEmail(email)) {
      showAlert("Error", "Please enter a valid Email.");
      setIsSubmitting(false);
      return;
    }

    if (docType === "NIC" && !validateNIC(nic)) {
      showAlert("Error", "Please enter a valid NIC Number.");
      setIsSubmitting(false);
      return;
    }
    if (docType === "PASS" && (!nic || nic.trim().length === 0)) {
      showAlert("Error", "Please enter a Passport ID.");
      setIsSubmitting(false);
      return;
    }

    if (buyerType === "Wholesale" && (!companyName || companyName.trim().length === 0)) {
      showAlert("Error", "Company Name is required for wholesale buyer.");
      setIsSubmitting(false);
      return;
    }

    if (buyerType === "Wholesale" && (!brDocument || !brDocument.r2Url)) {
      if (brDocument && !brDocument.r2Url) {
        showAlert("Error", "BR document is still uploading to R2. Please wait a moment.");
      } else {
        showAlert("Error", "Please upload the customer's official Business Registration (BR) document.");
      }
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post(
        `${environment.API_BASE_URL}api/customer/check-customer`,
        {
          phoneNumber,
          email: email,
          nic: nic,
        },
      );

      const customerData = {
        title: selectedCategory,
        firstName,
        lastName,
        phoneNumber,
        email: email,
        docType,
        nic,
        buyerType,
        companyName: buyerType === "Wholesale" ? companyName : null,
        companyPhone: buyerType === "Wholesale" ? companyPhone : null,
        brImg: buyerType === "Wholesale" && brDocument ? (brDocument.r2Url || null) : null,
        buildingType: effectiveBuildingType,
        houseNo,
        streetName,
        city,
        buildingNo: effectiveBuildingType === "Apartment" ? buildingNo : null,
        floorNo: effectiveBuildingType === "Apartment" ? floorNo : null,
        unitNo: effectiveBuildingType === "Apartment" ? unitNo : null,
        buildingName: effectiveBuildingType === "Apartment" ? buildingName : null,
      };

      await AsyncStorage.setItem(
        "pendingCustomerData",
        JSON.stringify(customerData),
      );

      const id = new Date().getTime().toString();
      const otpSuccess = await sendOTP();

      if (otpSuccess) {
        showAlert("Success", "OTP sent successfully.", () => {
          isNavigatingToOtpScreen.current = true;
          navigation.navigate("OtpScreen", { phoneNumber, id });
        });
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || "";

        if (status === 400) {
          if (message.includes("Mobile Number and Email")) {
            showAlert(
              "Account Already Exists",
              "Both mobile number and email are already registered. Please sign in instead.",
            );
          } else if (message.includes("Mobile Number")) {
            showAlert(
              "Already registered",
              "This mobile number is already registered. Please use a different mobile number.",
            );
          } else if (message.includes("Email")) {
            showAlert(
              "Already registered",
              "This email is already registered. Please use a different email.",
            );
          } else if (message.includes("NIC")) {
            showAlert(
              "NIC Already Exists",
              "This NIC is already registered. Please use a different NIC.",
            );
          } else {
            const formattedMessage = (
              message ||
              "Registration failed. Please check your details and try again."
            ).replace(/"email"/g, '"Email"');
            showAlert("Registration Error", formattedMessage);
          }
        } else if (status === 409) {
          showAlert(
            "Account Already Exists",
            "An account with this mobile number, email or NIC already exists. Please sign in instead.",
          );
        } else if (status && status >= 500) {
          showAlert(
            "Server Error",
            "Our servers are experiencing issues. Please try again later.",
          );
        } else {
          showAlert(
            "Registration Error",
            "Registration failed. Please try again.",
          );
        }
      } else if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "NETWORK_ERROR"
      ) {
        showAlert(
          "Network Error",
          "Please check your internet connection and try again.",
        );
      } else {
        showAlert(
          "Registration Error",
          "Registration failed. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    if (text.startsWith(" ")) {
      return;
    }

    if (!text.startsWith("+94")) {
      if (text.length < 3) {
        setPhoneNumber("+94");
        return;
      }
      text = "+94" + text.replace(/^\+?94?/, "");
    }

    if (text.length > 12) {
      text = text.substring(0, 12);
    }

    const cleanText =
      text.substring(0, 3) + text.substring(3).replace(/[^0-9]/g, "");

    setPhoneNumber(cleanText);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (step === 2) {
          if (buyerType === "Wholesale") {
            setStep("company");
          } else {
            setStep(1);
          }
          return true;
        }
        if (step === "company") {
          setStep(1);
          return true;
        }
        navigation.navigate("Main", { screen: "CustomersScreen" });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, step]),
  );

  const capitalizeWords = (text: string) => {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const renderBasicDetailsForm = () => {
    return (
      <View>
        {/* Buyer Type Segmented Selection (Top of Form) */}
        <View style={{ marginBottom: 16, marginTop: 4 }}>
          <Text
            className="text-[#000000] mb-2"
            style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14, fontWeight: "500" }}
          >
            Buyer Type *
          </Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F1F5F9",
              borderRadius: 999,
              padding: 4,
            }}
          >
            {/* Retail Tab */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setBuyerType("Retail");
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: buyerType === "Retail" ? "#FFFFFF" : "transparent",
                gap: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: buyerType === "Retail" ? 0.1 : 0,
                shadowRadius: 2,
                elevation: buyerType === "Retail" ? 2 : 0,
              }}
            >
              <MaterialCommunityIcons
                name="account-outline"
                size={18}
                color={buyerType === "Retail" ? "#6D28D9" : "#64748B"}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: buyerType === "Retail" ? "#6D28D9" : "#64748B",
                }}
              >
                Retail
              </Text>
            </TouchableOpacity>

            {/* Wholesale Tab */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setBuyerType("Wholesale");
                setBuildingType("House");
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: buyerType === "Wholesale" ? "#FFFFFF" : "transparent",
                gap: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: buyerType === "Wholesale" ? 0.1 : 0,
                shadowRadius: 2,
                elevation: buyerType === "Wholesale" ? 2 : 0,
              }}
            >
              <MaterialCommunityIcons
                name="storefront-outline"
                size={18}
                color={buyerType === "Wholesale" ? "#6D28D9" : "#64748B"}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: buyerType === "Wholesale" ? "#6D28D9" : "#64748B",
                }}
              >
                Wholesale
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title and First Name */}
        <View className="mb-4 flex-row justify-between">
          <View className="flex-[1]">
            <Text
              className="text-[#000000] mb-1"
              style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
            >
              Title *
            </Text>
            <TouchableOpacity
              onPress={() => {
                setTitleModalVisible(true);
                handleFieldTouch("title");
              }}
              className={`bg-[#F6F6F6] border flex-row justify-between h-[50px] items-center ${titleError ? "border-red-500" : "border-[#F6F6F6]"
                } rounded-full px-4 h-10`}
            >
              <Text
                className={selectedCategory ? "text-black" : "text-[#7F7F7F]"}
                style={!selectedCategory ? { fontStyle: "italic" } : {}}
              >
                {selectedCategory || "Title"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {titleError ? (
              <Text className="text-red-500 text-xs pl-4 pt-1">
                {titleError}
              </Text>
            ) : null}
          </View>

          <View className="flex-[2] ml-2">
            <Text
              className="text-[#000000] mb-1"
              style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
            >
              First Name *
            </Text>
            <TextInput
              className={`bg-[#F6F6F6] h-[50px] border ${firstNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
              placeholder="First Name"
              placeholderTextColor="#7F7F7F"
              value={firstName}
              onChangeText={(text) => {
                handleFieldTouch("firstName");
                if (text.startsWith(" ")) return;
                setFirstName(formatNameInput(text));
              }}
              onBlur={() => {
                handleFieldTouch("firstName");
              }}
              style={[{ fontStyle: firstName ? "normal" : "italic" }]}
            />
            {firstNameError ? (
              <Text className="text-red-500 text-xs pl-4 pt-1">
                {firstNameError}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Last Name */}
        <View className="mb-4">
          <Text
            className="text-[#000000] mb-1"
            style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
          >
            Last Name *
          </Text>
          <TextInput
            className={`bg-[#F6F6F6] h-[50px] border ${lastNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
            placeholder="Last Name"
            placeholderTextColor="#7F7F7F"
            value={lastName}
            onChangeText={(text) => {
              handleFieldTouch("lastName");
              if (text.startsWith(" ")) return;
              setLastName(formatNameInput(text));
            }}
            onBlur={() => {
              handleFieldTouch("lastName");
            }}
            style={[{ fontStyle: lastName ? "normal" : "italic" }]}
          />
          {lastNameError ? (
            <Text className="text-red-500 text-xs pl-4 pt-1">
              {lastNameError}
            </Text>
          ) : null}
        </View>

        {/* Mobile Number */}
        <View className="mb-4">
          <Text
            className="text-[#000000] mb-1"
            style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
          >
            Mobile Number *
          </Text>
          <TextInput
            className={`bg-[#F6F6F6] h-[50px] border ${phoneError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
            placeholder="+947XXXXXXXX"
            placeholderTextColor="#7F7F7F"
            value={phoneNumber}
            onChangeText={(text) => {
              handleFieldTouch("phoneNumber");
              handlePhoneNumberChange(text);
            }}
            onBlur={() => handleFieldTouch("phoneNumber")}
            keyboardType="phone-pad"
            maxLength={12}
            onFocus={() => {
              if (!phoneNumber || phoneNumber.length < 3) {
                setPhoneNumber("+94");
              }
            }}
            style={[{ fontStyle: phoneNumber ? "normal" : "italic" }]}
          />
          {phoneError ? (
            <Text className="text-red-500 text-xs pl-4 pt-1">{phoneError}</Text>
          ) : null}
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text
            className="text-[#000000] mb-1"
            style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
          >
            Email *
          </Text>
          <TextInput
            className={`bg-[#F6F6F6] h-[50px] border ${emailError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
            placeholder="Email"
            placeholderTextColor="#7F7F7F"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(text) => {
              handleFieldTouch("email");
              if (text.startsWith(" ")) return;
              setEmail(text.toLowerCase());
            }}
            onBlur={() => {
              handleFieldTouch("email");
            }}
            style={[{ fontStyle: email ? "normal" : "italic" }]}
          />
          {emailError ? (
            <Text className="text-red-500 text-xs pl-4 pt-1">{emailError}</Text>
          ) : null}
        </View>

        {/* Document Type Segmented Selection */}
        <View style={{ marginBottom: 16 }}>
          <Text
            className="text-[#000000] mb-2"
            style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14, fontWeight: "500" }}
          >
            Document Type *
          </Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F1F5F9",
              borderRadius: 999,
              padding: 4,
            }}
          >
            {/* NIC Number Tab */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setDocType("NIC");
                setNicError("");
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: docType === "NIC" ? "#FFFFFF" : "transparent",
                gap: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: docType === "NIC" ? 0.1 : 0,
                shadowRadius: 2,
                elevation: docType === "NIC" ? 2 : 0,
              }}
            >
              <MaterialCommunityIcons
                name="card-account-details"
                size={18}
                color={docType === "NIC" ? "#6D28D9" : "#64748B"}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: docType === "NIC" ? "#6D28D9" : "#64748B",
                }}
              >
                NIC Number
              </Text>
            </TouchableOpacity>

            {/* Passport ID Tab */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setDocType("PASS");
                setNicError("");
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: docType === "PASS" ? "#FFFFFF" : "transparent",
                gap: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: docType === "PASS" ? 0.1 : 0,
                shadowRadius: 2,
                elevation: docType === "PASS" ? 2 : 0,
              }}
            >
              <MaterialCommunityIcons
                name="passport"
                size={18}
                color={docType === "PASS" ? "#6D28D9" : "#64748B"}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: docType === "PASS" ? "#6D28D9" : "#64748B",
                }}
              >
                Passport ID
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic NIC / Passport Input */}
        <View className="mb-4">
          <Text
            className="text-[#000000] mb-1"
            style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
          >
            {docType === "NIC" ? "NIC Number *" : "Passport ID *"}
          </Text>
          <TextInput
            className={`bg-[#F6F6F6] h-[50px] border ${nicError && docType === "NIC" ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
            placeholder={
              docType === "NIC"
                ? "e.g. 199012345678 or 901234567V"
                : "Passport ID"
            }
            placeholderTextColor="#7F7F7F"
            autoCapitalize="characters"
            autoCorrect={false}
            value={nic}
            onChangeText={(text) => {
              if (docType === "NIC") {
                handleFieldTouch("nic");
              }
              if (text.startsWith(" ")) return;
              setNic(formatNicInput(text));
            }}
            onBlur={() => {
              if (docType === "NIC") {
                handleFieldTouch("nic");
              }
            }}
            maxLength={docType === "NIC" ? 12 : undefined}
            style={[{ fontStyle: nic ? "normal" : "italic" }]}
          />
          {docType === "NIC" && nicError ? (
            <Text className="text-red-500 text-xs pl-4 pt-1">{nicError}</Text>
          ) : null}
        </View>

        {/* Wholesale Only: Company Name and Company Phone Number */}
        {buyerType === "Wholesale" && (
          <>
            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Company Name *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${companyNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="Company Name"
                placeholderTextColor="#7F7F7F"
                value={companyName}
                onChangeText={(text) => {
                  setCompanyName(text);
                  if (companyNameError) setCompanyNameError("");
                }}
                style={[{ fontStyle: companyName ? "normal" : "italic" }]}
              />
              {companyNameError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">{companyNameError}</Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Company Phone Number *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${companyPhoneError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="e.g. : 0XX XXXX XXX"
                placeholderTextColor="#7F7F7F"
                keyboardType="phone-pad"
                value={companyPhone}
                onChangeText={handleCompanyPhoneChange}
                maxLength={12}
                style={[{ fontStyle: companyPhone ? "normal" : "italic" }]}
              />
              {companyPhoneError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">{companyPhoneError}</Text>
              ) : null}
            </View>
          </>
        )}

        {/* Continue Button */}
        <View
          style={{
            marginTop: 24,
            marginHorizontal: "20%",
            marginBottom: 24,
            borderRadius: 30,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          <TouchableOpacity
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.8}
            style={{ borderRadius: 30 }}
          >
            <LinearGradient
              colors={["#854BDA", "#6E3DD1"]}
              style={{
                alignItems: "center",
                borderRadius: 30,
                height: 50,
                justifyContent: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    textAlign: "center",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                  }}
                >
                  Continue
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCityField = () => {
    return (
      <View className="mb-4">
        <Text
          className="text-[#000000] mb-1"
          style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
        >
          Nearest City *
        </Text>
        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            setCityModalVisible(true);
            handleFieldTouch("city");
          }}
          style={{
            backgroundColor: "#F6F6F6",
            height: 50,
            borderWidth: 1.5,
            borderColor: "#F6F6F6",
            borderRadius: 999,
            paddingHorizontal: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: city ? "#111827" : "#7F7F7F",
              fontSize: 14,
              fontStyle: city ? "normal" : "italic",
            }}
          >
            {city || "Select Nearest City"}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        {/* Required field error */}
        {cityError ? (
          <Text className="text-red-500 text-xs pl-4 pt-1">{cityError}</Text>
        ) : null}

        {/* "City not found." / "Great news! We deliver to {city}!" banner */}
        <CityDeliveryStatus
          city={city}
          filteredCities={[]}
          isCityKnown={isCityKnown}
          isCityDeliverable={isCityDeliverable}
        />
      </View>
    );
  };

  const renderResidentialAddressForm = () => {
    return (
      <View>
        {/* Building Type - Only shown for Retail customers */}
        {buyerType !== "Wholesale" && (
          <View className="mb-4">
            <Text
              className="text-[#000000] mb-1"
              style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
            >
              Building Type *
            </Text>
            <TouchableOpacity
              onPress={() => {
                setBuildingTypeModalVisible(true);
                handleFieldTouch("buildingType");
              }}
              className={`bg-[#F6F6F6] h-[50px] border ${buildingTypeError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10 flex-row items-center justify-between`}
            >
              <Text
                className={buildingType ? "text-black" : "text-[#7F7F7F]"}
                style={!buildingType ? { fontStyle: "italic" } : {}}
              >
                {buildingType || "Select Building Type"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {buildingTypeError ? (
              <Text className="text-red-500 text-xs pl-4 pt-1">
                {buildingTypeError}
              </Text>
            ) : null}
          </View>
        )}

        {/* House Fields (always shown for Wholesale, or for Retail when House is chosen) */}
        {(buyerType === "Wholesale" || buildingType === "House") && (
          <>
            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Building / House No *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${houseNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="Building / House No (e.g., 14/B)"
                placeholderTextColor="#7F7F7F"
                value={houseNo}
                onChangeText={(text) => {
                  handleFieldTouch("houseNo");
                  if (text.startsWith(" ")) return;
                  const capitalizedText = capitalizeWords(text);
                  setHouseNo(capitalizedText);
                }}
                onBlur={() => handleFieldTouch("houseNo")}
                autoCapitalize="words"
                style={[{ fontStyle: houseNo ? "normal" : "italic" }]}
              />
              {houseNoError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {houseNoError}
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Street Name *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${streetNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="Street Name"
                placeholderTextColor="#7F7F7F"
                value={streetName}
                onChangeText={(text) => {
                  handleFieldTouch("streetName");
                  if (text.startsWith(" ")) return;
                  const capitalizedText = capitalizeWords(text);
                  setStreetName(capitalizedText);
                }}
                onBlur={() => handleFieldTouch("streetName")}
                autoCapitalize="words"
                style={[{ fontStyle: streetName ? "normal" : "italic" }]}
              />
              {streetNameError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {streetNameError}
                </Text>
              ) : null}
            </View>

            {renderCityField()}
          </>
        )}

        {/* Apartment Fields - Only for Retail */}
        {buyerType !== "Wholesale" && buildingType === "Apartment" && (
          <>
            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Apartment / Building No *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${buildingNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="Apartment / Building No"
                placeholderTextColor="#7F7F7F"
                value={buildingNo}
                onChangeText={(text) => {
                  handleFieldTouch("buildingNo");
                  if (text.startsWith(" ")) return;
                  const capitalizedText = capitalizeWords(text);
                  setbuildingNo(capitalizedText);
                }}
                onBlur={() => handleFieldTouch("buildingNo")}
                autoCapitalize="words"
                style={[{ fontStyle: buildingNo ? "normal" : "italic" }]}
              />
              {buildingNoError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {buildingNoError}
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Apartment / Building Name *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${buildingNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="Apartment / Building Name"
                placeholderTextColor="#7F7F7F"
                value={buildingName}
                onChangeText={(text) => {
                  handleFieldTouch("buildingName");
                  if (text.startsWith(" ")) return;
                  const capitalizedText = capitalizeWords(text);
                  setbuildingName(capitalizedText);
                }}
                onBlur={() => handleFieldTouch("buildingName")}
                autoCapitalize="words"
                style={[{ fontStyle: buildingName ? "normal" : "italic" }]}
              />
              {buildingNameError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {buildingNameError}
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Flat / Unit Number *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${unitNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="ex : Building B"
                placeholderTextColor="#7F7F7F"
                value={unitNo}
                onChangeText={(text) => {
                  handleFieldTouch("unitNo");
                  if (text.startsWith(" ")) return;
                  const capitalizedText = capitalizeWords(text);
                  setunitNo(capitalizedText);
                }}
                onBlur={() => handleFieldTouch("unitNo")}
                autoCapitalize="words"
                style={[{ fontStyle: unitNo ? "normal" : "italic" }]}
              />
              {unitNoError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {unitNoError}
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Floor Number *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${floorNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="ex : 3rd Floor"
                placeholderTextColor="#7F7F7F"
                value={floorNo}
                onChangeText={(text) => {
                  handleFieldTouch("floorNo");
                  if (text.startsWith(" ")) return;
                  const capitalizedText = capitalizeWords(text);
                  setfloorNo(capitalizedText);
                }}
                onBlur={() => handleFieldTouch("floorNo")}
                autoCapitalize="words"
                style={[{ fontStyle: floorNo ? "normal" : "italic" }]}
              />
              {floorNoError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {floorNoError}
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text className="text-[#000000] mb-1">House No *</Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${houseNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="ex : 14"
                placeholderTextColor="#7F7F7F"
                value={houseNo}
                onChangeText={(text) => {
                  handleFieldTouch("houseNo");
                  if (text.startsWith(" ")) return;
                  const capitalizedText = capitalizeWords(text);
                  setHouseNo(capitalizedText);
                }}
                onBlur={() => handleFieldTouch("houseNo")}
                autoCapitalize="words"
                style={[{ fontStyle: houseNo ? "normal" : "italic" }]}
              />
              {houseNoError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {houseNoError}
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Street Name *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${streetNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="Street Name"
                placeholderTextColor="#7F7F7F"
                value={streetName}
                onChangeText={(text) => {
                  if (text.startsWith(" ")) return;
                  const capitalizedText = capitalizeWords(text);
                  setStreetName(capitalizedText);
                  if (touchedFields.streetName && !text) {
                    setStreetNameError("Street name is required");
                  } else if (touchedFields.streetName) {
                    setStreetNameError("");
                  }
                }}
                onBlur={() => handleFieldTouch("streetName")}
                autoCapitalize="words"
                style={[{ fontStyle: streetName ? "normal" : "italic" }]}
              />
              {streetNameError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {streetNameError}
                </Text>
              ) : null}
            </View>

            {renderCityField()}
          </>
        )}

        {/* Register Button */}
        <View
          style={{
            marginTop: 24,
            marginHorizontal: "20%",
            marginBottom: 24,
            borderRadius: 30,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isSubmitting || loading || cityBlocksRegistration}
            activeOpacity={0.8}
            style={{ borderRadius: 30 }}
          >
            <LinearGradient
              colors={
                isSubmitting || loading || cityBlocksRegistration
                  ? ["#B6B7BC", "#B6B7BC"]
                  : ["#854BDA", "#6E3DD1"]
              }
              style={{
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 30,
                height: 50,
              }}
            >
              {isSubmitting || loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    textAlign: "center",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                  }}
                >
                  Register
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCompanyDetailsForm = () => {
    return (
      <View style={{ paddingTop: 8 }}>
        {/* Subtitle */}
        <Text
          style={{
            fontSize: SCREEN_HEIGHT > 900 ? 14 : 13,
            color: "#64748B",
            textAlign: "center",
            marginBottom: 20,
            lineHeight: 18,
          }}
        >
          Upload your customer's official certificate to verify wholesale buyer.
        </Text>

        {/* Legal Compliance Box */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: "#E0EAFF",
            padding: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 24,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
              },
              android: {
                elevation: 1.5,
              },
            }),
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: "#EDE9FE",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={24}
              color="#7C3AED"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#1E293B",
                marginBottom: 4,
              }}
            >
              Legal Compliance
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#64748B",
                lineHeight: 17,
              }}
            >
              Clear scan or photo of your customer's Business Registration (BR).
              Max file size 10MB in PDF, JPG, or PNG.
            </Text>
          </View>
        </View>

        {/* Upload BR Document Section */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontSize: SCREEN_HEIGHT > 900 ? 15 : 13,
              fontWeight: "700",
              color: "#1F2937",
              marginBottom: 10,
            }}
          >
            Upload BR Document *
          </Text>

          {!brDocument ? (
            /* Empty State: Dashed Box */
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBRUploadPress}
              style={{
                borderWidth: 1.5,
                borderColor: "#C7D2FE",
                borderStyle: "dashed",
                borderRadius: 20,
                paddingVertical: 36,
                paddingHorizontal: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FBFBFF",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "#EDE9FE",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Feather name="upload-cloud" size={26} color="#7C3AED" />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#6D28D9",
                  marginBottom: 4,
                  textAlign: "center",
                }}
              >
                Tap to browse or take a photo
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#64748B",
                  textAlign: "center",
                }}
              >
                Supports PDF, PNG, JPG (up to 10MB)
              </Text>
            </TouchableOpacity>
          ) : (
            /* Uploaded State */
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: "#E0EAFF",
                padding: 16,
              }}
            >
              {/* File Uploaded Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                  gap: 6,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#7C3AED"
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#1E293B",
                  }}
                >
                  File Uploaded!
                </Text>
              </View>

              {/* Thumbnail preview */}
              <View
                style={{
                  width: "100%",
                  height: 150,
                  borderRadius: 14,
                  backgroundColor: "#F1F5F9",
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                {brDocument.mimeType?.includes("pdf") ? (
                  <View style={{ alignItems: "center" }}>
                    <MaterialCommunityIcons
                      name="file-pdf-box"
                      size={54}
                      color="#EF4444"
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#475569",
                        marginTop: 4,
                      }}
                    >
                      PDF Document
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: brDocument.uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                )}
              </View>

              {/* File Info Card */}
              <View
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  <MaterialIcons
                    name="image"
                    size={22}
                    color="#64748B"
                    style={{ marginRight: 8 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#1E293B",
                      }}
                    >
                      {brDocument.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: isUploadingBR ? "#D97706" : brDocument.r2Url ? "#16A34A" : "#64748B", marginTop: 2 }}>
                      {isUploadingBR ? "Uploading to R2..." : brDocument.r2Url ? `Uploaded to R2 • ${brDocument.sizeText}` : brDocument.sizeText}
                    </Text>
                  </View>
                </View>

                {/* Remove button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setBrDocument(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Preview Full Image Button */}
              {!brDocument.mimeType?.includes("pdf") && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setPreviewModalVisible(true)}
                  style={{
                    borderWidth: 1.5,
                    borderColor: "#7C3AED",
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                  }}
                >
                  <Feather name="eye" size={16} color="#7C3AED" />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#7C3AED",
                    }}
                  >
                    Preview Full Image
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Submit & Continue Button */}
        <View
          style={{
            marginHorizontal: "15%",
            marginBottom: 24,
            borderRadius: 30,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <TouchableOpacity
            onPress={async () => {
              if (!brDocument) {
                Alert.alert("Upload Required", "Please upload the customer's official Business Registration (BR) document.");
                return;
              }
              if (!brDocument.r2Url) {
                const r2Url = await uploadBRToR2(brDocument.uri, brDocument.name, brDocument.mimeType || "image/jpeg");
                if (!r2Url) return;
                setBrDocument((prev) => prev ? { ...prev, r2Url } : null);
              }
              setStep(2); // Proceed to Residential Address
            }}
            disabled={!brDocument || isUploadingBR}
            activeOpacity={0.8}
            style={{ borderRadius: 30 }}
          >
            <LinearGradient
              colors={
                brDocument && !isUploadingBR
                  ? ["#854BDA", "#6E3DD1"]
                  : ["#CBD5E1", "#94A3B8"]
              }
              style={{
                alignItems: "center",
                borderRadius: 30,
                height: 50,
                justifyContent: "center",
              }}
            >
              {isUploadingBR ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "bold",
                      fontSize: 15,
                    }}
                  >
                    Uploading to R2...
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    textAlign: "center",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Submit & Continue
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <CustomHeader
        title={
          step === 1
            ? "Basic Details"
            : step === "company"
              ? "Company Details"
              : "Residential Address"
        }
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => {
          if (step === 2) {
            if (buyerType === "Wholesale") {
              setStep("company");
            } else {
              setStep(1);
            }
          } else if (step === "company") {
            setStep(1);
          } else {
            navigation.navigate("Main", { screen: "CustomersScreen" });
          }
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: "white", marginBottom: 40 }}
        contentContainerStyle={{ paddingBottom: keyboardHeight + 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-auto w-full max-w-[500px] py-2 px-6">
          {step === 1 && renderBasicDetailsForm()}
          {step === "company" && renderCompanyDetailsForm()}
          {step === 2 && renderResidentialAddressForm()}
        </View>
      </ScrollView>



      {/* Full Image Preview Modal */}
      <Modal
        visible={previewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000D0",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              overflow: "hidden",
              maxHeight: "90%",
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#E2E8F0",
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#1E293B",
                  flex: 1,
                  marginRight: 12,
                }}
              >
                {brDocument?.name || "BR Document"}
              </Text>
              <TouchableOpacity
                onPress={() => setPreviewModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Modal Body: Full Image */}
            <View
              style={{
                width: "100%",
                height: Dimensions.get("window").height * 0.7,
                backgroundColor: "#F8FAFC",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {brDocument?.uri ? (
                <Image
                  source={{ uri: brDocument.uri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      {/* Title Selection Modal */}
      <GlobalSearchModal
        visible={titleModalVisible}
        onClose={() => setTitleModalVisible(false)}
        title="Select Title"
        data={titleItems}
        selectedItems={selectedCategory ? [selectedCategory] : []}
        onSelect={(items) => {
          if (items.length > 0) {
            setSelectedCategory(items[0]);
          }
          handleFieldTouch("title");
        }}
        searchPlaceholder="Search title..."
        multiSelect={false}
        showSearch={false}
      />

      {/* Building Type Selection Modal */}
      <GlobalSearchModal
        visible={buildingTypeModalVisible}
        onClose={() => setBuildingTypeModalVisible(false)}
        title="Select Building Type"
        data={buildingTypeItems}
        selectedItems={buildingType ? [buildingType] : []}
        onSelect={(items) => {
          if (items.length > 0) {
            setBuildingType(items[0]);
          }
          handleFieldTouch("buildingType");
        }}
        searchPlaceholder="Search building type..."
        multiSelect={false}
        showSearch={false}
      />

      {/* City Selection Modal */}
      <GlobalSearchModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        title="Select Nearest City"
        data={cityItems}
        selectedItems={city ? [city] : []}
        onSelect={(items) => {
          if (items.length > 0) {
            setCity(items[0]);
            setFilteredCities([]);
          }
          handleFieldTouch("city");
        }}
        searchPlaceholder="Search city..."
        multiSelect={false}
        showSearch={true}
        noResultsText="No City Found"
      />
    </View>
  );
};

export default AddCustomersScreen;

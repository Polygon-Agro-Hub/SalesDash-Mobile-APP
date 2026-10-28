import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Linking,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AntIcons from "react-native-vector-icons/Feather";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import axios from "axios";
import environment from "@/environment/environment";
import {
  Entypo,
  FontAwesome,
  FontAwesome6,
  Ionicons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import LoadingPage from "../common/LoadingPage";
import FixedMarqueeText from "../common/MarqueeText";
import LottieView from "lottie-react-native";
import { AlertModal } from "../common/AlertModal";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal } from "react-native";
import { format } from "date-fns";

type ViewCustomerScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewCustomerScreen"
>;
type ViewCustomerScreenRouteProp = RouteProp<
  RootStackParamList,
  "ViewCustomerScreen"
>;

interface Order {
  orderId: string;
  processId?: string;
  customerId: string;
  deliveryType: string;
  sheduleDate: string;
  sheduleTime: string;
  weeklyDate: string;
  paymentMethod: string;
  paymentStatus: number;
  status: string;
  createdAt: string;
  InvNo: string;
  fullTotal: string | null;
  fullDiscount: string | null;
  reportStatus: string | null;
  isPaid: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OrdersResponse {
  success: boolean;
  data: Order[];
  message?: string;
  totalCount?: number;
  hasMore?: boolean;
}

type ViewCustomerScreenProps = {
  route: ViewCustomerScreenRouteProp;
  navigation: ViewCustomerScreenNavigationProp;
};

const getDisplayStatus = (status: string) => {
  if (!status) return "";
  const normalizedStatus = status.trim();
  if (normalizedStatus === "Return Received" || normalizedStatus === "Return") {
    return "Return";
  }
  return normalizedStatus;
};

const FILTER_TO_BACKEND_STATUS: Record<string, string | string[]> = {
  Return: ["Return", "Return Received"],
};

// ---------- Sorting helpers (scheduled date: latest first) ----------
const getScheduleTimestamp = (order: Order) => {
  const t = new Date(order.sheduleDate).getTime();
  return isNaN(t) ? 0 : t;
};

const getCreatedTimestamp = (order: Order) => {
  const t = new Date(order.createdAt).getTime();
  return isNaN(t) ? 0 : t;
};

const sortOrdersByScheduleDesc = (list: Order[]) =>
  [...list].sort((a, b) => {
    const diff = getScheduleTimestamp(b) - getScheduleTimestamp(a);
    if (diff !== 0) return diff;
    // tie-breaker: newest created first
    return getCreatedTimestamp(b) - getCreatedTimestamp(a);
  });

const getOrderKey = (order: Order) =>
  order.processId?.toString() || `${order.orderId}-${order.InvNo}`;

const ViewCustomerScreen: React.FC<ViewCustomerScreenProps> = ({
  route,
  navigation,
}) => {
  const ORDERS_PER_PAGE = 5;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [selectedFilter, setSelectedFilter] = useState("Ordered");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [loadingCustomerData, setLoadingCustomerData] = useState(true);
  const [buyerType, setBuyerType] = useState<string>(route.params?.buyerType || "");
  const [isStatusChecked, setIsStatusChecked] = useState<boolean>(false);
  const [wholesaleApproveStatus, setWholesaleApproveStatus] = useState<"To Review" | "Approve" | "Reject" | null>(null);
  const [wholesaleApplicationId, setWholesaleApplicationId] = useState<string | number>("");
  const [wholesaleCreatedAt, setWholesaleCreatedAt] = useState<string>("");
  const [isAccessDeniedVisible, setIsAccessDeniedVisible] = useState<boolean>(false);
  const [reuploadDoc, setReuploadDoc] = useState<{
    uri: string;
    name: string;
    sizeText: string;
    mimeType?: string;
    r2Url?: string | null;
  } | null>(null);
  const [isUploadingReupload, setIsUploadingReupload] = useState<boolean>(false);
  const [isSubmittingReupload, setIsSubmittingReupload] = useState<boolean>(false);
  const [previewModalVisible, setPreviewModalVisible] = useState<boolean>(false);
  const searchInputRef = useRef<TextInput>(null);
  const isMounted = useRef(true);
  const {
    name: initialName,
    number: initialNumber,
    id,
    customerId,
    title: initialTitle,
  } = route.params;
  const [customerName, setCustomerName] = useState(initialName);
  const [customerTitle, setCustomerTitle] = useState(initialTitle);
  const [customerNumber, setCustomerNumber] = useState(initialNumber);
  const isFirstRender = useRef(true);

  const selectedFilterRef = useRef(selectedFilter);
  useEffect(() => {
    selectedFilterRef.current = selectedFilter;
  }, [selectedFilter]);

  const fullName = `${customerTitle ? customerTitle + ". " : ""}${customerName}`;

  useEffect(() => {
    if (route.params?.name) setCustomerName(route.params.name);
    else if (initialName) setCustomerName(initialName);

    if (route.params?.title) setCustomerTitle(route.params.title);
    else if (initialTitle) setCustomerTitle(initialTitle);

    if (route.params?.number) setCustomerNumber(route.params.number);
    else if (initialNumber) setCustomerNumber(initialNumber);

    if (route.params?.buyerType) setBuyerType(route.params.buyerType);
  }, [
    route.params?.name,
    route.params?.title,
    route.params?.number,
    initialName,
    initialTitle,
    initialNumber,
  ]);

  useFocusEffect(
    React.useCallback(() => {
      isFirstRender.current = true;
      Keyboard.dismiss();
      searchInputRef.current?.blur();

      const resetStates = () => {
        setSearchText("");
        setOrders([]);
        setCurrentPage(1);
        setHasMore(true);
        setLoading(true);
        setLoadingMore(false);
        setError(null);
        setSearchError(null);
      };

      resetStates();
      setIsStatusChecked(false);

      loadOrders(1, true, false, selectedFilterRef.current);
      getUserProfile();

      return () => {
        Keyboard.dismiss();
        searchInputRef.current?.blur();
      };
    }, [
      id,
      customerId,
      route.params?.name,
      route.params?.title,
      route.params?.number,
    ]),
  );

  const [address, setAddress] = useState<string>("Loading...");
  const [savedCount, setSavedCount] = useState<number>(0);

  const getUserProfile = async () => {
    try {
      setLoadingCustomerData(true);
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        return null;
      }

      const targetCustomerId = customerId || id;
      if (targetCustomerId) {
        try {
          const response = await axios.get(
            `${environment.API_BASE_URL}api/customer/customerData/${targetCustomerId}`,
            { headers: { Authorization: `Bearer ${storedToken}` } },
          );

          if (response.data) {
            const lat = Number(response.data.latitude);
            const lng = Number(response.data.longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
              setLatitude(lat);
              setLongitude(lng);
            } else {
              setLatitude(null);
              setLongitude(null);
            }

            const balance = Number(response.data.creditBalance) || 0;
            setCreditBalance(balance);

            if (response.data.buyerType) {
              setBuyerType(response.data.buyerType);
            }
            if (response.data.wholesaleApproveStatus) {
              setWholesaleApproveStatus(response.data.wholesaleApproveStatus);
            } else if (response.data.buyerType === "Wholesale" && !wholesaleApproveStatus) {
              setWholesaleApproveStatus("To Review");
            }
            if (response.data.wholesaleApplicationId) {
              setWholesaleApplicationId(response.data.wholesaleApplicationId);
            }
            if (response.data.wholesaleCreatedAt) {
              setWholesaleCreatedAt(response.data.wholesaleCreatedAt);
            }

            const freshFirstName = response.data.firstName || "";
            const freshLastName = response.data.lastName || "";
            const freshTitle = response.data.title || "";
            const freshCode = response.data.phoneCode || "";
            const rawPhone = response.data.phoneNumber || "";
            const freshPhone =
              freshCode && rawPhone && !rawPhone.startsWith("+")
                ? `${freshCode}${rawPhone}`
                : rawPhone || route.params?.number || initialNumber;

            const combinedFreshName =
              `${freshFirstName} ${freshLastName}`.trim();
            if (combinedFreshName) {
              setCustomerName(combinedFreshName);
            }
            if (freshTitle) {
              setCustomerTitle(freshTitle);
            }
            if (freshPhone) {
              setCustomerNumber(freshPhone);
            }

            const locationName =
              `${freshTitle} ${freshFirstName} ${freshLastName}`.trim();
            setSelectedLocationName(locationName || "Customer Location");
          }
        } catch (locError) {
          console.warn(
            "Could not fetch customer location/profile data:",
            locError,
          );
        }
      }

      const targetId = id || customerId;
      if (targetId) {
        try {
          const detailResponse = await axios.get(
            `${environment.API_BASE_URL}api/customer/get-customer-data/${targetId}`,
          );

          if (detailResponse.status === 200) {
            const building = detailResponse.data.building;
            const customer = detailResponse.data.customer;
            const nearestCity = customer?.nearesCity || "";
            const isApartment = customer?.buildingType === "Apartment";

            if (customer) {
              const freshFirst = customer.firstName || "";
              const freshLast = customer.lastName || "";
              const freshT = customer.title || "";
              const freshP = customer.phoneNumber || "";
              const combined = `${freshFirst} ${freshLast}`.trim();
              if (combined) setCustomerName(combined);
              if (freshT) setCustomerTitle(freshT);
              if (freshP) setCustomerNumber(freshP);
            }

            if (building) {
              const houseOrBuildingNo = building.houseNo || building.buildingNo;

              const formattedAddress = [
                houseOrBuildingNo ? `No.${houseOrBuildingNo}` : null,
                building.streetName,
                nearestCity,
              ]
                .filter(Boolean)
                .join(", ");

              setAddress(
                formattedAddress
                  ? isApartment
                    ? `${formattedAddress}...`
                    : formattedAddress
                  : "No Address Found",
              );
            } else {
              setAddress("No Address Found");
            }

            setSavedCount(Number(detailResponse.data.savedAddressCount) || 0);
          } else {
            setAddress("No Address Found");
            setSavedCount(0);
          }
        } catch (detailError) {
          console.warn(
            "Could not fetch detailed customer building address:",
            detailError,
          );
          setAddress("No Address Found");
          setSavedCount(0);
        }
      }

      return storedToken;
    } catch (error) {
      console.error("Error fetching customer data:", error);
      return null;
    } finally {
      setLoadingCustomerData(false);
      setIsStatusChecked(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Main" as any, {
          screen: "CustomersScreen",
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation]),
  );

  const loadOrders = async (
    page = 1,
    showFullLoading = true,
    isLoadMore = false,
    statusFilter = selectedFilter,
  ) => {
    try {
      if (showFullLoading) {
        setLoading(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      }

      setError(null);

      const rawBackendStatus =
        statusFilter === "All"
          ? undefined
          : FILTER_TO_BACKEND_STATUS[statusFilter] || statusFilter;

      const statusValues = Array.isArray(rawBackendStatus)
        ? rawBackendStatus
        : rawBackendStatus
          ? [rawBackendStatus]
          : [undefined];

      const responses = await Promise.all(
        statusValues.map((statusValue) =>
          axios
            .get<OrdersResponse>(
              `${environment.API_BASE_URL}api/orders/get-order-bycustomerId/${id}`,
              {
                params: {
                  page,
                  limit: ORDERS_PER_PAGE,
                  ...(statusValue ? { status: statusValue } : {}),
                },
              },
            )
            .catch((err) => {
              if (err.response && err.response.status === 404) {
                return {
                  data: {
                    success: true,
                    data: [] as Order[],
                    totalCount: 0,
                    hasMore: false,
                  } as OrdersResponse,
                };
              }
              throw err;
            }),
        ),
      );

      const mergedOrdersMap = new Map<string, Order>();
      let anySuccess = false;
      let combinedHasMore = false;
      let firstFailureMessage: string | null = null;

      for (const response of responses) {
        if (response.data.success) {
          anySuccess = true;
          for (const order of response.data.data) {
            mergedOrdersMap.set(getOrderKey(order), order);
          }
          combinedHasMore = combinedHasMore || Boolean(response.data.hasMore);
        } else if (!firstFailureMessage) {
          firstFailureMessage =
            response.data.message || "Failed to load orders";
        }
      }

      // Scheduled date: latest date at the top
      const mergedOrders = sortOrdersByScheduleDesc(
        Array.from(mergedOrdersMap.values()),
      );

      if (anySuccess) {
        if (isLoadMore) {
          setOrders((prevOrders) => {
            // merge, de-duplicate, then re-sort the whole list
            const map = new Map<string, Order>();
            [...prevOrders, ...mergedOrders].forEach((order) => {
              map.set(getOrderKey(order), order);
            });
            return sortOrdersByScheduleDesc(Array.from(map.values()));
          });
        } else {
          setOrders(mergedOrders);
        }
        setHasMore(combinedHasMore);
        setCurrentPage(page);
      } else {
        setError(firstFailureMessage || "Failed to load orders");
      }
      return;
    } catch (err: any) {
      console.warn("⚠️ Error fetching orders (handled):", err.message || err);

      if (err.response && err.response.status === 404) {
        setOrders([]);
        setError(null);
        setHasMore(false);
      } else {
        console.error("❌ Actual error fetching orders:", err);
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreOrders = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = currentPage + 1;
      loadOrders(nextPage, false, true, selectedFilter);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setHasMore(true);
    setOrders([]);
    loadOrders(1, true, false, selectedFilter);
  };

  useEffect(() => {
    if (searchText.trim() === "") {
      setSearchError(null);
    } else {
      const results = orders.filter(
        (order) =>
          order.InvNo &&
          order.InvNo.toLowerCase().includes(searchText.toLowerCase()),
      );

      if (results.length === 0) {
        setSearchError(`No order found with number "${searchText}"`);
      } else {
        setSearchError(null);
      }
    }
  }, [searchText, orders]);

  const handleGetACall = () => {
    const phoneNumber = `tel:${customerNumber}`;
    Linking.openURL(phoneNumber).catch((err) =>
      console.error("Error opening dialer", err),
    );
  };

  const filters = [
    "Ordered",
    "Processing",
    "Out For Delivery",
    "Collected",
    "Hold",
    "On the way",
    "Delivered",
    "Cancelled",
    "Return",
  ];

  const formatsheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const handleSearch = () => {};

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchText ||
      (order.InvNo &&
        order.InvNo.toLowerCase().includes(searchText.toLowerCase()));

    return matchesSearch;
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setOrders([]);
    setCurrentPage(1);
    setHasMore(true);
    setSearchText("");
    loadOrders(1, true, false, selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const renderFooter = () => {
    if (!loadingMore) return null;

    return <LoadingPage message="Loading More Orders..." fullScreen={false} />;
  };

  const uploadReuploadToR2 = async (fileUri: string, fileName: string, mimeType: string): Promise<string | null> => {
    try {
      setIsUploadingReupload(true);
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
      Alert.alert("Upload Error", "Failed to upload BR document. Please try again.");
      return null;
    } finally {
      setIsUploadingReupload(false);
    }
  };

  const pickReuploadBRImage = async (mode: "camera" | "gallery" | "document") => {
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
            mimeType,
          };
          setReuploadDoc(docObj);
          const r2Url = await uploadReuploadToR2(asset.uri, fileName, mimeType);
          if (r2Url) {
            setReuploadDoc({ ...docObj, r2Url });
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
            mimeType,
          };
          setReuploadDoc(docObj);
          const r2Url = await uploadReuploadToR2(asset.uri, fileName, mimeType);
          if (r2Url) {
            setReuploadDoc({ ...docObj, r2Url });
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
            mimeType,
          };
          setReuploadDoc(docObj);
          const r2Url = await uploadReuploadToR2(asset.uri, fileName, mimeType);
          if (r2Url) {
            setReuploadDoc({ ...docObj, r2Url });
          }
        }
      }
    } catch (err) {
      console.error("Error picking BR document:", err);
      Alert.alert("Error", "Could not pick document. Please try again.");
    }
  };

  const handleReuploadSubmit = async () => {
    if (!reuploadDoc) {
      Alert.alert("Upload Required", "Please select a BR document to submit.");
      return;
    }

    try {
      setIsSubmittingReupload(true);
      let r2Url: string | null | undefined = reuploadDoc.r2Url;
      if (!r2Url) {
        r2Url = await uploadReuploadToR2(reuploadDoc.uri, reuploadDoc.name, reuploadDoc.mimeType || "image/jpeg");
        if (!r2Url) {
          setIsSubmittingReupload(false);
          return;
        }
        setReuploadDoc(prev => prev ? { ...prev, r2Url } : null);
      }

      const storedToken = await AsyncStorage.getItem("authToken");
      const targetCustomerId = id || customerId;
      await axios.post(
        `${environment.API_BASE_URL}api/customer/resubmit-wholesale-br`,
        {
          customerId: targetCustomerId,
          brImg: r2Url,
        },
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );

      setWholesaleApproveStatus("To Review");
      setReuploadDoc(null);
      Alert.alert("Submitted", "BR document has been resubmitted successfully for review.");
      getUserProfile();
    } catch (err) {
      console.error("Error resubmitting BR:", err);
      Alert.alert("Error", "Failed to resubmit BR document. Please try again.");
    } finally {
      setIsSubmittingReupload(false);
    }
  };

  const renderWholesaleStatusView = () => {
    const isRejected = wholesaleApproveStatus === "Reject";

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Lottie Animation */}
        <View style={{ alignItems: "center", justifyContent: "center", marginTop: 12 }}>
          {isRejected ? (
            <LottieView
              source={require("@/assets/json/br-status/rejected.json")}
              autoPlay
              loop={false}
              style={{ width: 140, height: 140 }}
            />
          ) : (
            <LottieView
              source={require("@/assets/json/br-status/pending.json")}
              autoPlay
              loop
              style={{ width: 140, height: 140 }}
            />
          )}
        </View>

        {/* Status Title */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#1E293B",
            textAlign: "center",
            marginTop: 8,
          }}
        >
          {isRejected ? "Submission Rejected" : "Approval Pending"}
        </Text>

        {/* Subtitle Message */}
        <Text
          style={{
            fontSize: 13,
            color: "#64748B",
            textAlign: "center",
            marginTop: 8,
            lineHeight: 18,
            paddingHorizontal: isRejected ? 10 : 20,
          }}
        >
          {isRejected
            ? "Please inform the customer that their Wholesale Customer application has been rejected. Ask them to correct the issues in their Business Registration documents and submit a new application using the option below."
            : "Thank you for submitting your Wholesale Customer application and Business Registration documents. Our compliance team is actively reviewing your submission."}
        </Text>

        {!isRejected ? (
          /* Info Card for Approval Pending */
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginTop: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {/* Application ID */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
              }}
            >
              <Text style={{ fontSize: 13, color: "#64748B", fontWeight: "500" }}>
                Application ID
              </Text>
              <View
                style={{
                  backgroundColor: "#EDE9FE",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#6D28D9" }}>
                  #CUS-{customerId || wholesaleApplicationId || id}
                </Text>
              </View>
            </View>

            {/* Submission Date */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
              }}
            >
              <Text style={{ fontSize: 13, color: "#64748B", fontWeight: "500" }}>
                Submission Date
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E293B" }}>
                {wholesaleCreatedAt
                  ? format(new Date(wholesaleCreatedAt), "dd MMM yyyy, h:mm a")
                  : "Today"}
              </Text>
            </View>

            {/* Estimated Review */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
              }}
            >
              <Text style={{ fontSize: 13, color: "#64748B", fontWeight: "500" }}>
                Estimated Review
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="time-outline" size={16} color="#7C3AED" />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#7C3AED" }}>
                  24–48 Business Hours
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Re-upload BR Form for Submission Rejected */
          <View style={{ marginTop: 20 }}>
            {/* Legal Compliance card */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: "#E0EAFF",
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: "#EDE9FE",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={22}
                  color="#7C3AED"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#1E293B",
                    marginBottom: 2,
                  }}
                >
                  Legal Compliance
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#64748B",
                    lineHeight: 15,
                  }}
                >
                  Clear scan or photo of your customer's Business Registration (BR).
                  Max file size 10MB in PDF, JPG, or PNG.
                </Text>
              </View>
            </View>

            {/* Upload BR Document Label */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#1F2937",
                marginBottom: 8,
              }}
            >
              Upload BR Document *
            </Text>

            {!reuploadDoc ? (
              /* Empty state dashed box */
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Alert.alert(
                    "Upload BR Document",
                    "Choose an option to upload the official business certificate:",
                    [
                      { text: "Take Photo", onPress: () => pickReuploadBRImage("camera") },
                      { text: "Choose from Gallery", onPress: () => pickReuploadBRImage("gallery") },
                      { text: "Browse Documents (PDF/Image)", onPress: () => pickReuploadBRImage("document") },
                      { text: "Cancel", style: "cancel" },
                    ]
                  );
                }}
                style={{
                  borderWidth: 1.5,
                  borderColor: "#C7D2FE",
                  borderStyle: "dashed",
                  borderRadius: 16,
                  paddingVertical: 28,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FBFBFF",
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#EDE9FE",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <Feather name="upload-cloud" size={24} color="#7C3AED" />
                </View>
                <Text
                  style={{
                    fontSize: 14,
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
                    fontSize: 11,
                    color: "#64748B",
                    textAlign: "center",
                  }}
                >
                  Supports PDF, PNG, JPG (up to 10MB)
                </Text>
              </TouchableOpacity>
            ) : (
              /* Uploaded State Box */
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: "#E0EAFF",
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#7C3AED"
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#1E293B",
                    }}
                  >
                    File Uploaded
                  </Text>
                </View>

                {/* Thumbnail */}
                <View
                  style={{
                    width: "100%",
                    height: 120,
                    borderRadius: 10,
                    backgroundColor: "#F1F5F9",
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  {reuploadDoc.mimeType?.includes("pdf") ? (
                    <View style={{ alignItems: "center" }}>
                      <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={48}
                        color="#EF4444"
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#475569",
                          marginTop: 2,
                        }}
                      >
                        PDF Document
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: reuploadDoc.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  )}
                </View>

                {/* File Info */}
                <View
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    padding: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                      marginRight: 6,
                    }}
                  >
                    <MaterialIcons
                      name="image"
                      size={20}
                      color="#64748B"
                      style={{ marginRight: 6 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#1E293B",
                        }}
                      >
                        {reuploadDoc.name}
                      </Text>
                      <Text style={{ fontSize: 10, color: isUploadingReupload ? "#D97706" : reuploadDoc.r2Url ? "#16A34A" : "#64748B", marginTop: 1 }}>
                        {isUploadingReupload ? "Uploading to R2..." : reuploadDoc.r2Url ? `Uploaded • ${reuploadDoc.sizeText}` : reuploadDoc.sizeText}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setReuploadDoc(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Preview Full Image button */}
                {!reuploadDoc.mimeType?.includes("pdf") && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setPreviewModalVisible(true)}
                    style={{
                      borderWidth: 1.5,
                      borderColor: "#7C3AED",
                      borderRadius: 10,
                      paddingVertical: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 6,
                    }}
                  >
                    <Feather name="eye" size={15} color="#7C3AED" />
                    <Text
                      style={{
                        fontSize: 13,
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

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleReuploadSubmit}
              disabled={!reuploadDoc || isUploadingReupload || isSubmittingReupload}
              activeOpacity={0.8}
              style={{
                borderRadius: 30,
                overflow: "hidden",
                marginHorizontal: "15%",
                marginTop: 6,
              }}
            >
              <LinearGradient
                colors={
                  reuploadDoc && !isUploadingReupload && !isSubmittingReupload
                    ? ["#854BDA", "#6E3DD1"]
                    : ["#CBD5E1", "#94A3B8"]
                }
                style={{
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 30,
                }}
              >
                {isSubmittingReupload || isUploadingReupload ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 15 }}>
                      {isUploadingReupload ? "Uploading..." : "Submitting..."}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>
                    Submit
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <LinearGradient
          colors={["#FFFFFF", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1, overflow: "hidden" }}
        >
        {/* Top Header Row */}
        <View
          style={{
            paddingTop: 16,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: "transparent",
            zIndex: 10,
          }}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Main" as any, {
                screen: "CustomersScreen",
              })
            }
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#F6F6F6",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
              marginTop: 4,
            }}
            activeOpacity={0.7}
          >
            <Entypo name="chevron-left" size={22} color={"black"} />
          </TouchableOpacity>

          {/* Center Title Content */}
          <View style={{ flex: 1, alignItems: "center", marginHorizontal: 12 }}>
            {fullName.length > 25 ? (
              <FixedMarqueeText
                text={fullName}
                style={{ fontSize: 18, fontWeight: "bold", color: "#000" }}
                speed={50}
              />
            ) : (
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#000",
                  textAlign: "center",
                }}
              >
                {fullName}
              </Text>
            )}

            <Text
              style={{
                fontSize: 15,
                color: "#393939",
                marginTop: 6,
              }}
            >
              Customer ID : {customerId}
            </Text>

            {buyerType !== "Wholesale" && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ExcludeItemEditSummery", {
                    id,
                    customerId,
                    name: customerName,
                    title: customerTitle,
                    phone: customerNumber,
                  })
                }
                style={{ marginTop: 8 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      color: "#7240D3",
                      textDecorationLine: "underline",
                      fontWeight: "600",
                      fontSize: 14,
                      marginRight: 6,
                    }}
                  >
                    Package Preferences
                  </Text>
                  <AntIcons name="external-link" size={16} color="#7240D3" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Edit button */}
          <TouchableOpacity
            onPress={() => {
              if (buyerType === "Wholesale") {
                setIsAccessDeniedVisible(true);
                return;
              }
              navigation.navigate("Main" as any, {
                screen: "EditCustomerScreen",
                params: {
                  id,
                  customerId,
                  name: customerName,
                  title: customerTitle,
                },
              });
            }}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={24} color="#6839CF" />
          </TouchableOpacity>
        </View>

        {/* Wholesale Pending/Rejected view vs Normal view */}
        {!isStatusChecked || loadingCustomerData ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
            <LoadingPage message="Loading Customer Profile..." fullScreen={true} />
          </View>
        ) : buyerType === "Wholesale" && wholesaleApproveStatus !== "Approve" ? (
          renderWholesaleStatusView()
        ) : (
          <View style={{ flex: 1 }}>
        {/* Address Cards Section */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            marginTop: 20,
            justifyContent: "space-between",
          }}
        >
          {/* Residential Address Card */}
          <View style={{ flex: 1, marginRight: 8 }}>
            {/* Purple curved underline peeking from behind */}
            <View
              style={{
                position: "absolute",
                top: 6,
                left: 4,
                right: 4,
                bottom: -4,
                backgroundColor: "#6938D3",
                borderRadius: 20,
              }}
            />
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("ResidentialAddress", {
                  customerId: id,
                });
              }}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 14,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 2,
                height: 140,
                justifyContent: "space-between",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <View style={{ paddingRight: 16 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: "#F5F1FD",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Entypo name="location-pin" size={18} color="#6B3BCF" />
                </View>
                <Text
                  style={{ fontSize: 13, fontWeight: "bold", color: "#1F2937" }}
                >
                  Residential Address
                </Text>
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={{
                    fontSize: 11,
                    color: "#9CA3AF",
                    marginTop: 4,
                    lineHeight: 15,
                  }}
                >
                  {address}
                </Text>
              </View>
              <View style={{ position: "absolute", bottom: 12, right: 12 }}>
                <Entypo name="chevron-right" size={16} color="#6B3BCF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Delivery Address Book Card */}
          <View style={{ flex: 1, marginLeft: 8 }}>
            {/* Purple curved underline peeking from behind */}
            <View
              style={{
                position: "absolute",
                top: 6,
                left: 4,
                right: 4,
                bottom: -4,
                backgroundColor: "#6938D3",
                borderRadius: 20,
              }}
            />
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("DeliveryAddressBooks", {
                  customerId: id,
                });
              }}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 14,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 2,
                height: 140,
                justifyContent: "space-between",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <View style={{ paddingRight: 16 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: "#F5F1FD",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <FontAwesome name="folder-open" size={18} color="#6B3BCF" />
                </View>
                <Text
                  style={{ fontSize: 13, fontWeight: "bold", color: "#1F2937" }}
                >
                  Delivery Address Book
                </Text>
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={{
                    fontSize: 11,
                    color: "#9CA3AF",
                    marginTop: 4,
                    lineHeight: 15,
                  }}
                >
                  {savedCount} Saved
                </Text>
              </View>
              <View style={{ position: "absolute", bottom: 12, right: 12 }}>
                <Entypo name="chevron-right" size={16} color="#6B3BCF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Negative Credit Balance Warning */}
        {creditBalance < 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              backgroundColor: "#FEF6F0",
              borderWidth: 1,
              borderColor: "#FDE4D4",
              borderRadius: 14,
              marginHorizontal: 16,
              marginTop: 14,
              padding: 12,
            }}
          >
            <MaterialIcons
              name="warning"
              size={18}
              color="#F5811F"
              style={{ marginRight: 8, marginTop: 7 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "bold", color: "#000000" }}
              >
                Negative Credit Balance{" "}
                <Text
                  style={{ fontSize: 13, fontWeight: "bold", color: "#FF6400" }}
                >
                  ( -Rs.{" "}
                  {Math.abs(creditBalance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  )
                </Text>
              </Text>
              <Text style={{ fontSize: 12, color: "#5E6089", marginTop: 2 }}>
                Ask the customer to clear the balance first.
              </Text>
            </View>
          </View>
        )}

        {/* Scrollable orders content area */}
        <View style={{ flex: 1, marginTop: 15 }}>
          {/* Search Bar */}
          <View style={{ paddingHorizontal: 16 }}>
            <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FAF9FE",
                  paddingHorizontal: 16,
                  borderWidth: 1.5,
                  borderColor: "#E8E2F7",
                  borderRadius: 25,
                  height: 48,
                }}
              >
                <TextInput
                  ref={searchInputRef}
                  autoFocus={false}
                  blurOnSubmit={true}
                  placeholder="Search By Order No"
                  placeholderTextColor="#A389D4"
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: "#1F2937",
                    height: "100%",
                    fontStyle: "italic",
                  }}
                  onChangeText={(text) => {
                    const numericOnly = text.replace(/[^0-9]/g, "");
                    setSearchText(numericOnly);
                  }}
                  value={searchText}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={handleSearch}>
                  <AntIcons name="search" size={20} color="#6B3BCF" />
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>

          {/* Filters List */}
          {!searchError && (
            <View style={{ marginTop: 14 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {filters.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: "#6B3BCF",
                      marginRight: 8,
                      backgroundColor:
                        selectedFilter === filter ? "#6B3BCF" : "transparent",
                    }}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: "600",
                        color:
                          selectedFilter === filter ? "#FFFFFF" : "#6B3BCF",
                      }}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Orders List */}
          <View style={{ flex: 1, marginTop: 12 }}>
            {loading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#6B3BCF" />
                <Text style={{ color: "#6B3BCF", marginTop: 8 }}>
                  Loading orders...
                </Text>
              </View>
            ) : error ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ color: "#EF4444", textAlign: "center" }}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: 16,
                    backgroundColor: "#6B3BCF",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 25,
                  }}
                  onPress={handleRefresh}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : searchError ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{
                  justifyContent: "center",
                  alignItems: "center",
                  flexGrow: 1,
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={handleRefresh}
                    colors={["#6B3BCF"]}
                  />
                }
              >
                <Image
                  source={require("@/assets/images/public/no-data.webp")}
                  style={{
                    width: wp("60%"),
                    height: hp("30%"),
                    resizeMode: "contain",
                  }}
                />
                <Text
                  style={{
                    color: "#000000",
                    fontStyle: "italic",
                    textAlign: "center",
                    marginTop: 12,
                  }}
                >
                  {" "}
                  No orders found{" "}
                </Text>
              </ScrollView>
            ) : filteredOrders.length > 0 ? (
              <FlatList
                data={filteredOrders}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                keyExtractor={(item, index) => {
                  const safeProcessId = item.processId || "";
                  const safeOrderId = item.orderId || "unknown";
                  const safeInvNo = item.InvNo || "";
                  return `${safeOrderId}-${safeProcessId}-${safeInvNo}-${index}`;
                }}
                renderItem={({ item }) => {
                  const isPaymentPending =
                    Number(item.isPaid) === 0 &&
                    item.paymentMethod === "Card" &&
                    item.status !== "Cancelled";
                  const displayStatus = getDisplayStatus(item.status);

                  return (
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => {
                        Keyboard.dismiss();
                        searchInputRef.current?.blur();
                        navigation.navigate("View_CancelOrderScreen" as any, {
                          orderId: item.processId || item.orderId,
                          status: item.status,
                          reportStatus: item.reportStatus,
                        });
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: 20,
                          padding: 16,
                          marginBottom: 12,
                          marginHorizontal: 16,
                          marginTop: 4,
                          borderWidth: 1.5,
                          borderColor: isPaymentPending ? "#EF4444" : "#F3F4F6",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3.84,
                          elevation: 4,
                          maxWidth: 500,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "bold",
                              color: "#1F2937",
                              fontSize: SCREEN_HEIGHT > 900 ? 18 : 15,
                            }}
                          >
                            Order : #{item.InvNo || "N/A"}
                          </Text>
                          <View
                            style={{
                              paddingVertical: 4,
                              paddingHorizontal: 12,
                              borderRadius: 12,
                              backgroundColor:
                                displayStatus === "Ordered"
                                  ? "#F5FF85"
                                  : displayStatus === "Processing"
                                    ? "#CFE1FF"
                                    : displayStatus === "Out For Delivery" ||
                                        displayStatus === "Out for Delivery"
                                      ? "#FCD4FF"
                                      : displayStatus === "Collected"
                                        ? "#F8FEA5"
                                        : displayStatus === "On the way"
                                          ? "#FFEDCF"
                                          : displayStatus === "Hold"
                                            ? "#FFEDCF"
                                            : displayStatus === "Delivered"
                                              ? "#BBFFC6"
                                              : displayStatus === "Cancelled"
                                                ? "#DFDFDF"
                                                : displayStatus === "Return"
                                                  ? "#FFDCDA"
                                                  : "#EAEAEA",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              numberOfLines={1}
                              style={{
                                fontSize: 11,
                                fontWeight: "bold",
                                color:
                                  displayStatus === "Ordered"
                                    ? "#878216"
                                    : displayStatus === "Processing"
                                      ? "#3B82F6"
                                      : displayStatus === "Out For Delivery" ||
                                          displayStatus === "Out for Delivery"
                                        ? "#80118A"
                                        : displayStatus === "Collected"
                                          ? "#7E8700"
                                          : displayStatus === "On the way"
                                            ? "#D17A00"
                                            : displayStatus === "Hold"
                                              ? "#D17A00"
                                              : displayStatus === "Delivered"
                                                ? "#308233"
                                                : displayStatus === "Cancelled"
                                                  ? "#5C5C5C"
                                                  : displayStatus === "Return"
                                                    ? "#FF1100"
                                                    : "#393939",
                              }}
                            >
                              {displayStatus}
                            </Text>
                          </View>
                        </View>

                        {isPaymentPending && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 6,
                            }}
                          >
                            <MaterialIcons
                              name="error"
                              size={13}
                              color="#EF4444"
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={{
                                color: "#EF4444",
                                fontWeight: "bold",
                                fontSize: SCREEN_HEIGHT > 900 ? 13 : 11,
                              }}
                            >
                              Payment Pending
                            </Text>
                          </View>
                        )}

                        <Text
                          style={{
                            color: "#9CA3AF",
                            marginTop: 6,
                            fontSize: SCREEN_HEIGHT > 900 ? 14 : 12,
                          }}
                        >
                          Scheduled to : {formatsheduleDate(item.sheduleDate)}
                        </Text>
                        <Text
                          style={{
                            color: "#9CA3AF",
                            marginTop: 2,
                            fontSize: SCREEN_HEIGHT > 900 ? 14 : 12,
                          }}
                        >
                          {item.sheduleTime}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                onEndReached={loadMoreOrders}
                onEndReachedThreshold={0.1}
                ListFooterComponent={renderFooter}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={handleRefresh}
                    colors={["#6B3BCF"]}
                  />
                }
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            ) : (
              <ScrollView
                contentContainerStyle={{
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  flexGrow: 1,
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={handleRefresh}
                    colors={["#6B3BCF"]}
                  />
                }
              >
                <Image
                  source={require("@/assets/images/public/no-data.webp")}
                  style={{
                    width: wp("60%"),
                    height: hp("30%"),
                    resizeMode: "contain",
                  }}
                />
                <Text
                  style={{
                    color: "#000000",
                    fontStyle: "italic",
                    textAlign: "center",
                    marginTop: 1,
                  }}
                >
                  {orders.length === 0
                    ? " No orders found "
                    : searchText
                      ? "No matching orders found"
                      : `No orders found with status "${selectedFilter}"`}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
        </View>
        )}

        {/* Sticky Bottom Action Buttons */}
        {!isKeyboardVisible && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: "#F5F2FE",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            {/* Get a Call Button */}
            <TouchableOpacity
              onPress={handleGetACall}
              style={{
                flex: 1,
                flexDirection: "row",
                height: 48,
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: "#6B3BCF",
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,

                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons
                name="call"
                size={18}
                color="#6B3BCF"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{ color: "#6B3BCF", fontWeight: "bold", fontSize: 15 }}
              >
                Get a Call
              </Text>
            </TouchableOpacity>

            {/* New Order Button */}
            <TouchableOpacity
              disabled={creditBalance < 0 || (buyerType === "Wholesale" && wholesaleApproveStatus !== "Approve")}
              onPress={() =>
                navigation.navigate("SelectOrderType" as any, {
                  id,
                  customerId,
                  name: customerName,
                  title: customerTitle,
                  number: customerNumber,
                  customerscreencustomerid: customerId,
                })
              }
              style={{
                flex: 1,
                flexDirection: "row",
                height: 48,
                borderRadius: 24,
                backgroundColor:
                  (buyerType === "Wholesale" && wholesaleApproveStatus !== "Approve") || creditBalance < 0
                    ? "#B8B8B8"
                    : "#6B3BCF",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 8,
                opacity: (buyerType === "Wholesale" && wholesaleApproveStatus !== "Approve") || creditBalance < 0 ? 0.7 : 1,

                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 15 }}
              >
                New Order
              </Text>
            </TouchableOpacity>
          </View>
        )}
        </LinearGradient>
      </TouchableWithoutFeedback>

      {/* Access Denied Modal for Wholesale Edit */}
      <AlertModal
        visible={isAccessDeniedVisible}
        title="Access Denied!"
        message="Please note that existing Wholesale Customer details cannot be edited."
        type="error"
        showOkButton={true}
        autoClose={false}
        okButtonText="OK"
        onClose={() => setIsAccessDeniedVisible(false)}
      />

      {/* Full Image Preview Modal for BR Document */}
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
                {reuploadDoc?.name || "BR Document"}
              </Text>
              <TouchableOpacity
                onPress={() => setPreviewModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <View
              style={{
                width: "100%",
                height: Dimensions.get("window").height * 0.7,
                backgroundColor: "#F8FAFC",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {reuploadDoc?.uri ? (
                <Image
                  source={{ uri: reuploadDoc.uri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ViewCustomerScreen;
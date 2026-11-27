import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import GlobalSearchModal from "../common/GlobalSearchModal";
import socketService from "@/services/socket/socket.service";
import SeasonalPackageBanner from "./SeasonalPackageBanner";

type OrderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OrderScreen"
>;
interface ProductItem {
  label: string;
  discount: string;
  value: string;
  id: number;
  price: string;
  discountedPrice?: string;
  unitType?: string;
  changeby?: string;
  startValue?: string;
}

interface AdditionalItem {
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
}

interface Package {
  id: number;
  packageId: number;
  displayName: string;
  price: string;
  description: string;
  portion: string;
  period: string;
  total: number;
  packingFee: string;
  productPrice: string;
  serviceFee: string;
  packageType?: string;
  startDate?: string;
  endDate?: string;
}

interface Crop {
  id: number;
  cropId: number;
  displayName: string;
  changeby: string;
  startValue: string;
  unitType: string;
  normalPrice: string;
  discountedPrice: string;
  promo: number;
}

interface CropItem {
  category: string;
  changeby: string;
  discount: string;
  discountedPrice: string;
  displayName: string;
  id: number;
  normalPrice: string;
  promo: number;
  startValue: string;
  unitType: string;
  varietyId: number;
}

interface OrderScreenProps {
  navigation: OrderScreenNavigationProp;
  route: {
    params: {
      id: string;
      isPackage: string;
      isSelectPackage?: number;
      isCustomPackage?: number;
      packageId?: number;
      packageItems?: Array<{
        id: number;
        name: string;
        quantity: string;
        quantityType: string;
        price: number;
      }>;
      rawPackageItems?: Array<{ name: string; qty: string }>;
      additionalItems?: Array<{
        pricePerKg?: number;
        discountedPricePerKg?: number;
        totalPrice?: number;
        mpItemId?: number;
        productId?: number;
        id: number;
        name: string;
        quantity: string;
        quantityType: string;
        price: number;
        discount: string;
        cropId?: number;
        changeby?: string;
        startValue?: string;
        unitType?: string;
      }>;
      rawAdditionalItems?: AdditionalItem[];
      orderItems?: any[];
      orderData?: any;
      subtotal?: number;
      discount?: number;
      total?: number;
      fullTotal?: number;
      selectedDate?: string;
      selectedTimeSlot?: string;
      timeDisplay?: string;
      paymentMethod?: string;
      isEdit?: boolean;
      customerId: string;
      name: string;
      title: string;
      number: string;
      customerscreencustomerid: string;
      isNewCustomer?: boolean;
      packageType?: string;
      endDate?: string;
      customerOriginScreen?: string;
    };
  };
}

const getDeliveryCutoffDate = (endDateStr?: string | null): string | null => {
  if (!endDateStr) return null;
  try {
    let year: number;
    let month: number;
    let day: number;

    if (typeof endDateStr === "string" && endDateStr.includes("-")) {
      const parts = endDateStr.split("T")[0].split("-");
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      const d = new Date(endDateStr);
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    // Delivery cutoff is [Expire Date] - 2 days
    const cutoffDate = new Date(year, month, day);
    cutoffDate.setDate(cutoffDate.getDate() - 2);

    const monthNames = [
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

    const displayDay = cutoffDate.getDate();
    const displayMonth = monthNames[cutoffDate.getMonth()];
    const displayYear = cutoffDate.getFullYear();

    return `${displayDay} ${displayMonth} ${displayYear}`;
  } catch (err) {
    console.error("Error calculating delivery cutoff date:", err);
    return null;
  }
};

const OrderScreen: React.FC<OrderScreenProps> = ({ route, navigation }) => {
  const {
    id,
    isPackage,
    customerId,
    name,
    title,
    number,
    customerscreencustomerid,
  } = route.params || {};

  const customerOriginScreen = (route.params as any)?.customerOriginScreen;

  const isPackageNum = Number(isPackage) === 1 ? 1 : 0;
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerKg, setPricePerKg] = useState<number>(0);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const additionalItemsRef = useRef<AdditionalItem[]>(additionalItems);

  useEffect(() => {
    additionalItemsRef.current = additionalItems;
  }, [additionalItems]);

  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AdditionalItem | null>(null);
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [editSelectedUnit, setEditSelectedUnit] = useState<string>("g");
  const [packageItems, setPackageItems] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("g");

  const [packageModalVisible, setPackageModalVisible] =
    useState<boolean>(false);
  const [productModalVisible, setProductModalVisible] =
    useState<boolean>(false);
  const [unitModalVisible, setUnitModalVisible] = useState<boolean>(false);
  const [editUnitModalVisible, setEditUnitModalVisible] =
    useState<boolean>(false);

  const [filteredPackageItems, setFilteredPackageItems] =
    useState(packageItems);

  const [items, setItems] = useState<{ name: string; qty: string }[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [productDropdownLoading, setProductDropdownLoading] =
    useState<boolean>(false);
  const [productValue, setProductValue] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [filteredProductItems, setFilteredProductItems] =
    useState(productItems);
  const [packages, setPackages] = useState<Package[]>([]);
  const [packageValue, setPackageValue] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      setSelectedItems([]);
      setSelectedProduct("");
    }, []),
  );

  useEffect(() => {
    if (showAddModal) {
      setProductValue("");
      setSelectedProduct("");
      setPricePerKg(0);
      setQuantity(0);
      setSelectedUnit("Kg");
      handleProductSearchChange("");
      handlePackageSearchChange("");
    } else {
      setProductModalVisible(false);
      setUnitModalVisible(false);
    }
  }, [showAddModal]);

  const fetchProductPrices = useCallback(async (productIds: number[]) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken || productIds.length === 0) return {};

      const response = await axios.get(
        `${environment.API_BASE_URL}api/packages/crops/all?_t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          params: { id, buyerType: (route.params as any)?.buyerType },
        },
      );

      const productPrices: Record<
        string,
        {
          normalPrice: number;
          discountedPrice: number;
          displayName: string;
          changeby: string;
          startValue: string;
        }
      > = {};

      const cropsList = response.data?.data || [];
      cropsList.forEach((item: any) => {
        const itemIdNum = Number(item.id);
        const varietyIdNum = Number(item.varietyId);
        const isMatch = productIds.some(
          (pid) => pid === itemIdNum || (varietyIdNum && pid === varietyIdNum),
        );

        if (isMatch) {
          const priceObj = {
            normalPrice: parseFloat(item.normalPrice) || 0,
            discountedPrice:
              parseFloat(item.discountedPrice) ||
              parseFloat(item.normalPrice) ||
              0,
            displayName: item.displayName || `Item ${item.id}`,
            changeby: item.changeby || "1",
            startValue: item.startValue || "1",
          };
          productPrices[item.id.toString()] = priceObj;
          if (item.varietyId) {
            productPrices[item.varietyId.toString()] = priceObj;
          }
        }
      });

      return productPrices;
    } catch (error) {
      console.error("Error fetching product prices:", error);
      return {};
    }
  }, [id, (route.params as any)?.buyerType]);

  const refreshAdditionalItemPrices = useCallback(
    async (itemsToRefresh: any[]) => {
      if (!itemsToRefresh || itemsToRefresh.length === 0) return;

      const productIds = itemsToRefresh
        .map((item: any) =>
          Number(item.productId || item.id || item.cropId || item.mpItemId),
        )
        .filter(
          (id): id is number =>
            typeof id === "number" && !isNaN(id) && id > 0,
        );

      if (productIds.length === 0) return;

      const productPrices = await fetchProductPrices(productIds);

      const mappedAdditionalItems: AdditionalItem[] = itemsToRefresh
        .map((item: any) => {
          const rawId =
            item.productId || item.id || item.mpItemId || item.cropId;
          const productId = Number(rawId);

          if (!productId || isNaN(productId)) {
            console.warn("Skipping item with invalid productId:", item);
            return null;
          }

          const quantity = parseFloat(item.quantity || item.qty) || 1;
          const unit =
            (item.unit || item.quantityType || "kg").toLowerCase() === "kg"
              ? "Kg"
              : "g";
          const quantityInKg = unit === "Kg" ? quantity : quantity / 1000;

          const productPrice =
            productPrices[productId.toString()] ||
            (item.varietyId
              ? productPrices[item.varietyId.toString()]
              : undefined);

          let pricePerKg, discountedPricePerKg, discountAmount, displayName;
          let changeby = item.changeby || "1";
          let startValue = item.startValue || "1";

          if (productPrice) {
            pricePerKg = productPrice.normalPrice;
            discountedPricePerKg = productPrice.discountedPrice;
            discountAmount =
              (pricePerKg - discountedPricePerKg) * quantityInKg;
            displayName = productPrice.displayName;
            changeby = productPrice.changeby || changeby;
            startValue = productPrice.startValue || startValue;
          } else if (item.pricePerKg && item.discountedPricePerKg) {
            pricePerKg = Number(item.pricePerKg);
            discountedPricePerKg = Number(item.discountedPricePerKg);
            discountAmount =
              (pricePerKg - discountedPricePerKg) * quantityInKg;
            displayName = item.name;
          } else {
            const totalPrice = Number(item.price || item.totalPrice) || 0;
            const totalDiscount = Number(item.discount) || 0;

            discountedPricePerKg =
              quantityInKg > 0 ? totalPrice / quantityInKg : 0;
            pricePerKg =
              quantityInKg > 0
                ? (totalPrice + totalDiscount) / quantityInKg
                : 0;
            discountAmount = totalDiscount;
            displayName = item.name;
          }

          const totalAmount = quantityInKg * discountedPricePerKg;

          return {
            id: productId,
            name: displayName,
            quantity: quantity,
            unit: unit,
            pricePerKg: pricePerKg,
            discountedPricePerKg: Math.max(0, discountedPricePerKg),
            discount: discountAmount,
            totalAmount: totalAmount,
            selected: false,
            changeby: changeby,
            startValue: startValue,
          } as AdditionalItem;
        })
        .filter((item): item is AdditionalItem => item !== null);

      setAdditionalItems(mappedAdditionalItems);
      additionalItemsRef.current = mappedAdditionalItems;
    },
    [fetchProductPrices],
  );

  useEffect(() => {
    const initializeAdditionalItems = async () => {
      const incomingItems =
        (route.params?.isEdit && route.params?.additionalItems) ||
        route.params?.rawAdditionalItems;

      if (incomingItems && incomingItems.length > 0) {
        await refreshAdditionalItemPrices(incomingItems);
      }
    };

    initializeAdditionalItems();
  }, [
    route.params?.isEdit,
    route.params?.additionalItems,
    route.params?.rawAdditionalItems,
    refreshAdditionalItemPrices,
  ]);

  useEffect(() => {
    if (route.params?.isEdit && route.params?.packageId) {
      setPackageValue(route.params.packageId.toString());

      if (route.params.packageItems) {
        const mappedPackageItems = route.params.packageItems.map((item) => ({
          name: item.name,
          qty: item.quantity,
        }));
        setItems(mappedPackageItems);
      }
      if (route.params.packageId && packages.length > 0) {
        const selectedPkg = packages.find(
          (pkg) => pkg.id === route.params.packageId,
        );
        if (selectedPkg) {
          setSelectedPackage((prev) => {
            if (!prev) return selectedPkg;
            return {
              ...selectedPkg,
              startDate:
                prev.startDate !== undefined
                  ? prev.startDate
                  : selectedPkg.startDate,
              endDate:
                prev.endDate !== undefined ? prev.endDate : selectedPkg.endDate,
              packageType:
                prev.packageType !== undefined
                  ? prev.packageType
                  : selectedPkg.packageType,
            };
          });
        }
      }
    }
  }, [
    route.params?.isEdit,
    route.params?.packageId,
    route.params?.packageItems,
    packages,
  ]);

  useEffect(() => {
    if (route.params?.isEdit) return;

    const prevPackageId = route.params?.packageId;
    const prevAdditionalItems = route.params?.rawAdditionalItems;

    if (prevPackageId && !packageValue) {
      setPackageValue(prevPackageId.toString());
    }

    if (prevAdditionalItems && prevAdditionalItems.length > 0) {
      setAdditionalItems(prevAdditionalItems);
    }
  }, [
    route.params?.packageId,
    route.params?.rawAdditionalItems,
    route.params?.isEdit,
    packageValue,
  ]);

  useEffect(() => {
    const currentPkgId = packageValue
      ? parseInt(packageValue, 10)
      : route.params?.packageId
        ? Number(route.params.packageId)
        : null;

    if (currentPkgId && packages.length > 0) {
      const pkg = packages.find((p) => p.id === currentPkgId);
      if (pkg) {
        setSelectedPackage(pkg);
      } else {
        setPackageValue("");
        setSelectedPackage(null);
        setItems([]);
        setAdditionalItems([]);
        additionalItemsRef.current = [];
        if (route.params) {
          route.params.rawAdditionalItems = undefined;
          route.params.additionalItems = undefined;
          route.params.packageId = undefined;
        }
      }
    }
  }, [packages, packageValue, route.params?.packageId]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);

    try {
      let packageTotalAmount = 0;
      if (packageValue && selectedPackage) {
        const packingFee = parseFloat(selectedPackage.packingFee) || 0;
        const productPrice = parseFloat(selectedPackage.productPrice) || 0;
        const serviceFee = parseFloat(selectedPackage.serviceFee) || 0;
        packageTotalAmount = packingFee + productPrice + serviceFee;
      }

      const orderData = {
        userId: route.params?.id,
        isPackage: isPackageNum,
        packageId: packageValue ? parseInt(packageValue) : null,
        total:
          packageTotalAmount +
          additionalItems.reduce((sum, item) => sum + item.totalAmount, 0),
        fullTotal:
          packageTotalAmount +
          additionalItems.reduce((sum, item) => sum + item.totalAmount, 0),
        discount: additionalItems.reduce((sum, item) => sum + item.discount, 0),
        additionalItems: additionalItems.map((item) => ({
          productId: item.id,
          qty: item.quantity,
          unit: item.unit.toLowerCase(),
          price:
            item.discountedPricePerKg *
            (item.unit === "Kg" ? item.quantity : item.quantity / 1000),
          discount: item.discount,
        })),
      };

      navigation.navigate("DeliveryAddress" as any, {
        orderData,
        customerid: route.params?.id,
        isPackage: isPackageNum,
        id,
        title,
        name,
        number,
        customerscreencustomerid,
        packageId: packageValue ? parseInt(packageValue) : null,
        packageType: selectedPackage?.packageType,
        startDate: selectedPackage?.startDate,
        endDate: selectedPackage?.endDate,
        rawPackageItems: items,
        rawAdditionalItems: additionalItems,
        isNewCustomer: route.params?.isNewCustomer,
        total:
          packageTotalAmount +
          additionalItems.reduce((sum, item) => sum + item.totalAmount, 0),
        fullTotal:
          packageTotalAmount +
          additionalItems.reduce((sum, item) => sum + item.totalAmount, 0),
        discount: additionalItems.reduce((sum, item) => sum + item.discount, 0),
        scheduleType: (route.params as any)?.scheduleType || (route.params as any)?.sheduleType,
        sheduleType: (route.params as any)?.sheduleType || (route.params as any)?.scheduleType,
        selectedDays: (route.params as any)?.selectedDays || (route.params as any)?.recurringDays,
        recurringDays: (route.params as any)?.recurringDays || (route.params as any)?.selectedDays,
        validityWeeks: (route.params as any)?.validityWeeks,
        validityPeriod: (route.params as any)?.validityPeriod,
        calculatedOrders: (route.params as any)?.calculatedOrders,
        isWholesale: (route.params as any)?.isWholesale,
        buyerType: (route.params as any)?.buyerType,
        from: (route.params as any)?.from,
        epsdDate: (route.params as any)?.epsdDate,
        isFinalizeImdt: 1,
      });
    } catch (error) {
      console.error("Error confirming order:", error);
      Alert.alert("Error", "Failed to process order");
    } finally {
      setLoading(false);
    }
  }, [
    isPackageNum,
    packageValue,
    additionalItems,
    items,
    navigation,
    route.params?.id,
    selectedPackage,
  ]);

  const handleSaveItem = useCallback(() => {
    const selectedProductData = productItems.find(
      (item) => item.value === productValue,
    );

    if (!selectedProductData) {
      Alert.alert("Error", "Please select a product");
      return;
    }

    const isProductAlreadyAdded = additionalItems.some(
      (item) => item.id === selectedProductData.id,
    );

    if (isProductAlreadyAdded) {
      Alert.alert("Error", "This product is already added");
      return;
    }

    const unit = selectedUnit === "Kg" ? "Kg" : "g";
    const quantityInKg = unit === "Kg" ? quantity : quantity / 1000;

    const normalPrice = parseFloat(selectedProductData.price);
    const discountedPrice = selectedProductData.discountedPrice
      ? parseFloat(selectedProductData.discountedPrice)
      : normalPrice;
    const discountPerKg = normalPrice - discountedPrice;
    const totalDiscountForQuantity = discountPerKg * quantityInKg;

    const totalAmount = quantityInKg * discountedPrice;

    const newItem = {
      id: selectedProductData.id || Date.now(),
      name: selectedProductData.label,
      quantity: quantity,
      unit: unit,
      pricePerKg: normalPrice,
      discountedPricePerKg: discountedPrice,
      discount: totalDiscountForQuantity,
      totalAmount: totalAmount,
      selected: false,
      changeby: selectedProductData.changeby || "1",
      startValue: selectedProductData.startValue || "1",
    };

    setAdditionalItems((prev) => [...prev, newItem]);
    setShowAddModal(false);
    setQuantity(1);
    setSelectedUnit("g");
    setPricePerKg(discountedPrice);
  }, [productItems, productValue, selectedUnit, quantity, additionalItems]);

  const fetchItemsForPackage = useCallback(async (packageId: number) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await axios.get<{
        data: { name: string; qty: string }[];
      }>(
        `${environment.API_BASE_URL}api/packages/${packageId}/items?_t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );

      if (response.data && Array.isArray(response.data.data)) {
        setItems(response.data.data);
      } else {
        setItems([]);
      }
    } catch (error: any) {
      console.error("Error fetching items:", error);
      if (error?.response?.status === 404) {
        setItems([]);
      }
    }
  }, []);

  const fetchPackageDetails = useCallback(async (packageId: number) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{
        data: {
          id: number;
          displayName: string;
          description: string;
          packageType?: string;
          startDate?: string;
          endDate?: string;
        };
      }>(
        `${environment.API_BASE_URL}api/packages/marketplace-package/${packageId}?_t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );

      if (response.data && response.data.data) {
        const data = response.data.data;
        setSelectedPackage((prev) => {
          if (!prev || prev.id !== packageId) return prev;
          return {
            ...prev,
            startDate: data.startDate,
            endDate: data.endDate,
            packageType: data.packageType || prev.packageType,
          };
        });
      }
    } catch (err) {
      console.warn(
        "Could not fetch extra package details in OrderScreen:",
        err,
      );
    }
  }, []);

  const fetchCrops = useCallback(async () => {
    try {
      setProductDropdownLoading(true);
      const storedToken = token || (await AsyncStorage.getItem("authToken"));
      const response = await axios.get(
        `${environment.API_BASE_URL}api/packages/crops/all?_t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          params: { id, buyerType: (route.params as any)?.buyerType },
        },
      );

      const retailItems = (response.data?.data || [])
        .filter(
          (item: CropItem) =>
            item.category?.toLowerCase() === "retail" ||
            !item.category,
        )
        .map((item: CropItem) => ({
          label: item.displayName,
          value: item.varietyId.toString(),
          id: item.id,
          unitType: item.unitType,
          price: item.normalPrice,
          discountedPrice: item.discountedPrice,
          discount: (
            parseFloat(item.normalPrice) - parseFloat(item.discountedPrice)
          ).toFixed(2),
          changeby: item.changeby || "1",
          startValue: item.startValue || "1",
        }));

      setProductItems(retailItems);
    } catch (error) {
      console.error("Error fetching crops:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setProductDropdownLoading(false);
    }
  }, [id, token, (route.params as any)?.buyerType]);

  const fetchPackages = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return [];
      }

      setToken(storedToken);

      const response = await axios.get<{ data: Package[] }>(
        `${environment.API_BASE_URL}api/packages/get-packages?_t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
      const freshPackages = response.data?.data || [];
      setPackages(freshPackages);

      const dropdownItems = freshPackages.map((pkg) => ({
        label: pkg.displayName,
        value: pkg.id.toString(),
      }));

      setPackageItems(dropdownItems);
      setFilteredPackageItems(dropdownItems);

      const currentPkgId = packageValue
        ? parseInt(packageValue, 10)
        : route.params?.packageId
          ? Number(route.params.packageId)
          : null;

      if (currentPkgId) {
        const freshPkg = freshPackages.find((p) => p.id === currentPkgId);
        if (freshPkg) {
          setSelectedPackage(freshPkg);
          await Promise.all([
            fetchPackageDetails(currentPkgId),
            fetchItemsForPackage(currentPkgId),
          ]);
        } else {
          setPackageValue("");
          setSelectedPackage(null);
          setItems([]);
          setAdditionalItems([]);
          additionalItemsRef.current = [];
          if (route.params) {
            route.params.rawAdditionalItems = undefined;
            route.params.additionalItems = undefined;
            route.params.packageId = undefined;
          }
        }
      }

      return freshPackages;
    } catch (error) {
      Alert.alert("Error", "Failed to fetch packages");
      console.error(error);
      return [];
    }
  }, [
    packageValue,
    route.params?.packageId,
    fetchPackageDetails,
    fetchItemsForPackage,
  ]);

  useEffect(() => {
    fetchPackages();

    const unsubscribe = socketService.onPackageUpdate(async () => {
      console.log(
        "🔄 [OrderScreen] Refreshing packages, crops, and additional items from socket update event",
      );
      const freshPkgs = await fetchPackages();
      const currentPkgId = packageValue
        ? parseInt(packageValue, 10)
        : route.params?.packageId
          ? Number(route.params.packageId)
          : selectedPackage?.id || null;

      if (
        currentPkgId &&
        freshPkgs &&
        !freshPkgs.some((p: Package) => p.id === currentPkgId)
      ) {
        setPackageValue("");
        setSelectedPackage(null);
        setItems([]);
        setAdditionalItems([]);
        additionalItemsRef.current = [];
        if (route.params) {
          route.params.rawAdditionalItems = undefined;
          route.params.additionalItems = undefined;
          route.params.packageId = undefined;
        }
      } else if (additionalItemsRef.current.length > 0) {
        refreshAdditionalItemPrices(additionalItemsRef.current);
      }
      fetchCrops();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchPackages, fetchCrops, refreshAdditionalItemPrices, packageValue, route.params, selectedPackage?.id]);

  useEffect(() => {}, [route.params]);

  const handlePackageChange = (value: string | null) => {
    if (value) {
      setPackageValue(value);
      const packageId = parseInt(value, 10);
      if (!isNaN(packageId)) {
        const foundPkg = packages.find((pkg) => pkg.id === packageId);
        if (foundPkg) {
          setSelectedPackage(foundPkg);
        }
        setItems([]);
        fetchItemsForPackage(packageId);
        fetchPackageDetails(packageId);
      } else {
        console.error("Invalid package ID:", value);
        setItems([]);
        setSelectedPackage(null);
        setAdditionalItems([]);
        additionalItemsRef.current = [];
        if (route.params) {
          route.params.rawAdditionalItems = undefined;
          route.params.additionalItems = undefined;
          route.params.packageId = undefined;
        }
      }
    } else {
      setPackageValue("");
      setItems([]);
      setSelectedPackage(null);
      setAdditionalItems([]);
      additionalItemsRef.current = [];
      if (route.params) {
        route.params.rawAdditionalItems = undefined;
        route.params.additionalItems = undefined;
        route.params.packageId = undefined;
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const itemsToRefresh =
        additionalItemsRef.current.length > 0
          ? additionalItemsRef.current
          : (route.params?.rawAdditionalItems || route.params?.additionalItems || []);

      const freshPkgs = await fetchPackages();
      const currentPkgId = packageValue
        ? parseInt(packageValue, 10)
        : selectedPackage?.id ||
          (route.params?.packageId ? Number(route.params.packageId) : null);
      let packageStillValid = false;
      if (currentPkgId) {
        const isStillActive =
          freshPkgs && freshPkgs.some((p: Package) => p.id === currentPkgId);
        if (isStillActive) {
          packageStillValid = true;
          await Promise.all([
            fetchItemsForPackage(currentPkgId),
            fetchPackageDetails(currentPkgId),
          ]);
        } else {
          setPackageValue("");
          setSelectedPackage(null);
          setItems([]);
          setAdditionalItems([]);
          additionalItemsRef.current = [];
          if (route.params) {
            route.params.rawAdditionalItems = undefined;
            route.params.additionalItems = undefined;
            route.params.packageId = undefined;
          }
        }
      }

      await Promise.all([
        (async () => {
          if (packageStillValid && itemsToRefresh.length > 0) {
            await refreshAdditionalItemPrices(itemsToRefresh);
          }
        })(),
        fetchCrops(),
      ]);
    } catch (error) {
      console.error("Refresh error in OrderScreen:", error);
    } finally {
      setRefreshing(false);
    }
  }, [
    packageValue,
    selectedPackage?.id,
    route.params?.packageId,
    route.params?.rawAdditionalItems,
    route.params?.additionalItems,
    fetchPackages,
    fetchItemsForPackage,
    fetchPackageDetails,
    refreshAdditionalItemPrices,
    fetchCrops,
  ]);

  // Auto-refresh when navigating back or when OrderScreen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const refreshScreenData = async () => {
        try {
          const freshPkgs = await fetchPackages();

          const currentPkgId = packageValue
            ? parseInt(packageValue, 10)
            : route.params?.packageId
              ? Number(route.params.packageId)
              : selectedPackage?.id || null;

          let packageStillValid = false;
          if (currentPkgId && isMounted) {
            const isStillActive =
              freshPkgs &&
              freshPkgs.some((p: Package) => p.id === currentPkgId);
            if (isStillActive) {
              packageStillValid = true;
              if (!packageValue) {
                setPackageValue(currentPkgId.toString());
              }
              await Promise.all([
                fetchItemsForPackage(currentPkgId),
                fetchPackageDetails(currentPkgId),
              ]);
            } else {
              setPackageValue("");
              setSelectedPackage(null);
              setItems([]);
              setAdditionalItems([]);
              additionalItemsRef.current = [];
              if (route.params) {
                route.params.rawAdditionalItems = undefined;
                route.params.additionalItems = undefined;
                route.params.packageId = undefined;
              }
            }
          }

          await Promise.all([
            (async () => {
              if (packageStillValid && isMounted) {
                const itemsToRefresh =
                  additionalItemsRef.current.length > 0
                    ? additionalItemsRef.current
                    : (route.params?.rawAdditionalItems || route.params?.additionalItems || []);
                if (itemsToRefresh.length > 0) {
                  await refreshAdditionalItemPrices(itemsToRefresh);
                }
              }
            })(),
            (async () => {
              if (isMounted) {
                await fetchCrops();
              }
            })(),
          ]);
        } catch (error) {
          console.error("Auto refresh error in OrderScreen on focus:", error);
        }
      };

      refreshScreenData();

      return () => {
        isMounted = false;
      };
    }, [
      packageValue,
      route.params?.packageId,
      route.params?.rawAdditionalItems,
      route.params?.additionalItems,
      selectedPackage?.id,
      fetchPackages,
      fetchItemsForPackage,
      fetchPackageDetails,
      refreshAdditionalItemPrices,
      fetchCrops,
    ]),
  );

  const handleAddMore = () => {
    setShowAddModal(true);
    const selectedProductData = productItems.find(
      (item) => item.value === productValue,
    );
    if (selectedProductData && selectedProductData.startValue) {
      setQuantity(Number(selectedProductData.startValue));
    } else {
      setQuantity(1);
    }
  };

  const calculateDiscountForQuantity = () => {
    const selectedProductData = productItems.find(
      (item) => item.value === productValue,
    );
    if (!selectedProductData) return 0;

    const normalPrice = parseFloat(selectedProductData.price);
    const discountedPrice = selectedProductData.discountedPrice
      ? parseFloat(selectedProductData.discountedPrice)
      : normalPrice;

    const discountPerKg = normalPrice - discountedPrice;
    const quantityInKg = selectedUnit === "Kg" ? quantity : quantity / 1000;

    return (discountPerKg * quantityInKg).toFixed(2);
  };

  const discount = Number(calculateDiscountForQuantity());

  const calculateGrandTotal = () => {
    let packageTotalAmount = 0;

    if (selectedPackage) {
      const packingFee = parseFloat(selectedPackage.packingFee) || 0;
      const productPrice = parseFloat(selectedPackage.productPrice) || 0;
      const serviceFee = parseFloat(selectedPackage.serviceFee) || 0;
      packageTotalAmount = packingFee + productPrice + serviceFee;
    }

    const additionalItemsTotal = additionalItems
      .filter((item) => !selectedItems.includes(item.id))
      .reduce((total, item) => {
        const quantityInKg =
          item.unit === "Kg" ? item.quantity : item.quantity / 1000;
        const itemTotal = quantityInKg * item.discountedPricePerKg;
        return total + itemTotal;
      }, 0);

    return (packageTotalAmount + additionalItemsTotal).toFixed(2);
  };

  const handleGoBack = () => {
    setShowAddModal(false);
    setProductValue("");
    setSelectedProduct("");
  };

  const toggleItemSelection = (id: number) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const deleteSelectedItems = () => {
    setAdditionalItems((prev) =>
      prev.filter((item) => !selectedItems.includes(item.id)),
    );
    setSelectedItems([]);
  };

  const incrementQuantity = () => {
    const selectedProductData = productItems.find(
      (item) => item.value === productValue,
    );
    const changeBy = selectedProductData?.changeby
      ? Number(selectedProductData.changeby)
      : 1;

    const adjustedChangeBy = selectedUnit === "Kg" ? changeBy : changeBy * 1000;

    setQuantity((prev) => {
      const newValue = prev + adjustedChangeBy;

      return selectedUnit === "Kg"
        ? Math.round(newValue * 100) / 100
        : Math.round(newValue);
    });
  };

  const decrementQuantity = () => {
    const selectedProductData = productItems.find(
      (item) => item.value === productValue,
    );
    const changeBy = selectedProductData?.changeby
      ? Number(selectedProductData.changeby)
      : 1;
    const startValue = selectedProductData?.startValue
      ? Number(selectedProductData.startValue)
      : 0;

    const adjustedChangeBy = selectedUnit === "Kg" ? changeBy : changeBy * 1000;
    const adjustedStartValue =
      selectedUnit === "Kg" ? startValue : startValue * 1000;

    setQuantity((prev) => {
      const newValue = prev - adjustedChangeBy;
      const roundedValue =
        selectedUnit === "Kg"
          ? Math.round(newValue * 100) / 100
          : Math.round(newValue);
      return Math.max(adjustedStartValue, roundedValue);
    });
  };

  const updateQuantity = (changeBy: number, increase: boolean) => {
    if (!editingItem) return;

    const dynamicChangeBy = editingItem.changeby
      ? Number(editingItem.changeby)
      : changeBy;
    const startValue = editingItem.startValue
      ? Number(editingItem.startValue)
      : 1;

    const adjustedChangeBy =
      editSelectedUnit === "Kg" ? dynamicChangeBy : dynamicChangeBy * 1000;
    const adjustedStartValue =
      editSelectedUnit === "Kg" ? startValue : startValue * 1000;

    if (increase) {
      setNewItemQuantity((prev) => {
        const newValue = prev + adjustedChangeBy;
        return editSelectedUnit === "Kg"
          ? Math.round(newValue * 1000) / 1000
          : Math.round(newValue);
      });
    } else {
      setNewItemQuantity((prev) => {
        const newValue = prev - adjustedChangeBy;
        const roundedValue =
          editSelectedUnit === "Kg"
            ? Math.round(newValue * 1000) / 1000
            : Math.round(newValue);
        return Math.max(adjustedStartValue, roundedValue);
      });
    }
  };

  const saveUpdatedItem = () => {
    if (!editingItem) return;

    const unit = editSelectedUnit;

    const roundedQuantity =
      unit === "Kg"
        ? Math.round(newItemQuantity * 1000) / 1000
        : Math.round(newItemQuantity);

    const quantityInKg =
      unit === "Kg" ? roundedQuantity : roundedQuantity / 1000;

    const totalAmount =
      Math.round(quantityInKg * editingItem.discountedPricePerKg * 100) / 100;
    const discountAmount =
      Math.round(
        (editingItem.pricePerKg - editingItem.discountedPricePerKg) *
          quantityInKg *
          100,
      ) / 100;

    const updatedItem: AdditionalItem = {
      ...editingItem,
      quantity: roundedQuantity,
      unit: unit,
      totalAmount: totalAmount,
      discount: discountAmount,
    };

    setAdditionalItems((items) =>
      items.map((item) => (item.id === editingItem.id ? updatedItem : item)),
    );

    setModalVisible(false);
    setEditingItem(null);
  };

  const getTotalItemsCount = () => {
    return items.reduce((total, item) => {
      const qty = parseInt(item.qty) || 0;
      return total + qty;
    }, 0);
  };

  const handleEditItem = (item: AdditionalItem) => {
    setEditingItem(item);
    setNewItemQuantity(item.quantity);
    setEditSelectedUnit(item.unit);
    setModalVisible(true);
  };

  useEffect(() => {
    if (productValue) {
      const selectedProductData = productItems.find(
        (item) => item.value === productValue,
      );
      if (selectedProductData) {
        const unitType =
          selectedProductData.unitType?.toLowerCase() === "g" ? "g" : "Kg";
        setSelectedUnit(unitType);

        const startValue = selectedProductData.startValue
          ? Number(selectedProductData.startValue)
          : 1;
        const adjustedStartValue =
          unitType === "Kg" ? startValue : startValue * 1000;
        setQuantity(adjustedStartValue);

        const discountedPrice = selectedProductData.discountedPrice
          ? parseFloat(selectedProductData.discountedPrice)
          : parseFloat(selectedProductData.price);
        setPricePerKg(discountedPrice);
      }
    }
  }, [productValue, productItems]);

  const handleUnitConversion = (newUnit: string) => {
    const currentUnit = selectedUnit;

    if (currentUnit === newUnit) return;

    let convertedQuantity = quantity;

    if (currentUnit === "Kg" && newUnit === "g") {
      convertedQuantity = quantity * 1000;
    } else if (currentUnit === "g" && newUnit === "Kg") {
      convertedQuantity = quantity / 1000;
    }

    if (newUnit === "g") {
      convertedQuantity = Math.round(convertedQuantity);
    } else {
      convertedQuantity = Math.round(convertedQuantity * 1000) / 1000;
    }

    setQuantity(convertedQuantity);
    setSelectedUnit(newUnit);
  };

  const handleEditUnitConversion = (newUnit: string) => {
    const currentUnit = editSelectedUnit;

    if (currentUnit === newUnit) return;

    let convertedQuantity = newItemQuantity;

    if (currentUnit === "Kg" && newUnit === "g") {
      convertedQuantity = newItemQuantity * 1000;
    } else if (currentUnit === "g" && newUnit === "Kg") {
      convertedQuantity = newItemQuantity / 1000;
    }

    setNewItemQuantity(convertedQuantity);
    setEditSelectedUnit(newUnit);
  };

  useEffect(() => {
    const filtered = productItems.filter(
      (product) => !additionalItems.some((item) => item.id === product.id),
    );
    setFilteredProductItems(filtered);
  }, [productItems, additionalItems]);

  const handleProductSearchChange = (text: string) => {
    let filteredText = text;
    if (filteredText.startsWith(" ")) {
      filteredText = filteredText.replace(/^\s+/, "");
    }
    filteredText = filteredText.replace(/[^a-zA-Z0-9\s]/g, "");
    filteredText = filteredText.replace(/\s+/g, " ");

    setProductSearchValue(filteredText);

    const baseFiltered = productItems.filter(
      (product) => !additionalItems.some((item) => item.id === product.id),
    );

    if (filteredText.trim() === "") {
      setFilteredProductItems(baseFiltered);
    } else {
      const searchFiltered = baseFiltered.filter((item) =>
        item.label.toLowerCase().includes(filteredText.toLowerCase()),
      );
      setFilteredProductItems(searchFiltered);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const targetScreen = (route.params as any)?.isNewCustomer
          ? "SelectOrderTypeNewCustomer"
          : "SelectOrderType";
        navigation.navigate(targetScreen as any, {
          id,
          customerId,
          title,
          name,
          number,
          customerscreencustomerid,
          customerOriginScreen:
            customerOriginScreen || (route.params as any)?.customerOriginScreen,
          packageId: packageValue ? parseInt(packageValue, 10) : undefined,
          rawAdditionalItems:
            additionalItemsRef.current.length > 0
              ? additionalItemsRef.current
              : undefined,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [
      navigation,
      id,
      customerId,
      title,
      name,
      number,
      customerscreencustomerid,
      customerOriginScreen,
      route.params,
      packageValue,
    ]),
  );

  useEffect(() => {
    setFilteredPackageItems(packageItems);
  }, [packageItems]);

  const handlePackageSearchChange = (text: string) => {
    let filteredText = text;
    if (filteredText.startsWith(" ")) {
      filteredText = filteredText.replace(/^\s+/, "");
    }
    filteredText = filteredText.replace(/[^a-zA-Z0-9\s]/g, "");
    filteredText = filteredText.replace(/\s+/g, " ");

    setPackageSearchValue(filteredText);
    if (filteredText.trim() === "") {
      setFilteredPackageItems(packageItems);
    } else {
      const filtered = packageItems.filter((item) =>
        item.label.toLowerCase().includes(filteredText.toLowerCase()),
      );
      setFilteredPackageItems(filtered);
    }
  };

  const [productSearchValue, setProductSearchValue] = useState("");
  const [packageSearchValue, setPackageSearchValue] = useState("");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <CustomHeader
        title="Order Details"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => {
          const targetScreen = (route.params as any)?.isNewCustomer
            ? "SelectOrderTypeNewCustomer"
            : "SelectOrderType";
          navigation.navigate(targetScreen as any, {
            id,
            customerId,
            title,
            name,
            number,
            customerscreencustomerid,
            customerOriginScreen:
              customerOriginScreen ||
              (route.params as any)?.customerOriginScreen,
            packageId: packageValue ? parseInt(packageValue, 10) : undefined,
            rawAdditionalItems:
              additionalItemsRef.current.length > 0
                ? additionalItemsRef.current
                : undefined,
          });
        }}
      />
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6839CF"]}
            tintColor="#6839CF"
          />
        }
      >
        {/* Package Selection */}
        <View className="mb-6">
          <Text className="font-medium text-gray-700 mb-2 rounded-full">
            Package
          </Text>

          <TouchableOpacity
            onPress={() => setPackageModalVisible(true)}
            className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-3 flex-row items-center min-h-[48px]"
          >
            <Text
              className={`flex-1 pr-2 ${packageValue ? "text-black" : "text-gray-500"}`}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {packageValue
                ? packageItems.find((item) => item.value === packageValue)
                    ?.label || "Select a package"
                : "Select a package"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Package Items - Now using dynamic data */}
        {items.length > 0 && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-gray-900">
                Package ({getTotalItemsCount()}{" "}
                {getTotalItemsCount() === 1 ? "item" : "items"})
              </Text>
              <TouchableOpacity
                onPress={handleAddMore}
                className="flex-row items-center gap-1"
              >
                <Ionicons name="add-circle-outline" size={20} color="#6839CF" />
                <Text className="text-purple-600 text-sm font-medium">
                  Add More
                </Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white border-[#3F3F3F]">
              {items.map((item, index) => (
                <View
                  key={index}
                  className={`flex-row justify-between items-center py-2 px-4 ${
                    index !== items.length - 1
                      ? "border-b border-[#CDCDCD]"
                      : ""
                  }`}
                >
                  <Text className="text-gray-800 font-medium flex-1">
                    {item.name}
                  </Text>
                  <View className=" px-2 py-1 rounded min-w-[32px] items-center">
                    <Text className="text-gray-600 font-medium text-sm">
                      {item.qty}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Seasonal Package Section (Only for One Time packages) */}
        <SeasonalPackageBanner
          packageId={packageValue || selectedPackage?.id}
        />

        {/* Show message when no package is selected */}
        {items.length === 0 && packageValue === "" && (
          <View className="items-center justify-center mt-[50%]">
            <Image
              source={require("@/assets/images/order/no-package.webp")}
              className="w-48 h-48 mb-4"
              resizeMode="contain"
            />
          </View>
        )}

        {/* Additional Items */}
        {additionalItems.length > 0 && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-gray-900">
                Additional ({additionalItems.length}{" "}
                {additionalItems.length === 1 ? "item" : "items"})
              </Text>

              {/* Show delete icon only when items are selected */}
              {selectedItems.length > 0 && (
                <TouchableOpacity onPress={deleteSelectedItems} className="p-2">
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <View className="bg-white rounded-lg border border-white">
              {additionalItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleItemSelection(item.id)}
                  className={`flex-row items-center py-4 px-4 ${
                    index !== additionalItems.length - 1
                      ? "border-b border-[#CDCDCD]"
                      : ""
                  } ${selectedItems.includes(item.id) ? "bg-white" : "bg-white"}`}
                >
                  {/* Checkbox icon */}
                  <Ionicons
                    name={
                      selectedItems.includes(item.id)
                        ? "checkbox"
                        : "checkbox-outline"
                    }
                    size={20}
                    color={
                      selectedItems.includes(item.id) ? "#7C3AED" : "#9CA3AF"
                    }
                    className="mr-3"
                  />

                  {/* Item details */}
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-800 font-medium">
                      {item.name}
                    </Text>
                  </View>

                  {/* Quantity and edit button */}
                  <View className="flex-row items-center gap-3">
                    <Text className="text-gray-600 text-sm font-medium">
                      {item.quantity}
                      {item.unit}
                    </Text>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditItem(item);
                      }}
                    >
                      <MaterialIcons name="edit" size={20} color="#6839CF" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Total Section - Only show when a package is selected */}
      {packageValue && (
        <View
          className={`bg-white flex-row justify-between items-center p-4 rounded-t-3xl shadow-lg`}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 10,
            marginTop: -10,
          }}
        >
          <Text className="text-lg font-semibold text-gray-800 ml-2">
            Total:{" "}
            <Text className="text-base font-semibold text-[#5C5C5C] mr-10">
              Rs.{" "}
              {Number(calculateGrandTotal()).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </Text>

          <TouchableOpacity onPress={handleConfirm} activeOpacity={0.8}>
            <View
              style={{
                width: "60%",
                borderRadius: 30,
                backgroundColor: "transparent",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={["#6839CF", "#874DDB"]}
                className="py-3 px-6 rounded-full"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 40,
                  width: 120,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 30,
                  overflow: "hidden",
                }}
              >
                <View
                  className="w-20 flex-row justify-center items-center"
                  style={{ minHeight: 20 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View className="flex-row gap-2 justify-center items-center">
                      <Text className="text-white font-semibold pl-2">
                        Confirm
                      </Text>
                      <Feather name="check" size={18} color="white" />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Add More Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleGoBack}
      >
        <View className="flex-1 justify-center items-center bg-[#00000066] p-2">
          <View
            className="bg-white p-6 rounded-xl w-11/12 max-w-[500px]"
            style={{
              maxHeight: "100%",
              height: "auto",
            }}
          >
            {/* Product Section */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-3">Product</Text>

              <TouchableOpacity
                onPress={() => {
                  fetchCrops();
                  setProductModalVisible(true);
                }}
                className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-2 flex-row justify-between items-center min-h-[48px]"
              >
                <Text className={productValue ? "text-black" : "text-gray-500"}>
                  {productValue
                    ? productItems.find((item) => item.value === productValue)
                        ?.label || "Select a product..."
                    : "Select a product..."}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2">
                Price per 1kg (Discounted Value)
              </Text>
              <View className="bg-gray-50 justify-center rounded-3xl h-[50px] p-3">
                <Text className="text-gray-900">
                  Rs.{" "}
                  {Number(pricePerKg || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-3">Quantity</Text>
              <View className="flex-row items-center gap-2">
                {/* Quantity stepper */}
                <View className="flex-row items-center bg-gray-100 rounded-full flex-1 h-[50px]">
                  <TouchableOpacity
                    className="w-12 h-[50px] items-center justify-center"
                    onPress={decrementQuantity}
                  >
                    <Text className="text-gray-700 text-xl font-bold">-</Text>
                  </TouchableOpacity>
                  <Text className="flex-1 text-center text-gray-700">
                    {(quantity || 0).toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    className="w-12 h-[50px] items-center justify-center"
                    onPress={incrementQuantity}
                  >
                    <Text className="text-gray-700 text-xl font-bold">+</Text>
                  </TouchableOpacity>
                </View>

                {/* Unit button */}
                <TouchableOpacity
                  onPress={() => setUnitModalVisible(true)}
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 h-[50px] flex-row items-center justify-between"
                  style={{ width: 100 }}
                >
                  <Text className="text-black">{selectedUnit}</Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Amount Section */}
            <View className="mb-6">
              <Text className="text-gray-700 mb-3">
                Total Amount (Discounted Value)
              </Text>
              <View className="bg-gray-50 rounded-3xl px-4 py-4">
                <Text className="text-gray-900">
                  Rs.{" "}
                  {(
                    (selectedUnit === "Kg" ? quantity : quantity / 1000) *
                    pricePerKg
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            {/* Dynamic Discount Message */}
            {discount > 0 ? (
              <View className="mb-4">
                <Text className="text-purple-600 text-center text-sm font-medium">
                  You received a discount of Rs.{" "}
                  {Number(calculateDiscountForQuantity()).toLocaleString(
                    "en-US",
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  )}{" "}
                  for this product
                </Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={handleGoBack}
                className="bg-gray-200 py-3 rounded-full items-center mb-3"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text className="text-gray-700 font-semibold text-base">
                  Go Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveItem}
                className="bg-purple-600 py-3 rounded-full items-center"
                style={{
                  shadowColor: "#7C3AED",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 6,
                }}
              >
                <Text className="text-white font-semibold text-base">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Product Selection Modal (inside Add More Modal for iOS stacking) */}
        <GlobalSearchModal
          visible={productModalVisible}
          onClose={() => setProductModalVisible(false)}
          title="Select Product"
          data={filteredProductItems}
          selectedItems={productValue ? [productValue] : []}
          onSelect={(items) => {
            if (items.length > 0) {
              setProductValue(items[0]);
              const selectedItem = productItems.find(
                (p) => p.value === items[0],
              );
              if (selectedItem) {
                setSelectedProduct(selectedItem.label);
                const discountedPrice = selectedItem.discountedPrice
                  ? parseFloat(selectedItem.discountedPrice)
                  : parseFloat(selectedItem.price);
                setPricePerKg(discountedPrice);

                const unitType =
                  selectedItem.unitType?.toLowerCase() === "g" ? "g" : "Kg";
                setSelectedUnit(unitType);

                const startValue = selectedItem.startValue
                  ? Number(selectedItem.startValue)
                  : 1;
                const adjustedStartValue =
                  unitType === "Kg" ? startValue : startValue * 1000;
                setQuantity(adjustedStartValue);
              }
            }
            setProductModalVisible(false);
          }}
          searchPlaceholder="Search product..."
          multiSelect={false}
          isLoading={productDropdownLoading}
        />

        {/* Unit Selection Modal (inside Add More Modal for iOS stacking) */}
        <GlobalSearchModal
          visible={unitModalVisible}
          onClose={() => setUnitModalVisible(false)}
          title="Select Unit"
          data={[
            { label: "Kg", value: "Kg" },
            { label: "g", value: "g" },
          ]}
          selectedItems={[selectedUnit]}
          onSelect={(items) => {
            if (items.length > 0) {
              handleUnitConversion(items[0]);
            }
            setUnitModalVisible(false);
          }}
          searchPlaceholder="Search unit..."
          multiSelect={false}
          showSearch={false}
          isLoading={false}
        />
      </Modal>

      {/* Edit Item Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#00000066] bg-opacity-10">
          <View className="bg-white p-6 rounded-xl w-11/12 max-w-[500px]">
            <Text className="text-gray-700 mb-2">Product</Text>
            <TextInput
              className="bg-gray-100 p-3 rounded-full mb-3 text-gray-700"
              value={editingItem?.name}
              editable={false}
            />

            {/* Quantity and Unit Selector */}
            <View>
              <Text className="text-gray-700 mb-2">Quantity</Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-row items-center bg-gray-100 rounded-full flex-1">
                  <TouchableOpacity
                    className="w-10 h-10 flex items-center justify-center"
                    onPress={() => updateQuantity(1, false)}
                  >
                    <Text className="text-gray-700 text-xl font-bold">-</Text>
                  </TouchableOpacity>

                  <Text className="flex-1 text-center text-gray-700">
                    {newItemQuantity}
                  </Text>

                  <TouchableOpacity
                    className="w-10 h-10 flex items-center justify-center"
                    onPress={() => updateQuantity(1, true)}
                  >
                    <Text className="text-gray-700 text-xl font-bold">+</Text>
                  </TouchableOpacity>
                </View>

                {/* Unit button */}
                <TouchableOpacity
                  onPress={() => setEditUnitModalVisible(true)}
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-3 flex-row items-center justify-between"
                  style={{ width: 100 }}
                >
                  <Text className="text-black">{editSelectedUnit}</Text>

                  <MaterialIcons
                    name="arrow-drop-down"
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Amount Section */}
            <View className="mb-6 mt-4">
              <Text className="text-gray-700 font-medium mb-3">
                Total Amount
              </Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4">
                <Text className="text-gray-900">
                  Rs.{" "}
                  {(
                    (editSelectedUnit === "Kg"
                      ? newItemQuantity
                      : newItemQuantity / 1000) *
                    (editingItem?.discountedPricePerKg || 0)
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View className="gap-3">
              <TouchableOpacity
                className="bg-gray-300 py-3 rounded-full items-center justify-center mb-3"
                onPress={() => setModalVisible(false)}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Go Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-purple-700 py-3 rounded-full items-center justify-center"
                onPress={saveUpdatedItem}
                style={{
                  shadowColor: "#7C3AED",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 6,
                }}
              >
                <Text className="text-white font-semibold text-center">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Package Selection Modal */}
      <GlobalSearchModal
        visible={packageModalVisible}
        onClose={() => setPackageModalVisible(false)}
        title="Select Package"
        data={filteredPackageItems}
        selectedItems={packageValue ? [packageValue] : []}
        onSelect={(items) => {
          if (items.length > 0) {
            handlePackageChange(items[0]);
          }
          setPackageModalVisible(false);
        }}
        searchPlaceholder="Search package..."
        multiSelect={false}
        showSearch={true}
        isLoading={false}
        noResultsText="No Packages Found"
      />

      {/* NOTE: Product Selection Modal and Unit Selection Modal have been moved
          inside the Add More Modal above. This is required on iOS because nested
          Modals must be children of their parent Modal to appear correctly on
          the native modal stack. The duplicates below have been removed. */}

      {/* Edit Unit Selection Modal */}
      <GlobalSearchModal
        visible={editUnitModalVisible}
        onClose={() => setEditUnitModalVisible(false)}
        title="Select Unit"
        data={[
          { label: "Kg", value: "Kg" },
          { label: "g", value: "g" },
        ]}
        selectedItems={[editSelectedUnit]}
        onSelect={(items) => {
          if (items.length > 0) {
            handleEditUnitConversion(items[0]);
          }
          setEditUnitModalVisible(false);
        }}
        searchPlaceholder="Search unit..."
        multiSelect={false}
        showSearch={false}
        isLoading={false}
      />
    </KeyboardAvoidingView>
  );
};

export default OrderScreen;

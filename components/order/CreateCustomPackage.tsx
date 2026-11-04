import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Keyboard,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import NoDataFound from "../common/NoDataFound";
import LoadingPage from "../common/LoadingPage";
import CustomHeader from "../common/CustomHeader";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CreateCustomPackageNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CreateCustomPackage"
>;

interface CreateCustomPackageProps {
  navigation: CreateCustomPackageNavigationProp;
  route: {
    params: {
      id: string;
      isPackage: string;
      selectedProductIds?: number[];
      customerId: string;
      name: string;
      title: string;
      number: string;
      customerscreencustomerid: string;
      buyerType?: string;
      from?: string;
    };
  };
}

interface Product {
  id: number;
  varietyId: string;
  displayName: string;
  normalPrice: number;
  discountedPrice: number;
  selected: boolean;
  unitType: string;
  startValue: number;
  changeby: number;
  category: string;
  tags: string;
}

const CreateCustomPackage: React.FC<CreateCustomPackageProps> = ({
  navigation,
  route,
}) => {
  const {
    id,
    isPackage,
    selectedProductIds,
    customerId,
    name,
    title,
    number,
    customerscreencustomerid,
    buyerType,
    from,
  } = route.params || {};

  const [fetchedBuyerType, setFetchedBuyerType] = useState<string>("");

  useEffect(() => {
    if (!buyerType && (id || customerId)) {
      const targetId = id || customerId;
      AsyncStorage.getItem("authToken").then((token) => {
        if (!token) return;
        axios
          .get(
            `${environment.API_BASE_URL}api/customer/get-customer-data/${targetId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )
          .then((res) => {
            if (res.data?.buyerType) {
              setFetchedBuyerType(res.data.buyerType);
            }
          })
          .catch(() => {});
      });
    }
  }, [id, customerId, buyerType]);

  const effectiveBuyerType = buyerType || fetchedBuyerType;
  const isWholesale =
    String(effectiveBuyerType || "").toLowerCase() === "wholesale" ||
    from === "ViewCustomerScreen";
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // iOS: how many pixels of OUR container the keyboard actually covers
  const containerRef = useRef<View>(null);
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);

  // Keyboard visibility + measured overlap (iOS)
  useEffect(() => {
    if (Platform.OS === "ios") {
      // keyboardWillChangeFrame fires for show, hide, and size changes
      // (QuickType bar, emoji keyboard, etc.), so it is the most reliable event.
      const frameSub = Keyboard.addListener("keyboardWillChangeFrame", (e) => {
        const { screenY } = e.endCoordinates;
        const windowHeight = Dimensions.get("window").height;
        const visible = screenY < windowHeight;
        setIsKeyboardVisible(visible);

        if (!visible) {
          setKeyboardOverlap(0);
          return;
        }

        containerRef.current?.measureInWindow((_x, y, _w, h) => {
          const containerBottom = y + h;
          const overlap = Math.max(0, containerBottom - screenY);
          setKeyboardOverlap(overlap);
        });
      });

      const hideSub = Keyboard.addListener("keyboardWillHide", () => {
        setIsKeyboardVisible(false);
        setKeyboardOverlap(0);
      });

      return () => {
        frameSub.remove();
        hideSub.remove();
      };
    }

    // Android
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Fetch products. The backend returns ONLY the correct category
  // (wholesale buyer -> wholesale items, retail buyer -> retail items).
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const apiUrl = `${environment.API_BASE_URL}api/packages/crops/all`;
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${storedToken}` },
          params: { id, buyerType: isWholesale ? "Wholesale" : "Retail" },
        });

        const list = response.data?.data ?? [];
        setProducts(
          list.map((item: any) => ({
            ...item,
            normalPrice: parseFloat(item.normalPrice),
            discountedPrice: parseFloat(item.discountedPrice),
            startValue: parseFloat(item.startValue),
            selected: selectedProductIds?.includes(item.id) ?? false,
          })),
        );
      } catch (err: any) {
        // Treat "no crops" (404) as an empty list, not an error
        if (err?.response?.status === 404) {
          setProducts([]);
        } else {
          console.error("Failed to fetch product:", err);
          setError("Failed to load products. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [id, isWholesale]);

  // Search only. Category filtering is done by the backend.
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      product.displayName.toLowerCase().includes(q) ||
      (product.tags && product.tags.toLowerCase().includes(q))
    );
  });

  const toggleProductSelection = (productId: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, selected: !product.selected }
          : product,
      ),
    );
  };

  // Re-apply selection when returning from the cart
  useFocusEffect(
    useCallback(() => {
      const currentSelectedIds = route.params?.selectedProductIds;
      if (currentSelectedIds && currentSelectedIds.length > 0) {
        setProducts((prevProducts) =>
          prevProducts.map((product) => ({
            ...product,
            selected: currentSelectedIds.includes(product.id),
          })),
        );
      }
    }, [route.params?.selectedProductIds]),
  );

  // Shared back navigation (header button + Android hardware button)
  const handleBack = useCallback(() => {
    if (isWholesale || from === "ViewCustomerScreen") {
      navigation.navigate("ViewCustomerScreen" as any, {
        id,
        customerId: customerscreencustomerid || customerId,
        title,
        name,
        number,
        buyerType: "Wholesale",
      });
    } else {
      navigation.navigate("SelectOrderType" as any, {
        id,
        customerId,
        title,
        name,
        number,
        customerscreencustomerid,
        buyerType: "Retail",
      });
    }
  }, [
    navigation,
    isWholesale,
    from,
    id,
    customerId,
    customerscreencustomerid,
    title,
    name,
    number,
  ]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [handleBack]),
  );

  const handleSearch = (query: string) => {
    let cleanedQuery = query.replace(/[^a-zA-Z0-9\s]/g, "");
    cleanedQuery = cleanedQuery.replace(/^\s+/, "");
    cleanedQuery = cleanedQuery.replace(/\s+/g, " ");
    setSearchQuery(cleanedQuery);
  };

  const hasSelectedProducts = products.some((product) => product.selected);

  const goToCart = () => {
    const selectedProducts = products
      .filter((product) => product.selected)
      .map((product) => {
        const itemDiscount = Math.max(
          0,
          product.normalPrice - product.discountedPrice,
        );
        return {
          id: product.id,
          name: product.displayName,
          price: product.discountedPrice,
          pricenoraml: product.normalPrice,
          normalPrice: product.normalPrice,
          discount: itemDiscount,
          discountedPrice: product.discountedPrice,
          changeby: product.changeby,
          unitType: product.unitType,
          startValue: product.startValue,
          cutId: id,
          isPackage: isPackage,
        };
      });

    if (selectedProducts.length > 0) {
      navigation.navigate("CratScreen" as any, {
        selectedProducts,
        selectedProductIds: selectedProducts.map((p: any) => p.id),
        id,
        isPackage,
        customerId,
        title,
        name,
        number,
        customerscreencustomerid,
        buyerType: isWholesale ? "Wholesale" : effectiveBuyerType || "Retail",
        from: from || (isWholesale ? "ViewCustomerScreen" : "SelectOrderType"),
      });
    } else {
      Alert.alert("Please select at least one product");
    }
  };

  const formatPrice = (price: number) => {
    return Number(price)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // No elevation while the keyboard is open (avoids a shadow artifact above it)
  const getElevation = () => {
    if (isKeyboardVisible) return 0;
    return hasSelectedProducts ? 5 : 0;
  };

  if (loading) {
    return <LoadingPage message="Loading Item Details..." fullScreen={true} />;
  }

  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-red-500 text-lg">{error}</Text>
        <TouchableOpacity
          className="mt-4 bg-purple-600 px-4 py-2 rounded-full"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      // Android: KeyboardAvoidingView "padding".
      // iOS: handled manually with the measured keyboard overlap below.
      behavior={Platform.OS === "android" ? "padding" : undefined}
      keyboardVerticalOffset={0}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View
        ref={containerRef}
        collapsable={false}
        style={{
          flex: 1,
          paddingBottom: Platform.OS === "ios" ? keyboardOverlap : 0,
        }}
      >
        <CustomHeader
          title="Select Custom Items"
          titleColor="#6C3CD1"
          showBackButton={true}
          navigation={navigation}
          onBackPress={handleBack}
        />

        <View className="flex-1 items-center">
          <View className="flex-1 w-full max-w-[500px] px-6">
            {/* Search Bar */}
            <View
              className="mb-4 bg-[#F5F1FC] h-[50px] rounded-full flex-row items-center px-4 mt-2"
              style={{
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TextInput
                className="flex-1 italic text-gray-700"
                style={{
                  height: 48,
                  textAlignVertical: "center",
                  paddingVertical: 0,
                  includeFontPadding: false,
                  fontSize: 14,
                }}
                placeholder="Search By Product Name"
                placeholderTextColor="#6839CF"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              <Ionicons name="search" size={20} color="#6839CF" />
            </View>

            {/* Product List OR Empty State */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "none" : "on-drag"}
              automaticallyAdjustKeyboardInsets={false}
              nestedScrollEnabled
              bounces={true}
              contentContainerStyle={
                filteredProducts.length === 0
                  ? {
                      flexGrow: 1,
                      justifyContent: "center",
                      alignItems: "center",
                    }
                  : { paddingBottom: 24 }
              }
            >
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    className="flex-row py-3 border-b border-gray-100"
                    onPress={() => toggleProductSelection(product.id)}
                  >
                    <View className="flex-1 pr-3">
                      <Text
                        className="text-base font-medium text-gray-800"
                        numberOfLines={2}
                      >
                        {product.displayName}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Rs. {formatPrice(product.discountedPrice)} per kg
                      </Text>
                    </View>
                    <View className="justify-center w-8">
                      <View
                        className={`w-6 h-6 rounded border ${
                          product.selected
                            ? "bg-black border-black"
                            : "border-gray-400"
                        } justify-center items-center`}
                      >
                        {product.selected && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    paddingBottom: 50,
                  }}
                >
                  <NoDataFound message="No products found" />
                </View>
              )}
            </ScrollView>

            {/* Go to Cart Button (stays visible above the keyboard) */}
            <View
              className="items-center"
              style={{
                paddingTop: isKeyboardVisible ? 8 : 16,
                paddingBottom: isKeyboardVisible
                  ? 12
                  : Math.max(insets.bottom, 16) + 8,
              }}
            >
              <View
                style={{
                  width: "60%",
                  borderRadius: 30,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity:
                    hasSelectedProducts && !isKeyboardVisible ? 0.25 : 0,
                  shadowRadius: 8,
                  elevation: getElevation(),
                }}
              >
                <TouchableOpacity
                  onPress={goToCart}
                  disabled={!hasSelectedProducts}
                  activeOpacity={0.8}
                  style={{ borderRadius: 30 }}
                >
                  {hasSelectedProducts ? (
                    <LinearGradient
                      colors={["#6839CF", "#874DDB"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 12,
                        borderRadius: 30,
                        alignItems: "center",
                      }}
                    >
                      <Text className="text-white font-medium text-base">
                        Go to Cart
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={{
                        paddingVertical: 12,
                        borderRadius: 30,
                        alignItems: "center",
                        backgroundColor: "#B6B7BC",
                      }}
                    >
                      <Text className="text-white font-medium text-base">
                        Go to Cart
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateCustomPackage;
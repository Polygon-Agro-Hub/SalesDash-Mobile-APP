import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import LoadingPage from "../common/LoadingPage";
import CustomHeader from "../common/CustomHeader";
import { useFocusEffect } from "@react-navigation/native";

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
      customerId:string;
       name:string;
       title:string;
       number:string;
       customerscreencustomerid:string;
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
  const { id, isPackage, selectedProductIds ,customerId, name, title,number ,customerscreencustomerid} = route.params || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const apiUrl = `${environment.API_BASE_URL}api/packages/crops/all`;
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${storedToken}` },
          params: { id },
        });

        if (response.data && response.data.data) {
          setProducts(
            response.data.data.map((item: any) => ({
              ...item,
              normalPrice: parseFloat(item.normalPrice),
              discountedPrice: parseFloat(item.discountedPrice),
              startValue: parseFloat(item.startValue),
              selected: selectedProductIds?.includes(item.id) ?? false,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.category === "Retail" &&
      (searchQuery
        ? product.displayName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (product.tags &&
            product.tags.toLowerCase().includes(searchQuery.toLowerCase()))
        : true),
  );

  const toggleProductSelection = (id: number) => {
    setProducts(
      products.map((product) =>
        product.id === id
          ? { ...product, selected: !product.selected }
          : product,
      ),
    );
  };

  useFocusEffect(
  useCallback(() => {
    const currentSelectedIds = route.params?.selectedProductIds;
    if (currentSelectedIds && currentSelectedIds.length > 0) {
      setProducts((prevProducts) =>
        prevProducts.map((product) => ({
          ...product,
          selected: currentSelectedIds.includes(product.id),
        }))
      );
    }
  }, [route.params?.selectedProductIds])
);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
         navigation.navigate("Main", {
            screen: "SelectOrderType",
            params:{id ,customerId,title,name,number,customerscreencustomerid}
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

  const handleSearch = (query: string) => {
    let cleanedQuery = query;
    cleanedQuery = cleanedQuery.replace(/[^a-zA-Z0-9\s]/g, "");
    if (cleanedQuery.length > 0 && cleanedQuery[0] === " ") {
      cleanedQuery = cleanedQuery.replace(/^\s+/, "");
    }
    cleanedQuery = cleanedQuery.replace(/\s+/g, " ");

    setSearchQuery(cleanedQuery);
  };
  const hasSelectedProducts = products.some((product) => product.selected);

  const goToCart = () => {
    const selectedProducts = products
      .filter((product) => product.selected)
      .map((product) => {
        const cutId = id;

        return {
          id: product.id,
          name: product.displayName,
          price: product.discountedPrice,
          pricenoraml: product.normalPrice,
          normalPrice: product.normalPrice,
          discount: product.normalPrice - product.discountedPrice,
          discountedPrice: product.discountedPrice,
          changeby: product.changeby,
          unitType: product.unitType,
          startValue: product.startValue,
          cutId: cutId,
          isPackage: isPackage,
        };
      });

    if (selectedProducts.length > 0) {
      navigation.navigate("CratScreen" as any, {
        selectedProducts,
        id,
        isPackage,
        customerId,title,name,number,customerscreencustomerid
      });
    } else {
      alert("Please select at least one product");
    }
  };

  // formatPrice function with comma separation
  const formatPrice = (price: number) => {
    return Number(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <CustomHeader
        title="Select Custom Items"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => {
          navigation.navigate("Main", {
            screen: "SelectOrderType",
            params:{id ,customerId,title,name,number,customerscreencustomerid}
          });
        }}
      />
      <View className="flex-1 px-6">
        <View className="mb-4 bg-[#F5F1FC] rounded-full flex-row items-center px-4 py-2 mt-2">
          <TextInput
            className="flex-1 text-gray-700"
            placeholder="Search By Product Name"
            placeholderTextColor="#6839CF"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <Ionicons name="search" size={20} color="#6839CF" />
        </View>

        {/* Product List */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
            <View className="py-8 items-center justify-center mt-[20%]">
              <LottieView
                source={require("@/assets/json/no-data.json")}
                style={{ width: wp(50), height: hp(30) }}
                autoPlay
                loop
              />
              <Text className="text-gray-500">No products found</Text>
            </View>
          )}
        </ScrollView>

        {/* Go to Cart Button */}
        <View className="py-4 px-6 ">
          <View
            style={{
              borderRadius: 30,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: hasSelectedProducts ? 0.25 : 0,
              shadowRadius: 8,
              elevation: hasSelectedProducts ? 10 : 0,
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
    </KeyboardAvoidingView>
  );
};

export default CreateCustomPackage;
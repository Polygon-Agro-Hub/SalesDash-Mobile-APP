import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { useTranslation } from "react-i18next";
import BackButton from "./BackButton";
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

type CreateCustomPackageNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CreateCustomPackage"
>;

interface CreateCustomPackageProps {
  navigation: CreateCustomPackageNavigationProp;
  route: {
    params: {
      id: string;
      isCustomPackage: string;
      isSelectPackage: string;
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
  category:string;
}

const CreateCustomPackage: React.FC<CreateCustomPackageProps> = ({ navigation, route }) => {
  const { id, isCustomPackage, isSelectPackage } = route.params || {};
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
        });

        console.log(response.data)
      
        if (response.data && response.data.data) {
          setProducts(response.data.data.map((item: any) => ({
            ...item,
            normalPrice: parseFloat(item.normalPrice),
            discountedPrice: parseFloat(item.discountedPrice),
            startValue: parseFloat(item.startValue),
            selected: false
          })));
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products
  .filter(product => 
    product.category === "Retail" && 
    (searchQuery 
      ? product.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      : true)
  );

  const toggleProductSelection = (id: number) => {
    setProducts(
      products.map(product => 
        product.id === id 
          ? { ...product, selected: !product.selected } 
          : product
      )
    );
  };

 

  // Check if any products are selected
  const hasSelectedProducts = products.some(product => product.selected);

  const goToCart = () => {
    const selectedProducts = products
      .filter(product => product.selected)
      .map(product => {
        const discountedPricePerKg = product.discountedPrice;
        const normalPricePerKg = product.normalPrice;
        const cutId = id;
        
        return {
          id: product.id,
          name: product.displayName,
          price: product.discountedPrice,
          pricenoraml: product.normalPrice,
          normalPrice: product.normalPrice,
          discountedPrice: product.discountedPrice,
          changeby: product.changeby, 
          unitType: product.unitType,
          startValue: product.startValue,
          cutId: cutId,
          isSelectPackage: isSelectPackage,
          isCustomPackage: isCustomPackage
        };
      });
  
    if (selectedProducts.length > 0) {
      navigation.navigate("CratScreen" as any, { selectedProducts, id, isCustomPackage, isSelectPackage });
    } else {
      alert("Please select at least one product");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#6C3CD1" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-red-500 text-lg">{error}</Text>
        <TouchableOpacity 
          className="mt-4 bg-purple-600 px-4 py-2 rounded-full"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-4">
          {/* Header */}
          <View className="flex-row items-center h-16 shadow-md bg-white">
            <BackButton navigation={navigation} />
            <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-7">
              Select Custom Items
            </Text>
          </View>

          {/* Search Bar */}
          <View className="mb-4 bg-[#F5F1FC] rounded-full flex-row items-center px-4 py-2">
            <TextInput
              className="flex-1 text-gray-700"
              placeholder="Search By Product Name"
              placeholderTextColor="#6839CF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Ionicons name="search" size={20} color="#6839CF" />
          </View>

          {/* Product List */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const pricePerKg = product.discountedPrice;
                return (
                  <TouchableOpacity
                    key={product.id}
                    className="flex-row items-center justify-between py-3 border-b border-gray-100"
                    onPress={() => toggleProductSelection(product.id)}
                  >
                    <View>
                      <Text className="text-base font-medium text-gray-800">
                        {product.displayName}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Rs.{product.discountedPrice} per kg
                        {product.unitType.toLowerCase() === 'g' && (
                          <Text style={{fontSize: 10}}> </Text>
                        )}
                      </Text>
                    </View>
                    <View
                      className={`w-6 h-6 rounded border ${
                        product.selected ? "bg-black border-black" : "border-gray-400"
                      } justify-center items-center`}
                    >
                      {product.selected && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="py-8 items-center justify-center">
                <Text className="text-gray-500">No products found</Text>
              </View>
            )}
         
            {/* Go to Cart Button */}
            <View className="py-4 px-6 ">
              <TouchableOpacity
                onPress={goToCart}
                disabled={!hasSelectedProducts}
              >
                {hasSelectedProducts ? (
                  <LinearGradient
                    colors={["#6839CF", "#874DDB"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="py-3 rounded-full items-center"
                  >
                    <Text className="text-white font-medium text-base">Go to Cart</Text>
                  </LinearGradient>
                ) : (
                  <View className="py-3 rounded-full items-center bg-[#B6B7BC]">
                    <Text className="text-white font-medium text-base">Go to Cart</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateCustomPackage;
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Modal,
  TextInput,
  Keyboard,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import BackButton from './BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AdditionalItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  pricePerKg: number;
  totalAmount: number;
  checked: boolean;
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
  }

  interface Crop {
  id:number;
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

const OrderScreen = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('Kiwi');
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerKg, setPricePerKg] = useState<number>(100);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  
  // Package dropdown states
 const [packageOpen, setPackageOpen] = useState<boolean>(false);
  const [packageValue, setPackageValue] = useState<string>('');
  const [packageItems, setPackageItems] = useState<{label: string, value: string}[]>([]);
  const [unitOpen, setUnitOpen] = useState<boolean>(false);
const [selectedUnit, setSelectedUnit] = useState<string>('g');
//const [loading, setLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false); 

  // Product dropdown states (for modal)
const [productOpen, setProductOpen] = useState<boolean>(false);
const [productValue, setProductValue] = useState<string>('kiwi');
const [productItems, setProductItems] = useState<{
  price: string;label: string, value: string
}[]>([]);
  
  const orderData = {
    packageName: packageItems.find(item => item.value === packageValue)?.label || "Fruity Pack",
    items: [
      { category: "Herbs", count: "03" },
      { category: "Up Country Fruits", count: "04" },
      { category: "Up Country Vegetables", count: "10" },
      { category: "Low Country Fruits", count: "02" },
      { category: "Low Country Vegetables", count: "03" },
      { category: "Yams", count: "02" },
    ],
    total: "1,800.00",
    itemCount: 24
  };

  const products = ['Kiwi', 'Apple', 'Mango', 'Orange', 'Banana'];
    const [token, setToken] = useState<string | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
     const [crops, setCrops] = useState<Crop[]>([]);
  const [error, setError] = useState<string | null>(null);


  const fetchPackages = async () => {
  try {
    const storedToken = await AsyncStorage.getItem("authToken");
    if (!storedToken) {
      Alert.alert("Error", "No authentication token found");
      return;
    }
    
    setToken(storedToken);
    
    const response = await axios.get<{ data: Package[] }>(
      `${environment.API_BASE_URL}api/packages/get-packages`,
      {
        headers: { Authorization: `Bearer ${storedToken}` },
      }
    );
    
    console.log("packagedata", response.data);
    setPackages(response.data.data);
    
    // Transform packages for dropdown
    const dropdownItems = response.data.data.map(pkg => ({
      label: pkg.displayName,
      value: pkg.id.toString() // Convert ID to string as DropDownPicker expects string values
    }));
    
    setPackageItems(dropdownItems);
  
  } catch (error) {
    Alert.alert("Error", "Failed to fetch packages");
    console.error(error);
  }
};

useEffect(() => {
  fetchPackages().then(() => {

  });
}, []);


///get all cropsss

const fetchCrops = async () => {
  try {
    setLoading(true);
    setError(null);
    
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
    
    if (response.status === 200 && response.data && Array.isArray(response.data.data)) {
      // Filter only Retail items and transform for dropdown
      const retailItems = response.data.data
        .filter((item: CropItem) => item.category === "Retail")
        .map((item: { displayName: any; varietyId: { toString: () => any; }; unitType: any; discountedPrice: any; normalPrice: any; }) => ({
          label: item.displayName,
          value: item.varietyId.toString(),
          unitType: item.unitType,
          price: item.discountedPrice || item.normalPrice
        }));
      
      setCrops(retailItems);
      setProductItems(retailItems);
      
      // Set default selected product if none selected
      if (!productValue && retailItems.length > 0) {
        setProductValue(retailItems[0].value);
        setSelectedProduct(retailItems[0].label);
        setPricePerKg(parseFloat(retailItems[0].price) || 100);
      }
    } else {
      setError("Unexpected response format");
    }
  } catch (error: any) {
    console.error("Error fetching crops:", error);
    if (axios.isAxiosError(error)) {
      setError(`Request failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    } else {
      setError(error.message || "An unknown error occurred");
    }
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (productOpen) {
    fetchCrops();

  }
}, [productOpen]);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('Order confirmed!');
    }, 1500);
  };

  const handleBack = () => {
    console.log('Navigate back');
  };

  const handleAddMore = () => {
    setShowAddModal(true);
  };

  const handleSaveItem = () => {
  const selectedProductData = productItems.find(item => item.value === productValue);
  
  if (!selectedProductData) {
    Alert.alert("Error", "Please select a product");
    return;
  }

  const unit = selectedUnit === 'Kg' ? 'Kg' : 'g';
  const quantityInKg = unit === 'Kg' ? quantity : quantity / 1000;
  const totalAmount = quantityInKg * pricePerKg;

  const newItem: AdditionalItem = {
    id: Date.now(),
    name: selectedProductData.label,
    quantity: quantity,
    unit: unit,
    pricePerKg: pricePerKg,
    totalAmount: totalAmount,
    checked: true
  };

  setAdditionalItems([...additionalItems, newItem]);
  setShowAddModal(false);
  setQuantity(1);
  setPricePerKg(parseFloat(selectedProductData.price) || 100);
};

  const handleGoBack = () => {
    setShowAddModal(false);
  };

  const toggleItemCheck = (id: number) => {
    setAdditionalItems(items => 
      items.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setAdditionalItems(items => items.filter(item => item.id !== id));
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1);
  };

  function updateQuantity2(arg0: number, arg1: boolean): void {
    throw new Error('Function not implemented.');
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between  bg-white">
       <BackButton navigation={navigator} />
        <Text className="text-lg font-semibold text-purple-600">Order Details</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Package Selection */}
        <View className="mb-6" style={{ zIndex: 3000 }}>
          <Text className=" font-medium text-gray-700 mb-2 rounded-full">Package</Text>
          <DropDownPicker
           open={packageOpen}
  value={packageValue}
  items={packageItems}
  setOpen={setPackageOpen}
  setValue={setPackageValue}
  setItems={setPackageItems}
  placeholder="Select a package"
  placeholderStyle={{ color: '#9CA3AF' }}
            style={{
              backgroundColor: '#F3F4F6',
              borderColor: '#F3F4F6',
              borderRadius: 8,
              minHeight: 48,
            }}
            textStyle={{
              fontSize: 14,
             
              color: '#111827',
            }}
            dropDownContainerStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E5E7EB',
              borderRadius: 8,
            }}
            arrowIconStyle={{
              width: 20,
              height: 20,
            }}
            tickIconStyle={{
              width: 20,
              height: 20,
            }}
            labelStyle={{
              fontWeight: '500',
              color: '#111827',
            }}
          
            searchable={false}
            listMode="SCROLLVIEW"
          />
        </View>

        {/* Package Items */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-semibold text-gray-900">
              Package ({orderData.itemCount} items)
            </Text>
            <TouchableOpacity 
              onPress={handleAddMore}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="add" size={16} color="#7C3AED" />
              <Text className="text-purple-600 text-sm font-medium">Add More</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white   border-[#3F3F3F]">
            {orderData.items.map((item, index) => (
              <View 
                key={index} 
                className={`flex-row justify-between items-center py-2 px-4 ${
                  index !== orderData.items.length - 1 ? "border-b border-[#CDCDCD]" : ""
                }`}
              >
                <Text className="text-gray-800 font-medium flex-1">{item.category}</Text>
                <View className="bg-gray-50 px-2 py-1 rounded min-w-[32px] items-center">
                  <Text className="text-gray-600 font-medium text-sm">
                    {item.count}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Additional Items */}
        {additionalItems.length > 0 && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-gray-900">
                Additional ({additionalItems.filter(item => item.checked).length.toString().padStart(2, '0')} items)
              </Text>
              <TouchableOpacity>
               <Image source={require("../assets/images/trash.webp")} className="w-5 h-5 mr-1" />
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-lg border border-white">
              {additionalItems.map((item, index) => (
                <View 
                  key={item.id} 
                  className={`flex-row items-center py-4 px-4 ${
                    index !== additionalItems.length - 1 ? "border-b border-[#CDCDCD]" : ""
                  }`}
                >
                  <TouchableOpacity 
                    onPress={() => toggleItemCheck(item.id)}
                    className="mr-3"
                  >
                    <View className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      item.checked ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                    }`}>
                      {item.checked && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">{item.name}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-gray-600 text-sm">{item.quantity}{item.unit}</Text>
                    <TouchableOpacity>
                       <Image source={require("../assets/images/Edit.webp")} className="w-4 h-4" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

    

      <View className={`bg-white flex-row justify-between items-center p-4 rounded-t-3xl shadow-lg  ''}`}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 10,
                  marginTop: -10,
                }}
                >
      
                  
  
      <Text className="text-lg font-semibold text-gray-800">
        Total  :  </Text>
        <Text className="text-lg font-semibold text-[#5C5C5C] mr-[19]">
          Rs. 18000
        </Text>
      
      

         <TouchableOpacity >
            <LinearGradient 
              colors={["#6839CF", "#874DDB"]} 
              className="py-3 px-6 rounded-full"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View className="w-14 flex-row justify-center items-center" style={{ minHeight: 20 }}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white font-semibold">
                    Confirm
                  </Text>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
      
      
                </View>

      {/* Add More Modal */}
<Modal
  visible={showAddModal}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={handleGoBack}
>
    <View className="flex-1 justify-center items-center bg-[#00000066] bg-opacity-10">
      <View className="bg-white p-6 rounded-xl w-4/5">
        
        {/* Product Section */}
        <View className="mb-6" style={{ zIndex: 80000 }}>
          <Text className="text-gray-700 font-medium mb-3">Product</Text>
          <DropDownPicker
            open={productOpen}
            setOpen={setProductOpen}
            value={productValue}
            setValue={setProductValue}
            onSelectItem={(item) => {
              // Check if item and item.value exist and are not undefined
              if (item && typeof item.value === 'string' && item.label) {
                setSelectedProduct(item.label);
                // Update price based on selected product if needed
                // setPricePerKg(getProductPrice(item.value));
              }
            }}
            items={productItems}
            searchable={true}
            searchPlaceholder="Search product..."
            setItems={setProductItems}
            dropDownContainerStyle={{
              borderColor: "#F6F6F6",
              borderWidth: 1,
              backgroundColor: "#F6F6F6",
              maxHeight: 200,
              minHeight: 150,
            }}
            style={{
              borderWidth: 1,
              borderColor: "#F6F6F6",
              backgroundColor: "#F6F6F6",
              borderRadius: 15,
              paddingHorizontal: 12,
              paddingVertical: 12,
              minHeight: 52,
            }}
            textStyle={{
              fontSize: 16,
              fontWeight: '500',
              color: '#111827',
            }}
            zIndex={80000}
            listMode="SCROLLVIEW"
          />
        </View>

        {/* Price per kg Section */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-3">Price per 1kg</Text>
          <View className="bg-gray-50 rounded-xl px-4 py-4">
            <Text className="text-gray-900 font-medium text-base">Rs.{pricePerKg || '100.00'}</Text>
          </View>
        </View>

     

       <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-3">Quantity</Text>
          <View className="flex-row items-center space-x-2">
            {/* Quantity Control with +/- buttons */}
            <View className="flex-row items-center bg-gray-100 rounded-full flex-1">
              <TouchableOpacity 
                className="w-10 h-10 flex items-center justify-center"
                onPress={decrementQuantity}
              >
                <Text className="text-gray-700 text-xl font-bold">-</Text>
              </TouchableOpacity>
              
              <Text className="flex-1 text-center text-gray-700">
                {quantity || "0"}
              </Text>
              
              <TouchableOpacity 
                className="w-10 h-10 flex items-center justify-center"
                onPress={incrementQuantity}
              >
                <Text className="text-gray-700 text-xl font-bold">+</Text>
              </TouchableOpacity>
            </View>
            
            {/* Unit dropdown */}
            <DropDownPicker
              open={unitOpen}
              setOpen={setUnitOpen}
              value={selectedUnit}
              setValue={setSelectedUnit}
              onSelectItem={(item) => {
                if (item && item.value) {
                  setSelectedUnit(item.value);
                }
              }}
              items={[
                { label: "Kg", value: "Kg" },
                { label: "g", value: "g" }
              ]}
              dropDownDirection="BOTTOM"
              containerStyle={{ width: 100 }}
              style={{
                backgroundColor: "#F6F6F6",
                borderColor: "#F6F6F6",
                borderRadius: 50,
                paddingHorizontal: 10,
              }}
              dropDownContainerStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#FFFFFF",
              }}
              zIndex={70000}
            />
          </View>
        </View>


        {/* Total Amount Section */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-3">Total Amount</Text>
          <View className="bg-gray-50 rounded-xl px-4 py-4">
            <Text className="text-gray-900 font-bold text-lg">Rs.{((quantity || 500) * (pricePerKg || 100) / 1000).toFixed(2)}</Text>
          </View>
        </View>

        {/* Discount Message */}
        <View className="mb-8">
          <Text className="text-purple-600 text-center text-sm font-medium">
            You received a discount of Rs.5.00 for this product
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          <TouchableOpacity 
            onPress={handleGoBack}
            className="bg-gray-200 py-4 rounded-full items-center"
          >
            <Text className="text-gray-700 font-semibold text-base">Go Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSaveItem}
            className="bg-purple-600 py-4 rounded-full items-center"
          >
            <Text className="text-white font-semibold text-base">Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>

</Modal>
    </SafeAreaView>
  );
};

export default OrderScreen;
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
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import BackButton from './BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";

type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderScreen">;

interface OrderScreenProps {
  navigation: OrderScreenNavigationProp;
  route: {
    params: {
      id: string; 
      isPackage:string;
    };
  };
}

interface ProductItem {
  label: string;
  discount: string;
  value: string; // This is varietyId
  id: number;    // Add this for marketplaceitems.id
  price: string;
  discountedPrice?: string;
  unitType?: string;
}

interface AdditionalItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  pricePerKg: number;
  discountedPricePerKg: number; // Add this
  discount: number; // Add this
  totalAmount: number;
  selected: boolean;
}


// interface ProductItem {
//   label: string;
//   discount:string;
//   value: string;
//   price: string;
//   discountedPrice?: string; // Make this optional
//   unitType?: string;
// }

interface Package {
    id: number;
    packageId: number; 
    displayName: string;
    price: string;
    description: string;
    portion: string;
    period: string;
    total: number;
    packingFee:string;
    productPrice: string;
    serviceFee:string
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

const OrderScreen: React.FC<OrderScreenProps> = ({ route, navigation }) => {
   const { id, isPackage } = route.params || {};
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerKg, setPricePerKg] = useState<number>(0);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  // Edit Modal States
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AdditionalItem | null>(null);
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [editUnitOpen, setEditUnitOpen] = useState<boolean>(false);
  const [editSelectedUnit, setEditSelectedUnit] = useState<string>('g');

  // Package dropdown states
  const [packageOpen, setPackageOpen] = useState<boolean>(false);
  const [packageValue, setPackageValue] = useState<string>('');
  const [packageItems, setPackageItems] = useState<{label: string, value: string}[]>([]);
  const [unitOpen, setUnitOpen] = useState<boolean>(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('g');

  const [items, setItems] = useState<{ name: string; qty: string}[]>([]);
const [selectedItems, setSelectedItems] = useState<number[]>([]);
  // Product dropdown states (for modal)
  const [productOpen, setProductOpen] = useState<boolean>(false);
  const [productValue, setProductValue] = useState<string>('kiwi');
  // const [productItems, setProductItems] = useState<{
  //   price: string;label: string, value: string
  // }[]>([]);
  const [ discountprice, setDiscountprice] = useState('')
  // Remove hardcoded orderData - we'll use dynamic data instead
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packageTotal, setPackageTotal] = useState<string>('0.00');
const [open, setOpen] = useState(false); // For edit modal dropdown
  const products = ['Kiwi', 'Apple', 'Mango', 'Orange', 'Banana'];
  const [token, setToken] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [itemDetails, setItemDetails] = useState<{
  id?: number;
  mpItemId?: string;
  changeby?: string;
  startValue?: string;
  unitType?: string;
  discountedPrice?: string;
  normalPrice?: string;
  displayName?: string;
  } | null>(null);

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
        value: pkg.id.toString()
      }));
      
      setPackageItems(dropdownItems);
    
    } catch (error) {
      Alert.alert("Error", "Failed to fetch packages");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);


  console.log("ispackage--------", isPackage)

  // Modified fetchItemsForPackage function
  const fetchItemsForPackage = async (packageId: number) => {
  try {
    const storedToken = await AsyncStorage.getItem("authToken");
    if (!storedToken) {
      Alert.alert("Error", "No authentication token found");
      return;
    }

    const response = await axios.get<{ data: { name: string; qty: string }[] }>(
      `${environment.API_BASE_URL}api/packages/${packageId}/items`,
      {
        headers: { Authorization: `Bearer ${storedToken}` },
      }
    );

    if (response.data && Array.isArray(response.data.data)) {
      setItems(response.data.data);  
      console.log("Items state updated:", response.data.data);
      
      // Find and set the selected package
      const selectedPkg = packages.find(pkg => pkg.id === packageId);
      if (selectedPkg) {
        setSelectedPackage(selectedPkg);
        
        // Calculate total from all package fees instead of using the total field
        const packingFee = parseFloat(selectedPkg.packingFee) || 0;
        const productPrice = parseFloat(selectedPkg.productPrice) || 0;
        const serviceFee = parseFloat(selectedPkg.serviceFee) || 0;
        const calculatedTotal = packingFee + productPrice + serviceFee;
        
        setPackageTotal(calculatedTotal.toString());
        
        console.log('Package selected:', {
          name: selectedPkg.displayName,
          packingFee,
          productPrice,
          serviceFee,
          calculatedTotal
        });
      } else {
        console.log("Package not found in packages array");
        setSelectedPackage(null);
        setPackageTotal('0.00');
      }
    } else {
      console.log("No items found for this package or unexpected response format");
      setItems([]);
      setSelectedPackage(null);
      setPackageTotal('0.00');
    }
  } catch (error) {
    console.error("Error fetching items:", error);
    setError("Failed to fetch items for the package");
    Alert.alert("Error", "Failed to fetch items for the package");
    setItems([]);
    setSelectedPackage(null);
    setPackageTotal('0.00');
  }
};

  // Handle package selection change - IMPROVED VERSION
  const handlePackageChange = (value: string | null) => {
    if (value) {
      setPackageValue(value);
      const packageId = parseInt(value, 10);
      if (!isNaN(packageId)) {
        // Only fetch items if packages array is populated
        if (packages.length > 0) {
          fetchItemsForPackage(packageId);
        } else {
          console.log("Packages not loaded yet, waiting...");
          // You might want to add a loading state here
          setItems([]);
          setSelectedPackage(null);
          setPackageTotal('0.00');
        }
      } else {
        console.error("Invalid package ID:", value);
        setItems([]);
        setSelectedPackage(null);
        setPackageTotal('0.00');
      }
    } else {
      setPackageValue('');
      setItems([]);
      setSelectedPackage(null);
      setPackageTotal('0.00');
    }
  };

  // Alternative: Use useEffect to handle package selection after packages are loaded
  useEffect(() => {
    if (packageValue && packages.length > 0) {
      const packageId = parseInt(packageValue, 10);
      if (!isNaN(packageId) && !selectedPackage) {
        fetchItemsForPackage(packageId);
      }
    }
  }, [packages, packageValue]);

//   const fetchCrops = async () => {
//   try {
//     setLoading(true);
//     setError(null);
    
//     const storedToken = await AsyncStorage.getItem("authToken");
//     if (!storedToken) {
//       setError("No authentication token found");
//       setLoading(false);
//       return;
//     }
    
//     const apiUrl = `${environment.API_BASE_URL}api/packages/crops/all`;
    
//     const response = await axios.get(apiUrl, {
//       headers: { Authorization: `Bearer ${storedToken}` },
//     });
    
//     if (response.status === 200 && response.data && Array.isArray(response.data.data)) {
//       // Filter only Retail items and transform for dropdown
//       const retailItems = response.data.data
//         .filter((item: CropItem) => item.category === "Retail")
//         .map((item: CropItem) => ({
//           label: item.displayName,
//           value: item.varietyId.toString(),
//           unitType: item.unitType,
//           price: item.normalPrice, // Use normalPrice here
//           discountedPrice: item.discountedPrice, // Use discountedPrice here
//           discount: (parseFloat(item.normalPrice) - parseFloat(item.discountedPrice)).toFixed(2) // Calculate discount amount
//         }));
      
//       setProductItems(retailItems);
      
//       // Set default selected product if none selected
//       if (!productValue && retailItems.length > 0) {
//         setProductValue(retailItems[0].value);
//         setSelectedProduct(retailItems[0].label);
//         const priceToUse = retailItems[0].discountedPrice || retailItems[0].price;
//         setPricePerKg(parseFloat(priceToUse) || 100);
//         setDiscountprice(retailItems[0].discount); // Set the calculated discount
//       }
//     } else {
//       setError("Unexpected response format");
//     }
//   } catch (error: any) {
//     console.error("Error fetching crops:", error);
//     if (axios.isAxiosError(error)) {
//       setError(`Request failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
//     } else {
//       setError(error.message || "An unknown error occurred");
//     }
//   } finally {
//     setLoading(false);
//   }
// };

const fetchCrops = async () => {
  try {
    setLoading(true);
    const response = await axios.get(`${environment.API_BASE_URL}api/packages/crops/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const retailItems = response.data.data
      .filter((item: CropItem) => item.category === "Retail")
      .map((item: CropItem) => ({
        label: item.displayName,
        value: item.varietyId.toString(),
        id: item.id, // Add marketplaceitems.id here
        unitType: item.unitType,
        price: item.normalPrice,
        discountedPrice: item.discountedPrice,
        discount: (parseFloat(item.normalPrice) - parseFloat(item.discountedPrice)).toFixed(2)
      }));

    setProductItems(retailItems);
  } catch (error) {
    console.error("Error fetching crops:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (productOpen) {
      fetchCrops();
    }
  }, [productOpen]);

  // const handleConfirm = () => {
  //   setLoading(true);
  //   setTimeout(() => {
  //     setLoading(false);
  //     console.log('Order confirmed!');
  //   }, 1500);
  // };



//   const handleConfirm = async () => {
//   setLoading(true);
  
//   try {
//     // Get user ID from storage
   

//     // Prepare the data object
//     const orderData = {
//       userId : id,
//       isPackage: isPackage === "1" ? 1 : 0, // Convert to number
//       packageId: packageValue ? parseInt(packageValue) : null,
//       total: parseFloat(calculateGrandTotal()),
//       fullTotal: parseFloat(calculateGrandTotal()), // Adjust if you have a different full total
//       discount: 0, // Calculate your discount if applicable
//       additionalItems: additionalItems.map(item => ({
//         productId: parseInt(productItems.find(p => p.label === item.name)?.value || "0"),
//         qty: item.quantity,
//         unit: item.unit.toLowerCase(), // Ensure it's 'kg' or 'g'
//         price: item.pricePerKg,
//         discount: item.discount
//       }))
//     };

//     console.log("Order data to pass:", orderData);

//     // Navigate to ScheduleScreen with the order data
//     navigation.navigate("ScheduleScreen", { orderData } as any);
    
//   } catch (error) {
//     console.error("Error confirming order:", error);
//     Alert.alert("Error", "Failed to process order");
//   } finally {
//     setLoading(false);
//   }
// };



// In your OrderScreen's handleConfirm function:
const handleConfirm = async () => {
  setLoading(true);
  
  try {
    const orderData = {
      userId: id,
      isPackage: isPackage === "1" ? 1 : 0,
      packageId: packageValue ? parseInt(packageValue) : null,
      total: parseFloat(calculateGrandTotal()),
      fullTotal: parseFloat(calculateGrandTotal()),
      discount: additionalItems.reduce((sum, item) => sum + item.discount, 0),
      additionalItems: additionalItems.map(item => {
        const product = productItems.find(p => p.label === item.name);
        return {
          productId: product ? product.id : 0, // Now using marketplaceitems.id
          qty: item.quantity,
          unit: item.unit.toLowerCase(),
          price: item.discountedPricePerKg * item.quantity,
          discount: item.discount
        };
      })
    };

    navigation.navigate("ScheduleScreen" as any, { 
      orderData ,
      customerid: id,
      isPackage
    });
    
  } catch (error) {
    console.error("Error confirming order:", error);
    Alert.alert("Error", "Failed to process order");
  } finally {
    setLoading(false);
  }
};


  const handleBack = () => {
    console.log('Navigate back');
  };

  const handleAddMore = () => {
    setShowAddModal(true);
  };

 
const calculateDiscountForQuantity = () => {
  const selectedProductData = productItems.find(item => item.value === productValue);
  if (!selectedProductData) return 0;
  
  const normalPrice = parseFloat(selectedProductData.price);
  const discountedPrice = selectedProductData.discountedPrice 
    ? parseFloat(selectedProductData.discountedPrice) 
    : normalPrice;
  
  const discountPerKg = normalPrice - discountedPrice;
  const quantityInKg = selectedUnit === 'Kg' ? quantity : quantity / 1000;
  
  return (discountPerKg * quantityInKg).toFixed(2);
};


 const calculateGrandTotal = () => {
  let packageTotalAmount = 0;
  
  if (selectedPackage) {
    const packingFee = parseFloat(selectedPackage.packingFee) || 0;
    const productPrice = parseFloat(selectedPackage.productPrice) || 0;
    const serviceFee = parseFloat(selectedPackage.serviceFee) || 0;
    packageTotalAmount = packingFee + productPrice + serviceFee;
  }
  
  const additionalItemsTotal = additionalItems
    .filter(item => !selectedItems.includes(item.id)) // Exclude selected items
    .reduce((total, item) => {
      const quantityInKg = item.unit === 'Kg' ? item.quantity : item.quantity / 1000;
      const itemTotal = quantityInKg * item.discountedPricePerKg;
      return total + itemTotal;
    }, 0);
  
  return (packageTotalAmount + additionalItemsTotal).toFixed(2);
};

// Update the handleSaveItem function
const handleSaveItem = () => {
  const selectedProductData = productItems.find(item => item.value === productValue);
  
  if (!selectedProductData) {
    Alert.alert("Error", "Please select a product");
    return;
  }

  const unit = selectedUnit === 'Kg' ? 'Kg' : 'g';
  const quantityInKg = unit === 'Kg' ? quantity : quantity / 1000;
  
  // Get both normal and discounted prices
  const normalPrice = parseFloat(selectedProductData.price);
  const discountedPrice = selectedProductData.discountedPrice 
    ? parseFloat(selectedProductData.discountedPrice) 
    : normalPrice;
  const discountPerKg = normalPrice - discountedPrice;
  const totalDiscountForQuantity = discountPerKg * quantityInKg;
  
  const totalAmount = quantityInKg * discountedPrice;
 
  const newItem: AdditionalItem = {
    id: parseInt(id),
    name: selectedProductData.label,
    quantity: quantity,
    unit: unit,
    pricePerKg: normalPrice,
    discountedPricePerKg: discountedPrice,
    discount: totalDiscountForQuantity, // Store total discount for this quantity
    totalAmount: totalAmount,
    selected: false
  };

  setAdditionalItems([...additionalItems, newItem]);

  console.log("===========", selectedProductData);
  console.log("Total discount for quantity:", totalDiscountForQuantity);
  
  setShowAddModal(false);
  setQuantity(1);
  setSelectedUnit('g');
  setPricePerKg(discountedPrice);
};



  const handleGoBack = () => {
    setShowAddModal(false);
  };
  console.log("dissssssssssssssss",discountprice)

 const toggleItemSelection = (id: number) => {
  setSelectedItems(prev => {
    if (prev.includes(id)) {
      return prev.filter(itemId => itemId !== id);
    } else {
      return [...prev, id];
    }
  });
};

// 3. Delete selected items function
const deleteSelectedItems = () => {
  setAdditionalItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
  setSelectedItems([]); // Clear selection after deletion
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

  // Edit Modal Functions
  const handleEditItem = (item: AdditionalItem) => {
    setEditingItem(item);
    setNewItemQuantity(item.quantity);
    setEditSelectedUnit(item.unit);
    setModalVisible(true);
  };

  const updateQuantity = (changeBy: number, increase: boolean) => {
    if (increase) {
      setNewItemQuantity(prev => prev + changeBy);
    } else {
      setNewItemQuantity(prev => Math.max(changeBy, prev - changeBy));
    }
  };

  const handleUnitChange = (unit: string) => {
    setEditSelectedUnit(unit);
  };

  const saveUpdatedItem = () => {
    if (!editingItem) return;

    const unit = editSelectedUnit;
    const quantityInKg = unit === 'Kg' ? newItemQuantity : newItemQuantity / 1000;
    const totalAmount = quantityInKg * editingItem.pricePerKg;

    const updatedItem: AdditionalItem = {
      ...editingItem,
      quantity: newItemQuantity,
      unit: unit,
      totalAmount: totalAmount
    };

    setAdditionalItems(items => 
      items.map(item => 
        item.id === editingItem.id ? updatedItem : item
      )
    );

  

    setModalVisible(false);
    setEditingItem(null);
  };

  // Calculate total items count
  const getTotalItemsCount = () => {
    return items.reduce((total, item) => {
      const qty = parseInt(item.qty) || 0;
      return total + qty;
    }, 0);
  };

//   // Calculate grand total - ADD SAFETY CHECKS
//  const calculateGrandTotal = () => {
//   let packageTotalAmount = 0;
  
//   if (selectedPackage) {
//     const packingFee = parseFloat(selectedPackage.packingFee) || 0;
//     const productPrice = parseFloat(selectedPackage.productPrice) || 0;
//     const serviceFee = parseFloat(selectedPackage.serviceFee) || 0;
//     packageTotalAmount = packingFee + productPrice + serviceFee;
//   }
  
//   const additionalItemsTotal = additionalItems
//     .filter(item => !selectedItems.includes(item.id)) // Exclude selected items
//     .reduce((total, item) => {
//       const quantityInKg = item.unit === 'Kg' ? item.quantity : item.quantity / 1000;
//       const itemTotal = quantityInKg * item.pricePerKg;
//       return total + itemTotal;
//     }, 0);
  
//   return (packageTotalAmount + additionalItemsTotal).toFixed(2);
// };



  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
                               behavior={Platform.OS === "ios" ? "padding" : "height"}
                               enabled 
                               className="flex-1"
                             >
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between bg-white">
       <BackButton navigation={navigation} />
        <Text className="text-lg font-semibold text-purple-600">Order Details</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Package Selection */}
        <View className="mb-6" style={{ zIndex: 3000 }}>
          <Text className="font-medium text-gray-700 mb-2 rounded-full">Package</Text>
          <DropDownPicker
            open={packageOpen}
            value={packageValue}
            items={packageItems}
            setOpen={setPackageOpen}
            setValue={setPackageValue}
            setItems={setPackageItems}
            onChangeValue={handlePackageChange}
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

        {/* Package Items - Now using dynamic data */}
        {items.length > 0 && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-gray-900">
                Package ({getTotalItemsCount()} items)
              </Text>
              <TouchableOpacity 
                onPress={handleAddMore}
                className="flex-row items-center gap-1"
              >
                <Ionicons name="add" size={16} color="#7C3AED" />
                <Text className="text-purple-600 text-sm font-medium">Add More</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white border-[#3F3F3F]">
              {items.map((item, index) => (
                <View 
                  key={index} 
                  className={`flex-row justify-between items-center py-2 px-4 ${
                    index !== items.length - 1 ? "border-b border-[#CDCDCD]" : ""
                  }`}
                >
                  <Text className="text-gray-800 font-medium flex-1">{item.name}</Text>
                  <View className="bg-gray-50 px-2 py-1 rounded min-w-[32px] items-center">
                    <Text className="text-gray-600 font-medium text-sm">
                      {item.qty}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Show message when no package is selected */}
        {items.length === 0 && packageValue === '' && (
          <View className="items-center justify-center mt-[50%]">
      <Image 
        source={require("../assets/images/nopackage.webp")} 
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
        Additional ({additionalItems.length} items)
      </Text>
      
      {/* Show delete icon only when items are selected */}
      {selectedItems.length > 0 && (
        <TouchableOpacity 
          onPress={deleteSelectedItems}
          className="p-2"
        >
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
            index !== additionalItems.length - 1 ? "border-b border-[#CDCDCD]" : ""
          } ${selectedItems.includes(item.id) ? "bg-white" : "bg-white"}`}
        >
          {/* Checkbox icon */}
          <Ionicons 
            name={selectedItems.includes(item.id) ? "checkbox" : "checkbox-outline"} 
            size={20} 
            color={selectedItems.includes(item.id) ? "#7C3AED" : "#9CA3AF"} 
            className="mr-3"
          />
          
          {/* Item details */}
          <View className="flex-1 ml-2">
            <Text className="text-gray-800 font-medium">{item.name}</Text>
            
          </View>
          
          {/* Quantity and edit button */}
          <View className="flex-row items-center gap-3">
            <Text className="text-gray-600 text-sm font-medium">
              {item.quantity}{item.unit}
            </Text>
            
        
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                handleEditItem(item);
              }}
            >
              <Image 
                source={require("../assets/images/Edit.webp")} 
                className="w-4 h-4" 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)}
 
      </ScrollView>

      {/* Bottom Total Section */}
      <View className={`bg-white flex-row justify-between items-center p-4 rounded-t-3xl shadow-lg`}
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
      Grand Total:
    </Text>
    <Text className="text-lg font-semibold text-purple-600">
      Rs. {calculateGrandTotal()}
    </Text>

        <TouchableOpacity onPress={handleConfirm}>
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
        <Text className="text-gray-700  mb-3">Product</Text>
        <DropDownPicker
          open={productOpen}
          setOpen={setProductOpen}
          value={productValue}
          setValue={setProductValue}
          onSelectItem={(item) => {
            if (item && typeof item.value === 'string' && item.label) {
              setSelectedProduct(item.label);
              // Update price based on selected product
              const selectedItem = productItems.find(p => p.value === item.value);
              if (selectedItem) {
                const discountedPrice = selectedItem.discountedPrice 
                  ? parseFloat(selectedItem.discountedPrice) 
                  : parseFloat(selectedItem.price);
                setPricePerKg(discountedPrice);
              }
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
            fontSize: 14,
            color: '#111827',
          }}
          zIndex={80000}
          listMode="SCROLLVIEW"
        />
      </View>

      {/* Price per kg Section - Show discounted price */}
      <View className="mb-6">
        <Text className="text-gray-700  mb-3">Price per 1kg</Text>
        <View className="bg-gray-50 rounded-xl px-4 py-4">
          <Text className="text-gray-900">Rs.{pricePerKg || '100.00'}</Text>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-gray-700  mb-3">Quantity</Text>
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

      {/* Total Amount Section - Show discounted total */}
      <View className="mb-6">
        <Text className="text-gray-700  mb-3">Total Amount</Text>
        <View className="bg-gray-50 rounded-xl px-4 py-4">
          <Text className="text-gray-900">
            Rs.{((selectedUnit === 'Kg' ? quantity : quantity / 1000) * pricePerKg).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Dynamic Discount Message */}
      <View className="mb-8">
        <Text className="text-purple-600 text-center text-sm font-medium">
          You received a discount of Rs.{calculateDiscountForQuantity()} for this product
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

      {/* Edit Item Modal */}
{/* Edit Item Modal */}
<Modal visible={modalVisible} transparent animationType="slide">
  <View className="flex-1 justify-center items-center bg-[#00000066] bg-opacity-10">
    <View className="bg-white p-6 rounded-xl w-4/5">
      <Text className="text-gray-700 mb-2">Product</Text>
      <TextInput
        className="bg-gray-100 p-3 rounded-full mb-3 text-gray-700"
        value={editingItem?.name}
        editable={false}
      />
      
      {/* Quantity and Unit Selector */}
      <View>
        <Text className="text-gray-700 mb-2">Quantity</Text>
        <View className="flex-row items-center space-x-2">
          {/* Quantity Control with +/- buttons */}
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
          
          {/* Unit dropdown */}
          <DropDownPicker
            open={editUnitOpen}
            setOpen={setEditUnitOpen}
            value={editSelectedUnit}
            setValue={setEditSelectedUnit}
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
          />
        </View>
      </View>
      
      {/* Total Amount Section */}
      <View className="mb-6 mt-4">
        <Text className="text-gray-700 font-medium mb-3">Total Amount</Text>
        <View className="bg-gray-50 rounded-xl px-4 py-4">
          <Text className="text-gray-900 font-bold text-lg">
            Rs.{(
              (editSelectedUnit === 'Kg' ? newItemQuantity : newItemQuantity / 1000) * 
              (editingItem?.pricePerKg || 0)
            ).toFixed(2)}
          </Text>
        </View>
      </View>
      
      {/* Buttons */}
      <View className="gap-3">
        <TouchableOpacity
          className="bg-gray-300 py-3 rounded-full items-center justify-center"
          onPress={() => setModalVisible(false)}
        >
          <Text className="text-gray-700 font-semibold text-center">Go Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-purple-700 py-3 rounded-full items-center justify-center"
          onPress={saveUpdatedItem}
        >
          <Text className="text-white font-semibold text-center">Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OrderScreen;


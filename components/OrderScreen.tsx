import React, { useCallback, useEffect, useState } from 'react';
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
import { RouteProp, useFocusEffect } from '@react-navigation/native';

type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderScreen">;
type OrderScreenRouteProp = RouteProp<RootStackParamList, "OrderScreen">;

// interface OrderScreenProps {
//   navigation: OrderScreenNavigationProp;
//   route: {
//     params: {
//       id: string; 
//       isPackage:string;
//     };
//   };
// }

interface ProductItem {
  changeby(changeby: any): unknown;
  startValue: ProductItem | undefined;
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
      additionalItems?: Array<{
        pricePerKg(pricePerKg: any): any;
        discountedPricePerKg(discountedPricePerKg: any): any;
        totalPrice: number;
        mpItemId: any;
        productId: any;
        id: number;
        name: string;
        quantity: string;
        quantityType: string;
        price: number;
        discount: string;
        cropId: number;
      }>;
      orderItems?: any[]; // Add this
      subtotal?: number;
      discount?: number;
      total?: number;
      fullTotal?: number;
      selectedDate?: string;
      selectedTimeSlot?: string;
      timeDisplay?: string;
      paymentMethod?: string;
      isEdit?: boolean;
    };
  };
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


useFocusEffect(
  useCallback(() => {

    setSelectedItems([]); 
    setSelectedProduct("");
  
  }, [])
);

useEffect(() => {
  if (showAddModal) {
    // Reset all form fields when modal opens
    setProductValue("null");
    setSelectedProduct('');
    setPricePerKg(0);
    setQuantity(0);
    setSelectedUnit('Kg');
    setProductOpen(false);
    setUnitOpen(false);
  }
}, [showAddModal]);


   // In OrderScreen.tsx, update the useEffect for handling initial data:
const fetchProductPrices = useCallback(async (productIds: number[]) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken || productIds.length === 0) return {};
      
      const response = await axios.get(`${environment.API_BASE_URL}api/packages/crops/all`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      const productPrices: Record<string, { normalPrice: number; discountedPrice: number; displayName: string }> = {};
      
      response.data.data.forEach((item: any) => {
        if (productIds.includes(item.id)) {
          productPrices[item.id.toString()] = {
            normalPrice: parseFloat(item.normalPrice) || 0,
            discountedPrice: parseFloat(item.discountedPrice) || parseFloat(item.normalPrice) || 0,
            displayName: item.displayName || `Item ${item.id}`
          };
        }
      });
      
      return productPrices;
    } catch (error) {
      console.error("Error fetching product prices:", error);
      return {};
    }
  }, []);

  // Separate useEffect for initializing additional items
  useEffect(() => {
    const initializeAdditionalItems = async () => {
      if (route.params?.isEdit && route.params?.additionalItems) {
        const productIds = route.params.additionalItems.map(item => item.productId).filter(Boolean);
        const productPrices = await fetchProductPrices(productIds);
        
        const mappedAdditionalItems = route.params.additionalItems.map((item, index) => {
          const productId = item.productId || item.mpItemId || item.cropId;
          const quantity = parseInt(item.quantity) || 1;
          const unit = item.quantityType === 'kg' ? 'Kg' : 'g';
          const quantityInKg = unit === 'Kg' ? quantity : quantity / 1000;
          
          // Get correct prices from API or fallback to passed data
          const productPrice = productPrices[productId.toString()];
          let pricePerKg, discountedPricePerKg, discountAmount, displayName;
          
          if (productPrice) {
            // Use API prices (most accurate)
            pricePerKg = productPrice.normalPrice;
            discountedPricePerKg = productPrice.discountedPrice;
            discountAmount = (pricePerKg - discountedPricePerKg) * quantityInKg;
            displayName = productPrice.displayName;
          } else if (item.pricePerKg && item.discountedPricePerKg) {
            // Use per-kg prices if provided
            pricePerKg = Number(item.pricePerKg) || 0;
            discountedPricePerKg = Number(item.discountedPricePerKg) || 0;
            discountAmount = (pricePerKg - discountedPricePerKg) * quantityInKg;
            displayName = item.name;
          } else {
            // Fallback: calculate from total prices
            const totalPrice = Number(item.price || item.totalPrice) || 0;
            const totalDiscount = parseFloat(item.discount) || 0;
            
            discountedPricePerKg = quantityInKg > 0 ? totalPrice / quantityInKg : 0;
            const discountPerKg = quantityInKg > 0 ? totalDiscount / quantityInKg : 0;
            pricePerKg = discountedPricePerKg + discountPerKg;
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
            selected: false
          };
        });
        
        setAdditionalItems(mappedAdditionalItems);
      }
    };

    initializeAdditionalItems();
  }, [route.params?.isEdit, route.params?.additionalItems, fetchProductPrices]);

  // Main useEffect for handling initial data
  useEffect(() => {
    if (route.params?.isEdit && route.params?.packageId) {
      // Set the package value from route params
      setPackageValue(route.params.packageId.toString());
      
      // Initialize package items if they exist
      if (route.params.packageItems) {
        const mappedPackageItems = route.params.packageItems.map(item => ({
          name: item.name,
          qty: item.quantity
        }));
        setItems(mappedPackageItems);
      }
      
      // Find and set the selected package
      if (route.params.packageId && packages.length > 0) {
        const selectedPkg = packages.find(pkg => pkg.id === route.params.packageId);
        if (selectedPkg) {
          setSelectedPackage(selectedPkg);
          const packingFee = parseFloat(selectedPkg.packingFee) || 0;
          const productPrice = parseFloat(selectedPkg.productPrice) || 0;
          const serviceFee = parseFloat(selectedPkg.serviceFee) || 0;
          setPackageTotal((packingFee + productPrice + serviceFee).toString());
        }
      }
    }
  }, [route.params?.isEdit, route.params?.packageId, route.params?.packageItems, packages]);




  const handleConfirm = useCallback(async () => {
  setLoading(true);
  
  try {
    // Calculate package total if a package is selected
    let packageTotalAmount = 0;
    if (packageValue && selectedPackage) {
      const packingFee = parseFloat(selectedPackage.packingFee) || 0;
      const productPrice = parseFloat(selectedPackage.productPrice) || 0;
      const serviceFee = parseFloat(selectedPackage.serviceFee) || 0;
      packageTotalAmount = packingFee + productPrice + serviceFee;
    }

    const orderData = {
      userId: route.params?.id,
      isPackage: isPackage === "1" ? 1 : 0,
      packageId: packageValue ? parseInt(packageValue) : null,
      total: packageTotalAmount + additionalItems.reduce((sum, item) => sum + item.totalAmount, 0),
      fullTotal: packageTotalAmount + additionalItems.reduce((sum, item) => sum + item.totalAmount, 0),
      discount: additionalItems.reduce((sum, item) => sum + item.discount, 0),
      additionalItems: additionalItems.map(item => ({
        productId: item.id,
        qty: item.quantity,
        unit: item.unit.toLowerCase(),
        price: item.discountedPricePerKg * (item.unit === 'Kg' ? item.quantity : item.quantity / 1000),
        discount: item.discount
      }))
    };

    console.log("orderData--------", orderData);
    
    navigation.navigate("ScheduleScreen" as any, { 
      orderData,
      customerid: route.params?.id,
      isPackage
    });
    
  } catch (error) {
    console.error("Error confirming order:", error);
    Alert.alert("Error", "Failed to process order");
  } finally {
    setLoading(false);
  }
}, [isPackage, packageValue, additionalItems, navigation, route.params?.id, selectedPackage]);

  // Updated handleSaveItem function with dynamic quantity initialization
  const handleSaveItem = useCallback(() => {
  const selectedProductData = productItems.find(item => item.value === productValue);
  
  if (!selectedProductData) {
    Alert.alert("Error", "Please select a product");
    return;
  }

  // Check if this product is already in additionalItems
  const isProductAlreadyAdded = additionalItems.some(item => item.id === selectedProductData.id);
  
  if (isProductAlreadyAdded) {
    Alert.alert("Error", "This product is already added");
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
 
  const newItem = {
    id: selectedProductData.id || Date.now(), // Use product ID or timestamp as fallback
    name: selectedProductData.label,
    quantity: quantity,
    unit: unit,
    pricePerKg: normalPrice,
    discountedPricePerKg: discountedPrice,
    discount: totalDiscountForQuantity,
    totalAmount: totalAmount,
    selected: false
  };

  setAdditionalItems(prev => [...prev, newItem]);
  setShowAddModal(false);
  setQuantity(1);
  setSelectedUnit('g');
  setPricePerKg(discountedPrice);
}, [productItems, productValue, selectedUnit, quantity, additionalItems]);

const availableProducts = productItems.filter(
  item => !additionalItems.some(addedItem => addedItem.id === item.id)
);
const productDropdownItems = productItems.map(item => ({
  ...item,
  disabled: additionalItems.some(addedItem => addedItem.id === item.id)
}));

 

  // Modify fetchItemsForPackage to handle pre-selected package
  const fetchItemsForPackage = async (packageId: number) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await axios.get<{ data: { name: string; qty: string }[] }>(
        `${environment.API_BASE_URL}api/packages/${packageId}/items`,
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );

      if (response.data && Array.isArray(response.data.data)) {
        setItems(response.data.data);
        
        // Find and set the selected package
        const selectedPkg = packages.find(pkg => pkg.id === packageId);
        if (selectedPkg) {
          setSelectedPackage(selectedPkg);
          
          // Calculate total from all package fees
          const packingFee = parseFloat(selectedPkg.packingFee) || 0;
          const productPrice = parseFloat(selectedPkg.productPrice) || 0;
          const serviceFee = parseFloat(selectedPkg.serviceFee) || 0;
          const calculatedTotal = packingFee + productPrice + serviceFee;
          
          setPackageTotal(calculatedTotal.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      Alert.alert("Error", "Failed to fetch items for the package");
    }
  };

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
      
      //console.log("packagedata", response.data);
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


 // console.log("ispackage--------", isPackage)

  useEffect(() => {
  console.log("Route params received:", route.params);
}, [route.params]);

 

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
        discount: (parseFloat(item.normalPrice) - parseFloat(item.discountedPrice)).toFixed(2),
        // Add new fields for dynamic quantity handling
        changeby: item.changeby || '1',
        startValue: item.startValue || '1',
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

 



  const handleBack = () => {
    console.log('Navigate back');
  };

  const handleAddMore = () => {
    setShowAddModal(true);
    // Reset quantity to startValue when opening modal
    const selectedProductData = productItems.find(item => item.value === productValue);
    if (selectedProductData && selectedProductData.startValue) {
      setQuantity(Number(selectedProductData.startValue));
    } else {
      setQuantity(1);
    }
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





  // const handleGoBack = () => {
  //   setShowAddModal(false);
  // };
  const handleGoBack = () => {
  setShowAddModal(false);
  setProductValue('');
  setSelectedProduct('');
};
  //console.log("dissssssssssssssss",discountprice)

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

  // Updated increment function with dynamic changeBy value
  // const incrementQuantity = () => {
  //   const selectedProductData = productItems.find(item => item.value === productValue);
  //   const changeBy = selectedProductData?.changeby ? Number(selectedProductData.changeby) : 1;
    
  //   // Adjust changeBy based on unit type
  //   const adjustedChangeBy = selectedUnit === 'Kg' ? changeBy : changeBy * 1000;
    
  //   setQuantity(prev => prev + adjustedChangeBy);
  // };

  // // Updated decrement function with dynamic changeBy value
  // const decrementQuantity = () => {
  //   const selectedProductData = productItems.find(item => item.value === productValue);
  //   const changeBy = selectedProductData?.changeby ? Number(selectedProductData.changeby) : 1;
    
  //   // Adjust changeBy based on unit type
  //   const adjustedChangeBy = selectedUnit === 'Kg' ? changeBy : changeBy * 1000;
  //   const startValue = selectedProductData?.startValue ? Number(selectedProductData.startValue) : 1;
    
  //   // Adjust startValue based on unit type
  //   const adjustedStartValue = selectedUnit === 'Kg' ? startValue : startValue * 1000;
    
  //   setQuantity(prev => prev > adjustedStartValue ? prev - adjustedChangeBy : adjustedStartValue);
  // };

 const incrementQuantity = () => {
  const selectedProductData = productItems.find(item => item.value === productValue);
  const changeBy = selectedProductData?.changeby ? Number(selectedProductData.changeby) : 1;
  
  // For Kg, use the changeBy value as is (could be decimal like 0.5)
  // For g, multiply by 1000 to get gram increments
  const adjustedChangeBy = selectedUnit === 'Kg' ? changeBy : changeBy * 1000;
  
  setQuantity(prev => prev + adjustedChangeBy);
};

const decrementQuantity = () => {
  const selectedProductData = productItems.find(item => item.value === productValue);
  const changeBy = selectedProductData?.changeby ? Number(selectedProductData.changeby) : 1;
  const startValue = selectedProductData?.startValue ? Number(selectedProductData.startValue) : 1;
  
  // For Kg, use values as is
  // For g, multiply by 1000
  const adjustedChangeBy = selectedUnit === 'Kg' ? changeBy : changeBy * 1000;
  const adjustedStartValue = selectedUnit === 'Kg' ? startValue : startValue * 1000;
  
  setQuantity(prev => Math.max(adjustedStartValue, prev - adjustedChangeBy));
};

// Update the edit modal increment/decrement functions
const updateQuantity = (changeBy: number, increase: boolean) => {
  if (!editingItem) return;
  
  // Get the product data to access changeby and startValue
  const productData = productItems.find(item => item.id === editingItem.id);
  const dynamicChangeBy = productData?.changeby ? Number(productData.changeby) : changeBy;
  const startValue = productData?.startValue ? Number(productData.startValue) : 1;
  
  // For Kg, use values as is (could be decimal)
  // For g, multiply by 1000
  const adjustedChangeBy = editSelectedUnit === 'Kg' ? dynamicChangeBy : dynamicChangeBy * 1000;
  const adjustedStartValue = editSelectedUnit === 'Kg' ? startValue : startValue * 1000;
  
  if (increase) {
    setNewItemQuantity(prev => prev + adjustedChangeBy);
  } else {
    setNewItemQuantity(prev => Math.max(adjustedStartValue, prev - adjustedChangeBy));
  }
};


  const handleUnitChange = (unit: string) => {
    setEditSelectedUnit(unit);
  };

const saveUpdatedItem = () => {
  if (!editingItem) return;

  const unit = editSelectedUnit;
  const quantityInKg = unit === 'Kg' ? newItemQuantity : newItemQuantity / 1000;
  
  // Calculate using discounted price
  const totalAmount = quantityInKg * editingItem.discountedPricePerKg;
  const discountAmount = (editingItem.pricePerKg - editingItem.discountedPricePerKg) * quantityInKg;

  const updatedItem: AdditionalItem = {
    ...editingItem,
    quantity: newItemQuantity,
    unit: unit,
    totalAmount: totalAmount,
    discount: discountAmount
  };

console.log("hgfsjka",updatedItem)

  setAdditionalItems(items => 
    items.map(item => 
      item.id === editingItem.id ? updatedItem : item
    )
  );

  setModalVisible(false);
  setEditingItem(null);
};

// Updated updateQuantity function for edit modal with dynamic values
// const updateQuantity = (changeBy: number, increase: boolean) => {
//   if (!editingItem) return;
  
//   // Get the product data to access changeby and startValue
//   const productData = productItems.find(item => item.id === editingItem.id);
//   const dynamicChangeBy = productData?.changeby ? Number(productData.changeby) : changeBy;
//   const startValue = productData?.startValue ? Number(productData.startValue) : 1;
  
//   // Adjust values based on unit type
//   const adjustedChangeBy = editSelectedUnit === 'Kg' ? dynamicChangeBy : dynamicChangeBy * 1000;
//   const adjustedStartValue = editSelectedUnit === 'Kg' ? startValue : startValue * 1000;
  
//   if (increase) {
//     setNewItemQuantity(prev => prev + adjustedChangeBy);
//   } else {
//     setNewItemQuantity(prev => Math.max(adjustedStartValue, prev - adjustedChangeBy));
//   }
// };

  // Calculate total items count
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
    const selectedProductData = productItems.find(item => item.value === productValue);
    if (selectedProductData) {
      const startValue = selectedProductData.startValue ? Number(selectedProductData.startValue) : 1;
      // Only set initial quantity when product changes, not when unit changes
      const adjustedStartValue = selectedUnit === 'Kg' ? startValue : startValue * 1000;
      setQuantity(adjustedStartValue);
      
      const discountedPrice = selectedProductData.discountedPrice 
        ? parseFloat(selectedProductData.discountedPrice) 
        : parseFloat(selectedProductData.price);
      setPricePerKg(discountedPrice);
    }
  }
}, [productValue, productItems]); // Removed selectedUnit dependency
// Add this new function to handle unit conversion
const handleUnitConversion = (newUnit: string) => {
  const currentUnit = selectedUnit;
  
  if (currentUnit === newUnit) return; // No change needed
  
  let convertedQuantity = quantity;
  
  if (currentUnit === 'Kg' && newUnit === 'g') {
    // Converting from Kg to g: multiply by 1000
    convertedQuantity = quantity * 1000;
  } else if (currentUnit === 'g' && newUnit === 'Kg') {
    // Converting from g to Kg: divide by 1000
    convertedQuantity = quantity / 1000;
  }
  
  // Round to appropriate decimal places
  if (newUnit === 'g') {
    convertedQuantity = Math.round(convertedQuantity);
  } else {
    // For Kg, keep up to 3 decimal places
    convertedQuantity = Math.round(convertedQuantity * 1000) / 1000;
  }
  
  setQuantity(convertedQuantity);
  setSelectedUnit(newUnit);
};

// Add this function for edit modal unit conversion
const handleEditUnitConversion = (newUnit: string) => {
  const currentUnit = editSelectedUnit;
  
  if (currentUnit === newUnit) return; // No change needed
  
  let convertedQuantity = newItemQuantity;
  
  if (currentUnit === 'Kg' && newUnit === 'g') {
    // Converting from Kg to g: multiply by 1000
    convertedQuantity = newItemQuantity * 1000;
  } else if (currentUnit === 'g' && newUnit === 'Kg') {
    // Converting from g to Kg: divide by 1000
    convertedQuantity = newItemQuantity / 1000;
  }
  
  setNewItemQuantity(convertedQuantity);
  setEditSelectedUnit(newUnit);
};


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
      <View className="flex-row items-center justify-between bg-white p-2">
       <BackButton navigation={navigation} />
        <Text className="text-lg font-semibold text-purple-600">Order Details</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-7" showsVerticalScrollIndicator={false}>
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
            placeholderStyle={{ color: '#000000' }}
            style={{
              backgroundColor: '#F6F6F6',
              borderColor: '#F6F6F6',
              borderRadius: 20,
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
                {/* <Ionicons name="add" size={16} color="#7C3AED" /> */}
                 <Image source={require("../assets/images/Add.webp")} className="w-5 h-5 " />
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

 

{/* Bottom Total Section - Only show when a package is selected */}
{/* Bottom Total Section - Only show when a package is selected */}
{packageValue && (
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

    <Text className="text-lg font-semibold text-gray-800 ml-2">
      Total:
    </Text>

<Text className="text-base font-semibold text-[#5C5C5C] mr-10">
  Rs. {Number(calculateGrandTotal()).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
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
            <View>
            <Text className="text-white font-semibold">
              Confirm
            </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  </View>
)}

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
        <Text className="text-gray-700 mb-3">Product</Text>
      <DropDownPicker
  open={productOpen}
  setOpen={setProductOpen}
  value={productValue}
  setValue={setProductValue}
  items={productItems.filter(
    product => !additionalItems.some(item => item.id === product.id)
  )}
  onSelectItem={(item) => {
    if (item && item.label && item.value) {
      setSelectedProduct(item.label);
      const selectedItem = productItems.find(p => p.value === item.value);
      if (selectedItem) {
        const discountedPrice = selectedItem.discountedPrice 
          ? parseFloat(selectedItem.discountedPrice) 
          : parseFloat(selectedItem.price);
        setPricePerKg(discountedPrice);
        
        // Set initial quantity based on product's startValue
        const startValue = selectedItem.startValue ? Number(selectedItem.startValue) : 1;
        const adjustedStartValue = selectedUnit === 'Kg' ? startValue : startValue * 1000;
        setQuantity(adjustedStartValue);
      }
    }
  }}
  searchable={true}
  searchPlaceholder="Search product..."
  placeholder="Select a product..."
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

      {/* Price per kg Section */}
      <View className="mb-6">
        <Text className="text-gray-700 mb-3">Price per 1kg</Text>
        <View className="bg-gray-50 rounded-xl px-4 py-4">
          <Text className="text-gray-900">Rs.{pricePerKg || '0.00'}</Text>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-gray-700 mb-3">Quantity</Text>
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
          
          {/* Unit dropdown - FIXED VERSION */}
       <DropDownPicker
  open={unitOpen}
  setOpen={setUnitOpen}
  value={selectedUnit}
  setValue={setSelectedUnit}
  onSelectItem={(item) => {
    if (item && item.value) {
      handleUnitConversion(item.value);
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
        <Text className="text-gray-700 mb-3">Total Amount</Text>
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
  onSelectItem={(item) => {
    if (item && item.value) {
      handleEditUnitConversion(item.value);
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
/>
        </View>
      </View>
      
      {/* Total Amount Section */}
      <View className="mb-6 mt-4">
        <Text className="text-gray-700 font-medium mb-3">Total Amount</Text>
        <View className="bg-gray-50 rounded-xl px-4 py-4">
          <Text className="text-gray-900  ">
            Rs.{(
              (editSelectedUnit === 'Kg' ? newItemQuantity : newItemQuantity / 1000) * 
              (editingItem?.discountedPricePerKg || 0)
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


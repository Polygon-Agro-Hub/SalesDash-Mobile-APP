import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Modal,Keyboard, Platform, KeyboardAvoidingView, Alert } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { SelectList } from "react-native-dropdown-select-list";
import BackButton from "./BackButton";
import DropDownPicker from "react-native-dropdown-picker";
import { LinearGradient } from "expo-linear-gradient"; 
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp } from "@react-navigation/native";


type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderScreen">;
type OrderScreenRouteProp = RouteProp<RootStackParamList, "OrderScreen">;



interface OrderScreenProps {
  navigation: OrderScreenNavigationProp;

  route: {
    params: {
      id: string; 
      isCustomPackage:string;
       isSelectPackage:string;
    };
  };
}
interface ModifiedPlusItem {
  packageDetailsId: number;
  originalQuantity: number;
  modifiedQuantity: number;
  originalPrice: number;
  additionalPrice: number;
  additionalDiscount: number;
}

interface ModifiedMinItem {
  packageDetailsId: number;
  originalQuantity: number;
  modifiedQuantity: number;
  originalPrice: number;
  additionalPrice: number;
  additionalDiscount: number;
}

interface AdditionalItem {
  mpItemId: number;
  quantity: number;
  price: number;
  discount: number;
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
interface ItemDetails {
  startValue?: string;
  changeby?: string;
  discountedPrice?: string;
  normalPrice?: string;
  displayName?: string;
  unitType?:string
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

// Define dropdown item interface
interface DropdownItem {
  label: string;
  value: string;
  key: number;
}




const OrderScreen: React.FC<OrderScreenProps> = ({ route, navigation }) => {
  const { id ,isCustomPackage, isSelectPackage} = route.params || {};
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("kg");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [token, setToken] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [additionalItems, setAdditionalItems] = useState<{ id: string;name: string; quantity: string; quantityType: string; price: number; cropId:number }[]>([]);
  const [packageItemsCount, setPackageItemsCount] = useState<number>(0); 
  const [loading, setLoading] = useState<boolean>(true);
  const [newItemName, setNewItemName] = useState<string>('');
  const [changeBy, setChangeBy] = useState(0.5); 
  const [unitType, setUnitType] = useState('kg'); 
  const [crops, setCrops] = useState<Crop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: number;name: string; quantity: string; quantityType: string; mpItemId?: number ;price: number; cropId:number } | null>(null);const [productOpen, setProductOpen] = useState<boolean>(false);  // State for controlling dropdown open/close
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
//const { id  } = route.params;
const [isModifiedPlus, setIsModifiedPlus] = useState(false);
const [isModifiedMin, setIsModifiedMin] = useState(false);
const [pricePerKg, setPricePerKg] = useState<string>("0.00");
const [editingItemOriginalPrice, setEditingItemOriginalPrice] = useState<number | null>(null);

const [newPrice1, setNewPrice1] = useState("0.00");
const [discount, setDiscount] = useState("0.00");
const [finaldiscount, setFinaldiscount] = useState("0.00");

 const [editingItemType, setEditingItemType] = useState<'package' | 'additional'>('package');

   const [selectedDelivery, setSelectedDelivery] = useState("");
   const [cropId, setCropid] = useState<number>(0);
   const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());
  
   const [originalPackageItems, setOriginalPackageItems] = useState<{
    //id: number;
    mpItemId: number;
    name: string;
    quantity: string;
    quantityType: string;
    price?: number 
  }[]>([]);
  const [packageItems, setPackageItems] = useState<{ 
    id:number;
    name: string; 
    quantity: string; 
    quantityType: string; 
    mpItemId?: number;
    price?: number 
  }[]>([]);
  
  // Make sure to set this when fetching items
  useEffect(() => {
    if (selectedPackage) {
      fetchItemsForPackage(selectedPackage.id).then((items) => {
        setPackageItems(items);
        setOriginalPackageItems(items); // Store the original items for comparison
      });
    }
  }, [selectedPackage]);
  

  interface ModifiedPlusItem {
    packageDetailsId: number; // Remove the undefined type
    originalQuantity: number;
    modifiedQuantity: number;
    originalPrice: number;
    additionalPrice: number;
    additionalDiscount: number;
  }
  
  interface ModifiedMinItem {
    packageDetailsId: number; // Remove the undefined type
    originalQuantity: number;
    modifiedQuantity: number;
    originalPrice: number;
    additionalPrice: number;
    additionalDiscount: number;
  }
  
  // Update the Package interface to include packageId
  interface Package {
    id: number;
    packageId: number; // Add this property
    displayName: string;
    price: string;
    description: string;
    portion: string;
    period: string;
    total: number;
  }


  const customerid = id;


  const prepareOrderItems = async () => {
    // Create separate arrays for tracking modifications and final items
    const modifiedPlusItems = [];
    const modifiedMinItems = [];
    const finalOrderPackageList = [];
    
    // First, process all package items to ensure their modifications are calculated
    // before handling any additional items
    for (const item of packageItems) {
      const originalItem = originalPackageItems.find(original => original.mpItemId === item.mpItemId);
      
      if (!originalItem) continue;
      
      const originalQuantity = parseFloat(originalItem.quantity);
      const modifiedQuantity = parseFloat(item.quantity);
      const originalPrice = item.price;
      
      // Fetch marketplace item details
      const marketplaceItemDetails = await fetchMarketplaceItemDetails(item.mpItemId ?? 0);
      
      if (!marketplaceItemDetails) {
        console.error(`Marketplace item not found for mpItemId: ${item.mpItemId}`);
        continue;
      }
      
      // Get prices from marketplace item details
      const normalPrice = parseFloat(marketplaceItemDetails.normalPrice?.toString().replace(/,/g, '') || "0");
      const discountedPrice = parseFloat(marketplaceItemDetails.discountedPrice?.toString().replace(/,/g, '') || "0");
      
      // Use the fetched prices
      const pricePerUnit = discountedPrice;
      const pricePerUnitNormal = normalPrice;
      
      // Store original values in local variables to avoid state interference
      const localOriginalPrice = Number(originalPrice ?? 0);
      
      // Handle item based on quantity changes
      if (modifiedQuantity === originalQuantity) {
        // Unchanged items - add to final list with original values
        finalOrderPackageList.push({
          productId: item.mpItemId,
          quantity: originalQuantity,
          price: originalPrice,
          isPacking: 0,
        });
      } 
      else if (modifiedQuantity > originalQuantity) {
        // Handle quantity increase
        const additionalQuantity = modifiedQuantity - originalQuantity;
        const additionalPrice = pricePerUnit * additionalQuantity;
        const additionalPriceNormal = pricePerUnitNormal * additionalQuantity;
        const discount = additionalPriceNormal - additionalPrice;
        
        // Store modification in the array immediately to avoid later changes
        const modifiedPlusItem = {
          packageDetailsId: item.id || 0,
          originalQuantity,
          modifiedQuantity: additionalQuantity,
          originalPrice: localOriginalPrice,
          additionalPrice,
          additionalDiscount: discount
        };
        
        modifiedPlusItems.push(modifiedPlusItem);
        
        const totalPrice = additionalPrice + localOriginalPrice;
        
        // Add to final order list with updated price
        finalOrderPackageList.push({
          productId: item.mpItemId,
          quantity: modifiedQuantity,
          price: totalPrice,
          isPacking: 0,
        });
      } 
      else if (modifiedQuantity < originalQuantity) {
        // Handle quantity decrease
        const reducedQuantity = originalQuantity - modifiedQuantity;
        const reducedPrice = pricePerUnit * reducedQuantity;
        const reducedPriceNormal = pricePerUnitNormal * reducedQuantity;
        const discount = reducedPriceNormal - reducedPrice;
        
        // Store modification immediately
        const modifiedMinItem = {
          packageDetailsId: item.id || 0,
          originalQuantity,
          modifiedQuantity: reducedQuantity,
          originalPrice: originalPrice,
          additionalPrice: reducedPrice,
          additionalDiscount: discount
        };
        
        modifiedMinItems.push(modifiedMinItem);
        
        finalOrderPackageList.push({
          productId: item.mpItemId,
          quantity: modifiedQuantity,
          price: (originalPrice ?? 0) - reducedPrice,
          isPacking: 0,
        });
      }
    }
    
    // Now process additional items completely separately
    const finalAdditionalItems = additionalItems.map(item => {
      const quantityStr = typeof item.quantity === 'string' ? 
        item.quantity.split(' ')[0] : 
        String(item.quantity);
      
      const quantity = parseFloat(quantityStr);
      const itemPrice = parseFloat(item.price?.toString().replace(/,/g, '') || "0");
      const totalPrice = itemPrice * quantity;
      const discountRate = parseFloat(finaldiscount || "0") / 100;
      const discountAmount = totalPrice * discountRate;
      
      return {
        id: item.id,
        quantity: quantity,
        unitType: unitType,
        total: itemPrice + parseFloat(finaldiscount || "0"),
        subtotal: itemPrice,
        discount: parseFloat(finaldiscount || "0")
      };
    });
    
    // Create a deep copy of the arrays to avoid reference issues
    const finalModifiedPlusItems = [...modifiedPlusItems];
    const finalModifiedMinItems = [...modifiedMinItems];
    
    // Create the final order items object using the copies
    const orderItems = [
      {
        packageId: selectedPackage?.id || 0,
        isModifiedPlus: finalModifiedPlusItems.length > 0,
        isModifiedMin: finalModifiedMinItems.length > 0,
        isAdditionalItems: additionalItems.length > 0,
        packageTotal: parseFloat(totalPrice?.toString() || "0"),
        packageDiscount: parseFloat(finaldiscount || "0"),
        modifiedPlusItems: finalModifiedPlusItems.length > 0 ? finalModifiedPlusItems : undefined,
        modifiedMinItems: finalModifiedMinItems.length > 0 ? finalModifiedMinItems : undefined,
        additionalItems: finalAdditionalItems.length > 0 ? finalAdditionalItems : undefined,
        finalOrderPackageList: finalOrderPackageList
      }
    ];
    
    console.log(orderItems);
    return orderItems;
  };

const [clickCount, setClickCount] = useState<number>(1); // Default value is 1 (or whatever makes sense)

  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState([
    { label: "kg", value: "kg" },
    { label: "g", value: "g" },
  ]);

  const [counter, setCounter] = useState(0);
  
    
    const handleClick1 = () => {
        // Counter state is incremented
        setCounter(counter + 1);
    };

   
    const handleClick2 = () => {
        // Counter state is decremented
        setCounter(counter - 1);
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
    
    setPackages(response.data.data); 
  
  } catch (error) {
    Alert.alert("Error", "Failed to fetch packages");
    console.error(error);
  }
};

useEffect(() => {
  fetchPackages().then(() => {

  });
}, []);
  
  
  
  
  

  
  
  const fetchItemsForPackage = async (packageId: number): Promise<{ 
    id: number;
    mpItemId: number;
    name: string;
    quantity: string;
    quantityType: string;
    price: number;
  }[]> => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return []; 
      }
  
      const response = await axios.get<{ 
        data: { 
          id: number;
          mpItemId: number;
          name: string;
          quantity: string;
          quantityType: string;
          price: number;
        }[] 
      }>(
        `${environment.API_BASE_URL}api/packages/${packageId}/items`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
  
      if (response.data && response.data.data) {
       // console.log("Package items fetched:", response.data.data);
    
        setPackageItemsCount(response.data.data.length);
        return response.data.data; 
        
      } else {
 
        return [];
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      Alert.alert("Error", "Failed to fetch items for the package");
      return []; 
    }
  };
  


  const fetchMarketplaceItemDetails = async (mpItemId: number) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return null;
      }
  
  
      const response = await axios.get(
        `${environment.API_BASE_URL}api/packages/marketplace-item/${mpItemId}`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
  
      if (response.data && response.data.data) {
        const itemDetails = response.data.data;
       // console.log("=======",response.data)
  
     
  
        setChangeBy(parseFloat(itemDetails.changeby)); // Set the changeby value from the response
  
        return itemDetails;
      } else {
        console.log("No details found for this item.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching item details:", error);
      Alert.alert("Error", "Failed to fetch item details");
      return null;
    }
  };
  


  const handleCropSelect = (selectedCropName: string) => {
    const selectedCrop = crops.find(crop => crop.displayName === selectedCropName);
    
    if (selectedCrop) {
      // Reset counter when selecting a new crop
      setCounter(0);
      
      // Get basic values from the selected crop
      const normalPrice = Number(selectedCrop.normalPrice) || 0;
      const discountedPrice = parseFloat(selectedCrop.discountedPrice ?? "0.00");
  
      
      // Set item details
      setItemDetails({
        changeby: selectedCrop.changeby,
        startValue: selectedCrop.startValue,
        unitType: selectedCrop.unitType,
        discountedPrice: selectedCrop.discountedPrice,
        normalPrice: selectedCrop.normalPrice,
        displayName: selectedCrop.displayName,
      });

      const total = parseFloat(selectedCrop.discountedPrice) * parseFloat(selectedCrop.startValue);
      
      setNewItemQuantity(selectedCrop.startValue);
      setUnits([{ label: selectedCrop.unitType, value: selectedCrop.unitType }]);
    setSelectedUnit(selectedCrop.unitType); // This line was missing

      setPricePerKg(discountedPrice.toFixed(2));
      setNewPrice1(total.toFixed(2));
      
      // Calculate initial discount
      const discount = (normalPrice*parseFloat(selectedCrop.startValue) ) - (discountedPrice* parseFloat(selectedCrop.startValue));
      const discountfinal = discount.toFixed(2)
      setFinaldiscount(discountfinal);
    }
  };




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
    
   //console.log("product", response.data);
    
    if (response.status === 200 && response.data && Array.isArray(response.data.data)) {
      // Filter only Retail items
      const retailItems = response.data.data.filter((item: CropItem) => item.category === "Retail");
      setCrops(retailItems); // Update crops list with only retail items
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
  
  
  
const fetchCropDetails = async (cropId: number) => {
  try {
    const storedToken = await AsyncStorage.getItem("authToken");
    if (!storedToken) {
      throw new Error("No authentication token found");
    }

    const apiUrl = `${environment.API_BASE_URL}api/packages/crops/${cropId}`;  // Adjust to the correct endpoint for crop details
    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${storedToken}` },
    });

    if (response.status === 200 && response.data) {
    // console.log("CROP datata", response.data)
      return response.data;  // Return the crop details
      
    } else {
      throw new Error("Unexpected response format");
    }
  } catch (error: any) {
    console.error("Error fetching crop details:", error);
    throw error;
  }
};

  useEffect(() => {
    if (editingItem) {
      setNewItemQuantity(editingItem.quantity);
      setSelectedUnit(editingItem.quantityType);
      
    }
  }, [editingItem]);


  
  
  
  



  //+++++++ ADDD


  

 // Function to handle quantity increases
const updateQuantityAdd = (changeBy: number, isIncrement: boolean) => {
  // Increment counter for tracking clicks
  const newCounterValue = counter + 1;
  setCounter(newCounterValue);
  
  // Update the quantity
  const currentValue = parseFloat(newItemQuantity || "0");
  const newValue = currentValue + changeBy;
  setNewItemQuantity(newValue.toString());
  
  // Recalculate prices
  if (itemDetails) {
    // Validate inputs
    if (!newItemName || typeof newItemName !== "string" || !newItemName.trim()) {
      Alert.alert("Error", "Please select a product.");
      return;
    }
    
    if (newValue <= 0) {
      Alert.alert("Error", "Quantity must be greater than zero.");
      return;
    }
    
    // Calculate new prices
    calculateTotalPriceAdd(newValue, itemDetails, newCounterValue);
  }
};

// Function to handle quantity decreases
const updateQuantity2Add = (changeBy: number, isIncrement: boolean) => {
  // Get current value
  const currentValue = parseFloat(newItemQuantity || "0");
  
  // Only proceed if we're not already at 0
  if (currentValue <= 0) {
    setNewItemQuantity("0");
    return; // Exit the function if already at 0
  }
  
  // Calculate new value ensuring it doesn't go below 0
  const newValue = Math.max(0, currentValue - changeBy);
  
  // Only update counter and recalculate if we actually changed the value
  if (newValue < currentValue) {
    // Decrement counter for tracking clicks
    const newCounterValue = counter - 1;
    setCounter(newCounterValue);
    
    // Update the quantity
    setNewItemQuantity(newValue.toString());
    
    // Recalculate prices
    if (itemDetails) {
      calculateTotalPriceAdd(newValue, itemDetails, newCounterValue);
    }
  }
};

// Unified price calculation function
function calculateTotalPriceAdd(quantity: number, itemDetails: ItemDetails | null, counterValue: number) {
  if (itemDetails === null) {
    throw new Error("Item details are missing");
  }
  
  // Get needed values from itemDetails
  const startValue = parseFloat(itemDetails.startValue ?? "1.00");
  const changeBy = parseFloat(itemDetails.changeby ?? "0.50");
  const discountedPrice = parseFloat(itemDetails.discountedPrice ?? "0.00");
  const normalPrice = parseFloat(itemDetails.normalPrice ?? "0.00");
  const unit = itemDetails.unitType;


  // Calculate discounted price
  const additionalPrice = (discountedPrice ) * changeBy * counterValue;
  const totalDiscountedPrice = discountedPrice * startValue + additionalPrice;
  
  // Calculate normal price (without discount)
  const normalAdditionalPrice = (normalPrice ) * changeBy * counterValue;
  const totalNormalPrice = normalPrice * startValue + normalAdditionalPrice;
  
  // Calculate total discount amount
  const totalDiscount = totalNormalPrice - totalDiscountedPrice;
  
  // Update state values
  setNewPrice1(totalDiscountedPrice.toFixed(2));
  setFinaldiscount(totalDiscount.toFixed(2));
  
  return totalDiscountedPrice;
}


  
  const handleItemEdit = (item: any) => {
    setEditingItem(item);
  
    
    if (item.quantity) {
   
      const numericPart = item.quantity.toString().split(' ')[0];
      setNewItemQuantity(numericPart);
    } else {
      setNewItemQuantity(""); 
    }
  
  
    if (item.quantityType) {
      setSelectedUnit(item.quantityType);
    }
  

    if ('mpItemId' in item && item.mpItemId !== undefined && item.mpItemId !== null && typeof item.mpItemId === 'number') {
  
  
      fetchMarketplaceItemDetails(item.mpItemId)
        .then(details => {
          if (details) {
          
            setItemDetails({
              changeby: details.changeby,
              startValue: details.startValue,
              unitType: details.unitType,
              discountedPrice: details.discountedPrice,
              normalPrice: details.normalPrice,
              displayName: details.displayName
            });
  
            // If you need to update the unitType state as well
            if (details.unitType) {
              setUnitType(details.unitType);
            }
          }
        })
        .catch(error => {
          console.error("Error fetching item details on click:", error);
        })
        .finally(() => {
      
        });
    } else {
      console.log("Invalid mpItemId:", item.mpItemId);
    }
  

    setModalVisible(true);
  };
  
 


  const addItem = () => {
    // Existing validation code...
  
    const selectedCrop = crops.find((crop) => crop.displayName === newItemName);
    if (!selectedCrop) {
      Alert.alert("Error", "Selected crop not found.");
      return;
    }
  
    // Get the crop ID if available, otherwise generate a unique ID
    const itemId = selectedCrop.id ? String(selectedCrop.id) : String(Date.now());
    
    const parsedQuantity = parseFloat(newItemQuantity);
  
    if (itemDetails) {
      const calculatedPrice = calculateTotalPriceAdd(parsedQuantity, itemDetails, counter);
  
      const newItem = {
        id: itemId,
        name: newItemName ?? "",
        quantity: `${String(newItemQuantity)} ${selectedUnit}`,
        quantityType: selectedUnit || "unit",
        price: calculatedPrice,
        cropId: selectedCrop.cropId // Store this even if undefined for consistency
      };
      
      console.log("''''''''", newItem);
      
      if (parsedQuantity === 0) {
        // Remove item if quantity is 0
        setAdditionalItems((prevItems) => {
          return prevItems.filter((item) => item.id !== itemId);
        });
      } else {
        // Check if item with this ID already exists
        const existingItemIndex = additionalItems.findIndex((item) => item.id === itemId);
        
        if (existingItemIndex !== -1) {
          // Update existing item
          setAdditionalItems((prevItems) => {
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: `${parsedQuantity} ${selectedUnit}`,
              price: calculatedPrice
            };
            return updatedItems;
          });
        } else {
          // Add new item
          setAdditionalItems((prevItems) => [...prevItems, newItem]);
        }
        
        // Update total price
        setTotalPrice((prevTotal) => (Number(prevTotal) || 0) + calculatedPrice);
      }
  
      // Reset states after adding item
      setCounter(0);
      setModalVisible(false);
      setNewItemName("");          
      setNewItemQuantity("");       
      setPricePerKg("");           
      setNewPrice1("");            
      setFinaldiscount(finaldiscount); 
      setModalVisible1(false);
    } else {
      Alert.alert("Error", "Item details are missing.");
    }
  };


const toggleItemSelection = (itemId: string | number) => {
  setSelectedItems(prev => {
    const newSelection = new Set(prev);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    return newSelection;
  });
};

// Function to delete selected items
const deleteSelectedItems = () => {
  // Filter out selected items
  const updatedItems = additionalItems.filter(item => !selectedItems.has(item.id));
  
  // Calculate price difference
  const priceDifference = additionalItems
    .filter(item => selectedItems.has(item.id))
    .reduce((total, item) => total + Number(item.price || 0), 0);
  
  // Update state
  setAdditionalItems(updatedItems);
  setTotalPrice(prevTotal => (Number(prevTotal) || 0) - priceDifference);
  
  // Clear selection
  setSelectedItems(new Set());
};
  
  

  const handleItemClick = (item: any) => {
    setEditingItem(item);
    setEditingItemType('package'); 
    setCounter(0);
    
    if (item.quantity) {
      const numericPart = item.quantity.toString().split(' ')[0];
      setNewItemQuantity(numericPart);
    } else {
      setNewItemQuantity("");
    }
  
    if (item.quantityType) {
      setSelectedUnit(item.quantityType);
    }
  
    if ('mpItemId' in item && item.mpItemId !== undefined) {
      fetchMarketplaceItemDetails(item.mpItemId)
        .then(details => {
          if (details) {
            setItemDetails({
              changeby: details.changeby,
              startValue: details.startValue,
              unitType: details.unitType,
              discountedPrice: details.discountedPrice,
              normalPrice: details.normalPrice,
              displayName: details.displayName
            });
            if (details.unitType) {
              setUnitType(details.unitType);
            }
          }
        })
        .catch(error => console.error("Error:", error));
    }
    setModalVisible(true);
  };
  
  const handleEditItemClick = (item: any) => {
    console.log("Editing item:", item); // Add this to debug
    
    setEditingItem(item);
    setEditingItemType('additional'); 
    setCounter(0);
    
    // Store the ID explicitly for reference
    const itemId = item.id;
    console.log("Editing item with ID:", itemId);
    
    if (item.quantity) {
      const numericPart = item.quantity.toString().split(' ')[0];
      setNewItemQuantity(numericPart);
    } else {
      setNewItemQuantity("");
    }
  
    if (item.quantityType) {
      setSelectedUnit(item.quantityType);
    }
  
    // Store original price
    setEditingItemOriginalPrice(item.price);
    
    // Since cropId is undefined, we need to look up the crop details by name
    const selectedCrop = crops.find((crop) => crop.displayName === item.name);
    
    if (selectedCrop) {
      setLoading(true);
      
      // Try to use the display name to find the right crop
      fetchCropDetails(selectedCrop.id)
        .then(details => {
          if (details) {
            setItemDetails({
              changeby: details.changeby,
              startValue: details.startValue,
              unitType: details.unitType,
              discountedPrice: details.discountedPrice,
              normalPrice: details.normalPrice,
              displayName: details.displayName
            });
            
            if (details.unitType) {
              setUnitType(details.unitType);
            }
          }
        })
        .catch(error => console.error("Error fetching crop details:", error))
        .finally(() => setLoading(false));
    } else {
      // If we can't find the crop, use the item's own data
      console.log("Could not find crop for:", item.name);
      
      // Set some reasonable defaults based on the item itself
      setItemDetails({
        changeby: "0.5",
        startValue: "1.0",
        unitType: item.quantityType || "Kg",
        discountedPrice: String(item.price / parseFloat(newItemQuantity)),
        normalPrice: String(item.price / parseFloat(newItemQuantity)),
        displayName: item.name
      });
    }
    
    setModalVisible(true);
  };

  function calculateTotalPrice(newQuantity: number, itemDetails: ItemDetails | null, clickCount: number) {
    if (itemDetails === null) {
      throw new Error("Item details are missing");
    }
  
    const startValue = parseFloat(itemDetails.startValue ?? "1.00");
    const changeBy = parseFloat(itemDetails.changeby ?? "0.50");
    const discountedPrice = parseFloat(itemDetails.discountedPrice ?? "0.00");
  

    const newPrice = (discountedPrice) * changeBy * clickCount;
 
  
    return newPrice;
  }
  

  const updateQuantity = (changeBy: number, isIncrement: boolean) => {
  
    setCounter((prevCounter) => {
        const newCounter = prevCounter + 1;
     
        return newCounter; 
    });

  
    const currentValue = parseFloat(newItemQuantity || "0");
    const newValue = currentValue + changeBy; 
    setNewItemQuantity(newValue.toString());
  
   
  
    
    if (itemDetails) {
     
      const updatedItemPrice = calculateTotalPrice(newValue, itemDetails, counter + 1); 

    }
};


useEffect(() => {

}, [counter]); 
  
  

  

const updateQuantity2 = (changeBy: number, isIncrement: boolean) => {
  const currentValue = parseFloat(newItemQuantity || "0");
  
  // Only decrease if the current value is greater than the change amount
  if (currentValue >= changeBy) {
    setCounter((prevCounter) => {
      const newCounter = prevCounter - 1;
 
      return newCounter;
    });
    
 
    const newValue = currentValue - changeBy;
    setNewItemQuantity(newValue.toString());
    
    // Recalculate the total price after changing quantity
    if (itemDetails) {
      const updatedItemPrice = calculateTotalPrice(newValue, itemDetails, counter - 1);
 
    }
  } else {
    // If trying to decrease below 0, set to 0 but don't change counter or price
    if (currentValue > 0) {
      setNewItemQuantity("0");
      setCounter((prevCounter) => {
        const newCounter = prevCounter - 1;
    
        return newCounter;
      });
      
      // Recalculate price when setting to exactly 0
      if (itemDetails) {
        const updatedItemPrice = calculateTotalPrice(0, itemDetails, counter - 1);
    
      }
    }
 
  }
};

  
// const saveUpdatedItem = () => {
//   const parsedNewItemQuantity = parseFloat(newItemQuantity || "0");
  
//   if (editingItem) {
//     console.log("Saving edited item:", editingItem);
    
//     if (editingItemType === 'package') {
//       // Update package item
//       const updatedItems = packageItems.map(item =>
//         item.name === editingItem.name
//           ? {
//               ...item,
//               quantity: String(parsedNewItemQuantity),
//               quantityType: selectedUnit || "",
//             }
//           : item
//       );
//    //  console.log("Updated Items:", updatedItems);
//       setPackageItems(updatedItems);
//     } else {
//       // Update additional item with correct price calculation
//       if (itemDetails) {
//         // Calculate the new price for the edited item
//         const basePrice = editingItem.price/parseFloat(editingItem.quantity);
//         console.log("88888888", editingItem)
//         const calculatedPrice = basePrice * parsedNewItemQuantity;
        
//         console.log("Updating item with ID:", editingItem.id);
//         console.log("New quantity:", parsedNewItemQuantity);
//         console.log("New calculated price:", calculatedPrice);
        
//         // Find the original item to get its price
//         const originalItem = additionalItems.find(item => String(item.id) === String(editingItem.id));
//         const originalPrice = originalItem ? Number(originalItem.price) : 0;
        
//         console.log("Original price:", originalPrice);
        
//         // Update the item in the array - use ID for reliable matching
//         const updatedItems = additionalItems.map(item => {
//           // Convert both IDs to the same type (string) before comparison
//           if (String(item.id) === String(editingItem.id)) {
//             console.log("Found item to update:", item);
//             return {
//               ...item,
//               quantity: `${String(parsedNewItemQuantity)} ${selectedUnit}`,
//               quantityType: selectedUnit || "",
//               price: calculatedPrice
//             };
//           }
//           return item;
//         });
        
//         // Update state
//         setAdditionalItems(updatedItems);
        
//         // Adjust total price by removing old price and adding new price
//         const priceDifference = calculatedPrice - originalPrice;
//         setTotalPrice(prevTotal => Number(prevTotal) + priceDifference);
        
//         console.log("Updated items:", updatedItems);
//       }
//     }
//   }
 
  
//   setCounter(0);
//   setModalVisible(false);
// };

const saveUpdatedItem = () => {
  const parsedNewItemQuantity = parseFloat(newItemQuantity || "0");
  
  if (editingItem) {
    console.log("Saving edited item:", editingItem);
    
    if (editingItemType === 'package') {
      // Calculate price difference for package item
      const originalQuantity = parseFloat(editingItem.quantity);
      
      // Fix TypeScript errors by ensuring discountedPrice is a number
      const discountedPrice = itemDetails?.discountedPrice ?? 0;
      
      // Ensure these are all numbers by using Number() conversion
      const originalItemPrice = Number(discountedPrice) * Number(originalQuantity);
      const newItemPrice = Number(discountedPrice) * Number(parsedNewItemQuantity);
      const priceDifference = Number(newItemPrice) - Number(originalItemPrice);
      
      // Update package item
      const updatedItems = packageItems.map(item =>
        item.name === editingItem.name
          ? {
              ...item,
              quantity: String(parsedNewItemQuantity),
              quantityType: selectedUnit || "",
            }
          : item
      );
      
      setPackageItems(updatedItems);
      
      // Update total price for package item changes
      if (priceDifference !== 0) {
        setTotalPrice(prevTotal => Number(prevTotal) + priceDifference);
      }
      
    } else {
      // Update additional item with correct price calculation
      if (itemDetails) {
        // Calculate the new price for the edited item
        const basePrice = Number(editingItem.price) / Number(parseFloat(editingItem.quantity));
        const calculatedPrice = Number(basePrice) * Number(parsedNewItemQuantity);
        
        console.log("Updating item with ID:", editingItem.id);
        console.log("New quantity:", parsedNewItemQuantity);
        console.log("New calculated price:", calculatedPrice);
        
        // Find the original item to get its price
        const originalItem = additionalItems.find(item => 
          String(item.id) === String(editingItem.id)
        );
        const originalPrice = originalItem ? Number(originalItem.price) : 0;
        
        console.log("Original price:", originalPrice);
        
        // Update the item in the array - use ID for reliable matching
        const updatedItems = additionalItems.map(item => {
          // Convert both IDs to the same type (string) before comparison
          if (String(item.id) === String(editingItem.id)) {
            console.log("Found item to update:", item);
            return {
              ...item,
              quantity: `${String(parsedNewItemQuantity)} ${selectedUnit}`,
              quantityType: selectedUnit || "",
              price: calculatedPrice
            };
          }
          return item;
        });
        
        // Update state
        setAdditionalItems(updatedItems);
        
        // Adjust total price by removing old price and adding new price
        const priceDifference = Number(calculatedPrice) - Number(originalPrice);
        setTotalPrice(prevTotal => Number(prevTotal) + priceDifference);
        
        console.log("Updated items:", updatedItems);
      }
    }
  } else if (itemDetails) {
    // Handle adding new items (not editing)
    const updatedTotalPrice = calculateTotalPrice(parsedNewItemQuantity, itemDetails, counter);
    setTotalPrice(prevTotal => Number(prevTotal) + Number(updatedTotalPrice));
  }
  
  setCounter(0);
  setModalVisible(false);
};
  
  const navigateToNextScreen = async () => {
    try {

      const orderItems = await prepareOrderItems();
      

      navigation.navigate('ScheduleScreen' as any, { orderItems ,  isCustomPackage, isSelectPackage, customerid });
      
   
    } catch (error) {
      console.error("Error preparing order items:", error);
    }
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
    <View className="flex-1 bg-white">
    <KeyboardAvoidingView 
                               behavior={Platform.OS === "ios" ? "padding" : "height"}
                               enabled 
                               className="flex-1"
                             >
      
      {/* Header */}
      <View className="flex-row items-center h-16 shadow-md px-4 bg-white">
        <BackButton navigation={navigation} />
        <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-7">Order Details</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} className="px-6 mt-4" keyboardShouldPersistTaps="handled">
  {/* Package Selection */}
  <Text className="text-gray-700 text-base mb-2">Package</Text>
  
  <SelectList
    setSelected={async (val: string) => {
      const selectedPkg = packages.find(pkg => pkg.id.toString() === val);
      if (selectedPkg) {
        setSelectedPackage(selectedPkg);
        setTotalPrice(Number(selectedPkg.total) || 0);
        
        const items = await fetchItemsForPackage(selectedPkg.id);
        setPackageItems(items);
        setPackageItemsCount(items.length);
      }
    }}
    data={packages.map(pkg => ({
      key: pkg.id.toString(),
      value: pkg.displayName || "Unnamed Package"
    }))}
    save="key"
    search={true}
    placeholder="Select Package"
    boxStyles={{
      borderColor: "#F6F6F6",
      backgroundColor: "#F6F6F6",
      borderRadius: 40,
      padding: 10
    }}
  />

  {selectedPackage && (
    <View className="mt-6 px-3 mb-20">
      <View className="flex-row justify-between items-center border-b border-gray-200 py-3">
        <Text className="font-bold text-gray-800">
          Package ({packageItemsCount} items)
        </Text>
        
        <TouchableOpacity
          className="ml-3 flex-row items-center"
          onPress={() => setModalVisible1(true)}
        >
          <Image source={require("../assets/images/Add.png")} className="w-5 h-5 mr-2" />
          <Text className="text-[#6839CF] font-semibold">Add More</Text>
        </TouchableOpacity>

      </View>
      
      {/* Render package items */}
      {packageItems.map((item, index) => (
        <View key={index} className="flex-row justify-between items-center border-b border-gray-200 py-3">
          <Text className="text-gray-700 text-base">{item.name}</Text>
          <View className="flex-row items-center">
            <Text className="text-gray-600 text-base">
              {item.quantity} {item.quantityType}
            </Text>
            <TouchableOpacity
              className="ml-3"
              onPress={() => handleItemClick(item)}
            >
              <Image source={require("../assets/images/Edit.png")} className="w-4 h-4" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      
      {additionalItems.length > 0 && (
        <View className="flex-row justify-between items-center mt-5 border-b border-gray-200 py-3">
          <Text className="font-bold text-gray-800">Additional ({additionalItems.length} items)</Text>
          {selectedItems.size > 0 && (
            <TouchableOpacity
              className="flex-row items-center"
              onPress={deleteSelectedItems}
            >
              <Image source={require("../assets/images/trash.png")} className="w-5 h-5 mr-1" />
              <Text className="text-red-500"></Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Render Additional Items with checkboxes */}
      {additionalItems.map((item, index) => (
        <View key={index} className="flex-row justify-between items-center border-b border-gray-200 py-3">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => toggleItemSelection(item.id)}
              className="mr-2"
            >
              <View className={`w-5 h-5 border rounded-sm  flex items-center justify-center ${selectedItems.has(item.id) ? 'bg-black border-black' : 'border-gray-400'}`}>
                {selectedItems.has(item.id) && (
                  <Text className="text-white text-xs">✓</Text>
                )}
              </View>
            </TouchableOpacity>
            <Text className="text-gray-700 text-base">{item.name}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-600 text-base">{item.quantity}</Text>
            <TouchableOpacity
              className="ml-3"
              onPress={() => handleEditItemClick(item)}
            >
              <Image source={require("../assets/images/Edit.png")} className="w-4 h-4" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  )}
</ScrollView>
  
  
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
  onPress={() => updateQuantity2(parseFloat(itemDetails?.changeby || "0.5"), false)} // Decrease quantity on "-" button

>
  <Text className="text-gray-700 text-xl font-bold">-</Text>
</TouchableOpacity>

<Text className="flex-1 text-center text-gray-700">
  {newItemQuantity || "0"}
</Text>

<TouchableOpacity
  className="w-10 h-10 flex items-center justify-center"
   onPress={() => updateQuantity(parseFloat(itemDetails?.changeby || "0.5"), true)} // Increase quantity on "+" button

>
  <Text className="text-gray-700 text-xl font-bold">+</Text>
</TouchableOpacity>



          </View>
          
          {/* Unit Selection */}
          {/* <DropDownPicker
            open={open}
            setOpen={setOpen}
            value={selectedUnit}
            setValue={setSelectedUnit}
            items={units}
            setItems={setUnits}
            dropDownDirection="TOP"
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
          /> */}
              <DropDownPicker
              open={open}
              setOpen={setOpen}
              value={selectedUnit}
              setValue={setSelectedUnit}
              items={units}
              setItems={setUnits}
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
      
      {/* Buttons */}
      <View className="justify-between mt-4">
        <TouchableOpacity
          className="bg-gray-300 py-3 rounded-full items-center justify-center"
          onPress={() => setModalVisible(false)}
        >
          <Text className="text-gray-700 font-semibold text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
      <View className="justify-between mt-4">
      <TouchableOpacity
  className="bg-purple-700 py-3 rounded-full items-center justify-center"
  onPress={saveUpdatedItem} // Call the new function here
>
  <Text className="text-white font-semibold text-center">Save</Text>
</TouchableOpacity>






      </View>
    </View>
  </View>
</Modal>



      
 
      
     <Modal visible={modalVisible1} transparent animationType="slide">
  <TouchableOpacity
    activeOpacity={1}
    onPress={Keyboard.dismiss}
    className="flex-1 justify-center items-center bg-[#00000066]"
  >
    <View className="bg-white p-6 rounded-xl w-4/5">
      <Text className="text-gray-700 mb-2">Product</Text>

      <View  className="">
        
              <DropDownPicker
          open={productOpen}
          setOpen={setProductOpen}
          value={newItemName}
          setValue={setNewItemName}
          onSelectItem={(item) => {
            // Check if item and item.value exist and are not undefined
            if (item && typeof item.value === 'string') {
              handleCropSelect(item.value);
            }
          }}
          items={crops.map(crop => ({
            label: crop.displayName,  
            value: crop.displayName,  
 
            key: crop.cropId
          }))}
                   searchable={true}
          searchPlaceholder="Search product..."
          setItems={setCrops}
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
            borderRadius: 30,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
          textStyle={{
            fontSize: 14,
          }}
          zIndex={80000}
                  listMode="SCROLLVIEW"
        />
      </View>



      <View className="mb-4">
  <Text className="text-gray-700 mb-2 mt-2">Price per 1kg</Text>
  <View className="bg-gray-100 rounded-full px-4 py-3">
    <Text className="text-gray-700">Rs. {pricePerKg}</Text>
  </View>
</View>



      <View>
        <Text className="text-gray-700 mb-2">Quantity</Text>
        <View className="flex-row items-center space-x-2">
          <View className="flex-row items-center bg-gray-100 rounded-full flex-1">
            <TouchableOpacity 
              className="w-10 h-10 flex items-center justify-center"
             
              onPress={() => updateQuantity2Add(parseFloat(itemDetails?.changeby || "0.5"), false)} // Decrease quantity on "-" button
            >
              <Text className="text-gray-700 text-xl font-bold">-</Text>
            </TouchableOpacity>
            
            <Text className="flex-1 text-center text-gray-700">
              {newItemQuantity || "0"}
            </Text>
            
            <TouchableOpacity 
              className="w-10 h-10 flex items-center justify-center"
           
              onPress={() => updateQuantityAdd(parseFloat(itemDetails?.changeby || "0.5"), true)} // Increase quantity on "+" button
            >
              <Text className="text-gray-700 text-xl font-bold">+</Text>
            </TouchableOpacity>
          </View>

          <View style={{ zIndex: 1000 }}>
            <DropDownPicker
              open={open}
              setOpen={setOpen}
              value={selectedUnit}
              setValue={setSelectedUnit}
              items={units}
              setItems={setUnits}
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
      </View>

      <View className="mb-4">
  <Text className="text-gray-700 mb-2 mt-2">Total Amount</Text>
  <View className="bg-gray-100 rounded-full px-4 py-3">
    <Text className="text-gray-700">Rs.{newPrice1} </Text>

    
  </View>

  
</View>

<View className="mb-4">
<Text className="text-[#7340D3] text-center">
  You received a discount of Rs.{finaldiscount} for this product
</Text>

 
</View>



      <View className="justify-between mt-4">
        <TouchableOpacity
          className="bg-gray-300 py-3 px-6 rounded-full items-center justify-center"
          onPress={() => setModalVisible1(false)}
        >
          <Text className="text-gray-700 font-semibold text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
      <View className="justify-between mt-4">
        <TouchableOpacity
          className="bg-purple-700 py-3 px-6 rounded-full items-center justify-center"
          onPress={() => {
            addItem();
            setCounter(0);
            setModalVisible1(false);
          }}
        >
          <Text className="text-white font-semibold text-center">Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
</Modal>





  
      {/* Conditionally Render Navbar */}
      {selectedPackage && !isKeyboardVisible && (
          <View className={`bg-white flex-row justify-between items-center p-4 rounded-t-3xl shadow-lg ${!selectedPackage ? 'mb-20' : ''}`}
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
  Total : 
  <Text className="text-lg font-semibold text-[#5C5C5C]">
    Rs. {Number(totalPrice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </Text>
</Text>

  
  <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="py-3 px-6 rounded-full">
    <TouchableOpacity 
      onPress={navigateToNextScreen}
    >
      <Text className="text-white font-semibold">Confirm</Text>
    </TouchableOpacity>
  </LinearGradient>


          </View>
        )}
   
    </KeyboardAvoidingView>
  </View>
  
  );
};

export default OrderScreen;
  
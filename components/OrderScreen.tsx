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

const [newPrice1, setNewPrice1] = useState("0.00");
const [discount, setDiscount] = useState("0.00");
const [finaldiscount, setFinaldiscount] = useState("0.00");

 const [editingItemType, setEditingItemType] = useState<'package' | 'additional'>('package');

   const [selectedDelivery, setSelectedDelivery] = useState("");
   const [cropId, setCropid] = useState<number>(0);
  
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

    const modifiedPlusItems = [];
    const modifiedMinItems = [];
    
    // Process items with increased quantity
    for (const item of packageItems) {
      const originalItem = originalPackageItems.find(original => original.mpItemId === item.mpItemId);
      
      if (!originalItem) continue;
      
      const originalQuantity = parseFloat(originalItem.quantity);
      const modifiedQuantity1 = parseFloat(item.quantity);
      const originalPrice = item.price

      
      
      // Check if quantity increased
      if (modifiedQuantity1 > originalQuantity) {
        const modifiedQuantity = modifiedQuantity1 - originalQuantity;
        
        // Fetch marketplace item details to get pricing information
        const marketplaceItemDetails = await fetchMarketplaceItemDetails(item.mpItemId ?? 0);
        
        if (!marketplaceItemDetails) {
          console.error(`Marketplace item not found for mpItemId: ${item.mpItemId}`);
          continue;
        }
        
        // Get prices from marketplace item
        const normalPrice = parseFloat(marketplaceItemDetails.normalPrice?.toString().replace(/,/g, '') || "0");
        const discountedPrice = parseFloat(marketplaceItemDetails.discountedPrice?.toString().replace(/,/g, '') || "0");
        const startValue = parseFloat(marketplaceItemDetails.startValue?.toString().replace(/,/g, '') || "0")

        // Calculate price per unit using normal price
        const pricePerUnit = discountedPrice / startValue;
        const pricePerUnitNormal = normalPrice / startValue;
        
        // Calculate additional price for the added quantity
        const additionalPrice = pricePerUnit * modifiedQuantity;
        const additionalPriceNormal = pricePerUnitNormal * modifiedQuantity;
        const discount = additionalPriceNormal-additionalPrice;
        
        // Calculate discount percentage
        const discountPercentage = normalPrice > 0 ? ((normalPrice - discountedPrice) / normalPrice) * 100 : 0;
        
        // Apply the discount to the additional price
        const additionalDiscount = discount;
        
  
        
        modifiedPlusItems.push({
          packageDetailsId:  item.id || 0,
          originalQuantity,
          modifiedQuantity,
          originalPrice: originalPrice,
          additionalPrice,
          additionalDiscount
        });
      }
      
      // Check if quantity decreased
      else if (modifiedQuantity1 < originalQuantity) {
        const modifiedQuantity = originalQuantity - modifiedQuantity1;
        
        // Fetch marketplace item details to get pricing information
        const marketplaceItemDetails = await fetchMarketplaceItemDetails(item.mpItemId ?? 0);
        
        if (!marketplaceItemDetails) {
          console.error(`Marketplace item not found for mpItemId: ${item.mpItemId}`);
          continue;
        }
        
        // Get prices from marketplace item
        const normalPrice = parseFloat(marketplaceItemDetails.normalPrice?.toString().replace(/,/g, '') || "0");
        const discountedPrice = parseFloat(marketplaceItemDetails.discountedPrice?.toString().replace(/,/g, '') || "0");
        const startValue = parseFloat(marketplaceItemDetails.startValue?.toString().replace(/,/g, '') || "0")

        // Calculate price per unit using normal price
        const pricePerUnit = discountedPrice / startValue;
        const pricePerUnitNormal = normalPrice / startValue;
        
        // Calculate additional price for the added quantity
        const additionalPrice = pricePerUnit * modifiedQuantity;
        const additionalPriceNormal = pricePerUnitNormal * modifiedQuantity;
        const discount = additionalPriceNormal-additionalPrice;
        
        // Calculate discount percentage
        const discountPercentage = normalPrice > 0 ? ((normalPrice - discountedPrice) / normalPrice) * 100 : 0;
        
        // Apply the discount to the absolute price difference
        const additionalDiscount = discount;
        
        console.log(`Minus item ${item.mpItemId} (${item.name}): 
          Normal price ${normalPrice}, 
          Discounted price ${discountedPrice}, 
          Price per unit ${pricePerUnit}, 
          Additional price ${additionalPrice}, 
          Discount ${additionalDiscount}`);
        
        modifiedMinItems.push({
          packageDetailsId:  item.id || 0,
          originalQuantity,
          modifiedQuantity,
          originalPrice: originalPrice,
          additionalPrice,
          additionalDiscount
        });
      }
    }
  
    // Process additional items (unchanged from your original code)
    const finalAdditionalItems = additionalItems.map(item => {
      // Extract the numeric part of quantity
      const quantityStr = typeof item.quantity === 'string' ? 
        item.quantity.split(' ')[0] : 
        String(item.quantity);
      
      const quantity = parseFloat(quantityStr);
      
      // Get price and ensure proper numeric conversion
      const itemPrice = parseFloat(item.price?.toString().replace(/,/g, '') || "0");
      
      // Calculate total price (price * quantity)
      const totalPrice = itemPrice * quantity;
      
      // Apply discount to the total price
      const discountRate = parseFloat(finaldiscount || "0") / 100;
      const discountAmount = totalPrice * discountRate;
      const finalPrice = totalPrice - discountAmount;
      
    const total = itemPrice+ parseFloat(finaldiscount)
    
      const selectedCrop = crops.find((crop) => crop.displayName === newItemName);
     // console.log(`Additional item ${item.cropId} (${item.name}): Price ${itemPrice}, Quantity ${quantity}, Total ${totalPrice}, Discount ${discountAmount}, Final ${finalPrice}`);
      
      return {
        id:item.id,
        quantity: quantity,
        unitType: unitType,
        total: total,
        subtotal: itemPrice,
        discount: parseFloat(finaldiscount || "0")
      };
    });
    
     console.log("........",itemDetails?.id);

  
    // Create the complete orderItems array
    const orderItems = [
      {
        packageId: selectedPackage?.id || 0,
        isModifiedPlus: modifiedPlusItems.length > 0,
        isModifiedMin: modifiedMinItems.length > 0,
        isAdditionalItems: additionalItems.length > 0,
        packageTotal: parseFloat(totalPrice?.toString() || "0"),
        packageDiscount: parseFloat(finaldiscount || "0"),
        modifiedPlusItems: modifiedPlusItems.length > 0 ? modifiedPlusItems : undefined,
        modifiedMinItems: modifiedMinItems.length > 0 ? modifiedMinItems : undefined,
        additionalItems: finalAdditionalItems.length > 0 ? finalAdditionalItems : undefined
      }
      
    ];
    
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
        console.log("Package items fetched:", response.data.data);
    
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
        console.log("=======",response.data)
  
     
  
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
    const normalPrice = Number(selectedCrop.normalPrice) || 0;
    const discountedPrice = parseFloat(selectedCrop.discountedPrice ?? "0.00");
    let startValue = Number(selectedCrop.startValue) || 1; // Default to 1 to avoid division by zero
    let unitType = selectedCrop.unitType?.toLowerCase(); // Normalize unit type

    let pricePerKg;
    let newPrice1;

    if (unitType === "g" || unitType === "gram" || unitType === "grams") {

      pricePerKg = ((normalPrice / startValue) * 1000).toFixed(2);
      newPrice1 = ((discountedPrice / startValue) * 1000).toFixed(2);
    } else {
      // Normal case when price is per kg
      pricePerKg = (normalPrice / startValue).toFixed(2);
      newPrice1 = (discountedPrice / startValue).toFixed(2);
    }

    // Calculate discount per kg
    let discountPerKg = parseFloat(pricePerKg) - parseFloat(newPrice1);

    // Calculate total discount based on quantity (startValue)
    let totalDiscount = discountPerKg * startValue;
    let totalPriceAfterDiscount = normalPrice - totalDiscount;

    console.log("Normal Price:", normalPrice);
    console.log("id", selectedCrop.id)
    console.log("Start Value:", startValue, unitType);
   console.log("Price per 1kg:", pricePerKg);
   console.log("Total Amount after discount:", totalPriceAfterDiscount.toFixed(2));
   console.log("Discount Amount:", totalDiscount.toFixed(2));


   

    setItemDetails({
      changeby: selectedCrop.changeby,
      startValue: selectedCrop.startValue,
      unitType: selectedCrop.unitType,
      discountedPrice: selectedCrop.discountedPrice,
      normalPrice: selectedCrop.normalPrice,
      displayName: selectedCrop.displayName,
   //   id: selectedCrop.id
    });

    setNewItemQuantity(selectedCrop.startValue);
    //setMpItemId(selectedCrop.id)
    setSelectedUnit(selectedCrop.unitType);
    setPricePerKg(pricePerKg);
    setNewPrice1(newPrice1); 
    setDiscount(totalDiscount.toFixed(2)); // Converts to string with 2 decimal places
    setFinaldiscount(totalDiscount.toFixed(2))
  }
};





// Fetch crops from API
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
      setCrops(response.data.data);  // Update crops list
   

  
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
     console.log("CROP datata", response.data)
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


  
  
  
  function calculateTotalPrice(newQuantity: number, itemDetails: ItemDetails | null, clickCount: number) {
    if (itemDetails === null) {
      throw new Error("Item details are missing");
    }
  
    const startValue = parseFloat(itemDetails.startValue ?? "1.00");
    const changeBy = parseFloat(itemDetails.changeby ?? "0.50");
    const discountedPrice = parseFloat(itemDetails.discountedPrice ?? "0.00");
  

    const newPrice = (discountedPrice / startValue) * changeBy * clickCount;
 
  
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




const saveUpdatedItem = () => {
 
  const parsedNewItemQuantity = parseFloat(newItemQuantity || "0");
  
  if (editingItem) {
    if (editingItemType === 'package') {
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
    //  console.log("Updated Items:", updatedItems);
      setPackageItems(updatedItems);
    } else {
      // Update additional item
      const updatedItems = additionalItems.map(item =>
        item.name === editingItem.name
          ? {
              ...item,
              quantity: `${String(parsedNewItemQuantity)} ${selectedUnit}`,
              quantityType: selectedUnit || "",
            }
          : item
      );
      setAdditionalItems(updatedItems);
    }

    // Update the editingItem reference
    setEditingItem(prev => ({
      ...prev!,
      quantity: String(parsedNewItemQuantity),
      quantityType: selectedUnit || "",
    }));
  }
  
 
  if (itemDetails) {
    const updatedTotalPrice = calculateTotalPrice(parsedNewItemQuantity, itemDetails, counter);
    setTotalPrice(updatedTotalPrice + (Number(totalPrice) || 0));
 //   console.log("Updated Total Price after Save:", updatedTotalPrice);
  }
  
  setCounter(0);
  setModalVisible(false);
};

  //+++++++ ADDD


  

  const updateQuantityAdd = (changeBy: number, isIncrement: boolean) => {
    // Calculate the new counter value first
    const newCounterValue = counter + 1;
    
    // Update the counter state
    setCounter(newCounterValue);
    
 
    
    // Update the quantity
    const currentValue = parseFloat(newItemQuantity || "0");
    const newValue = currentValue + changeBy;
    setNewItemQuantity(newValue.toString());
    
    // Calculate price with the new counter value
    if (itemDetails) {
      if (!newItemName || typeof newItemName !== "string" || !newItemName.trim()) {
        Alert.alert("Error", "Please select a product.");
        return;
      }
      
      if (!newItemQuantity || !newItemQuantity.trim()) {
        Alert.alert("Error", "Please enter a quantity.");
        return;
      }
      
      const parsedQuantity = parseFloat(newItemQuantity);
      // Use the newCounterValue instead of counter
      const calculatedPrice = calculateTotalPriceAdd(parsedQuantity, itemDetails, newCounterValue);
      
    //  console.log("Current total price:", totalPrice);
      const updatedItemPrice = calculatedPrice + (Number(totalPrice) || 0);

      
      const total = calculatedPrice;

    }
  };
  
  const updateQuantity2Add = (changeBy: number, isIncrement: boolean) => {
    // Calculate the new counter value first
    const newCounterValue = counter - 1;
    
    // Update the counter state
    setCounter(newCounterValue);
    
 
    
    // Update the quantity
    const currentValue = parseFloat(newItemQuantity || "0");
    const newValue = currentValue - changeBy;
    setNewItemQuantity(newValue.toString());
    
    // Recalculate the total price after changing quantity
    if (itemDetails) {
      const parsedQuantity = parseFloat(newItemQuantity);
      // Use the newCounterValue instead of counter
      const calculatedPrice = calculateTotalPriceAdd(parsedQuantity, itemDetails, newCounterValue);
      

      const updatedItemPrice = calculateTotalPrice(newValue, itemDetails, newCounterValue);
      

    }
  };
  
  function calculateTotalPriceAdd(newQuantity: number, itemDetails: ItemDetails | null, counterValue: number) {

    
    if (itemDetails === null) {
      throw new Error("Item details are missing");
    }
    
    const startValue = parseFloat(itemDetails.startValue ?? "1.00");
    const changeBy = parseFloat(itemDetails.changeby ?? "0.50");
    const discountedPrice = parseFloat(itemDetails.discountedPrice ?? "0.00");
    const normalPrice = parseFloat(itemDetails.normalPrice ?? "0.00")
    
    // Calculate price based on click count and quantity
    const newPrice = (discountedPrice / startValue) * changeBy * counterValue;
    const newPrice1 = newPrice + discountedPrice;

    const notdiscount = (normalPrice / startValue) * changeBy * counterValue;
    const notdiscount1 = notdiscount + discountedPrice;

    

    const newdiscount = notdiscount1-newPrice1 ;
    const finaldiscount = (newdiscount + parseFloat(discount ?? "0.00")).toFixed(2);


  
    
    setNewPrice1(newPrice1.toFixed(2));
    setFinaldiscount(finaldiscount)
    
    
    return newPrice1;
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

    if (!newItemName || typeof newItemName !== "string" || !newItemName.trim()) {
      Alert.alert("Error", "Please select a product.");
      return;
    }
  
    if (!newItemQuantity || !newItemQuantity.trim()) {
      Alert.alert("Error", "Please enter a quantity.");
      return;
    }
  
    const selectedCrop = crops.find((crop) => crop.displayName === newItemName);
  
    if (!selectedCrop) {
      Alert.alert("Error", "Selected crop not found.");
      return;
    }
  
    // Access the cropId here
    const cropId = selectedCrop.cropId;

    setCropid(cropId);
  

  
    const parsedQuantity = parseFloat(newItemQuantity);
  
    if (itemDetails) {
      const calculatedPrice = calculateTotalPriceAdd(parsedQuantity, itemDetails, counter);
  

      const newItem = {
        id: selectedCrop.id ? String(selectedCrop.id) : String(Date.now()),
        name: newItemName ?? "",
        quantity: `${String(newItemQuantity)} ${selectedUnit}`,
        quantityType: selectedUnit || "unit",
        price: calculatedPrice,
        cropId: cropId,
      };
  
  
      
      if (parsedQuantity === 0) {
        setAdditionalItems((prevItems) => {
          const updatedItems = prevItems.filter((item) => item.name !== newItemName);
          return updatedItems;
        });
      } else {

        const existingItemIndex = additionalItems.findIndex((item) => item.name === newItem.name);
  
        if (existingItemIndex !== -1) {
          setAdditionalItems((prevItems) => {
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex].quantity = `${parsedQuantity + parseFloat(updatedItems[existingItemIndex].quantity)} ${selectedUnit}`;
            updatedItems[existingItemIndex].price += calculatedPrice;
            updatedItems[existingItemIndex].id = selectedCrop.id ? String(selectedCrop.id) : String(Date.now());
            updatedItems[existingItemIndex].cropId = cropId;
            console.log("Updated additional items inside callback:", updatedItems);
            return updatedItems;
          });
          console.log("Item quantity updated:", newItem);
        } else {
          setAdditionalItems((prevItems) => {
            const updatedItems = [...prevItems, newItem];
            return updatedItems;
          });
        }
      }


      const parsedNewItemQuantity = parseFloat(newItemQuantity || "0");
  
      if (editingItem) {
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
  
          setEditingItem(prev => ({
              ...prev!,
              quantity: String(parsedNewItemQuantity),
              quantityType: selectedUnit || "",
          }));
      }

      if (itemDetails) {
          const updatedTotalPrice = calculateTotalPrice(parsedNewItemQuantity, itemDetails, counter);
          setTotalPrice(updatedTotalPrice + (Number(totalPrice) || 0));
     
      }
  
      setCounter(0);
      setModalVisible(false);

      setTotalPrice((prevTotal) => (Number(prevTotal) || 0) + calculatedPrice);
  
    
      setNewItemName("");          
      setNewItemQuantity("");       
      setPricePerKg("");           
      setNewPrice1("");            
      setCounter(0);                
      setFinaldiscount(finaldiscount); 
      setModalVisible1(false);   
    
    } else {
      Alert.alert("Error", "Item details are missing.");
    }
  };
  
  

  const handleItemClick = (item: any) => {
    setEditingItem(item);
    setEditingItemType('package'); 
    
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
    setEditingItem(item);
    setEditingItemType('additional'); 
    
    if (item.quantity) {
      const numericPart = item.quantity.toString().split(' ')[0];
      setNewItemQuantity(numericPart);
    } else {
      setNewItemQuantity("");
    }
  
    if (item.quantityType) {
      setSelectedUnit(item.quantityType);
    }
  
    if (item.cropId) {
      fetchCropDetails(item.cropId)
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
      <ScrollView showsVerticalScrollIndicator={false} className="px-6 mt-4"  keyboardShouldPersistTaps="handled">
        
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
      <Text className="font-bold text-gray-800 mt-5">Additional</Text>
    )}

    {/* Render Additional Items */}
    {additionalItems.map((item, index) => (
      <View key={index} className="flex-row justify-between items-center border-b border-gray-200 py-3">
        <Text className="text-gray-700 text-base">{item.name}</Text>
        <View className="flex-row items-center">
          <Text className="text-gray-600 text-base">{item.quantity}</Text>
          <TouchableOpacity
            className="ml-3"
            onPress={() =>handleEditItemClick (item)} // Call the new function here
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
          <DropDownPicker
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
  
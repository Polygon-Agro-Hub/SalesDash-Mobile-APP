import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Modal,Keyboard, Platform, KeyboardAvoidingView, Alert } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { SelectList } from "react-native-dropdown-select-list";
import BackButton from "./BackButton";
import Navbar from "./Navbar";
import DropDownPicker from "react-native-dropdown-picker";
import { LinearGradient } from "expo-linear-gradient"; // Gradient background
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp } from "@react-navigation/native";


type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderScreen">;
type OrderScreenRouteProp = RouteProp<RootStackParamList, "OrderScreen">;


interface OrderScreenProps {
  navigation: OrderScreenNavigationProp;
  route: OrderScreenRouteProp;
}

interface Package {
  id: number;
  name: string;
  price: string;
  description: string;
  portion: string;
   period :string;
   total:number;
}
interface Item {
  name: string;
  quantity: string;
  quantityType: string;
  price: number;  // Add price as part of the type
  cropId: number;
}


interface CropItem {
  id: string;
  cropNameEnglish: string;
}


interface CropItem {
  cropid: number;
  displayName: string;
  category: string;
  normalPrice: number;
  discountedPrice: number;
  discount: number | null;
  unitType: string;
}
interface Crop {
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

interface CropDetails {
  cropId: number;
  displayName: string;
  changeby: string;
  startValue: string;
  unitType: string;
  normalPrice: string;
  discountedPrice: string;
  promo: number;
}


const OrderScreen: React.FC<OrderScreenProps> = ({ route, navigation }) => {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);
  //const [editingItem, setEditingItem] = useState<{ name: string; quantity: string ; } | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("kg");
  //const [newItemName, setNewItemName] = useState("");
const [newItemQuantity, setNewItemQuantity] = useState("");
const [newItemQuantity1, setNewItemQuantity1] = useState("");
//const [productOpen, setProductOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
const [totalPrice, setTotalPrice] = useState<number>(0);

const [token, setToken] = useState<string | null>(null);
const [packages, setPackages] = useState<Package[]>([]);
const [items, setItems] = useState<{ name: string; quantity: string; quantityType: string }[]>([]);
//const [packageItems, setPackageItems] = useState<{ name: string; quantity: string; quantityType: string }[]>([]);
const [additionalItems, setAdditionalItems] = useState<{ name: string; quantity: string; quantityType: string; price: number; cropId:number }[]>([]);
const [packageItemsCount, setPackageItemsCount] = useState<number>(0); 
const [portion, setPortion] = useState<number>(0);  // To store portion
const [period, setPeriod] = useState<number>(0);    // To store period
const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
 // const [error, setError] = useState<string>("");
  const [productList, setProductList] = useState<Array<{ label: string; value: string }>>([]);

//const [productOpen, setProductOpen] = useState(false);
const [newItemName, setNewItemName] = useState<string>('');
const [changeBy, setChangeBy] = useState(0.5); 
const [unitType, setUnitType] = useState('kg'); 
const [packageItems, setPackageItems] = useState<{ name: string; quantity: string; quantityType: string; mpItemId?: number }[]>([]);
const [crops, setCrops] = useState<Crop[]>([]);
//const [crops, setCrops] = useState(false);
const [error, setError] = useState<string | null>(null);
//const [newItemQuantity, setNewItemQuantity] = useState("");
const [editingItem, setEditingItem] = useState<{ name: string; quantity: string; quantityType: string; mpItemId?: number ;price: number; cropId:number } | null>(null);
const [productOpen, setProductOpen] = useState<boolean>(false);  // State for controlling dropdown open/close
//const [crops, setCrops] = useState<any[]>([]);  // State for storing the list of crops
//const [loading, setLoading] = useState(false);
const [itemDetails, setItemDetails] = useState<{
  changeby?: string;
  startValue?: string;
  unitType?: string;
  discountedPrice?: string;
  normalPrice?: string;
  displayName?: string;
} | null>(null);
const { id  } = route.params;
const [isModifiedPlus, setIsModifiedPlus] = useState(false);
const [isModifiedMin, setIsModifiedMin] = useState(false);
const [pricePerKg, setPricePerKg] = useState<string>("0.00");
const [totalAmont,setTotalAmont] = useState("0.00");
const [newPrice1, setNewPrice1] = useState("0.00");
const [discount, setDiscount] = useState("0.00");
const [finaldiscount, setFinaldiscount] = useState("0.00");
 const [deliveryType, setDeliveryType] = useState("One Time");
 const [selectedDays, setSelectedDays] = useState<string[]>([]); 
 //const [additionalItems, setAdditionalItems] = useState<Item[]>([]);

   const [selectedDelivery, setSelectedDelivery] = useState("");
   const [cropId, setCropid] = useState<number>(0);

const [clickCount, setClickCount] = useState<number>(1); // Default value is 1 (or whatever makes sense)

  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState([
    { label: "kg", value: "kg" },
    { label: "g", value: "g" },
  ]);

  const [counter, setCounter] = useState(0);
//console.log("=====",counter)
//console.log("cusid_____", id)
    // Function is called everytime increment button is clicked
    const handleClick1 = () => {
        // Counter state is incremented
        setCounter(counter + 1);
    };

    // Function is called everytime decrement button is clicked
    const handleClick2 = () => {
        // Counter state is decremented
        setCounter(counter - 1);
    };

    const deliveryOptions = [
      { key: "one_time", value: "One Time" },
      { key: "twice_week", value: "Twice a Week" },
      { key: "weekly", value: "Weekly" },
    ];


//console.log(packageItems , packages)
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

      setPackages(response.data.data); // Ensure response structure matches
     
    } catch (error) {
      Alert.alert("Error", "Failed to fetch packages");
      console.error(error);
    }
  };

 
  useEffect(() => {
    fetchPackages();
  }, []); // Fetch packages once on mount
  
  
  useEffect(() => {
    if (selectedPackage) {
      setPortion(Number(selectedPackage.portion));
      setPeriod(Number(selectedPackage.period));
  
      fetchItemsForPackage(selectedPackage.id)
        .then((items) => {
          if (items.length > 0) {
            setPackageItems(items);// Make sure to update the state with fetched items
            items.forEach((item) => {
              console.log("Fetching item details for mpItemId:", item.mpItemId);
              fetchMarketplaceItemDetails(item.mpItemId);
            });
          } else {
            console.log("No items found in the package.");
          }
        })
        .catch((error) => {
          console.error("Error fetching items for package:", error);
        });
    }
  }, [selectedPackage]);
  
  
  
  

  
  
  const fetchItemsForPackage = async (packageId: number): Promise<{ 
    mpItemId: number;
    name: string;
    quantity: string;
    quantityType: string;
  }[]> => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return []; // Return an empty array instead of void
      }
  
      const response = await axios.get<{ 
        data: { 
          mpItemId: number;
          name: string;
          quantity: string;
          quantityType: string;
        }[] 
      }>(
        `${environment.API_BASE_URL}api/packages/${packageId}/items`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
  
      if (response.data && response.data.data) {
        //console.log("Package items fetched:", response.data.data);
        setPackageItemsCount(response.data.data.length);
        return response.data.data; // Ensure function returns an array
        
      } else {
       // console.log("No items found for this package.");
        return []; // Return an empty array instead of undefined
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      Alert.alert("Error", "Failed to fetch items for the package");
      return []; // Return an empty array on error
    }
  };
  


  const fetchMarketplaceItemDetails = async (mpItemId: number) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return null;
      }
      //console.log(mpItemId)
  
      const response = await axios.get(
        `${environment.API_BASE_URL}api/packages/marketplace-item/${mpItemId}`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
  
      if (response.data && response.data.data) {
        const itemDetails = response.data.data;
  
       // Log each property individually
        // console.log("Item Details:");
        // console.log("ID:", itemDetails.id);
        // console.log("Display Name:", itemDetails.displayName);
        // console.log("Normal Price:", itemDetails.normalPrice);
        // console.log("Discounted Price:", itemDetails.discountedPrice);
        // console.log("Start Value:", itemDetails.startValue);
        // console.log("Unit Type:", itemDetails.unitType);
        // console.log("Change By:", itemDetails.changeby);
  
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
      // Convert price per gram to price per kg
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
      displayName: selectedCrop.displayName
    });

    setNewItemQuantity(selectedCrop.startValue);
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

   // console.log("Fetching crops...");
    const apiUrl = `${environment.API_BASE_URL}api/packages/crops/all`;
   // console.log("Request URL:", apiUrl);

    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${storedToken}` },
    });

   // console.log("Response status:", response.status);

    if (response.status === 200 && response.data && Array.isArray(response.data.data)) {
      setCrops(response.data.data);  // Update crops list
      console.log("Crops fetched successfully:", response.data);

  
    } else {
      setError("Unexpected response format");
     // console.log("Unexpected response format", response.data);
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

// UseEffect to fetch crops when dropdown opens
useEffect(() => {
  if (productOpen) {
    fetchCrops();  // Ensure crops are fetched before displaying dropdown
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
  
    // Modify the price calculation using the clickCount if needed
    const newPrice = (discountedPrice / startValue) * changeBy * clickCount;
  
    console.log("New Quantity:", newQuantity);
    console.log("Calculated Price:+-=-=-=", newPrice);
  
    return newPrice;
  }
  
  // Update quantity and recalculate price using click count
  const updateQuantity = (changeBy: number, isIncrement: boolean) => {
    // Use previous counter value to update counter correctly
    setCounter((prevCounter) => {
        const newCounter = prevCounter + 1;
        console.log("Counter inside setCounter:", newCounter);  // Logs the updated counter immediately
        return newCounter; // Return new value to update state
    });

    console.log("Updating quantity:", changeBy, isIncrement);
    console.log("jjjjjj")
  
    const currentValue = parseFloat(newItemQuantity || "0");
    const newValue = currentValue + changeBy; // Adjust quantity based on increment/decrement flag
    setNewItemQuantity(newValue.toString());
  
   
  
    
    if (itemDetails) {
     
      const updatedItemPrice = calculateTotalPrice(newValue, itemDetails, counter + 1); // Pass the updated counter value
    //  setTotalPrice(updatedItemPrice + (Number(totalPrice) || 0)); // Use optional chaining
      console.log("Updated Price:", updatedItemPrice);
    }
};


useEffect(() => {
  console.log("Updated counter value:", counter);
}, [counter]); 
  
  
  const updateQuantity2 = (changeBy: number, isIncrement: boolean) => {
    setCounter((prevCounter) => {
      const newCounter = prevCounter - 1;
      console.log("Counter inside setCounter22:", newCounter); 
      return newCounter; 
  });

  console.log("Updating quantity:22", changeBy, isIncrement);

  const currentValue = parseFloat(newItemQuantity || "0");
  const newValue = currentValue - changeBy; // Adjust quantity based on increment/decrement flag
  setNewItemQuantity(newValue.toString());

  

  // Recalculate the total price after changing quantity
  if (itemDetails) {

    const updatedItemPrice = calculateTotalPrice(newValue, itemDetails, counter - 1); // Pass the updated counter value
 //   setTotalPrice(updatedItemPrice + (Number(totalPrice) || 0)); // Use optional chaining
    console.log("Updated Price:2", updatedItemPrice);
  }
  };
  


  const saveUpdatedItem = () => {
    console.log("Save button pressed", totalPrice);

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

        console.log("Updated Items:", updatedItems);

        setPackageItems(updatedItems);

        setEditingItem(prev => ({
            ...prev!,
            quantity: String(parsedNewItemQuantity),
            quantityType: selectedUnit || "",
        }));
    }

    // Ensure total price is updated based on the final counter value
    if (itemDetails) {
        const updatedTotalPrice = calculateTotalPrice(parsedNewItemQuantity, itemDetails, counter);
        setTotalPrice(updatedTotalPrice + (Number(totalPrice) || 0));
        console.log("Updated Total Price after Save:", updatedTotalPrice);
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
    
    // Log the new counter value
    console.log("Counter updated to:", newCounterValue);
    
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
      
      console.log("Current total price:", totalPrice);
      const updatedItemPrice = calculatedPrice + (Number(totalPrice) || 0);
     // setTotalPrice(updatedItemPrice);
      console.log("Updated total price:", updatedItemPrice);
      
      const total = calculatedPrice;
      console.log("Calculated price:", calculatedPrice);
     // setTotalAmont(total.toFixed(2));
    }
  };
  
  const updateQuantity2Add = (changeBy: number, isIncrement: boolean) => {
    // Calculate the new counter value first
    const newCounterValue = counter - 1;
    
    // Update the counter state
    setCounter(newCounterValue);
    
    // Log the new counter value
    console.log("Counter decremented to:", newCounterValue);
    
    // Update the quantity
    const currentValue = parseFloat(newItemQuantity || "0");
    const newValue = currentValue - changeBy;
    setNewItemQuantity(newValue.toString());
    
    // Recalculate the total price after changing quantity
    if (itemDetails) {
      const parsedQuantity = parseFloat(newItemQuantity);
      // Use the newCounterValue instead of counter
      const calculatedPrice = calculateTotalPriceAdd(parsedQuantity, itemDetails, newCounterValue);
      
      console.log("Current total price:", totalPrice);
      // Use the updated counter value for price calculation
      const updatedItemPrice = calculateTotalPrice(newValue, itemDetails, newCounterValue);
      
      // Update total price
   //   setTotalPrice((-updatedItemPrice) + (Number(totalPrice) || 0));
      console.log("Updated total price:", (-updatedItemPrice) + (Number(totalPrice) || 0));
    }
  };
  
  function calculateTotalPriceAdd(newQuantity: number, itemDetails: ItemDetails | null, counterValue: number) {
    console.log("Calculating price with:", {itemDetails, counterValue});
    
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


  

    
    console.log("Quantity:", newQuantity);
    console.log("Counter value:", counterValue);
    console.log("Base calculation:", newPrice);
    console.log("Final calculated price:", newPrice1);
    console.log("Discount....", discount)
    console.log("Discount", newdiscount)
    console.log ("finalDiscount",finaldiscount )
    
    setNewPrice1(newPrice1.toFixed(2));
    setFinaldiscount(finaldiscount)
    
    
    return newPrice1;
  }


  
  const handleItemEdit = (item: any) => {
    setEditingItem(item);
  
    
    if (item.quantity) {
      // Safely extract the numeric part
      const numericPart = item.quantity.toString().split(' ')[0];
      setNewItemQuantity(numericPart);
    } else {
      setNewItemQuantity(""); // Set default empty string if quantity doesn't exist
    }
  
    // Check if item.quantityType exists before setting it
    if (item.quantityType) {
      setSelectedUnit(item.quantityType);
    }
  
    // Fetch marketplace item details when clicking on this item
    if ('mpItemId' in item && item.mpItemId !== undefined && item.mpItemId !== null && typeof item.mpItemId === 'number') {
      // Optional: show loading indicator
      // setLoading(true);
  
      fetchMarketplaceItemDetails(item.mpItemId)
        .then(details => {
          if (details) {
          //  console.log("Fetched item details on click:", details);
            // Update the itemDetails state with the fetched data
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
          // Optional: hide loading indicator
          // setLoading(false);
        });
    } else {
      console.log("Invalid mpItemId:", item.mpItemId);
    }
  
    // Open the modal after setting the data
    setModalVisible(true);
  };
  
  const handleItemClick = (item: any) => {
    setEditingItem(item);
  
    // Check if item.quantity exists before trying to split it
    if (item.quantity) {
      // Safely extract the numeric part
      const numericPart = item.quantity.toString().split(' ')[0];
      setNewItemQuantity(numericPart);
    } else {
      setNewItemQuantity(""); // Set default empty string if quantity doesn't exist
    }
  
    // Check if item.quantityType exists before setting it
    if (item.quantityType) {
      setSelectedUnit(item.quantityType);
    }
  
    // Fetch marketplace item details when clicking on this item
    if ('mpItemId' in item && item.mpItemId !== undefined && item.mpItemId !== null && typeof item.mpItemId === 'number') {
      // Optional: show loading indicator
      // setLoading(true);
  
      fetchMarketplaceItemDetails(item.mpItemId)
        .then(details => {
          if (details) {
         //   console.log("Fetched item details on click:", details);
            // Update the itemDetails state with the fetched data
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
          // Optional: hide loading indicator
          // setLoading(false);
        });
    } else {
      console.log("Invalid mpItemId:", item.mpItemId);
      console.log("zzzzzzzzzzzz")
    }
  
    // Open the modal after setting the data
    setModalVisible(true);
  };


  const addItem = () => {
    console.log("newItemName:", newItemName);
    console.log("qqqqq", crops);
  
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
    console.log("Selected Crop ID:", cropId);  // Output the cropId
    setCropid(cropId);
  
    console.log("llllll", cropId);
  
    const parsedQuantity = parseFloat(newItemQuantity);
  
    if (itemDetails) {
      const calculatedPrice = calculateTotalPriceAdd(parsedQuantity, itemDetails, counter);
  
      console.log("Current total price:", totalPrice);
      console.log("Calculated price for new item:", calculatedPrice);
  
      // Create new item object
      const newItem: Item = {
        name: newItemName ?? "",
        quantity: `${String(newItemQuantity)} ${selectedUnit}`,
        quantityType: selectedUnit || "unit",
        price: calculatedPrice,
        cropId: cropId,  // Add cropId to the new item
      };
  
      // Check if quantity is 0, remove the item if true, otherwise add the item
      if (parsedQuantity === 0) {
        setAdditionalItems((prevItems) => {
          const updatedItems = prevItems.filter((item) => item.name !== newItemName);
          console.log("Item removed because quantity is 0:", updatedItems);
          return updatedItems;
        });
        console.log("Item removed because quantity is 0");
      } else {
        // Check if the item already exists
        const existingItemIndex = additionalItems.findIndex((item) => item.name === newItem.name);
  
        if (existingItemIndex !== -1) {
          setAdditionalItems((prevItems) => {
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex].quantity = `${parsedQuantity + parseFloat(updatedItems[existingItemIndex].quantity)} ${selectedUnit}`;
            updatedItems[existingItemIndex].price += calculatedPrice; // Update price as well
            updatedItems[existingItemIndex].cropId = cropId; // Ensure cropId is updated if needed
            console.log("Updated additional items inside callback:", updatedItems);
            return updatedItems;
          });
          console.log("Item quantity updated:", newItem);
        } else {
          setAdditionalItems((prevItems) => {
            const updatedItems = [...prevItems, newItem];
            console.log("Updated additional items inside callback:", updatedItems);
            return updatedItems;
          });
          console.log("Item added:", newItem);
        }
      }
      console.log("Save button pressed", totalPrice);

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
  
          console.log("Updated Items:", updatedItems);
  
          setPackageItems(updatedItems);
  
          setEditingItem(prev => ({
              ...prev!,
              quantity: String(parsedNewItemQuantity),
              quantityType: selectedUnit || "",
          }));
      }
  
      // Ensure total price is updated based on the final counter value
      if (itemDetails) {
          const updatedTotalPrice = calculateTotalPrice(parsedNewItemQuantity, itemDetails, counter);
          setTotalPrice(updatedTotalPrice + (Number(totalPrice) || 0));
          console.log("Updated Total Price after Save:", updatedTotalPrice);
      }
  
      setCounter(0);
      setModalVisible(false);
  
      // Update total price by adding the new item's price
      setTotalPrice((prevTotal) => (Number(prevTotal) || 0) + calculatedPrice);
  
      // Reset input fields and state after adding or removing the item
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
  
  const handleEditItemClick = (item: any) => {
    setEditingItem(item);
  
    if (item.quantity) {
      const numericPart = item.quantity.toString().split(' ')[0];
      setNewItemQuantity(numericPart);
    } else {
      setNewItemQuantity(""); // Set default empty string if quantity doesn't exist
    }
  
    if (item.quantityType) {
      setSelectedUnit(item.quantityType);
    }
  
    if (item.cropId) {
      fetchCropDetails(item.cropId)
        .then((details: CropDetails) => {  // Specify the type here
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
          console.log("CORP", cropId)
        })
        .catch((error: Error) => {  // Specify the error type
          console.error("Error fetching crop details on click:", error);
        });
    } else {
      console.log("Invalid item: No valid cropId found");
    }
  
    setModalVisible(true);
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
  setSelected={(val: string) => {
    // Find the package by its id
    const selectedPkg = packages.find(pkg => pkg.id.toString() === val);
    
    // If the package is found, set it as the selected package and update the total price
    if (selectedPkg) {
      setSelectedPackage(selectedPkg);
      setTotalPrice(Number(selectedPkg.total) || 0); // Set initial package price
    }
  }}
  data={packages.map(pkg => ({ key: pkg.id.toString(), value: pkg.name }))}
  placeholder="Select Package"
  boxStyles={{ borderColor: "#F6F6F6", backgroundColor: "#F6F6F6", borderRadius: 40, padding: 10 }}
/>

    

{/* Package Items List */}
{selectedPackage && (
  <View className="mt-6 px-3 mb-20">
    <View className="flex-row justify-between items-center border-b border-gray-200 py-3">
      <Text className="font-bold text-gray-800">Package ({packageItemsCount} items)</Text>

      {/* Ensure correct state name is used */}
   
        <TouchableOpacity
          className="ml-3 flex-row items-center"
          onPress={() => setModalVisible1(true)}
        >
          <Image source={require("../assets/images/Add.png")} className="w-5 h-5 mr-2" />
          <Text className="text-[#6839CF] font-semibold">Add More</Text>
        </TouchableOpacity>

      
    </View>
     {packageItems.map((item, index) => (
          <View key={index} className="flex-row justify-between items-center border-b border-gray-200 py-3">
          <Text className="text-gray-700 text-base">{item.name}</Text>
          <View className="flex-row items-center">
        <Text className="text-gray-600 text-base">{item.quantity}{item.quantityType}</Text>
        <TouchableOpacity
      className="ml-3"
      onPress={() =>  handleItemClick (item)} // Call the new function here
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
  onPress={() => updateQuantity2(parseFloat(itemDetails?.changeby || "0.5"), false)} // Decrease quantity on "-" button
 // onPress= {(handleClick2)}
>
  <Text className="text-gray-700 text-xl font-bold">-</Text>
</TouchableOpacity>

<Text className="flex-1 text-center text-gray-700">
  {newItemQuantity || "0"}
</Text>

<TouchableOpacity
  className="w-10 h-10 flex items-center justify-center"
   onPress={() => updateQuantity(parseFloat(itemDetails?.changeby || "0.5"), true)} // Increase quantity on "+" button
  //onPress= {(handleClick1)}
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
            key: crop.cropId,
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

      {/* <View style={{ marginBottom: productOpen ? 200 : 0 }} /> */}

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
      onPress={() => navigation.navigate("ScheduleScreen", { totalPrice })}
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
  
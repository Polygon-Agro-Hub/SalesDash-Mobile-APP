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


type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderScreen">;

interface OrderScreenProps {
  navigation: OrderScreenNavigationProp;
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
  mpItemId: number;
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



const OrderScreen: React.FC<OrderScreenProps> = ({ navigation }) => {
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
const [additionalItems, setAdditionalItems] = useState<{ name: string; quantity: string; quantityType: string }[]>([]);
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
const [editingItem, setEditingItem] = useState<{ name: string; quantity: string; quantityType: string; mpItemId?: number } | null>(null);
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

const [clickCount, setClickCount] = useState<number>(1); // Default value is 1 (or whatever makes sense)

  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState([
    { label: "kg", value: "kg" },
    { label: "g", value: "g" },
  ]);

  const [counter, setCounter] = useState(0);
console.log("=====",counter)
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
        console.log("Package items fetched:", response.data.data);
        return response.data.data; // Ensure function returns an array
      } else {
        console.log("No items found for this package.");
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
      console.log(mpItemId)
  
      const response = await axios.get(
        `${environment.API_BASE_URL}api/packages/marketplace-item/${mpItemId}`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
  
      if (response.data && response.data.data) {
        const itemDetails = response.data.data;
  
        // Log each property individually
        console.log("Item Details:");
        console.log("ID:", itemDetails.id);
        console.log("Display Name:", itemDetails.displayName);
        console.log("Normal Price:", itemDetails.normalPrice);
        console.log("Discounted Price:", itemDetails.discountedPrice);
        console.log("Start Value:", itemDetails.startValue);
        console.log("Unit Type:", itemDetails.unitType);
        console.log("Change By:", itemDetails.changeby);
  
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
  
 // Handle crop selection and update item details
 const handleCropSelect = (selectedCropName: string) => {
  // Find the selected crop by its displayName
  const selectedCrop = crops.find(crop => crop.displayName === selectedCropName);

  if (selectedCrop) {
    // Update the itemDetails state with selected crop details
    setItemDetails({
      changeby: selectedCrop.changeby,
      startValue: selectedCrop.startValue,
      unitType: selectedCrop.unitType,
      discountedPrice: selectedCrop.discountedPrice,
      normalPrice: selectedCrop.normalPrice,
      displayName: selectedCrop.displayName
    });
    
    // Set initial quantity to the startValue
    setNewItemQuantity(selectedCrop.startValue);
    
    // Set the unit type
    setSelectedUnit(selectedCrop.unitType);
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

    console.log("Fetching crops...");
    const apiUrl = `${environment.API_BASE_URL}api/packages/crops/all`;
    console.log("Request URL:", apiUrl);

    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${storedToken}` },
    });

    console.log("Response status:", response.status);

    if (response.status === 200 && response.data && Array.isArray(response.data.data)) {
      setCrops(response.data.data);  // Update crops list
      console.log("Crops fetched successfully:", response.data);
    } else {
      setError("Unexpected response format");
      console.log("Unexpected response format", response.data);
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
  
  
  
 
  
  

  
  // Fetch data when dropdown opens
  // useEffect(() => {
  //   if (productOpen) {
  //     fetchCrops();
  //   }
  // }, [productOpen]);

 
  useEffect(() => {
    if (editingItem) {
      setNewItemQuantity(editingItem.quantity);
      setSelectedUnit(editingItem.quantityType);
    }
  }, [editingItem]);


  // useEffect(() => {
  //   if (selectedPackage && itemDetails && newItemQuantity) {
  //     // Calculate the total price dynamically based on the quantity and selected package
  //     const updatedPrice = calculateTotalPrice(Number(newItemQuantity), itemDetails);
  //     setTotalPrice(updatedPrice + Number(selectedPackage.total || 0)); // Add package total to item price
  //   }
  // }, [newItemQuantity, selectedPackage, itemDetails]);
  
  
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
    console.log("Calculated Price:", newPrice);
  
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
  
    const currentValue = parseFloat(newItemQuantity || "0");
    const newValue = currentValue + changeBy; // Adjust quantity based on increment/decrement flag
    setNewItemQuantity(newValue.toString());
  
    // Avoid logging `counter` immediately, use `useEffect` instead to log the updated counter
  
    // Recalculate the total price after changing quantity
    if (itemDetails) {
      // Pass the updated counter to the price calculation
      const updatedItemPrice = calculateTotalPrice(newValue, itemDetails, counter + 1); // Pass the updated counter value
      setTotalPrice(updatedItemPrice + (Number(selectedPackage?.total) || 0)); // Use optional chaining
      console.log("Updated Price:", updatedItemPrice);
    }
};

// Optionally, use `useEffect` to log the updated counter after it changes
useEffect(() => {
  console.log("Updated counter value:", counter);
}, [counter]); // This will run whenever `counter` changes

  
  // Update quantity and recalculate price using click count
  const updateQuantity2 = (changeBy: number, isIncrement: boolean) => {
    setCounter((prevCounter) => {
      const newCounter = prevCounter - 1;
      console.log("Counter inside setCounter22:", newCounter);  // Logs the updated counter immediately
      return newCounter; // Return new value to update state
  });

  console.log("Updating quantity:22", changeBy, isIncrement);

  const currentValue = parseFloat(newItemQuantity || "0");
  const newValue = currentValue - changeBy; // Adjust quantity based on increment/decrement flag
  setNewItemQuantity(newValue.toString());

  // Avoid logging `counter` immediately, use `useEffect` instead to log the updated counter

  // Recalculate the total price after changing quantity
  if (itemDetails) {
    // Pass the updated counter to the price calculation
    const updatedItemPrice = calculateTotalPrice(newValue, itemDetails, counter - 1); // Pass the updated counter value
    setTotalPrice(updatedItemPrice + (Number(selectedPackage?.total) || 0)); // Use optional chaining
    console.log("Updated Price:2", updatedItemPrice);
  }
  };
  


  const saveUpdatedItem = () => {
    console.log("Save button pressed", totalPrice);
  
    // Ensure newItemQuantity is a number before passing it to calculateTotalPrice
    const parsedNewItemQuantity = parseFloat(newItemQuantity || "0");
  
    if (editingItem) {
      // Update the item quantity and unit in the packageItems list
      const updatedItems = packageItems.map(item =>
        item.name === editingItem.name
          ? {
              ...item,
              quantity: String(parsedNewItemQuantity), // Keep quantity as a string
              quantityType: selectedUnit || "",
            }
          : item
      );
      console.log("Updated Items:", updatedItems);
  
      // Set the updated items back to the state
      setPackageItems(updatedItems);
  
      // Update the editingItem state with the new quantity and unit
      setEditingItem(prev => ({
        ...prev!,
        quantity: String(parsedNewItemQuantity), // Ensure quantity is a string
        quantityType: selectedUnit || "",
      }));
  
      // Recalculate the total price after saving, passing parsedNewItemQuantity and clickCount
      //const updatedTotalPrice = calculateTotalPrice(parsedNewItemQuantity, itemDetails, clickCount);
     // setTotalPrice(updatedTotalPrice); // Update the total price
    }
  
    // Close the modal after saving
    setModalVisible(false);
  };
  
  const handleItemEdit = (item: any) => {
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
            console.log("Fetched item details on click:", details);
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
            console.log("Fetched item details on click:", details);
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


  const handleEditItemClick = (item: any) => {
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
            console.log("Fetched item details on click:", details);
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
  
  
  const addItem = () => {
    console.log('newItemName:', newItemName);  // Check if the selected product is properly set
  
    if (!newItemName || typeof newItemName !== 'string' || !newItemName.trim()) {
      Alert.alert("Error", "Please select a product.");
      return;
    }
  
    if (!newItemQuantity || !newItemQuantity.trim()) {
      Alert.alert("Error", "Please enter a quantity.");
      return;
    }
  
    const newItem = {
      name: newItemName ?? "",
      quantity: `${String(newItemQuantity)} ${selectedUnit}`,  // Ensure it's a string
      quantityType: selectedUnit || "unit",
    };
  
    setAdditionalItems((prevItems) => [...prevItems, newItem]);
    setNewItemName('');
    setNewItemQuantity('');
    setModalVisible1(false);
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

        {/* Number of Persons */}
        <View className="mt-4">
  <Text className="text-gray-700">No. of Persons</Text>
  {/* <TextInput 
    className="bg-[#F6F6F6] p-3 rounded-lg mt-1 text-gray-500 rounded-full h-12" 
    placeholder="ex: 3" 
    keyboardType="numeric"
  /> */}
 <TextInput 
  className="bg-[#F6F6F6] p-3 rounded-lg mt-1 text-gray-500 rounded-full h-12"
  placeholder="ex: 3"
  keyboardType="numeric"
  onChangeText={text => setPortion(text ? Number(text) : 0)}
  value={portion ? portion.toString() : ""}
/>
</View>

  
        {/* Number of Days */}
        <View className="mt-3">
          <Text className="text-gray-700">For How many days?</Text>
          <TextInput
  className="bg-[#F6F6F6] p-3 rounded-lg mt-1 text-gray-500 rounded-full h-12"
  placeholder="ex: 5"
  keyboardType="numeric"
  onChangeText={text => setPeriod(text ? Number(text) : 0)}
  value={period ? period.toString() : ""}
/>
        </View>
  
        {/* Image when no package is selected */}
        {!selectedPackage && (
          <View className="flex items-center mt-6">
            <Image source={require("../assets/images/order.png")} className="w-40 h-40" resizeMode="contain" />
          </View>
        )}
  
        {/* Package Items List */}
      {/* Package Items List */}
{selectedPackage && (
  <View className="mt-6 px-3 mb-20">
    <View className="flex-row justify-between items-center border-b border-gray-200 py-3">
      <Text className="font-bold text-gray-800"> Package ({packageItemsCount} items)</Text>
      <TouchableOpacity
        className="ml-3 flex-row items-center"
        onPress={() => setModalVisible1(true)}  
      >
        <Image source={require("../assets/images/Add.png")} className="w-5 h-5 mr-2" />
        <Text className="text-[#6839CF] font-semibold">Add More</Text>
      </TouchableOpacity>
    </View>

    {/* Render Package Items */}
    {packageItems.map((item, index) => (
      <View key={index} className="flex-row justify-between items-center border-b border-gray-200 py-3">
      <Text className="text-gray-700 text-base">{item.name}</Text>
      <View className="flex-row items-center">
    <Text className="text-gray-600 text-base">{item.quantity}{item.quantityType}</Text>
    <TouchableOpacity
  className="ml-3"
  onPress={() => handleEditItemClick(item)} // Call the new function here
>
          <Image source={require("../assets/images/Edit.png")} className="w-4 h-4" />
        </TouchableOpacity>
      </View>
    </View>
    ))}

    {/* "Additional" Label */}
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
  onPress={() => handleItemClick(item)} // Call the new function here
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



      
     {/* Add New Item Modal */}
     <Modal visible={modalVisible1} transparent animationType="slide">
  <TouchableOpacity
    activeOpacity={1}
    onPress={Keyboard.dismiss}
    className="flex-1 justify-center items-center bg-[#00000066]"
  >
    <View className="bg-white p-6 rounded-xl w-4/5">
      <Text className="text-gray-700 mb-2">Product</Text>

      {/* Product Dropdown */}
      <View style={{ zIndex: 2000 }}>
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
          setItems={setCrops}
          searchable={true}
          searchPlaceholder="Search product..."
          placeholder={loading ? "Fetching items..." : "Select a product"}
          dropDownDirection="BOTTOM"
          containerStyle={{ width: "100%" }}
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

      {/* Add Space to Prevent Overlap */}
      <View style={{ marginBottom: productOpen ? 200 : 0 }} />

      {/* Quantity and Unit Selector */}
      <View>
        <Text className="text-gray-700 mb-2">Quantity</Text>
        <View className="flex-row items-center space-x-2">
          {/* Quantity Control with +/- buttons */}
          <View className="flex-row items-center bg-gray-100 rounded-full flex-1">
            <TouchableOpacity 
              className="w-10 h-10 flex items-center justify-center"
              onPress={() => {
                const currentValue = parseFloat(newItemQuantity || "0");
                const changeBy = parseFloat(itemDetails?.changeby || "0.5");
                const minValue = 0;
                const newValue = Math.max(minValue, currentValue - changeBy);
                setNewItemQuantity(newValue.toString());
              }}
            >
              <Text className="text-gray-700 text-xl font-bold">-</Text>
            </TouchableOpacity>
            
            <Text className="flex-1 text-center text-gray-700">
              {newItemQuantity || "0"}
            </Text>
            
            <TouchableOpacity 
              className="w-10 h-10 flex items-center justify-center"
              onPress={() => {
                const currentValue = parseFloat(newItemQuantity || "0");
                const changeBy = parseFloat(itemDetails?.changeby || "0.5");
                const newValue = currentValue + changeBy;
                setNewItemQuantity(newValue.toString());
              }}
            >
              <Text className="text-gray-700 text-xl font-bold">+</Text>
            </TouchableOpacity>
          </View>

          {/* Unit Selection */}
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

      {/* Buttons */}
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
  Total : <Text className="text-lg font-semibold text-[#5C5C5C]">
    Rs.{totalPrice.toFixed(2)}
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
      {!selectedPackage && !isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
    </KeyboardAvoidingView>
  </View>
  
  );
};

export default OrderScreen;
  
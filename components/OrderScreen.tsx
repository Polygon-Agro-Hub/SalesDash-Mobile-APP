import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Modal,Keyboard, Platform, KeyboardAvoidingView } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { SelectList } from "react-native-dropdown-select-list";
import BackButton from "./BackButton";
import Navbar from "./Navbar";
import DropDownPicker from "react-native-dropdown-picker";
import { LinearGradient } from "expo-linear-gradient"; // Gradient background


type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderScreen">;

interface OrderScreenProps {
  navigation: OrderScreenNavigationProp;
}

const OrderScreen: React.FC<OrderScreenProps> = ({ navigation }) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);
  const [editingItem, setEditingItem] = useState<{ name: string; quantity: string } | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("kg");
  const [newItemName, setNewItemName] = useState("");
const [newItemQuantity, setNewItemQuantity] = useState("");
const [newItemQuantity1, setNewItemQuantity1] = useState("");
const [productOpen, setProductOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
const [totalPrice, setTotalPrice] = useState(1800.00); // Example default price


  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState([
    { label: "kg", value: "kg" },
    { label: "g", value: "g" },
  ]);


  const [productList, setProductList] = useState([
    { label: "Mango", value: "Mango" },
    { label: "Pineapple", value: "Pineapple" },
    { label: "Kiwi", value: "Kiwi" },
    { label: "Apple", value: "Apple" },
    { label: "Banana", value: "Banana" },
    { label: "Grapes", value: "Grapes" },
    { label: "Orange", value: "Orange" },
    { label: "Strawberry", value: "Strawberry" },
    { label: "Blueberry", value: "Blueberry" },
    { label: "Watermelon", value: "Watermelon" },
    { label: "Peach", value: "Peach" },
    { label: "Cherry", value: "Cherry" },
    { label: "Pear", value: "Pear" },
    { label: "Plum", value: "Plum" },
    { label: "Pomegranate", value: "Pomegranate" },
    { label: "Lemon", value: "Lemon" },
    { label: "Lime", value: "Lime" },
    { label: "Coconut", value: "Coconut" },
    { label: "Papaya", value: "Papaya" },
    { label: "Guava", value: "Guava" },
  ]);
  

  const packages = [
    { key: "1", value: "Fruity Pack" },
    { key: "2", value: "Veggie Pack" },
  ];




  const [packageItems, setPackageItems] = useState([
    { name: "Orange", quantity: "500g" },
    { name: "Grapes", quantity: "100g" },
    { name: "Strawberry", quantity: "100g" },
    { name: "Papaya", quantity: "100g" },
    { name: "Lemon", quantity: "400g" },
    { name: "Apple", quantity: "100g" },
    { name: "Watermelon", quantity: "500g" },
    { name: "Banana", quantity: "1kg" },
    { name: "Woodapple", quantity: "100g" },
    { name: "Guava", quantity: "250g" },
  ]);
  
  const [additionalItems, setAdditionalItems] = useState<{ name: string; quantity: string }[]>([]);
  
  
  
  const addItem = () => {
    if (newItemName.trim() && newItemQuantity.trim()) {
      const newItem = {
        name: newItemName,
        quantity: newItemQuantity + selectedUnit,
      };
      setAdditionalItems((prevItems) => [...prevItems, newItem]); // Add new items separately
      setNewItemName("");
      setNewItemQuantity("");
      setModalVisible1(false);
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      
      {/* Header */}
      <View className="flex-row items-center h-16 shadow-md px-4 bg-white">
        <BackButton navigation={navigation} />
        <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-7">Order Details</Text>
      </View>
  
      <ScrollView showsVerticalScrollIndicator={false} className="px-6 mt-4">
        
        {/* Package Selection */}
        <Text className="text-gray-700 text-base mb-2">Package</Text>
        <SelectList
          setSelected={(val: string) => setSelectedPackage(val)}
          data={packages}
          placeholder="Select Package"
          boxStyles={{ borderColor: "#F6F6F6", backgroundColor: "#F6F6F6", borderRadius: 40, padding: 10 }}
        />
  
        {/* Number of Persons */}
        <View className="mt-4">
          <Text className="text-gray-700">No. of Persons</Text>
          <TextInput className="bg-[#F6F6F6] p-3 rounded-lg mt-1 text-gray-500 rounded-full h-12" placeholder="ex: 3 " />
        </View>
  
        {/* Number of Days */}
        <View className="mt-3">
          <Text className="text-gray-700">For How many days?</Text>
          <TextInput className="bg-[#F6F6F6] p-3 rounded-lg mt-1 text-gray-500 rounded-full h-12" placeholder="ex: 5" />
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
      <Text className="font-bold text-gray-800">Package (10 items)</Text>
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
        <Text className="text-gray-600 text-base">{item.quantity}</Text>
        <TouchableOpacity
          className="ml-3"
          onPress={() => {
            setEditingItem(item);
            setModalVisible(true); // Open modal for editing item
          }}
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
         onPress={() => {
           setEditingItem(item);
           setModalVisible(true); // Open modal for editing item
         }}
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
          {/* Quantity Input */}
          <TextInput
            className="bg-gray-100 p-3 rounded-full text-gray-700 flex-1 px-6"
            placeholder={editingItem?.quantity}  // Use the current quantity as the placeholder
            keyboardType="numeric"
            value={newItemQuantity}  // Controlled value
            onChangeText={setNewItemQuantity}
          />

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
      <View className=" justify-between mt-4">
        <TouchableOpacity
          className="bg-gray-300 py-3  rounded-full items-center justify-center"
          onPress={() => setModalVisible(false)}
        >
          <Text className="text-gray-700 font-semibold text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
      <View className=" justify-between mt-4">
        <TouchableOpacity
          className="bg-purple-700 py-3  rounded-full items-center justify-center"
          onPress={() => {
            if (editingItem) {
              // Update the item in the packageItems or additionalItems array
              const updatedItems = selectedPackage
                ? packageItems.map(item =>
                    item.name === editingItem.name ? { ...item, quantity: newItemQuantity + selectedUnit } : item
                  )
                : additionalItems.map(item =>
                    item.name === editingItem.name ? { ...item, quantity: newItemQuantity + selectedUnit } : item
                  );

              // Update the appropriate state
              selectedPackage
                ? setPackageItems(updatedItems)
                : setAdditionalItems(updatedItems);
            }

            setModalVisible(false); // Close the modal
          }}
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
          items={productList}
          setItems={setProductList}
          searchable={true}
          searchPlaceholder="Search product..."
          placeholder="Select a product"
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
          {/* Quantity Input */}
          <TextInput
            className="bg-gray-100 p-3 rounded-full text-gray-700 flex-1 px-6"
            placeholder="500"
            keyboardType="numeric"
            value={newItemQuantity}
            onChangeText={setNewItemQuantity}
          />

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
      <View className=" justify-between mt-4">
        <TouchableOpacity
          className="bg-gray-300 py-3 px-6 rounded-full items-center justify-center"
          onPress={() => setModalVisible1(false)}
        >
          <Text className="text-gray-700 font-semibold text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
      <View className=" justify-between mt-4">
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

            

  <Text className="text-lg font-semibold text-gray-800">Total : 
    <Text className="text-lg font-semibold text-[#5C5C5C]">
     Rs.{totalPrice.toFixed(2)} </Text></Text>
  
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

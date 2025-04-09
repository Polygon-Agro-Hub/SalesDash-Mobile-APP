import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "./types";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import environment from "@/environment/environment";

type OrderConfirmedScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderConfirmedScreen">;
type OrderConfirmedScreenRouteProp = RouteProp<RootStackParamList, "OrderConfirmedScreen">;

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  // Add other properties as needed
}

interface OrderConfirmedScreenProps {
  navigation: OrderConfirmedScreenNavigationProp;
  route: OrderConfirmedScreenRouteProp;
}

interface Order {
  orderId: number;
  customerId: number;
  deliveryType: string;
  scheduleDate: string;
  scheduleTimeSlot: string;
  weeklyDate: string;
  paymentMethod: string;
  paymentStatus: number;
  orderStatus: string;
  createdAt: string;
  InvNo: string;
  fullTotal: string | null;
  fullSubTotal: string | null;
  fullDiscount: string | null;
  deleteStatus: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  buildingType: string;
  fullAddress: string;
}

const OrderConfirmedScreen: React.FC<OrderConfirmedScreenProps> = ({ navigation, route }) => {
 // const { orderId } = route.params;
    const [order, setOrder] = useState<Order | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
   const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

  // Extract params with default values to prevent undefined errors
  const { 
    orderId = "N/A", 
    total = 0, 
    subtotal = 0, 
    discount = 0,
    paymentMethod = "N/A", 
    customerId = "N/A", 
    selectedDate = "N/A", 
    selectedTimeSlot = "N/A",
    items = []
  } = route.params || {};

  // useEffect(() => {
  //   const fetchOrderDetails = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await axios.get(`${environment.API_BASE_URL}api/orders/get-order/${orderId}`);
  //       console.log("mkk", response.data);
  //       if (response.data.success) {
  //         setOrder(response.data.data);
  //       } else {
  //         setError("Failed to load order details");
  //       }
  //     } catch (err) {
  //       console.error("Error fetching order details:", err);
  //       setError("An error occurred while fetching order details");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchOrderDetails();
  // }, [orderId]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${environment.API_BASE_URL}api/orders/get-order/${orderId}`,
          { timeout: 30000 } 
        );
        
        if (!isMounted) return;
        
        console.log("mkk", response.data);
        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          setError("Failed to load order details");
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error("Error fetching order details:", err);
        setError("An error occurred while fetching order details");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Initial fetch
    fetchOrderDetails();
    
    // Set timeout for retry after 10 seconds
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log("Retrying order fetch after timeout...");
        fetchOrderDetails();
      }
    }, 10000);
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [orderId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };


  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Function to convert the watermark image to base64
  const convertImageToBase64 = async () => {
    try {
      // Get the local URI of the asset
      const asset = Asset.fromModule(require("../assets/images/Watermark.png"));
      await asset.downloadAsync(); // Ensure it's available on the filesystem
  
      if (!asset.localUri) {
        throw new Error("Failed to load asset");
      }
  
      // Read the image as Base64
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return "";
    }
  };
  
  // Function to generate and download the invoice PDF
  const handleDownloadInvoice = async () => {
    try {
      const watermarkBase64 = await convertImageToBase64(); // Convert watermark image to Base64
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}`;
      const invoiceNumber = `MP${formattedDate}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  
      // Create items table rows if items are available
      let itemsRows = '';
      if (items && items.length > 0) {
        items.forEach(item => {
          const itemPrice = item.price || 0;
          const itemQuantity = item.quantity || 0;
          itemsRows += `
            <tr>
              <td>${item.name || 'Item'}</td>
              <td>${itemQuantity}</td>
              <td>${itemPrice.toFixed(2)}</td>
              <td>${(itemPrice * itemQuantity).toFixed(2)}</td>
            </tr>
          `;
        });
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Purchase Invoice</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    margin: 0;
                    background-color: #ffffff;
                    position: relative;
                }
                .invoice-container {
                    position: relative;
                    border: 1px solid #ddd;
                    padding: 20px;
                    max-width: 700px;
                    margin: auto;
                    background: white;
                    z-index: 1;
                    overflow: hidden; /* Ensures watermark stays inside */
                }
                .watermark {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0.1; /* Adjust transparency */
                    z-index: -1; /* Push it behind text */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .watermark img {
                    width: 70%; /* Adjust size as needed */
                    height: auto;
                }
                h1, h2 {
                    color: #000;
                    text-align: left;
                }
                .section {
                    margin-top: 20px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 10px;
                }
                .bold {
                    font-weight: bold;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 5px;
                }
                table, th, td {
                    border: 1px solid black;
                    padding: 10px;
                    text-align: left;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="watermark">
                    <img src="${watermarkBase64}" alt="Watermark" />
                </div>
                
                <h1>Purchase Invoice</h1>
                <div class="section">
                    <p class="bold">AgroWorld (Pvt) Ltd.</p>
                    <p>Address: No. 1 Colombo 2</p>
                    <p>Contact: 077123457</p>
                    <p>Invoice Number: <strong>${order?.InvNo}</strong></p>
                    <p>Order ID: <strong>${orderId}</strong></p>
                    <p>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
                </div>

                <div class="section">
                    <h2>Customer Details</h2>
                    <p><span class="bold">Delivery Type:</span> One time</p>
                    <p><span class="bold">Selected Date:</span> ${selectedDate}</p>
                    <p><span class="bold"> Time :</span> ${selectedTimeSlot}</p>
                </div>

                <div class="section">
                    <h2>Receiver Details</h2>
                    <p><span class="bold">Receiver's Name:</span> ${order?.firstName}  ${order?.lastName}</p>
                    <p><span class="bold">Phone Number:</span> ${order?.phoneNumber}</p>
                    <p><span class="bold">Building Type:</span> ${order?.buildingType}</p>
                     <p><span class="bold">Address:</span> ${order?.fullAddress}</p>
                </div>

                ${items && items.length > 0 ? `
                <div class="section">
                    <h2>Order Items</h2>
                    <table>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                        ${itemsRows}
                    </table>
                </div>
                ` : ''}

                <div class="section">
                    <h2>Payment Summary</h2>
                    <table>
                        <tr>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                        <tr>
                            <td>Subtotal</td>
                            <td>${subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Discount</td>
                            <td>${discount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td><strong>Grand Total</strong></td>
                            <td><strong>${total.toFixed(2)}</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div class="section">
                    <h2>Payment Method</h2>
                    <p><span class="bold">Payment Method:</span> ${paymentMethod}</p>
                </div>
                
                <div class="footer">
                    <p><strong>Thank You for Shopping with Us!</strong></p>
                    <p>We value your trust and look forward to serving you again.</p>
                    <p>We are an Agro Fin Tech Company</p>
                </div>
            </div>
        </body>
        </html>
      `;
  
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
  
      if (Platform.OS === "android") {
        Alert.alert("PDF Generated", `Saved to: ${uri}`);
      }
  
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF.");
    }
  };
  
  // Safely format a number with toFixed or return '0.00' if undefined
  const safeToFixed = (num: any, decimals = 2) => {
    if (num === undefined || num === null || isNaN(Number(num))) {
      return '0.00';
    }
    return Number(num).toFixed(decimals);
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} 
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 bg-white px-2">
          <View style={{ paddingHorizontal: wp(6), paddingVertical: hp(1) }} className="flex-1">
            <View className="px-2">
              <Text style={{ fontSize: 20 }} className="text-black text-center mt-8 font-bold">
                Order is Confirmed!
              </Text>
              <Text style={{ fontSize: 18 }} className="text-[#3F3F3F] text-center mt-2">
                Order No: {order?.InvNo}
              </Text>
              <Text style={{ fontSize: 16 }} className="text-[#747474] text-center mt-5">
                Order Confirmation message and Payment Gateway Link has been sent to your Customer
              </Text>
            </View>

            {/* Order Details */}
            {/* <View className="mt-4 px-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-[#747474]">Order Date:</Text>
                <Text className="font-medium">{selectedDate}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-[#747474]">Time Slot:</Text>
                <Text className="font-medium">{selectedTimeSlot}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-[#747474]">Payment Method:</Text>
                <Text className="font-medium">{paymentMethod}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-[#747474]">Subtotal:</Text>
                <Text className="font-medium">${safeToFixed(subtotal)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-[#747474]">Discount:</Text>
                <Text className="font-medium">-${safeToFixed(discount)}</Text>
              </View>
              <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-200">
                <Text className="font-bold">Total:</Text>
                <Text className="font-bold">${safeToFixed(total)}</Text>
              </View>
            </View> */}

            {/* Illustration */}
            <View className="flex items-center justify-center mt-5">
              <Image 
                source={require("../assets/images/confirmed.png")} 
                style={{ width: wp(80), height: hp(40) }} 
                resizeMode="contain" 
              />
            </View>

            {/* Download Invoice Button */}
            <TouchableOpacity 
              onPress={handleDownloadInvoice} 
              style={{ marginHorizontal: wp(20), marginTop: hp(7) }}
            >
              <LinearGradient 
                colors={["#6839CF", "#874DDB"]} 
                style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 30, alignItems: "center" }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Download Invoice</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OrderConfirmedScreen;
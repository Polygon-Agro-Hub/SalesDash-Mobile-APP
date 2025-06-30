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
  Alert,
  BackHandler,
  ActivityIndicator
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from 'expo-media-library';

type OrderConfirmedScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderConfirmedScreen">;
type OrderConfirmedScreenRouteProp = RouteProp<RootStackParamList, "OrderConfirmedScreen">;

interface OrderConfirmedScreenProps {
  navigation: OrderConfirmedScreenNavigationProp;
  route: OrderConfirmedScreenRouteProp;
}

interface Order {
  orderId: number;
  userId: number;
  deliveryType: string;
  scheduleDate: string;
  scheduleTimeSlot: string;
  weeklyDate: string;
  paymentMethod: string;
  paymentStatus: number;
  orderStatus: string;
  createdAt: string;
  invoiceNumber: string;
  fullTotal: string | null;
  fullSubTotal: string | null;
  fullDiscount: string | null;
  deleteStatus: string | null;
  title: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  buildingType: string;
  fullAddress: string;
}

interface CustomerData {
  title?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  buildingType?: string;
  buildingDetails?: {
    buildingNo?: string;
    unitNo?: string;
    buildingName?: string;
    floorNo?: string;
    houseNo?: string;
    streetName?: string;
    city?: string;
  };
  email?:string
}

interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
}

const OrderConfirmedScreen: React.FC<OrderConfirmedScreenProps> = ({ navigation, route }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { 
    orderId = "N/A", 
    total = 0, 
    subtotal = 0, 
    discount = 0,
    paymentMethod = "N/A", 
    customerId = "N/A", 
    selectedDate = "N/A", 
    selectedTimeSlot = "N/A",
    items = [],
    isPackage = "",
  } = route.params || {};

  console.log("ispackage",isPackage)

  console.log("vhalkdz", order?.invoiceNumber);
  console.log("kacsbhm", customerId);

  useEffect(() => {
    const handleBackPress = () => {
      return true;
    };
 
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );
  
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        console.log("orderid", orderId);
        
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

    fetchOrderDetails();

    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log("Retrying order fetch after timeout...");
        fetchOrderDetails();
      }
    }, 10000);
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [orderId]);

  // Fetch customer data and delivery fee after order is loaded
  useEffect(() => {
    const fetchCustomerDataAndDeliveryFee = async () => {
      if (!order?.userId) {
        console.log("No userId found in order data");
        return;
      }

      try {
        console.log("Fetching customer data for userId:", order.userId);
        
        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          console.log("No authentication token found");
          setError("No authentication token found");
          return;
        }
        
        // Fetch customer data using userId from order
        const customerResponse = await axios.get(
          `${environment.API_BASE_URL}api/orders/get-customer-data/${order.userId}`,
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );
        
        console.log("Customer API response:", customerResponse.data);
        
        if (customerResponse.data && customerResponse.data.success) {
          console.log("Customer data received:", customerResponse.data.data);
          setCustomerData(customerResponse.data.data);
          
          // Extract city from customer data
          const customerCity = customerResponse.data.data.buildingDetails?.city;
          console.log("Customer city:", customerCity);
          
          if (customerCity) {
            // Fetch cities to get delivery charge
            const cityResponse = await axios.get<{ data: City[] }>(
              `${environment.API_BASE_URL}api/customer/get-city`,
              { headers: { Authorization: `Bearer ${storedToken}` }}
            );
            
            console.log("Cities API response:", cityResponse.data);
            
            if (cityResponse.data && cityResponse.data.data) {
              const cityData = cityResponse.data.data.find(c => c.city === customerCity);
              if (cityData) {
                const fee = parseFloat(cityData.charge) || 0;
                setDeliveryFee(fee);
                console.log(`Setting delivery fee to ${fee} for city ${customerCity}`);
              } else {
                console.log(`City ${customerCity} not found in cities list`);
              }
            }
          }
          
          // Set data loaded to true after all data is fetched
          setIsDataLoaded(true);
        } else {
          const errorMsg = customerResponse.data?.message || "Failed to fetch customer data";
          console.log("Customer API error:", errorMsg);
          setError(errorMsg);
          setIsDataLoaded(true); // Set to true even on error to show the page
        }
      } catch (error: any) {
        console.error("Error fetching customer data:", error);
        if (axios.isAxiosError(error)) {
          const errorMsg = error.response?.data?.message || error.message;
          console.log("Axios error details:", errorMsg);
          setError(errorMsg);
        } else {
          setError("Failed to fetch customer data");
        }
        setIsDataLoaded(true); // Set to true even on error to show the page
      }
    };

    // Only fetch customer data when order is available
    if (order && order.userId) {
      fetchCustomerDataAndDeliveryFee();
    }
  }, [order]); // Dependency on order object

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const convertImageToBase64 = async () => {
    try {
      const asset = Asset.fromModule(require("../assets/images/Watermark.webp"));
      
      if (!asset.downloaded) {
        await asset.downloadAsync();
      }
      
      if (!asset.localUri) {
        console.warn("Asset local URI not found, falling back to alternative method");
        return await convertImageAlternative();
      }

      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return `data:image/webp;base64,${base64}`;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return await convertImageAlternative();
    }
  };

  const convertImageAlternative = async () => {
    try {
      const assetInfo = require("../assets/images/Watermark.webp");
      
      if (typeof assetInfo === 'number') {
        const asset = Asset.fromModule(assetInfo);
        await asset.downloadAsync();
        
        if (asset.localUri) {
          const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return `data:image/webp;base64,${base64}`;
        }
      }
      
      console.warn("Unable to load watermark image");
      return "";
    } catch (error) {
      console.error("Alternative watermark conversion failed:", error);
      return "";
    }
  };

  const handleDownloadAndShareInvoice = async () => {
    if (isDownloading) return; // Prevent multiple clicks
    
    try {
      setIsDownloading(true);
      
      const watermarkBase64 = await convertImageToBase64();
      const invoiceNumber = order?.invoiceNumber || `INV-${Date.now()}`;

      let itemsRows = '';
      if (items && items.length > 0) {
        items.forEach(item => {
          const itemPrice = item.price || 0;
          const itemQuantity = item.quantity || 0;
          itemsRows += 
            `<tr>
              <td>${item.name || 'Item'}</td>
              <td>${itemQuantity}</td>
              <td>${itemPrice.toFixed(2)}</td>
              <td>${(itemPrice * itemQuantity).toFixed(2)}</td>
            </tr>`;
        });
      }

      const serviceFeeRow = isPackage === 0 ? `
      <tr>
        <td>Service Fee</td>
        <td>180.00</td>
      </tr>
    ` : '';

    const totalFeeRow0 = isPackage === 0 ? `
      <tr>
        <td>Subtotal</td>
        <td>${(total+ discount-180).toFixed(2)}</td>
      </tr>
    ` : '';

    const totalFeeRow1 = isPackage === 1 ? `
      <tr>
        <td>Subtotal</td>
        <td>${(total+ discount).toFixed(2)}</td>
      </tr>
    ` : '';

//       const htmlContent = `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//             <meta charset="UTF-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>Purchase Invoice</title>
//             <style>
//                 body {
//                     font-family: Arial, sans-serif;
//                     padding: 10px;
//                     margin: 0;
//                     background-color: #ffffff;
//                     position: relative;
//                 }
//                 .invoice-container {
//                     position: relative;
//                     border: 1px solid #ccc;
//                     padding: 10px;
//                     max-width: 700px;
//                     margin: auto;
//                     background: white;
//                     overflow: hidden;
//                 }
//                 .watermark {
//                     position: absolute;
//                     top: 0;
//                     left: 0;
//                     width: 100%;
//                     height: 100%;
//                     opacity: 0.5;
//                     z-index: 0;
//                     display: flex;
//                     justify-content: center;
//                     align-items: center;
//                 }
//                 .watermark img {
//                     width: 70%;
//                     height: auto;
//                 }
//                 h1, h2 {
//                     color: #000;
//                     text-align: left;
//                 }
//                 .section {
//                     border-bottom: 2px solid #ddd;
//                     padding-bottom: 10px;
//                     line-height: 0.8;
//                     margin-bottom: 5px;
//                 }
//                 .bold {
//                     font-weight: bold;
//                 }
//                 table {
//                     width: 100%;
//                     border-collapse: collapse;
//                 }
//                 table, th, td {
//                     border: 1px solid black;
//                     padding: 10px;
//                     text-align: left;
//                 }
//                 .footer {
//                     text-align: center;
//                     font-size: 14px;
//                 }
//             </style>
//         </head>
//         <body>
//             <div class="invoice-container">
//            <div class="watermark">
//     <img 
//         src="https://pub-79ee03a4a23e4dbbb70c7d799d3cb786.r2.dev/POLYGON%20ORIGINAL%20LOGO.png" 
//         alt="Watermark" 
//         style="width: full; height: full; opacity: 0.3;" 
//     />
// </div>

                
//                 <h3>Purchase Invoice</h3>
//                 <div class="section">
//                     <p class="bold">AgroWorld (Pvt) Ltd.</p>
//                     <p>Address: No 46/42, Nawam Mawatha, Colombo 02</p>
//                     <p>Contact: +94 770111999</p>
//                     <p>Invoice Number: <strong>${order?.invoiceNumber}</strong></p>
//                     <p>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
//                 </div>
  
//                 <div class="section">
//                     <h3>Order Details</h3>
//                     <p><span class="bold">Delivery Type:</span> One time</p>
//                     <p><span class="bold">Selected Date:</span> ${selectedDate}</p>
//                     <p><span class="bold"> Time :</span> ${selectedTimeSlot}</p>
//                 </div>
  
//                 <div class="section">
//                     <h3>Receiver Details</h3>
//                     <p><span class="bold">Receiver's Name:</span> ${order?.title}  ${order?.firstName}  ${order?.lastName}</p>
//                     <p><span class="bold">Phone Number:</span> ${order?.phoneNumber}</p>
//                     <p><span class="bold">Building Type:</span> ${order?.buildingType}</p>
//                     <p><span class="bold">Address:</span> ${order?.fullAddress}</p>
//                 </div>
  
//                 ${items && items.length > 0 ? `
//                 <div class="section">
//                     <h3>Order Items</h3>
//                     <table>
//                         <tr>
//                             <th>Item</th>
//                             <th>Quantity</th>
//                             <th>Unit Price</th>
//                             <th>Total</th>
//                         </tr>
//                         ${itemsRows}
//                     </table>
//                 </div>
//                 ` : ''}
  
//                 <div class="section">
//                     <h3>Payment Summary</h3>
//                     <table>
//                         <tr>
//                             <th>Description</th>
//                             <th>Amount (Rs.)</th>
//                         </tr>
//                             </tr>
//                       ${totalFeeRow0}
//                       <tr>
//                            </tr>
//                       ${totalFeeRow1}
//                       <tr>
//                         <tr>
//                             <td>Discount</td>
//                             <td>${discount.toFixed(2)}</td>
//                         </tr>
//                         </tr>
//                       ${serviceFeeRow}
//                       <tr>
//                          <tr>
//                             <td>Delivery Fee</td>
//                             <td>${deliveryFee.toFixed(2)}</td>
//                         </tr>
//                         <tr>
//                             <td><strong>Grand Total</strong></td>
//                            <td><strong>${(total + deliveryFee).toFixed(2)}</strong></td>
//                         </tr>
//                     </table>
//                 </div>
                
//                 <div class="section">
//                     <h3>Payment Method</h3>
//                     <p><span class="bold">Payment Method:</span> ${paymentMethod}</p>
//                 </div>
                
//                 <div class="footer">
//                     <p><strong>Thank You for Shopping with Us!</strong></p>
//                     <p>We value your trust and look forward to serving you again.</p>
//                     <p>We are an Agro Fin Tech Company</p>
//                 </div>
//             </div>
//         </body>
//         </html>
//       `;
 const htmlContent = `
       <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Purchase Invoice</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 10px;
        margin: 0;
        background-color: #ffffff;
      }
      .invoice-container {
        width: 100%;
        max-width: 760px;
        margin: auto;
        background: white;
        padding: 20px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 30px;
      }
      .top h1 {
        color: #3e206d;
        font-size: 20px;
        text-align: center;
        justify-items: center;
        align-items: center;
      }
      .headerp {
        font-size: 14px;
        line-height: 10px;
      }
      .logo {
        width: 180px;
        height: auto;
      }

      .bold {
        font-weight: 550;
        font-size: 14px;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .table th,
      .table td {
        border-left: none; 
        border-right: none; 
        padding: 15px;
        text-align: left;
      }
      .table th {
        background-color: #f8f8f8;
        font-size: 14px;
        font-weight: 100;
        justify-items: center;
        border-bottom: 1px solid #ddd;
      }
      .tabledata {
        font-size: 14px;
        font-weight: bold;
        color: #666666;
      }
      .table td {
        text-align: left;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        margin-top: 60px;
        color: #8492A3;
      }
      .section1 {
        margin-top: 10px;
      }
      .section2 {
        margin-top: 10px;
      }
      .section3 {
        margin-top: 10px;
      }
      .ptext {
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="invoice-container">
      <!-- Header Section -->
      <div class="top">
        <h1>INVOICE</h1>
      </div>
      <div class="header">
        <div>
          <p>
            <span style="font-weight: 550; font-size: 16px"
              >Polygon Holdings (Private) Ltd.</span
            >
          </p>
          <p class="headerp">No. 42/46, Nawam Mawatha, Colombo 02.</p>
          <p class="headerp">Contact No : +94 770 111 999</p>
          <p class="headerp">Email Address : info@polygon.lk</p>
        </div>
        <div>
          <img
            src="https://pub-79ee03a4a23e4dbbb70c7d799d3cb786.r2.dev/POLYGON%20ORIGINAL%20LOGO.png"
            alt="Polygon Logo"
            class="logo"
          />
        </div>
      </div>

      <!-- Billing Section -->
      <div
        class="section1"
        style="display: flex; justify-content: space-between"
      >
        <div>
          <p class="bold">Bill To :</p>
          <p class="headerp">${order?.title}  ${order?.firstName}  ${order?.lastName}</p>
          <p class="headerp">${order?.fullAddress}</p>
          <p class="headerp">${order?.phoneNumber}</p>
          <p class="headerp">${customerData?.email}</p>
        </div>
        <div>
          <div style="margin-right: 55px">
            <p class="bold">Grand Total :</p>
            <p style="font-weight: 550; font-size: 16px">Rs. ${(total + deliveryFee).toFixed(2)}</p>
            <div class="section" style="margin-top: 30px">
              <p class="bold">Payment Method :</p>
              <p class="headerp">${paymentMethod}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div
          class="section2"
          style="display: flex; justify-content: space-between"
        >
          <div>
            <p class="bold">Invoice No :</p>
            <p class="headerp">${order?.invoiceNumber}</p>
          </div>

          <div style="margin-right: 79px">
            <p class="bold">Ordered Date :</p>
            <p class="headerp">${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div
          class="section2"
          style="display: flex; justify-content: space-between"
        >
          <div>
            <p class="bold">Delivery Method :</p>
            <p class="headerp">Home Delivery</p>
          </div>

          <div style="margin-right: 64px">
            <p class="bold">Scheduled Date :</p>
            <p class="headerp">${selectedDate}</p>
          </div>
        </div>
      </div>

      <!-- Order Items Section -->
      <div class="section3" style="margin-top: 40px; margin-bottom: 30px">
        <div
          style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
          "
        >
          <div class="bold">Family Pack for 2 (03 Items)</div>
          <div style="font-weight: 550; font-size: 16px">Rs. 380.00</div>
        </div>
        <div style="border: 1px solid #ddd; border-radius: 10px">
          <table class="table">
            <tr>
              <th style="text-align: center; border-top-left-radius: 10px">
                Index
              </th>
              <th>Item Description</th>
              <th style="border-top-right-radius: 10px; width: 40%">QTY</th>
            </tr>
            <tr>
              <td style="text-align: center">1</td>
              <td class="tabledata">Up Country Fruits</td>
              <td class="tabledata">05</td>
            </tr>
            <tr>
              <td style="text-align: center">2</td>
              <td class="tabledata">Low Country Fruits</td>
              <td class="tabledata">05</td>
            </tr>
            <tr>
              <td style="text-align: center">3</td>
              <td class="tabledata">Low Country Vegetables</td>
              <td class="tabledata">10</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Additional Items Section -->
      <div class="section">
        <div
          style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
          "
        >
          <div class="bold">Additional Items (03 Items)</div>
          <div style="font-weight: 550; font-size: 16px">Rs. 380.00</div>
        </div>
        <div style="border: 1px solid #ddd; border-radius: 10px">
          <table class="table">
            <tr>
              <th style="text-align: center; border-top-left-radius: 10px">
                Index
              </th>
              <th>Item Description</th>
              <th>Unit Price (Rs.)</th>
              <th>QTY</th>
              <th style="border-top-right-radius: 10px">Amount (Rs.)</th>
            </tr>
            <tr>
              <td style="text-align: center">1</td>
              <td class="tabledata">Papaya</td>
              <td class="tabledata">200.00</td>
              <td class="tabledata">1kg</td>
              <td class="tabledata">200.00</td>
            </tr>
            <tr>
              <td style="text-align: center">2</td>
              <td class="tabledata">Lettuce</td>
              <td class="tabledata">200.00</td>
              <td class="tabledata">500g</td>
              <td class="tabledata">100.00</td>
            </tr>
            <tr>
              <td style="text-align: center">3</td>
              <td class="tabledata">Beans</td>
              <td class="tabledata">200.00</td>
              <td class="tabledata">800g</td>
              <td class="tabledata">80.00</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Grand Total Section -->
      <div class="section" style="margin-top: 30px">
        <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc;padding-bottom: 10px;" >
          <div class="bold">Grand Total for all items</div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-right: 20px; " class="ptext" >
          <p>Family Pack for 2</p>
          <p>Rs. 380.00</p>
        </div>
        <div style=" display: flex; justify-content: space-between; margin-right: 20px;" class="ptext" > 
          <p>Additional Items</p>
          <p>Rs. 380.00</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-right: 20px;  "class="ptext" >
          <p>Delivery Fee</p>
          <p>${deliveryFee.toFixed(2)}</p>
        </div>

        <div style="margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;" ></div>
      </div>

      <!-- Payment Method Section -->
      <div style="margin-top: -10px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 600; margin-right: 20px;">
        <p>Grand Total</p>
        <p>Rs. ${(total + deliveryFee).toFixed(2)}</p>
      </div>

      <!-- Remarks Section -->
      <div class="section">
        <p style=" margin-top: 50px; display: flex; justify-content: space-between; font-size: 14px; font-weight: 600;">
          Remarks :
        </p>

        <div   style="color: #666666; font-size: 12px; line-height: 10px;">
          <p>Kindly inspect all goods at the time of delivery to ensure accuracy and condition.</p>
          <p>Polygon does not accept returns under any circumstances.</p>
          <p>Please report any issues or discrepancies within 24 hours of delivery to ensure prompt attention.</p>
          <p>For any assistance, feel free to contact our customer service team.</p>
        </div>
       
      </div>

      <!-- Footer Section -->
      <div class="footer">
        <p  style=" margin-top: 50px; font-size: 16px; font-weight: 600; color:#000; font-style:italic">Thank you for shopping with us!</p>
        <p  style=" margin-top: -5px; font-size: 14px; font-weight: 500; color:#4B4B4B; font-style:italic">WE WILL SEND YOU MORE OFFERS, LOWEST PRICED VEGGIES FROM US.</p>
        <p style=" margin-top: 50px; font-style:italic">
          - THIS IS A COMPUTER GENERATED INVOICE, THUS NO SIGNATURE REQUIRED -
        </p>
      </div>
    </div>
  </body>
</html>
      `;
      const { uri: pdfUri } = await Print.printToFileAsync({ 
        html: htmlContent,
        width: 595, 
        height: 842,  
        base64: false
      });

      const fileName = `Invoice_${invoiceNumber}.pdf`;
      const tempFilePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: pdfUri,
        to: tempFilePath
      });

      const shareOptions = {
        mimeType: 'application/pdf',
        dialogTitle: ('Share Invoice'),
        UTI: 'com.adobe.pdf'
      };

      if (Platform.OS === 'android') {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(tempFilePath, shareOptions);
          Alert.alert(
            ('Invoice Ready'),
            ('To save to Downloads, select "Save to device" from the share menu'),
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(('Error'), ('Sharing is not available on this device'));
        }
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(tempFilePath, shareOptions);
          Alert.alert(
            ('Invoice Ready'),
            ('Use the "Save to Files" option to save the invoice'),
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(('Error'), ('Sharing is not available on this device'));
        }
      }

    } catch (error) {
      console.error('Invoice generation error:', error);
      Alert.alert(('Error'), ('Failed to generate invoice. Please try again.'));
    } finally {
      setIsDownloading(false);
    }
  };

 
  if (loading || !isDataLoaded) {
    return (
      <View className="flex-1 inset-0 bg-white/20 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#6839CF" />
        <Text className="mt-4 text-lg text-gray-600">Loading order details...</Text>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      className="flex-1 relative"
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
                Order No: {order?.invoiceNumber}
              </Text>
              <Text style={{ fontSize: 16 }} className="text-[#747474] text-center mt-5">
                Order Confirmation message and Payment Gateway Link has been sent to your Customer
              </Text>
            </View>

            <View className="flex items-center justify-center mt-5">
              <Image 
                source={require("../assets/images/confirmed.webp")} 
                style={{ width: wp(80), height: hp(40) }} 
                resizeMode="contain" 
              />
            </View>

            <TouchableOpacity 
              onPress={handleDownloadAndShareInvoice} 
              style={{ 
                marginHorizontal: wp(20), 
                marginTop: hp(7),
                opacity: isDownloading ? 0.7 : 1 
              }}
              disabled={isDownloading}
            >
              <LinearGradient 
                colors={isDownloading ? ["#9ca3af", "#6b7280"] : ["#6839CF", "#874DDB"]} 
                style={{ 
                  paddingVertical: 12, 
                  paddingHorizontal: 16, 
                  borderRadius: 30, 
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center"
                }}
              >
                {isDownloading && (
                  <ActivityIndicator 
                    size="small" 
                    color="white" 
                    style={{ marginRight: 8 }} 
                  />
                )}
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {isDownloading ? "Downloading..." : "Download Invoice"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
   
    </KeyboardAvoidingView>
  );
};

export default OrderConfirmedScreen;
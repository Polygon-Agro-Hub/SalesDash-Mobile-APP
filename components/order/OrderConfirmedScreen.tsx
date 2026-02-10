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
import { RootStackParamList } from "../types/types";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";

type OrderConfirmedScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderConfirmedScreen">;
type OrderConfirmedScreenRouteProp = RouteProp<RootStackParamList, "OrderConfirmedScreen">;

interface OrderConfirmedScreenProps {
  navigation: OrderConfirmedScreenNavigationProp;
  route: OrderConfirmedScreenRouteProp;
}

// Updated interfaces to match API response
interface PackageDetail {
  id: number;
  name: string;
  quantity: string;
  category?: string;
}

interface PackageInfo {
  displayName: string;
  packageDetails: PackageDetail[];
  packageId: number;
  packingFee: string;
  productPrice: string;
  serviceFee: string;
  status: string;
}

interface AdditionalItem {
  id: number;
  name: string;
  price: string;
  quantity: string;
  unit: string;
  totalPrice: string;
}

interface CustomerInfo {
  buildingType: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  title: string;
}

interface OrderStatus {
  invoiceNumber: string;
  reportStatus: string | null;
  status: string;
}

interface Order {
  additionalItems: AdditionalItem[];
  createdAt: string;
  customerInfo: CustomerInfo;
  discount: string;
  fullAddress: string;
  fullTotal: string;
  isPackage: number;
  orderId: number;
  orderStatus: OrderStatus;
  packageInfo: PackageInfo;
  scheduleDate: string;
  scheduleTime: string;
  scheduleType: string;
  total: string;
  userId: number;
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
  email?: string;
}

interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
}

interface PackageDetail {
  id: number;
  packageId: number;
  productTypeId: number;
  qty: number;
  productTypeName: string;
}

interface AdditionalItem {
  productId: number;
  qty: number;
  unit: string;
  price: string;
  discount: number;
  displayName: string;
  varietyId: number;
}

const OrderConfirmedScreen: React.FC<OrderConfirmedScreenProps> = ({ navigation, route }) => {

  
  const [isDataLoaded, setIsDataLoaded] = useState(false);
 
  const [order, setOrder] = useState<Order | null>(null);
const [isKeyboardVisible, setKeyboardVisible] = useState(false);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [deliveryFee, setDeliveryFee] = useState<number>(0);
const [customerData, setCustomerData] = useState<CustomerData | null>(null);
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

      
      const response = await axios.get(
        `${environment.API_BASE_URL}api/orders/get-order/${orderId}`,
        { timeout: 30000 } 
      );
      
      if (!isMounted) return;
      
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError("Failed to load order details");
        setLoading(false); // Stop loading on error
      }
    } catch (err) {
      if (!isMounted) return;
      
      console.error("Error fetching order details:", err);
      setError("An error occurred while fetching order details");
      setLoading(false); // Stop loading on error
    }
  };

  fetchOrderDetails();

  timeoutId = setTimeout(() => {
    if (isMounted && !order) {
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

      return;
    }

    try {

      
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }
      
      const customerResponse = await axios.get(
        `${environment.API_BASE_URL}api/orders/get-customer-data/${order.userId}`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
      
      
      if (customerResponse.data && customerResponse.data.success) {
        setCustomerData(customerResponse.data.data);
        
        const customerCity = customerResponse.data.data.buildingDetails?.city;
        
        if (customerCity) {
          const cityResponse = await axios.get<{ data: City[] }>(
            `${environment.API_BASE_URL}api/customer/get-city`,
            { headers: { Authorization: `Bearer ${storedToken}` }}
          );
          
          
          if (cityResponse.data && cityResponse.data.data) {
            const cityData = cityResponse.data.data.find(c => c.city === customerCity);
            if (cityData) {
              const fee = parseFloat(cityData.charge) || 0;
              setDeliveryFee(fee);
            } else {
              console.log(`City ${customerCity} not found in cities list`);
            }
          }
        }
        
        // Stop loading after all data is fetched successfully
        setLoading(false);
      } else {
        const errorMsg = customerResponse.data?.message || "Failed to fetch customer data";
        console.log("Customer API error:", errorMsg);
        setError(errorMsg);
        setLoading(false);
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
      setLoading(false);
    }
  };

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
      const asset = Asset.fromModule(require("../../assets/images/Watermark.webp"));
      
      if (!asset.downloaded) {
        await asset.downloadAsync();
      }
      
      if (!asset.localUri) {
        console.warn("Asset local URI not found, falling back to alternative method");
        return await convertImageAlternative();
      }

      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: "base64",
      });

      return `data:image/webp;base64,${base64}`;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return await convertImageAlternative();
    }
  };

  const convertImageAlternative = async () => {
    try {
      const assetInfo = require("../../assets/images/Watermark.webp");
      
      if (typeof assetInfo === 'number') {
        const asset = Asset.fromModule(assetInfo);
        await asset.downloadAsync();
        
        if (asset.localUri) {
          const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
            encoding: "base64",
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
      const invoiceNumber = order?.orderStatus?.invoiceNumber || `INV-${Date.now()}`;

      // Calculate totals from API data
      const packagePrice = parseFloat(order?.packageInfo?.productPrice || '0');
const packingFee = parseFloat(order?.packageInfo?.packingFee || '0');
const serviceFee = parseFloat(order?.packageInfo?.serviceFee || '0');
const discountAmount = parseFloat(order?.discount || '0');
const totalBeforeDiscount = parseFloat(order?.total || '0');
const totalAmount = totalBeforeDiscount - discountAmount;
      
const additionalItemsTotal = order?.additionalItems?.reduce((sum, item) => {
  const price = parseFloat(item.price?.toString() || '0');
  const discount = parseFloat(item.discount?.toString() || '0');
  const actualAmount = price + discount; // Use actual amount (price + discount)
  return sum + actualAmount;
}, 0) || 0;


const totaldiscount = order?.additionalItems?.reduce((sum, item) => {
  // Convert discount to string before parsing if it's a number
  const discount = typeof item.discount === 'number' ? item.discount.toString() : item.discount || '0';
  return sum + parseFloat(discount);
}, 0) || 0;

      // Generate package details rows
     // Generate package details rows
let packageDetailsRows = '';
if (order?.packageInfo?.packageDetails && order.packageInfo.packageDetails.length > 0) {
  order.packageInfo.packageDetails.forEach((item, index) => {
    packageDetailsRows += 
      `<tr>
        <td style="text-align: center">${index + 1}</td>
        <td class="tabledata">${item.productTypeName || 'Item'}</td>
        <td class="tabledata">${item.qty || 'N/A'}</td>
      </tr>`;
  });
}

let additionalItemsRows = '';
if (order?.additionalItems && order.additionalItems.length > 0) {
  order.additionalItems.forEach((item, index) => {
    const price = parseFloat(item.price?.toString() || '0'); // This is the discounted price from backend
    const discount = parseFloat(item.discount?.toString() || '0'); // This is the discount amount
    const quantity = parseFloat(item.qty?.toString() || '0');
    
    // Calculate the actual amount (price + discount)
    const actualAmount = price + discount; // 510 + 90 = 600
    
    // Calculate unit price (actual amount / quantity)
    const unitPrice = quantity > 0 ? (actualAmount / quantity) : 0; // 600 / 2 = 300
    
    additionalItemsRows += `
      <tr>
        <td style="text-align: center">${index + 1}</td>
        <td class="tabledata">${item.displayName || item.name || 'Item'}</td>
        <td class="tabledata">${unitPrice.toFixed(2)}</td>
        <td class="tabledata">${quantity} </td>
        <td class="tabledata">${actualAmount.toFixed(2)}</td>
      </tr>`;
  });
}



      // Format scheduled date
      const formatScheduleDate = (dateString: string) => {
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch (error) {
          return selectedDate;
        }
      };

      const htmlContent = `
       <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Purchase Invoice</title>

    <style>
    @page{
    margin-top:20px;
    }
      body {
        font-family: Arial, sans-serif;
        padding: 10px;
        margin: 0;
        background-color: #ffffff;
      }
      .invoice-container {
        width: 100%;
        max-width: 730px;
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
         .label {
    color: #929292; /* Gray color for labels */
    font-weight: 500;
  }
  
  .value {
    color: #000000; /* Dark color for values */
    font-weight: normal;
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
        font-weight: ;
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
        .section {
        page-break-inside: avoid; /* Avoid page breaks inside these sections */
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
              >Polygon Agro Holdings (Private) Ltd</span
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
          <p class="headerp">${order?.customerInfo?.title || ''}.${order?.customerInfo?.firstName || ''} ${order?.customerInfo?.lastName || ''}</p>
          <p class="headerp"> +94 ${order?.customerInfo?.phoneNumber || ''}</p>
          <p class="headerp">${customerData?.email || ''}</p>
              <div style="margin-top: 10px">
      ${order?.customerInfo?.buildingType === 'Apartment' ? 
         `
        <p class="bold">Apartment Address :</p>
        <p class="headerp"><span class="label">House No:</span> <span class="value">${customerData?.buildingDetails?.houseNo || ''}</span></p>
        <p class="headerp"><span class="label">Floor No:</span> <span class="value">${customerData?.buildingDetails?.floorNo || ''}</span></p>
        <p class="headerp"><span class="label">Building No:</span> <span class="value">${customerData?.buildingDetails?.buildingNo || ''}</span></p>
        <p class="headerp"><span class="label">Building Name:</span> <span class="value">${customerData?.buildingDetails?.buildingName || ''}</span></p>
        <p class="headerp"><span class="label">Unit No:</span> <span class="value">${customerData?.buildingDetails?.unitNo || ''}</span></p>
        <p class="headerp"><span class="label">Street:</span> <span class="value">${customerData?.buildingDetails?.streetName || ''}</span></p>
        <p class="headerp"><span class="label">City:</span> <span class="value">${customerData?.buildingDetails?.city || ''}</span></p>
        `
        :
        `
        <p class="bold">House Address :</p>
        <p class="headerp"><span class="label">House No:</span> <span class="value">${customerData?.buildingDetails?.houseNo || ''}</span></p>
        <p class="headerp"><span class="label">Street:</span> <span class="value">${customerData?.buildingDetails?.streetName || ''}</span></p>
        <p class="headerp"><span class="label">City:</span> <span class="value">${customerData?.buildingDetails?.city || ''}</span></p>
        `
      }
    </div>
          
        </div>
        <div>
          <div style="margin-right: 55px">
            <p class="bold">Grand Total :</p>
            <p style="font-weight: 550; font-size: 16px">Rs. ${(totalAmount ).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
            <div class="section" style="margin-top: 30px">
              <p class="bold">Payment Method :</p>
              <p class="headerp">Cash On Delivery</p>
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
            <p class="headerp">${invoiceNumber}</p>
          </div>
       <div style="margin-right: 79px">
            <p class="bold">Ordered Date :</p>
            <p class="headerp">${new Date(order?.createdAt || '').toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).replace(/ /g, '-')}</p>
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
         <p class="headerp">${new Date(order?.scheduleDate || '').toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).replace(/ /g, '-')}</p>
          </div>
        </div>
      </div>

      ${order?.isPackage === 1 ? `
      <!-- Package Section -->
      <div class="section" style="margin-top: 40px; margin-bottom: 30px">
        <div
          style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
          "
        >
          <div class="bold">${order?.packageInfo?.displayName || 'Package'} (${order?.packageInfo?.packageDetails?.length || 0} Items)</div>
          <div style="font-weight: 550; font-size: 16px">Rs. ${(packagePrice + packingFee + serviceFee).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
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
            ${packageDetailsRows}
          </table>
        </div>
      </div>` : ''}

      ${order?.additionalItems && order.additionalItems.length > 0 ? `
      <!-- Additional Items Section -->
      <div class="section 4">
        <div
          style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
            margin-top:10px
          "
        >
         <div class="bold">${order?.isPackage === 1 ? 'Additional Items' : 'Custom Items'} (${order?.additionalItems?.length || 0} ${order?.additionalItems?.length === 1 ? 'Item' : 'Items'})</div>
    <div style="font-weight: 550; font-size: 16px">Rs. ${additionalItemsTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
        </div>
        <div style="border: 1px solid #ddd; border-radius: 10px">
          <table class="table">
            <tr>
              <th style="text-align: center; border-top-left-radius: 10px">
                Index
              </th>
              <th>Item Description</th>
              <th>Unit Price (Rs.)</th>
              <th>QTY (kg)</th>
              <th style="border-top-right-radius: 10px">Amount (Rs.)</th>
            </tr>
            ${additionalItemsRows}
          </table>
        </div>
      </div>` : ''}

      <!-- Grand Total Section -->
      <div class="section" style="margin-top: 30px">
        <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc;padding-bottom: 10px;" >
          <div class="bold">Grand Total for all items</div>
        </div>
        ${order?.isPackage === 1 ? `
        <div style="display: flex; justify-content: space-between; margin-right: 20px; " class="ptext" >
          <p>${order?.packageInfo?.displayName || 'Package'}</p>
          <p>Rs. ${(packagePrice + packingFee + serviceFee).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
        </div>` : ''}
        ${order?.additionalItems && order.additionalItems.length > 0 ? `
        <div style=" display: flex; justify-content: space-between; margin-right: 20px;" class="ptext" > 
          <p>${order?.isPackage === 1 ? 'Additional Items' : 'Custom Items'}</p>
          <p>Rs. ${additionalItemsTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
        </div>` : ''}
         ${order?.isPackage === 0 ? `
        <div style="display: flex; justify-content: space-between; margin-right: 20px; " class="ptext" >
          <p>Service Fee</p>
          <p>Rs. 180.00</p>
        </div>` : ''}
       
        <div style="display: flex; justify-content: space-between; margin-right: 20px;" class="ptext" >
          <p>Discount</p>
          <p> Rs. ${totaldiscount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-right: 20px;"class="ptext" >
          <p>Delivery Fee</p>
          <p>Rs. ${deliveryFee.toFixed(2)}</p>
        </div>

        <div style="margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;" ></div>
      </div>

      <!-- Payment Method Section -->
      <div style="margin-top: -10px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 600; margin-right: 20px;">
        <p>Grand Total</p>
        <p>Rs. ${(totalAmount ).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
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
      const tempFilePath = `${(FileSystem as any).cacheDirectory}${fileName}`;


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
          // Alert.alert(
          //   ('Invoice Ready'),
          //   ('To save to Downloads, select "Save to device" from the share menu'),
          //   [{ text: "OK" }]
          // );
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

  if (loading) {
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
      style={{flex: 1}}
      className="relative"
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
                Order No: #{order?.orderStatus?.invoiceNumber}
              </Text>
              <Text style={{ fontSize: 16 }} className="text-[#747474] text-center mt-5">
                Order Confirmation message and Payment Gateway Link has been sent to your Customer
              </Text>
            </View>

            <View className="flex items-center justify-center mt-5">
              <Image 
                source={require("../../assets/images/confirmed.webp")} 
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
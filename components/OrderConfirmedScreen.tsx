import React, { useEffect, useState } from "react";
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
import { RootStackParamList } from "./types";
import Navbar from "./Navbar";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

type OrderConfirmedScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderConfirmedScreen">;

interface OrderConfirmedScreenProps {
  navigation: OrderConfirmedScreenNavigationProp;
}

const OrderConfirmedScreen: React.FC<OrderConfirmedScreenProps> = ({ navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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
                    margin-top: 10px;
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
    
    <h1>Purchase Invoice</h1>
    <div class="section">
        <p class="bold">AgroWorld (Pvt) Ltd.</p>
        <p>Address: [Your Address]</p>
        <p>Contact: 07x-xxxxxxx</p>
        <p>Invoice Number: <strong>MPyyyyttmttdd</strong></p>
    </div>
</div>


                <div class="section">
                <div class="watermark">
        <img src="${watermarkBase64}" alt="Watermark" />
    </div>
                    <h2>Receiver Details</h2>
                    <p><span class="bold">Receiver’s Name:</span> John Doe</p>
                    <p><span class="bold">Phone Number:</span> 07x-xxxxxxx</p>
                    <p><span class="bold">Building Type:</span> Apartment</p>
                    <p><span class="bold">Address:</span> 123 Street, City</p>
                </div>
                <div class="section">
                    <h2>Payment Summary</h2>
                    <table>
                        <tr>
                            <th>Description</th>
                            <th>Amount (Rs.)</th>
                        </tr>
                        <tr>
                            <td>Subtotal</td>
                            <td>1000</td>
                        </tr>
                        <tr>
                            <td>Discount</td>
                            <td>-100</td>
                        </tr>
                        <tr>
                            <td>Coupon Discount</td>
                            <td>-50</td>
                        </tr>
                        <tr>
                            <td><strong>Grand Total</strong></td>
                            <td><strong>850</strong></td>
                        </tr>
                    </table>
                </div>
                <div class="section">
                    <h2>Payment Method</h2>
                    <p><span class="bold">Payment Method:</span> Credit Card</p>
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
  
  

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 bg-white px-2">
          <View style={{ paddingHorizontal: wp(6), paddingVertical: hp(1) }} className="flex-1">
            <View className="px-2">
              <Text style={{ fontSize: 20 }} className="text-black text-center mt-8 font-bold">
                Order is Confirmed!
              </Text>
              <Text style={{ fontSize: 18 }} className="text-[#3F3F3F] text-center mt-2">
                Order No : #24123105
              </Text>
              <Text style={{ fontSize: 16 }} className="text-[#747474] text-center mt-5">
                Order Confirmation message and Payment Gateway Link has been sent to your Customer
              </Text>
            </View>

            {/* Illustration */}
            <View className="flex items-center justify-center mt-5">
              <Image source={require("../assets/images/confirmed.png")} style={{ width: wp(80), height: hp(40) }} resizeMode="contain" />
            </View>

            {/* Download Invoice Button */}
            <TouchableOpacity onPress={handleDownloadInvoice} style={{ marginHorizontal: wp(20), marginTop: hp(7) }}>
              <LinearGradient colors={["#6839CF", "#874DDB"]} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 30, alignItems: "center" }}>
                <Text style={{ color: "white", fontWeight: "bold" }}>Download Invoice</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Navbar navigation={navigation} activeTab="CustomersScreen" />
    </KeyboardAvoidingView>
  );
};

export default OrderConfirmedScreen;

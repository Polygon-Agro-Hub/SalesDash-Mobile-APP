import { useEffect, useState } from "react";
import { Alert, Platform, StatusBar, LogBox } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LanguageProvider } from "@/context/LanguageContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import NavigationBar from "@/components/navigation/Navbar";
import Splash from "@/components/authentication/Splash";
import ChangePasswordScreen from "@/components/authentication/ChangePasswordScreen";
import LoginScreen from "@/components/authentication/LoginScreen";
import DashboardScreen from "@/components/dashboard/DashboardScreen";
import ViewScreen from "@/components/order/ViewScreen";
import CustomersScreen from "@/components/customer/CustomersScreen";
import SidebarScreen from "@/components/navigation/SidebarScreen";
import ProfileScreen from "@/components/authentication/ProfileScreen";
import AddComplaintScreen from "@/components/complain/AddComplaintScreen";
import ViewComplainScreen from "@/components/complain/ViewComplainScreen";
import ViewCustomerScreen from "@/components/customer/ViewCustomerScreen";
import ReminderScreen from "@/components/reminder/ReminderScreen";
import AddCustomersScreen from "@/components/customer/AddCustomersScreen";
import OtpScreen from "@/components/otp/OtpScreen";
import OtpSuccesfulScreen from "@/components/otp/OtpSuccesfulScreen";
import BannedScreen from "@/components/authentication/BannedScreen";
import EditCustomerScreen from "@/components/customer/EditCustomerScreen";
import OrderScreen from "@/components/order/OrderScreen";
import ScheduleScreen from "@/components/order/ScheduleScreen";
import SelectPaymentMethod from "@/components/order/SelectPaymentMethod";
import OrderSummeryScreen from "@/components/order/OrderSummeryScreen";
import OrderConfirmedScreen from "@/components/order/OrderConfirmedScreen";
import ViewOrdersScreen from "@/components/order/ViewOrdersScreen";
import View_CancelOrderScreen from "@/components/order/ViewCancelOrderScreen";
import SelectOrderType from "@/components/order/SelectOrderType";
import SelectOrderTypeNewCustomer from "@/components/order/SelectOrderTypeNewCustomer";
import CreateCustomPackage from "@/components/order/CreateCustomPackage";
import CratScreen from "@/components/order/CartScreen";
import ExcludeListAdd from "@/components/excludeItems/ExcludeListAdd";
import ExcludeListSummery from "@/components/excludeItems/ExcludeListSummery";
import ExcludeItemEditSummery from "@/components/excludeItems/ExcludeItemEditSummery";
import ExcludeAddMore from "@/components/excludeItems/ExcludeAddMore";
import PrivacyPolicy from "@/components/policies/PrivacyPolicy";
import TermsConditions from "@/components/policies/TermsConditions";
import NetInfo from "@react-native-community/netinfo";
import AttachGeoLocationScreen from "@/components/location/AttachGeoLocationScreen";
import ViewLocationScreen from "@/components/location/ViewLocationScreen";
import * as ExpoNavigationBar from "expo-navigation-bar";
import { AlertModal, setGlobalAlertListener } from "@/components/common/AlertModal";
import ResidentialAddress from "@/components/location/ResidentialAddress";
import DeliveryAddressBooks from "@/components/location/DeliveryAddressBooks";
import AddDeliveryAddress from "@/components/location/AddDeliveryAddress";
import DeliveryAddress from "@/components/order/DeliveryAddress";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
export const navigationRef = createNavigationContainerRef();

LogBox.ignoreLogs([
  "InteractionManager has been deprecated",
  "setBackgroundColorAsync is not supported with edge-to-edge enabled"
]);

function MainTabNavigator() {
  useEffect(() => {
    if (Platform.OS === "android") {
      ExpoNavigationBar.setBackgroundColorAsync("#D1D5DB");
      ExpoNavigationBar.setButtonStyleAsync("dark");
    }
  }, []);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: false,
        tabBarStyle: { position: "absolute", backgroundColor: "#fff" },
      })}
      tabBar={(props) => <NavigationBar {...props} />}
    >
      <Tab.Screen name="DashboardScreen" component={DashboardScreen} />
      <Tab.Screen name="ViewOrdersScreen" component={ViewOrdersScreen} />
      <Tab.Screen name="ReminderScreen" component={ReminderScreen} />
      <Tab.Screen name="EditCustomerScreen" component={EditCustomerScreen} />
      <Tab.Screen name="AddComplaintScreen" component={AddComplaintScreen} />
      <Tab.Screen
        options={{
          tabBarHideOnKeyboard: true,
          tabBarVisibilityAnimationConfig: {
            show: { animation: "timing", config: { duration: 0 } },
            hide: { animation: "timing", config: { duration: 0 } },
          },
        }}
        name="CustomersScreen"
        component={CustomersScreen}
      />
    
      <Tab.Screen
        name="OrderConfirmedScreen"
        component={OrderConfirmedScreen as any}
      />
      <Tab.Screen
        name="AddCustomersScreen"
        component={AddCustomersScreen as any}
      />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
      <Tab.Screen name="ViewComplainScreen" component={ViewComplainScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [isOfflineAlertShown, setIsOfflineAlertShown] = useState(false);
  const [alertState, setAlertState] = useState({
    visible: false,
    title: "",
    message: "" as string | React.ReactNode,
    type: "error" as "success" | "error",
    onClose: (() => {}) as () => void,
    autoClose: true,
    showOkButton: undefined as boolean | undefined,
  });

  useEffect(() => {
    setGlobalAlertListener((title, message, type, onClose, autoClose, showOkButton) => {
      setAlertState({
        visible: true,
        title,
        message,
        type,
        onClose: () => {
          setAlertState((prev) => ({ ...prev, visible: false }));
          if (onClose) {
            onClose();
          }
        },
        autoClose,
        showOkButton,
      });
    });
  }, []);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (!state.isConnected && !isOfflineAlertShown) {
        setIsOfflineAlertShown(true);
        Alert.alert(
          "No Internet Connection",
          "Please check your connection and try again.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsOfflineAlertShown(false);
              },
            },
          ],
        );
      }
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, [isOfflineAlertShown]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const errorResponse = error.response;
        if (
          errorResponse &&
          (errorResponse.status === 401 || errorResponse.status === 403) &&
          (errorResponse.data?.statusType === "not_approved" ||
            errorResponse.data?.statusType === "rejected" ||
            errorResponse.data?.statusType === "pending" ||
            errorResponse.data?.message === "This account is not approved" ||
            errorResponse.data?.message === "This account is rejected" ||
            errorResponse.data?.message === "Account status is pending verification")
        ) {
          let currentRouteName = "";
          if (navigationRef.isReady()) {
            const route = navigationRef.getCurrentRoute() as any;
            currentRouteName = route?.name || "";
          }

          if (currentRouteName !== "LoginScreen" && currentRouteName !== "Splash" && currentRouteName !== "BannedScreen") {
            try {
              // Clear auth tokens
              await AsyncStorage.multiRemove([
                "authToken",
                "tokenStoredTime",
                "tokenExpirationTime",
                "userToken",
              ]);

              if (navigationRef.isReady()) {
                navigationRef.reset({
                  index: 0,
                  routes: [{ 
                    name: "BannedScreen",
                    params: { 
                      statusType: errorResponse.data?.statusType,
                      message: errorResponse.data?.message 
                    }
                  }],
                });
              }
            } catch (e) {
              console.error("Failed to perform force logout:", e);
            }

            // Return a promise that never resolves or rejects to prevent component error logs
            return new Promise(() => {});
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
          paddingBottom: insets ? insets.bottom : 0,
          backgroundColor: "#fff",
        }}
        edges={["top", "right", "left"]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="SidebarScreen" component={SidebarScreen} />
              <Stack.Screen
        name="ViewCustomerScreen"
        component={ViewCustomerScreen as any}
      />
            <Stack.Screen name="OtpScreen" component={OtpScreen} />
            <Stack.Screen name="ViewScreen" component={ViewScreen as any} />
            <Stack.Screen name="OtpScreenUp" component={OtpScreen} />
            <Stack.Screen name="OrderScreen" component={OrderScreen as any} />
            <Stack.Screen name="CratScreen" component={CratScreen as any} />
            <Stack.Screen
              name="SelectOrderType"
              component={SelectOrderType as any}
            />

            <Stack.Screen
              name="ChangePasswordScreen"
              component={ChangePasswordScreen}
            />
            <Stack.Screen
              name="OtpSuccesfulScreen"
              component={OtpSuccesfulScreen as any}
            />
            <Stack.Screen
              name="BannedScreen"
              component={BannedScreen as any}
            />
            <Stack.Screen
              name="ScheduleScreen"
              component={ScheduleScreen as any}
            />
            <Stack.Screen
              name="SelectPaymentMethod"
              component={SelectPaymentMethod as any}
            />
            <Stack.Screen
              name="OrderSummeryScreen"
              component={OrderSummeryScreen as any}
            />
            <Stack.Screen
              name="View_CancelOrderScreen"
              component={View_CancelOrderScreen as any}
            />
            <Stack.Screen
              name="CreateCustomPackage"
              component={CreateCustomPackage as any}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicy as any}
            />
            <Stack.Screen
              name="ViewLocationScreen"
              component={ViewLocationScreen as any}
            />
           
            <Stack.Screen
              name="AttachGeoLocationScreen"
              component={AttachGeoLocationScreen as any}
            />
            <Stack.Screen
              name="TermsConditions"
              component={TermsConditions as any}
            />
            <Stack.Screen
              name="ExcludeListAdd"
              component={ExcludeListAdd as any}
            />
            <Stack.Screen
              name="ExcludeListSummery"
              component={ExcludeListSummery as any}
            />
            <Stack.Screen
              name="SelectOrderTypeNewCustomer"
              component={SelectOrderTypeNewCustomer as any}
            />
            <Stack.Screen
              name="ExcludeAddMore"
              component={ExcludeAddMore as any}
            />
            <Stack.Screen
              name="ExcludeItemEditSummery"
              component={ExcludeItemEditSummery as any}
            />
            <Stack.Screen
              name="ResidentialAddress"
              component={ResidentialAddress as any}
            />
            <Stack.Screen
              name="DeliveryAddressBooks"
              component={DeliveryAddressBooks as any}
            />
            <Stack.Screen
              name="AddDeliveryAddress"
              component={AddDeliveryAddress as any}
            />
             <Stack.Screen
              name="DeliveryAddress"
              component={DeliveryAddress as any}
            />
            <Stack.Screen name="Main" component={MainTabNavigator} />
          </Stack.Navigator>
        </NavigationContainer>
        <AlertModal
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          onClose={alertState.onClose}
          autoClose={alertState.autoClose}
          showOkButton={alertState.showOkButton}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

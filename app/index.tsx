import React from 'react'
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Splash from '@/components/Splash';
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler';
import * as ScreenCapture from 'expo-screen-capture';
import { LanguageProvider } from '@/context/LanguageContext';
import ChangePasswordScreen from '@/components/ChangePasswordScreen';
import LoginScreen from '@/components/LoginScreen';
import DashboardScreen from '@/components/DashboardScreen';
import ViewScreen from '@/components/ViewScreen';
import CustomersScreen from '@/components/CustomersScreen';
import SidebarScreen from '@/components/SidebarScreen';
import ProfileScreen from '@/components/ProfileScreen';
import AddComplaintScreen from '@/components/AddComplaintScreen';
import ViewComplainScreen from '@/components/ViewComplainScreen';
import ViewCustomerScreen from '@/components/ViewCustomerScreen';
import ReminderScreen from '@/components/ReminderScreen';
import AddCustomersScreen from '@/components/AddCustomersScreen';
import OtpScreen from '@/components/OtpScreen';
import OtpSuccesfulScreen from '@/components/OtpSuccesfulScreen';
import EditCustomerScreen from '@/components/EditCustomerScreen';
import OtpScreenUp from '@/components/OtpScreenUp';
import OrderScreen from '@/components/OrderScreen';
import ScheduleScreen from '@/components/ScheduleScreen';
import SelectPaymentMethod from '@/components/SelectPaymentMethod';
import OrderSummeryScreen from '@/components/OrderSummeryScreen';
import OrderConfirmedScreen from '@/components/OrderConfirmedScreen';
import ViewOrdersScreen from '@/components/ViewOrdersScreen';
import View_CancelOrderScreen from '@/components/View_CancelOrderScreen'
import NavigationBar from "@/components/Navbar";
import SelectOrderType from "@/components/SelectOrderType";
import SelectOrderTypeNewCustomer from "@/components/SelectOrderTypeNewCustomer"
import CreateCustomPackage from "@/components/CreateCustomPackage";
import CratScreen from "@/components/CratScreen"
import ExcludeListAdd from "@/components/ExcludeListAdd"
import ExcludeListSummery from "@/components/ExcludeListSummery"
import ExcludeItemEditSummery from "@/components/ExcludeItemEditSummery"
import ExcludeAddMore from '@/components/ExcludeAddMore'
 
import { RootStackParamList } from '@/components/types';
import { Provider, useSelector } from 'react-redux';
import  store, { RootState } from "@/services/reducxStore";


const Stack = createStackNavigator(); 
// (Text as any).defaultProps = {
//   ...(Text as any).defaultProps,
//   allowFontScaling: false,
// };

// (TextInput as any).defaultProps = {
//   ...(TextInput as any).defaultProps,
//   allowFontScaling: false,
// };

const Tab = createBottomTabNavigator();
//const Stack = createNativeStackNavigator(); 
// const Stack = createStackNavigator<RootStackParamList>();
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: { display: 'none' }, 
        headerShown: false,
      })}
      
      tabBar={(props) => <NavigationBar {...props} />}
    >
      <Tab.Screen name="DashboardScreen" component={DashboardScreen} />
      <Tab.Screen name="ViewOrdersScreen" component={ViewOrdersScreen} />
      <Tab.Screen name="ReminderScreen" component={ReminderScreen} />
      <Tab.Screen name="CustomersScreen" component={CustomersScreen} />
      <Tab.Screen name="ViewComplainScreen" component={ViewComplainScreen} />
      {/* <Tab.Screen name="SidebarScreen" component={SidebarScreen} /> */}
      <Tab.Screen name="ViewScreen" component={ViewScreen as any} />
      <Tab.Screen name="ViewCustomerScreen" component={ViewCustomerScreen as any} />
      <Tab.Screen name="EditCustomerScreen" component={EditCustomerScreen} />
      <Tab.Screen name="SelectOrderType" component={SelectOrderType as any} />
      <Tab.Screen name="SelectOrderTypeNewCustomer" component={SelectOrderTypeNewCustomer as any} />
      <Tab.Screen name="OrderConfirmedScreen" component={OrderConfirmedScreen as any} />
      <Tab.Screen name="OtpSuccesfulScreen" component={OtpSuccesfulScreen as any} />
            <Tab.Screen name="AddComplaintScreen" component={AddComplaintScreen} />
            <Tab.Screen name="ExcludeListAdd" component={ExcludeListAdd as any} />
            <Tab.Screen name="ExcludeListSummery" component={ExcludeListSummery as any} />
            <Tab.Screen name="ExcludeItemEditSummery" component={ExcludeItemEditSummery as any} />
            <Tab.Screen name="ExcludeAddMore" component={ExcludeAddMore as any} />
             <Tab.Screen name="AddCustomersScreen" 
             component={AddCustomersScreen} 
             
             />
    </Tab.Navigator>
  );
}
const index = () => {
  
    // Prevent screenshots and screen recording
    // ScreenCapture.usePreventScreenCapture()

  return (
    <Provider store={store}>
    <LanguageProvider>
    <GestureHandlerRootView >
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
      {/* <Stack.Screen name="DashboardScreen" component={DashboardScreen} /> */}
      {/* <Stack.Screen name="ViewScreen" component={ViewScreen as any} /> */}
      {/* <Stack.Screen name="CustomersScreen" component={CustomersScreen} /> */}
      <Stack.Screen name="SidebarScreen" component={SidebarScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      {/* <Stack.Screen name="AddComplaintScreen" component={AddComplaintScreen} /> */}
      {/* <Stack.Screen name="ViewComplainScreen" component={ViewComplainScreen} /> */}
      {/* <Stack.Screen name="ViewCustomerScreen" component={ViewCustomerScreen as any} /> */}
      {/* <Stack.Screen name="ReminderScreen" component={ReminderScreen} /> */}
      {/* <Stack.Screen name="AddCustomersScreen" component={AddCustomersScreen} /> */}
      <Stack.Screen name="OtpScreen" component={OtpScreen} />
      <Stack.Screen name="OtpScreenUp" component={OtpScreenUp} />
      {/* <Stack.Screen name="OtpSuccesfulScreen" component={OtpSuccesfulScreen as any} /> */}
      {/* <Stack.Screen name="EditCustomerScreen" component={EditCustomerScreen} /> */}
      <Stack.Screen name="OrderScreen" component={OrderScreen as any} />
      <Stack.Screen name="ScheduleScreen" component={ScheduleScreen as any} />
      <Stack.Screen name="SelectPaymentMethod" component={SelectPaymentMethod as any} />
      <Stack.Screen name="OrderSummeryScreen" component={OrderSummeryScreen as any} />
      {/* <Stack.Screen name="OrderConfirmedScreen" component={OrderConfirmedScreen as any} /> */}
      {/* <Stack.Screen name="ViewOrdersScreen" component={ViewOrdersScreen} /> */}
      <Stack.Screen name="View_CancelOrderScreen" component={View_CancelOrderScreen as any} /> 
      {/* <Stack.Screen name="SelectOrderType" component={SelectOrderType as any} /> */}
      <Stack.Screen name="CreateCustomPackage" component={CreateCustomPackage as any} />
      <Stack.Screen name="CratScreen" component={CratScreen as any} />
      <Stack.Screen name="Main" component={MainTabNavigator} />

      
    </Stack.Navigator>
   </GestureHandlerRootView>
    </LanguageProvider>
    </Provider>
  )
}

export default index


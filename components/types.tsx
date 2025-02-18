


export type RootStackParamList = {
    Splash: undefined;
    LoginScreen: undefined;
    ChangePasswordScreen: undefined;
    DashboardScreen: undefined;
   ViewScreen: {selectedPackage:string};
  
    CustomersScreen: undefined;
    SidebarScreen: undefined;
    ProfileScreen: undefined;
    AddComplaintScreen: undefined;
    ViewComplainScreen: undefined;
    ViewCustomerScreen: {number:string,name:string, customerId:string , id: string}; // Update this type
    ReminderScreen: undefined;
    AddCustomersScreen: undefined;
    OtpScreen:{phoneNumber:string , id: string};
    OtpSuccesfulScreen:undefined;
    EditCustomerScreen:{ id: string}; 
    OtpScreenUp:{phoneNumber:string , id: string};      
    OrderScreen:undefined;
    ScheduleScreen: {totalPrice: Number };
    SelectPaymentMethod: undefined;
    OrderSummeryScreen:undefined;
    OrderConfirmedScreen:undefined;
    ViewOrdersScreen:undefined;
    View_CancelOrderScreen:undefined;

  };
  
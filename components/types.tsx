


export type RootStackParamList = {
    Splash: undefined;
    LoginScreen: undefined;
    ChangePasswordScreen: undefined;
    DashboardScreen: undefined;
    
   //ViewScreen: {selectedPackage:string};
 ViewScreen: { 
    selectedPackageId: number;
    selectedPackageName: string;
    selectedPackageTotal: string;
    selectedPackageDescription:string;
    selectedPackageportion:number;
    selectedPackageperiod:number;
  
  };
  
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
    OtpScreenUp:{phoneNumber:string , id: string, token:string};      
    //OrderScreen:undefined;
    OrderScreen: { id: string };
   // OrderScreen: { itemId: number | null }; 
    ScheduleScreen: {totalPrice: Number };
    SelectPaymentMethod: undefined;
    OrderSummeryScreen:undefined;
    OrderConfirmedScreen:undefined;
    ViewOrdersScreen:undefined;
    View_CancelOrderScreen:{orderId:number};
    Main: { screen: keyof RootStackParamList; params?: any };
  };
  
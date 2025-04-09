export interface CartItem {
  id: number;
  name: string;
  price: number;
  normalPrice: number;
  discountedPrice: number;
  quantity: number;
  selected: boolean;
  unitType: string;
  startValue: number;
  changeby: number;
}

export interface PackageItem {
  packageId: number;
  isModifiedPlus: boolean;
  isModifiedMin: boolean;
  isAdditionalItems: boolean;
  packageTotal: number;
  packageDiscount: number;
  modifiedPlusItems: ModifiedPlusItem[];
  modifiedMinItems: ModifiedMinItem[];
  additionalItems: AdditionalItem[];
}

interface ModifiedPlusItem {
  packageDetailsId: number;
  originalQuantity: number;
  modifiedQuantity: number;
  originalPrice: number | string;
  additionalPrice: number;
  additionalDiscount: number;
}

interface ModifiedMinItem {
  packageDetailsId: number;
  originalQuantity: number;
  modifiedQuantity: number;
  originalPrice: number | string;
  additionalPrice: number;
  additionalDiscount: number;
}

interface AdditionalItem {
  mpItemId: number;
  quantity: number;
  price: number;
  discount: number;
}


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
    OrderScreen: {id: string; isCustomPackage:string; isSelectPackage:string;};
   // OrderScreen: { itemId: number | null }; 
    ScheduleScreen: {totalPrice: Number };
   // SelectPaymentMethod: undefined;
   // OrderSummeryScreen:undefined;
    //OrderConfirmedScreen:undefined;
    ViewOrdersScreen:undefined;
    View_CancelOrderScreen:{orderId:number};
    SelectOrderType:undefined;
    CreateCustomPackage :{id: string; isCustomPackage:string; isSelectPackage:string;};
   // CratScreen:undefined;
   CratScreen: {
    selectedProducts: CartItem[];
    id: string; 
  };
    Main: { screen: keyof RootStackParamList; params?: any };
    SelectPaymentMethod: {
      items: CartItem[];
      subtotal: number;
      discount: number;
      total: number;
      fullTotal: number;
      selectedDate: string;
      selectedTimeSlot: string;
    };
    OrderSummeryScreen: {
      items?: CartItem[];
      subtotal?: number;
      discount?: number;
      total?: number;
      fullTotal?: number;
      selectedDate?: string;
      selectedTimeSlot?: string;
      paymentMethod?: string;
      customerId?: string | number;
      customerid?: string | number;
      isSelectPackage?: number;
      isCustomPackage?: number;
      packageId?: number;
      orderItems?: PackageItem[]; // Add this line to include orderItems
    };
    OrderConfirmedScreen: {
      orderId: number;
      total: number;
      subtotal:number,
      discount:number,
      paymentMethod: string;
      customerId: string | number;
      customerid?: string | number;
      items?: Array<CartItem>;
      selectedDate: string;
      selectedTimeSlot: string;
      orderData?: any;
    
    };
  };
  
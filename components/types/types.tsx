export interface CartItem {
  id: number;
  name: string;
  price: number;
  discount: number;
  qty: string;
  normalPrice: number;
  discountedPrice: number;
  quantity: number;
  selected: boolean;
  unitType: string;
  startValue: number;
  changeby: number;
  title: string;
}

export interface PackageItem {
  originalPackageDetails: any;
  packageId: number;
  isModifiedPlus: boolean;
  isModifiedMin: boolean;
  isAdditionalItems: boolean;
  packageTotal: number;
  packageDiscount: number;
  modifiedPlusItems: ModifiedPlusItem[];
  modifiedMinItems: ModifiedMinItem[];
  additionalItems: AdditionalItem[];
  finalOrderPackageList?: Array<{
    discount: number;
    packageDetailId: any;
    itemId: any;
    id: any;
    productName: string;
    productId: number;
    quantity: number;
    price: number | string;
    isPacking: number;
  }>;
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

export interface AdditionalItem {
  unit: any;
  qty: any;
  productId: any;
  id: number | string;
  mpItemId: number;
  quantity: number;
  price: number;
  discount: number;
}

// Full shape of an additional item as carried through the nav chain (rawAdditionalItems)
export interface RawAdditionalItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  pricePerKg: number;
  discountedPricePerKg: number;
  discount: number;
  totalAmount: number;
  selected: boolean;
  changeby?: string;
  startValue?: string;
}

// Full shape of a package item as carried through the nav chain (rawPackageItems)
export interface RawPackageItem {
  name: string;
  qty: string;
}

export type RootStackParamList = {
  Splash: undefined;
  LoginScreen: undefined;
  ChangePasswordScreen: undefined;
  DashboardScreen: undefined;
  CustomersScreen: undefined;
  SidebarScreen: undefined;
  ProfileScreen: undefined;
  AddComplaintScreen: undefined;
  ViewComplainScreen: undefined;
  ViewOrdersScreen: undefined;
  ReminderScreen: undefined;
  SelectOrderType: {
    id?: string;
    customerId?: string;
    title?: string;
    name?: string;
    number?: string;
    customerscreencustomerid?: string;
  };
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  SelectOrderTypeNewCustomer: {
    id: number;
    name: string;
    title: string;
    customerId: string;
    phoneNumber: string;
  };
  Main: {
    screen: keyof RootStackParamList;
    params?: any;
  };
  ViewScreen: {
    selectedPackageId: number;
    selectedPackageName: string;
    selectedPackageImage: string;
    selectedPackageproductPrice: string;
    selectedPackagepackingFee: string;
    selectedPackageserviceFee: string;
    selectedPackageDescription: string;
    selectedPackageportion: number;
    selectedPackageperiod: number;
  };
  ViewCustomerScreen: {
    number: string;
    name: string;
    customerId: string;
    id: string;
    title: string;
  };
  AddCustomersScreen: {
    selectedLatitude?: number;
    selectedLongitude?: number;
    selectedLocationName?: string;
    preserveData?: boolean;
  };
  ViewLocationScreen: {
    latitude: number;
    longitude: number;
    locationName?: string;
    preserveData?: boolean;
  };
  OtpScreen: {
    phoneNumber: string;
    id: string;
  };
  OrderConfimedOTPScreen:{
    phoneNumber: string;
  }
  OtpSuccesfulScreen: {
    customerId?: number | string;
    name?: string;
    number?: string;
    title?: string;
    id?: string;
  };
  BannedScreen: {
    statusType?: "not_approved" | "rejected" | "pending";
    message?: string;
  };
  EditCustomerScreen: {
    id: string;
    customerId: string;
    name: string;
    title: string;
  };
  OtpScreenUp: {
    phoneNumber: string;
    id: string;
    token: string;
  };
  OrderScreen: {
    id: string;
    isPackage: string;
    isCustomPackage?: string;
    isSelectPackage?: string;
    customerId: string;
    name: string;
    title: string;
    number: string;
    customerscreencustomerid: string;
    isEdit?: boolean;
    packageId?: number;
    packageItems?: Array<{
      id: number;
      name: string;
      quantity: string;
      quantityType: string;
      price: number;
    }>;
    additionalItems?: Array<{
      pricePerKg?: number;
      discountedPricePerKg?: number;
      totalPrice?: number;
      mpItemId?: number;
      productId?: number;
      id: number;
      name: string;
      quantity: string;
      quantityType: string;
      price: number;
      discount: string;
      cropId?: number;
      changeby?: string;
      startValue?: string;
      unitType?: string;
    }>;
    orderItems?: PackageItem[];
    subtotal?: number;
    discount?: number;
    total?: number;
    fullTotal?: number;
    selectedDate?: string;
    selectedTimeSlot?: string;
    timeDisplay?: string;
    paymentMethod?: string;
    orderData?: {
      additionalItems?: AdditionalItem[];
      [key: string]: any;
    };
  };
  ScheduleScreen: {
    totalPrice?: number;
    items?: CartItem[];
    subtotal?: number;
    discount?: number;
    total?: number;
    fullTotal?: number;
    id?: string;
    customerId?: string;
    customerid?: string;
    title?: string;
    name?: string;
    number?: string;
    customerscreencustomerid?: string;
    selectedDate?: string;
    selectedTimeSlot?: string;
    timeDisplay?: string;
    isPackage?: string | number;
    packageId?: number | null;
    rawPackageItems?: RawPackageItem[];
    rawAdditionalItems?: RawAdditionalItem[];
    orderItems?: PackageItem[];
    orderData?: {
      additionalItems?: AdditionalItem[];
      [key: string]: any;
    };

    fromOrderSummary?: boolean;
    selectedAddress?: any;
    deliveryCharge?: number;
    isFinalizeImdt?: number;
  };
  SelectPaymentMethod: {
    items?: CartItem[];
    subtotal?: number;
    discount?: number;
    total?: number;
    fullTotal?: number;
    selectedDate?: string;
    selectedTimeSlot?: string;
    timeDisplay?: string;
    sheduleTime?: string;
    sheduleDate?: string;

    id?: string;
    customerId?: string;
    customerid?: string;

    title?: string;
    name?: string;
    number?: string;
    customerscreencustomerid?: string;

    isPackage?: number | string;
    packageId?: number;

    selectedMethod?: "Card" | "Cash" | null;

    rawPackageItems?: RawPackageItem[];
    rawAdditionalItems?: RawAdditionalItem[];

    orderItems?: PackageItem[];
    orderData?: {
      additionalItems?: AdditionalItem[];
      [key: string]: any;
    };

    selectedAddress?: any;
    deliveryCharge?: number;
    isFinalizeImdt?: number;
  };
  OrderSummeryScreen: {
    items?: CartItem[];
    subtotal?: number;
    discount?: number;
    total?: number;
    fullTotal?: number;
    selectedDate?: string;
    selectedTimeSlot?: string;
    timeDisplay?: string;
    sheduleTime?: string;
    sheduleDate?: string;
    deliveryCharge?: number;
    paymentMethod?: string;

    customerId?: string | number;
    customerid?: string | number;
    id?: string;

    title?: string;
    name?: string;
    number?: string;
    customerscreencustomerid?: string;

    isPackage?: number | string;
    packageId?: number;

    rawPackageItems?: RawPackageItem[];
    rawAdditionalItems?: RawAdditionalItem[];

    orderItems?: PackageItem[];
    orderData?: {
      additionalItems?: AdditionalItem[];
      [key: string]: any;
    };

    selectedAddress?: any;
    isFinalizeImdt?: number;
  };
  OrderConfirmedScreen: {
    orderId: number;
    total: number;
    subtotal: number;
    discount: number;
    paymentMethod: string;
    customerId: string | number;
    customerid?: string | number;
    items?: Array<CartItem>;
    selectedDate: string;
    selectedTimeSlot: string;
    orderData?: any;
    isPackage: number;
  };
  View_CancelOrderScreen: {
    orderId: number;
    userId: number;
    status: string;
    reportStatus: string | null;
  };
  AttachGeoLocationScreen: {
    currentLatitude?: number;
    currentLongitude?: number;
    onLocationSelect?: (
      latitude: number,
      longitude: number,
      locationName: string,
    ) => void;
    preserveData?: boolean;
  };
  AttachGeoLocationScreenEdit: {
    currentLatitude?: number;
    currentLongitude?: number;
    onLocationSelect?: (
      latitude: number,
      longitude: number,
      locationName: string,
    ) => void;
  };
  CreateCustomPackage: {
    id: string;
    isCustomPackage: string;
    isSelectPackage: string;
  };
  CratScreen: {
    selectedProducts: CartItem[];
    id: string;
    customerId?: string;
    title?: string;
    name?: string;
    number?: string;
    customerscreencustomerid?: string;
    isPackage?: number;
    items?: CartItem[];
    subtotal?: number;
    discount?: number;
    total?: number;
    fullTotal?: number;
    selectedDate?: string;
    selectedTimeSlot?: string;
    timeDisplay?: string;
    paymentMethod?: string;
    fromOrderSummary?: boolean;
  };
  ExcludeListAdd: {
    customerId: number;
    name?: string;
    title?: string;
    number?: string;
    id?: number;
  };
  ExcludeListSummery: {
    customerId: number;
    name?: string;
    title?: string;
    phoneNumber?: string;
    cusId?: string;
    id?: number;
  };
  ExcludeItemEditSummery: {
    id: string;
    customerId: string;
    name: string;
    title: string;
    phone:string;
  };
  ExcludeAddMore: {
    id: string;
    customerId: string;
    name: string;
    title: string;
  };
  ResidentialAddress: {
    customerId: string;
  };
  DeliveryAddressBooks: {
    customerId: string;
  };
  AddDeliveryAddress: {
    customerId: string;
  };
  DeliveryAddress: {
    customerId: string;
    selectedAddressId?: number;
    onSelectAddress?: (address: any) => void;
    items?: any[];
    subtotal?: number;
    discount?: number;
    total?: number;
    fullTotal?: number;
    id?: string;
    isPackage?: any;
    customerscreencustomerid?: string;
    number?: string;
    title?: string;
    name?: string;
    rawPackageItems?: any[];
    rawAdditionalItems?: any[];
    orderItems?: any[];
    orderData?: any;
    selectedDate?: string;
    timeDisplay?: string;
    selectedTimeSlot?: string;
    paymentMethod?: string;
    selectedAddress?: any;
    deliveryCharge?: number;
    isFinalizeImdt?: number;
  };
  PackageConfirmation: {
    id?: string;
    customerId?: string;
    name?: string;
    title?: string;
    isPackage?: any;
    packageId?: number | null;
    total?: number;
    fullTotal?: number;
    discount?: number;
    orderData?: any;
    rawPackageItems?: any[];
    rawAdditionalItems?: any[];
    number?: string;
    customerscreencustomerid?: string;
  };
  OnlinePayment:{
    
  };
  OnlinePaymentStatus: {
    orderId?: number | string;
    customerId?: string | number;
    name?: string;
    title?: string;
    number?: string;
    isPackage?: any;
    total?: number;
    subtotal?: number;
    discount?: number;
    selectedDate?: string;
    selectedTimeSlot?: string;
    paymentMethod?: string;
    currentStep?: number;
    id?: string | number;
    customerid?: string | number;
    customerscreencustomerid?: string | number;
  };
};

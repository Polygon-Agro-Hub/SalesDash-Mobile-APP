import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Unique SalesDash namespaces to prevent collision with other Expo apps on the same device
const BIOMETRIC_ENABLED_KEY = "salesdash_isBiometricEnabled_v1";
const SECURE_EMP_ID_KEY = "salesdash_biometric_emp_id_v1";
const SECURE_PASSWORD_KEY = "salesdash_biometric_password_v1";

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: "com.polygonagro.SalesDash",
};

export interface BiometricAvailability {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricTypes: LocalAuthentication.AuthenticationType[];
}

export const checkBiometricAvailability = async (): Promise<BiometricAvailability> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return { hasHardware, isEnrolled, biometricTypes };
  } catch (error) {
    console.warn("Error checking biometric availability:", error);
    return { hasHardware: false, isEnrolled: false, biometricTypes: [] };
  }
};

export const getBiometricTypeLabel = async (): Promise<string> => {
  try {
    const { biometricTypes } = await checkBiometricAvailability();
    if (biometricTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return "Face ID";
    }
    if (biometricTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "Fingerprint";
    }
    return "Biometrics";
  } catch {
    return "Biometrics";
  }
};

export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const creds = await getBiometricCredentials();
    return Boolean(creds?.empId && creds?.password);
  } catch (error) {
    console.warn("Error checking if biometric is enabled:", error);
    return false;
  }
};

export const saveBiometricCredentials = async (
  empId: string,
  password: string,
): Promise<boolean> => {
  try {
    const cleanEmpId = empId.trim().toUpperCase();

    // Store in SalesDash isolated keychain / keystore
    await SecureStore.setItemAsync(SECURE_EMP_ID_KEY, cleanEmpId, STORE_OPTIONS);
    await SecureStore.setItemAsync(SECURE_PASSWORD_KEY, password, STORE_OPTIONS);
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");

    // Clean any legacy un-namespaced keys from other Expo apps to prevent leakage
    await SecureStore.deleteItemAsync("biometric_emp_id").catch(() => {});
    await SecureStore.deleteItemAsync("biometric_password").catch(() => {});

    return true;
  } catch (error) {
    console.error("Error saving biometric credentials:", error);
    return false;
  }
};

export const getBiometricCredentials = async (): Promise<{
  empId: string;
  password: string;
} | null> => {
  try {
    // 1. Check namespaced SalesDash store first
    let empId = await SecureStore.getItemAsync(SECURE_EMP_ID_KEY, STORE_OPTIONS);
    let password = await SecureStore.getItemAsync(SECURE_PASSWORD_KEY, STORE_OPTIONS);

    // 2. Validate that the empId belongs to SalesDash (must start with "SA")
    if (empId && password && empId.trim().toUpperCase().startsWith("SA")) {
      return { empId: empId.trim().toUpperCase(), password };
    }

    // 3. If an old non-SalesDash ID is stored (e.g. "DRV..."), purge it immediately
    if (empId && !empId.trim().toUpperCase().startsWith("SA")) {
      console.warn("Purging foreign credential from SalesDash biometric store:", empId);
      await clearBiometricCredentials();
    }

    return null;
  } catch (error) {
    console.error("Error retrieving biometric credentials:", error);
    return null;
  }
};

export const clearBiometricCredentials = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(SECURE_EMP_ID_KEY, STORE_OPTIONS).catch(() => {});
    await SecureStore.deleteItemAsync(SECURE_PASSWORD_KEY, STORE_OPTIONS).catch(() => {});
    await SecureStore.deleteItemAsync("biometric_emp_id").catch(() => {});
    await SecureStore.deleteItemAsync("biometric_password").catch(() => {});
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "false");
  } catch (error) {
    console.warn("Error clearing biometric credentials:", error);
  }
};

export const authenticateWithBiometrics = async (
  promptMessage = "Log in with Biometrics",
): Promise<boolean> => {
  try {
    const { hasHardware, isEnrolled } = await checkBiometricAvailability();
    if (!hasHardware || !isEnrolled) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Cancel",
      fallbackLabel: "Use Password",
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error("Biometric authentication failed:", error);
    return false;
  }
};

export default {
  checkBiometricAvailability,
  getBiometricTypeLabel,
  isBiometricEnabled,
  saveBiometricCredentials,
  getBiometricCredentials,
  clearBiometricCredentials,
  authenticateWithBiometrics,
};

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Unique SalesDash namespaces to prevent collision with other Expo apps on the same device
const BIOMETRIC_ENABLED_KEY = "salesdash_isBiometricEnabled_v1";
const SECURE_EMP_ID_KEY = "salesdash_biometric_emp_id_v1";
const SECURE_PASSWORD_KEY = "salesdash_biometric_password_v1";
export const CURRENT_EMP_ID_KEY = "salesdash_current_emp_id";

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

// Debug helper. NOTE: on Android this list can be incomplete (e.g. some Samsung
// phones report only fingerprint while the system prompt still offers face),
// so never use it to hide or block face unlock.
export const getBiometricSupport = async (): Promise<{
  supportsFace: boolean;
  supportsFingerprint: boolean;
}> => {
  const { biometricTypes } = await checkBiometricAvailability();
  const supportsFace = biometricTypes.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  );
  const supportsFingerprint = biometricTypes.includes(
    LocalAuthentication.AuthenticationType.FINGERPRINT,
  );
  console.log("Biometric support:", { biometricTypes, supportsFace, supportsFingerprint });
  return { supportsFace, supportsFingerprint };
};

export const getBiometricTypeLabel = async (): Promise<string> => {
  try {
    // On Android the system prompt decides what is offered (face and/or
    // fingerprint), so use a generic label that is correct on every phone.
    if (Platform.OS === "android") return "Biometrics";

    const { supportsFace, supportsFingerprint } = await getBiometricSupport();
    if (supportsFace && supportsFingerprint) return "Face ID / Touch ID";
    if (supportsFace) return "Face ID";
    if (supportsFingerprint) return "Touch ID";
    return "Biometrics";
  } catch {
    return "Biometrics";
  }
};

export const isBiometricEnabled = async (currentEmpId?: string): Promise<boolean> => {
  try {
    // 1. Check flag in AsyncStorage
    const enabledFlag = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    const legacyFlag = await AsyncStorage.getItem("isBiometricEnabled");
    const isFlagTrue =
      enabledFlag === "true" || (enabledFlag === null && legacyFlag === "true");
    if (!isFlagTrue) {
      return false;
    }

    // 2. Check credentials in SecureStore
    const creds = await getBiometricCredentials();
    if (!creds?.empId || !creds?.password) {
      return false;
    }

    // 3. Match against current user if provided or stored
    let targetId = currentEmpId?.trim().toUpperCase();
    if (!targetId) {
      const storedCurrentId = await AsyncStorage.getItem(CURRENT_EMP_ID_KEY);
      if (storedCurrentId) {
        targetId = storedCurrentId.trim().toUpperCase();
      }
    }

    if (targetId && creds.empId.trim().toUpperCase() !== targetId) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Error checking if biometric is enabled:", error);
    return false;
  }
};

export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  try {
    const val = enabled ? "true" : "false";
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, val);
    await AsyncStorage.setItem("isBiometricEnabled", val);
  } catch (error) {
    console.warn("Error setting biometric enabled state:", error);
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
    await AsyncStorage.setItem("isBiometricEnabled", "true");

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
    const empId = await SecureStore.getItemAsync(SECURE_EMP_ID_KEY, STORE_OPTIONS);
    const password = await SecureStore.getItemAsync(SECURE_PASSWORD_KEY, STORE_OPTIONS);

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
    await AsyncStorage.setItem("isBiometricEnabled", "false");
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
      fallbackLabel: "Use Password", // iOS only
      disableDeviceFallback: false,
      // Android only: also allow weaker (Class 2) biometrics such as face unlock,
      // on phones where the manufacturer exposes it to apps.
      biometricsSecurityLevel: "weak",
    });

    return result.success;
  } catch (error) {
    console.error("Biometric authentication failed:", error);
    return false;
  }
};

export default {
  checkBiometricAvailability,
  getBiometricSupport,
  getBiometricTypeLabel,
  isBiometricEnabled,
  setBiometricEnabled,
  saveBiometricCredentials,
  getBiometricCredentials,
  clearBiometricCredentials,
  authenticateWithBiometrics,
  CURRENT_EMP_ID_KEY,
};

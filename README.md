# SalesDash — Sales Agent Mobile Client

Welcome to the mobile application for **SalesDash**, a cross-platform mobile client designed for sales agents. This app manages customer accounts, sales orders, product catalogs, customer complaints, reminders, payment processing, delivery addresses, and real-time notifications.

Developed and maintained by **Polygon Holdings Private Limited**.

---

## 🚀 Features

*   **Secure Authentication & Role Management**: Sales agent authentication, token persistence with AsyncStorage, session validation, and password management.
*   **Order Management & Creation**:
    *   Browse product packages, custom packages, schedule orders, and exclude items.
    *   Payment method selection (Cash, Card, Online payment verification).
    *   Order confirmation with OTP verification.
*   **Customer Directory & Profiling**: Add, view, and edit customer details with geolocation tagging and residential address management.
*   **Real-time Notifications**: Socket.IO integration for live real-time notifications and unread badge counters.
*   **Complaints Management**: Log and monitor customer complaints.
*   **Network & Offline Handling**: Real-time network connectivity monitoring with automated offline alerts.
*   **Privacy & Permissions**:
    *   **iOS App Tracking Transparency (ATT)**: Dynamic permission requests for iOS 14+ via native ATTrackingManager.
    *   **Android Policy Compliance**: Blocked `AD_ID` permission and ProGuard/R8 obfuscation optimization.

---

## 🛠️ Technology Stack

*   **Framework**: Expo SDK 54 / React Native (v0.81.5) with TypeScript
*   **State Management**: Redux Toolkit & React Context
*   **Navigation**: React Navigation (Bottom Tabs & Stack Navigator) with Expo Router
*   **Styling**: TailwindCSS via NativeWind (v4)
*   **Networking**: Axios & Socket.io-client
*   **Hardware & Native Integrations**:
    *   `expo-camera` (document and camera scanning)
    *   `expo-location` (geo-location mapping)
    *   `expo-tracking-transparency` (iOS App Tracking Transparency)
    *   `expo-notifications` (push notifications)
    *   `expo-audio` / `react-native-webview`

---

## 📁 Project Structure

```
SalesDash-Mobile-APP/
├── .expo/                # Expo development build files
├── app/                  # App entry points & navigation
│   └── App.tsx           # Root navigation & app initializations
├── assets/               # Images, fonts, and animation JSONs
├── components/           # UI Components
│   ├── authentication/   # Login, Splash, Profile, Banned screens
│   ├── common/           # Alert modals, headers, loading skeleton
│   ├── customer/         # Customer listings & management
│   ├── order/            # Ordering flow, cart, payment, summary
│   ├── complain/         # Complaint registration & tracking
│   ├── location/         # Address book & geo-location screens
│   └── reminder/         # Reminders & notification views
├── context/              # Context providers (LanguageContext)
├── environment/          # API Base URL and environment configurations
├── utils/                # Helper utilities
│   └── ios/              # iOS utilities (trackingPermissions)
├── app.json              # Expo application manifest
├── eas.json              # EAS build configurations
├── package.json          # Dependency manifest
└── tsconfig.json         # TypeScript compiler configurations
```

---

## ⚙️ Getting Started

### 1. Pre-requisites
Ensure you have the following installed on your developer machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Expo Go](https://expo.dev/client) app installed on your physical mobile device, or configured Android Emulator / iOS Simulator.

### 2. Installation
Clone the repository, navigate to the directory, and install the dependencies:
```bash
npm install
```

### 3. API Base URL Configuration
Open [environment/environment.ts](environment/environment.ts) and configure the `API_BASE_URL` property to point to your running backend service:
```typescript
export const environment = {
  production: false,
  API_BASE_URL: "http://<YOUR_BACKEND_IP>:3000/"
};
```
*Note: If testing on a physical device, use your machine's local IP address instead of `localhost`.*

### 4. Running the Development Server
Start the Metro bundler server:
```bash
npm run start
```
Once the server starts:
*   Press **`a`** to open the app on an Android Emulator.
*   Press **`i`** to open the app on an iOS Simulator.
*   Scan the QR code displayed in the terminal using the Expo Go app on a physical device.

---

## 📦 Deployment & Building

---

### 1. EAS Build (Cloud Build — Recommended)

Make sure you have EAS CLI installed and are logged in:
```bash
npm install -g eas-cli
eas login
```

#### 📦 Build AAB (Android App Bundle for Google Play Store)
Generates an `.aab` file required for uploading/updating on Google Play Console (includes ProGuard `mapping.txt` deobfuscation file):
```bash
eas build --platform android --profile production
```

#### 📱 Build APK (Android Package for Direct Installation / Testing)
Generates an `.apk` file for direct installation on physical Android devices for testing:
```bash
eas build --platform android --profile preview
```

#### 🍎 Build iOS (IPA for Apple App Store / TestFlight)
Generates an `.ipa` build for iOS distribution:
```bash
eas build --platform ios --profile production
```

---

### 2. Local Gradle Build (On Your Machine)

#### 📦 Build AAB Locally
```bash
npx expo prebuild --platform android
cd android
./gradlew bundleRelease
```
*Output path*: `android/app/build/outputs/bundle/release/app-release.aab`
*Mapping file (Deobfuscation)*: `android/app/build/outputs/mapping/release/mapping.txt`

#### 📱 Build APK Locally
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```
*Output path*: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🛡️ Deobfuscation File & Google Play Warning

If Google Play shows the warning:
> *There is no deobfuscation file associated with this App Bundle. If you use obfuscated code (R8/proguard), uploading a deobfuscation file will make crashes and ANRs easier to analyze and debug.*

1. **Automated Submission**: When deploying using `eas submit --platform android`, EAS automatically links and submits the `mapping.txt` file along with the AAB.
2. **Manual Upload**: If uploading the AAB manually to Google Play Console:
   - Go to **Google Play Console** > **App bundle explorer**.
   - Select the uploaded version.
   - Go to the **Downloads** tab > **Assets** / **Deobfuscation files**.
   - Upload the `mapping.txt` file generated during the build (available in the EAS Build dashboard artifacts or local `android/app/build/outputs/mapping/release/mapping.txt`).

---

## 📄 License

This project is licensed under the MIT License.

Copyright (c) 2026 **Polygon Holdings Private Limited**.

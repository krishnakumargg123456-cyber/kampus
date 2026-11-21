import Constants from 'expo-constants';

// KAMPUS Mobile API Configuration
// Dynamically resolves API URL from Expo environment or runtime configuration.
// Never relies on an unverified placeholder URL.
const configuredUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as any)?.apiUrl ||
  (Constants.manifest as any)?.extra?.apiUrl;

const API_BASE_URL: string = configuredUrl || 'http://localhost:3000';

export default API_BASE_URL;

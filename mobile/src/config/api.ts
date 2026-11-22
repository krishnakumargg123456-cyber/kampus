import Constants from 'expo-constants';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as any)?.apiUrl ||
  'https://kampus-api-i08d.onrender.com';

export default API_BASE_URL.replace(/\/+$/, '');

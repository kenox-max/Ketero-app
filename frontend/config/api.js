import { Platform } from 'react-native';

const DEV_API = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
const PROD_API = process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL || 'https://ketero-app.onrender.com';

export const API_BASE_URL = __DEV__ ? DEV_API : PROD_API;
export const SOCKET_URL = __DEV__ ? DEV_API : PROD_API;

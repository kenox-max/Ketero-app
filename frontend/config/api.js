import { Platform } from 'react-native';

const DEV_API = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
const PROD_API = 'https://ketero-app.onrender.com'; // Your exact Render deployment URL

export const API_BASE_URL = __DEV__ ? DEV_API : PROD_API;
export const SOCKET_URL = __DEV__ ? DEV_API : PROD_API;

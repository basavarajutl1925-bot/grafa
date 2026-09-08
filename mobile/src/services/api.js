import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  Constants.manifest?.extra?.apiUrl ||
  'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Auth APIs
export const authAPI = {
  loginUser: (deviceId, latitude, longitude) =>
    api.post('/auth/user/login', { deviceId, latitude, longitude }),
  
  loginAdmin: (email, password) =>
    api.post('/auth/admin/login', { email, password }),
  
  registerAdmin: (email, password) =>
    api.post('/auth/admin/register', { email, password }),
  
  updateLocation: (latitude, longitude) =>
    api.post('/auth/location/update', { latitude, longitude }),
};

// Ad APIs
export const adAPI = {
  getFeed: (district) =>
    api.get('/ads/feed', { params: { district } }),
  
  createAdRequest: (title, description, district, category, shopLocation, contactPhone, contactEmail, images) =>
    api.post('/ads/request', {
      title,
      description,
      district,
      category,
      shopLocation,
      contactPhone,
      contactEmail,
      images,
    }),
  
  getMyAds: () =>
    api.get('/ads/my-ads'),
  
  trackView: (adId) =>
    api.post(`/ads/${adId}/view`),
  
  trackClick: (adId) =>
    api.post(`/ads/${adId}/click`),
};

// Item APIs
export const itemAPI = {
  getItems: () =>
    api.get('/items'),
  
  addItem: (name, category, unit, description, districts) =>
    api.post('/items', {
      name,
      category,
      unit,
      description,
      districts,
    }),
  
  addPrice: (itemId, price, district, source) =>
    api.post(`/items/${itemId}/price`, {
      price,
      district,
      source,
    }),
  
  getPrediction: (itemId, daysAhead = 7, district) =>
    api.get(`/items/${itemId}/predict`, { params: { daysAhead, district } }),
  
  getPrices: (itemId) =>
    api.get(`/items/${itemId}/prices`),
};

// Location APIs
export const locationAPI = {
  getDistrict: (latitude, longitude) =>
    api.post('/location/district', { latitude, longitude }),
  
  getDistrictList: () =>
    api.get('/location/districts'),
};

// Admin APIs
export const adminAPI = {
  getPendingAds: (page = 1, limit = 20) =>
    api.get('/admin/ads/pending', { params: { page, limit } }),
  
  approveAd: (adId) =>
    api.post(`/admin/ads/${adId}/approve`),
  
  rejectAd: (adId, reason) =>
    api.post(`/admin/ads/${adId}/reject`, { reason }),
  
  getDashboardStats: () =>
    api.get('/admin/dashboard/stats'),
};

export { api };
export default api;

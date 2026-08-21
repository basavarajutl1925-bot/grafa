import React, { useEffect, useState, useRef } from 'react';
import { useGeolocation } from './useGeolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, locationAPI } from '../services/api';
import DeviceInfo from 'react-native-device-info';
import uuid from 'react-native-uuid';

/**
 * Custom hook for managing user authentication and location
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [district, setDistrict] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { latitude, longitude } = useGeolocation();
  const deviceIdRef = useRef(null);

  // Initialize device ID
  useEffect(() => {
    const initDeviceId = async () => {
      try {
        let deviceId = await AsyncStorage.getItem('deviceId');
        if (!deviceId) {
          deviceId = uuid.v4();
          await AsyncStorage.setItem('deviceId', deviceId);
        }
        deviceIdRef.current = deviceId;
      } catch (err) {
        console.error('Error initializing device ID:', err);
      }
    };

    initDeviceId();
  }, []);

  // Login user with location
  useEffect(() => {
    const loginUser = async () => {
      if (!latitude || !longitude || !deviceIdRef.current) return;

      try {
        setIsLoading(true);
        const response = await authAPI.loginUser(
          deviceIdRef.current,
          latitude,
          longitude
        );

        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userId', response.data.user.id);
        setUser(response.data.user);

        // Get district
        const districtResponse = await locationAPI.getDistrict(latitude, longitude);
        setDistrict(districtResponse.data.district);
        await AsyncStorage.setItem('userDistrict', districtResponse.data.district);
      } catch (err) {
        console.error('Login error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loginUser();
  }, [latitude, longitude]);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      setUser(null);
      setDistrict(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return {
    user,
    district,
    isLoading,
    error,
    logout,
    latitude,
    longitude,
  };
};

export default useAuth;

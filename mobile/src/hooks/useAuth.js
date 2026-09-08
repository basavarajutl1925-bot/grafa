import React, { useEffect, useState, useRef } from 'react';
import { useGeolocation } from './useGeolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, locationAPI } from '../services/api';
import uuid from 'react-native-uuid';

/**
 * Custom hook for managing user authentication and location
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [district, setDistrict] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    latitude,
    longitude,
    error: locationError,
    isLoading: locationLoading,
  } = useGeolocation();
  const deviceIdRef = useRef(null);
  const hasLoggedInRef = useRef(false);

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

        const cachedDistrict = await AsyncStorage.getItem('userDistrict');
        if (cachedDistrict) {
          setDistrict(cachedDistrict);
        }
      } catch (err) {
        console.error('Error initializing device ID:', err);
      }
    };

    initDeviceId();
  }, []);

  useEffect(() => {
    if (locationError) {
      setError(locationError);
    }

    if (!locationLoading && (!latitude || !longitude) && !hasLoggedInRef.current) {
      setIsLoading(false);
    }
  }, [latitude, longitude, locationError, locationLoading]);

  // Login user with location
  useEffect(() => {
    const loginUser = async () => {
      if (!latitude || !longitude || !deviceIdRef.current || hasLoggedInRef.current) {
        return;
      }

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
        const resolvedDistrict =
          districtResponse.data.district ||
          response.data.user?.district ||
          'Your district';
        setDistrict(resolvedDistrict);
        await AsyncStorage.setItem('userDistrict', resolvedDistrict);
        setError(null);
        hasLoggedInRef.current = true;
      } catch (err) {
        console.error('Login error:', err);
        const cachedDistrict = await AsyncStorage.getItem('userDistrict');
        if (cachedDistrict) {
          setDistrict(cachedDistrict);
        }
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
      setError(null);
      hasLoggedInRef.current = false;
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

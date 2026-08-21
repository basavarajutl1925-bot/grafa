import { useEffect, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Custom hook for geolocation tracking
 */
export const useGeolocation = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'Grafa needs access to your location to show relevant ads',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setError('Location permission denied');
            setIsLoading(false);
            return;
          }
        }

        // Get current position
        Geolocation.getCurrentPosition(
          position => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
            setIsLoading(false);

            // Watch position for continuous updates
            const watchId = Geolocation.watchPosition(
              position => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
              },
              err => {
                console.error('Watch position error:', err);
              },
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
              }
            );

            return () => Geolocation.clearWatch(watchId);
          },
          err => {
            setError(err.message);
            setIsLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 1000,
          }
        );
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    requestLocationPermission();
  }, []);

  return { latitude, longitude, error, isLoading };
};

export default useGeolocation;

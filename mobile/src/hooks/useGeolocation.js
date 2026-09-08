import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

/**
 * Custom hook for geolocation tracking
 */
export const useGeolocation = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const watchSubscriptionRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (status !== 'granted') {
          setError('Location permission denied');
          setIsLoading(false);
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) {
          return;
        }

        setLatitude(currentPosition.coords.latitude);
        setLongitude(currentPosition.coords.longitude);
        setIsLoading(false);

        watchSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 100,
          },
          position => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
          }
        );
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err.message);
        setIsLoading(false);
      }
    };

    requestLocationPermission();

    return () => {
      isMounted = false;
      watchSubscriptionRef.current?.remove?.();
    };
  }, []);

  return { latitude, longitude, error, isLoading };
};

export default useGeolocation;

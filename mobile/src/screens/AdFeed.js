import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { adAPI } from '../services/api';
import useAuth from '../hooks/useAuth';

const AdFeed = () => {
  const { district, isLoading: authLoading } = useAuth();
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAds = async () => {
      if (!district) return;

      try {
        setIsLoading(true);
        const response = await adAPI.getFeed(district);
        setAds(response.data.ads);
      } catch (err) {
        console.error('Error fetching ads:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAds();
  }, [district]);

  const handleAdView = async (adId) => {
    try {
      await adAPI.trackView(adId);
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  };

  const handleAdClick = async (adId) => {
    try {
      await adAPI.trackClick(adId);
    } catch (err) {
      console.error('Error tracking click:', err);
    }
  };

  const renderAdItem = ({ item }) => (
    <TouchableOpacity
      style={styles.adCard}
      onPress={() => handleAdClick(item._id)}
      onLayout={() => handleAdView(item._id)}
    >
      {item.images && item.images.length > 0 && (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.adImage}
        />
      )}
      <View style={styles.adContent}>
        <Text style={styles.adTitle}>{item.title}</Text>
        <Text style={styles.adDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.adFooter}>
          <Text style={styles.adDistrict}>{item.district}</Text>
          {item.contactPhone && (
            <Text style={styles.adContact}>{item.contactPhone}</Text>
          )}
        </View>
        <View style={styles.adStats}>
          <Text style={styles.statText}>Views: {item.impressions}</Text>
          <Text style={styles.statText}>Clicks: {item.clicks}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (authLoading || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ads in {district}</Text>
        <Text style={styles.headerSubtitle}>{ads.length} active ads</Text>
      </View>
      <FlatList
        data={ads}
        renderItem={renderAdItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 5,
  },
  listContent: {
    padding: 10,
  },
  adCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
  },
  adContent: {
    padding: 12,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  adDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 5,
  },
  adFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  adDistrict: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  adContact: {
    fontSize: 12,
    color: '#666',
  },
  adStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statText: {
    fontSize: 11,
    color: '#999',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AdFeed;

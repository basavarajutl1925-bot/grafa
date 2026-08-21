import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { itemAPI, locationAPI } from '../services/api';
import useAuth from '../hooks/useAuth';

const PricePredictionScreen = () => {
  const { district } = useAuth();
  const [items, setItems] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const response = await itemAPI.getItems();
        setItems(response.data.items);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  const fetchPrediction = async (itemId) => {
    try {
      setSelectedItem(itemId);
      const response = await itemAPI.getPrediction(itemId, 7, district);
      setPredictions(prev => ({
        ...prev,
        [itemId]: response.data,
      }));
    } catch (error) {
      console.error('Error fetching prediction:', error);
    }
  };

  const renderItemCard = ({ item }) => {
    const prediction = predictions[item._id];

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => fetchPrediction(item._id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemUnit}>({item.unit})</Text>
        </View>

        {prediction && selectedItem === item._id && (
          <View style={styles.predictionContainer}>
            <View style={styles.predictionSection}>
              <Text style={styles.predictionLabel}>Predicted Price (7 days):</Text>
              <Text style={styles.predictionValue}>
                ₹{prediction.prediction?.predicted}
              </Text>
            </View>

            <View style={styles.predictionSection}>
              <Text style={styles.trendText}>
                Trend: {prediction.prediction?.trend?.toUpperCase()}
              </Text>
              <Text style={styles.confidenceText}>
                Confidence: {prediction.prediction?.confidence}%
              </Text>
            </View>

            {prediction.stats && (
              <View style={styles.statsSection}>
                <Text style={styles.statsTitle}>Price Statistics</Text>
                <Text style={styles.statLine}>
                  Average: ₹{prediction.stats.mean}
                </Text>
                <Text style={styles.statLine}>
                  Min: ₹{prediction.stats.min} | Max: ₹{prediction.stats.max}
                </Text>
                <Text style={styles.statLine}>
                  Std Dev: ₹{prediction.stats.stdDev}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Price Predictions</Text>
        <Text style={styles.headerSubtitle}>{district}</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItemCard}
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
    backgroundColor: '#34C759',
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
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemUnit: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  predictionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  predictionSection: {
    marginBottom: 10,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#666',
  },
  predictionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
    marginTop: 4,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statLine: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
});

export default PricePredictionScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

const CropDetailsScreen = ({ route }) => {
  const { cropId } = route.params;
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadCropDetails();
  }, [cropId]);

  const loadCropDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/crops/${cropId}`);
      setCrop(response.data.crop);
      setPriceHistory(response.data.priceHistory);
    } catch (error) {
      console.error('Error loading crop:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveCrop = async () => {
    try {
      // TODO: Implement save/unsave logic
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#27ae60" />
      </SafeAreaView>
    );
  }

  if (!crop) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Crop not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Crop Header */}
        {crop.imageUrl && (
          <Image source={{ uri: crop.imageUrl }} style={styles.cropImage} />
        )}

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.cropName}>{crop.cropName}</Text>
              <Text style={styles.cropFamily}>{crop.cropFamily}</Text>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={toggleSaveCrop}
            >
              <Text style={styles.saveButtonText}>
                {isSaved ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Season and Info */}
        <View style={styles.infoGrid}>
          {crop.season.map((s, index) => (
            <View key={index} style={styles.infoCard}>
              <Text style={styles.infoLabel}>Season</Text>
              <Text style={styles.infoValue}>{s}</Text>
            </View>
          ))}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Harvest Days</Text>
            <Text style={styles.infoValue}>{crop.harvestDays || '-'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Avg Yield</Text>
            <Text style={styles.infoValue}>{crop.avgYield} kg/ha</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Water Need</Text>
            <Text style={styles.infoValue}>{crop.waterRequirement} mm</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{crop.description}</Text>
        </View>

        {/* Temperature Range */}
        {crop.tempRange && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temperature Range</Text>
            <View style={styles.tempCard}>
              <View style={styles.tempItem}>
                <Text style={styles.tempLabel}>Min</Text>
                <Text style={styles.tempValue}>{crop.tempRange.min}°C</Text>
              </View>
              <View style={styles.tempDivider} />
              <View style={styles.tempItem}>
                <Text style={styles.tempLabel}>Max</Text>
                <Text style={styles.tempValue}>{crop.tempRange.max}°C</Text>
              </View>
            </View>
          </View>
        )}

        {/* Soil Types */}
        {crop.soilType && crop.soilType.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suitable Soil Types</Text>
            <View style={styles.tags}>
              {crop.soilType.map((soil, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{soil}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Price History */}
        {priceHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Prices</Text>
            <FlatList
              data={priceHistory}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.priceItem}>
                  <View>
                    <Text style={styles.priceDistrict}>{item.district}</Text>
                    <Text style={styles.priceDate}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.priceValue}>₹{item.price}/{crop.priceUnit}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Common Diseases */}
        {crop.commonDiseases && crop.commonDiseases.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Diseases</Text>
            {crop.commonDiseases.map((disease, index) => (
              <View key={index} style={styles.diseaseCard}>
                <Text style={styles.diseaseName}>{disease.name}</Text>
                <View style={styles.diseaseRow}>
                  <Text style={styles.diseaseSeverity}>
                    Severity: {disease.severity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Cultural Practices */}
        {crop.culturalPractices && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cultural Practices</Text>
            <Text style={styles.description}>{crop.culturalPractices}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Set Price Alert</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>View Diseases</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cropImage: {
    width: '100%',
    height: 250,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  cropFamily: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  saveButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 28,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    gap: 10,
  },
  infoCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  tempCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    padding: 15,
  },
  tempItem: {
    alignItems: 'center',
  },
  tempLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  tempValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: 5,
  },
  tempDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#bdc3c7',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  tagText: {
    color: '#27ae60',
    fontSize: 13,
    fontWeight: '500',
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  priceDistrict: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  priceDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 3,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  diseaseCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  diseaseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  diseaseRow: {
    marginTop: 8,
  },
  diseaseSeverity: {
    fontSize: 12,
    color: '#856404',
  },
  actionButtons: {
    marginHorizontal: 15,
    marginBottom: 20,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#27ae60',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  secondaryButtonText: {
    color: '#27ae60',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spacing: {
    height: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default CropDetailsScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

const DiseaseIdentificationScreen = ({ navigation }) => {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('Kharif');
  const [expandedDiseaseIndex, setExpandedDiseaseIndex] = useState(null);

  const seasons = ['Kharif', 'Rabi', 'Zaid'];

  useEffect(() => {
    loadDiseases();
  }, [selectedSeason]);

  const loadDiseases = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/diseases/season/${selectedSeason}`);
      setDiseases(response.data.diseases);
    } catch (error) {
      console.error('Error loading diseases:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDiseaseExpand = (index) => {
    setExpandedDiseaseIndex(expandedDiseaseIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Disease Identification</Text>
          <Text style={styles.headerSubtitle}>Learn about common crop diseases</Text>
        </View>

        {/* Season Filter */}
        <View style={styles.seasonFilter}>
          {seasons.map((season) => (
            <TouchableOpacity
              key={season}
              style={[
                styles.seasonButton,
                selectedSeason === season && styles.seasonButtonActive,
              ]}
              onPress={() => setSelectedSeason(season)}
            >
              <Text
                style={[
                  styles.seasonButtonText,
                  selectedSeason === season && styles.seasonButtonTextActive,
                ]}
              >
                {season}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Diseases List */}
        {loading ? (
          <ActivityIndicator size="large" color="#e74c3c" style={styles.loader} />
        ) : diseases.length === 0 ? (
          <Text style={styles.noDataText}>No diseases found for this season</Text>
        ) : (
          diseases.map((disease, index) => (
            <TouchableOpacity
              key={disease._id}
              style={styles.diseaseCard}
              onPress={() => toggleDiseaseExpand(index)}
            >
              {/* Disease Header */}
              <View style={styles.diseaseHeader}>
                <View style={styles.diseaseInfo}>
                  <Text style={styles.diseaseName}>{disease.diseaseName}</Text>
                  <Text style={styles.diseaseCrop}>{disease.cropAffected?.cropName}</Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    disease.severity === 'SEVERE' && styles.severitySevere,
                    disease.severity === 'MODERATE' && styles.severityModerate,
                  ]}
                >
                  <Text style={styles.severityText}>{disease.severity}</Text>
                </View>
              </View>

              {/* Disease Image */}
              {disease.imageUrl && (
                <Image
                  source={{ uri: disease.imageUrl }}
                  style={styles.diseaseImage}
                />
              )}

              {/* Expanded Content */}
              {expandedDiseaseIndex === index && (
                <View style={styles.expandedContent}>
                  {/* Symptoms */}
                  {disease.symptoms && disease.symptoms.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>🔍 Symptoms</Text>
                      {disease.symptoms.map((symptom, i) => (
                        <View key={i} style={styles.listItem}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.listText}>{symptom}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Treatment */}
                  {disease.treatment && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>💊 Treatment</Text>
                      <Text style={styles.treatmentText}>{disease.treatment}</Text>
                    </View>
                  )}

                  {/* Preventive Measures */}
                  {disease.preventiveMeasures && disease.preventiveMeasures.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>🛡️ Prevention</Text>
                      {disease.preventiveMeasures.map((measure, i) => (
                        <View key={i} style={styles.listItem}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.listText}>{measure}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Pesticides */}
                  {disease.pesticides && disease.pesticides.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>🧪 Pesticides</Text>
                      {disease.pesticides.map((pesticide, i) => (
                        <View key={i} style={styles.pesticideCard}>
                          <Text style={styles.pesticidesName}>{pesticide.name}</Text>
                          <Text style={styles.pesticideDetail}>
                            Dosage: {pesticide.dosage}
                          </Text>
                          <Text style={styles.pesticideDetail}>
                            DtH: {pesticide.daysTillHarvest} days
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Organic Alternatives */}
                  {disease.organicAlternatives && disease.organicAlternatives.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>🌿 Organic Alternatives</Text>
                      {disease.organicAlternatives.map((alternative, i) => (
                        <View key={i} style={styles.listItem}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.listText}>{alternative}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Weather Conditions */}
                  {disease.weatherConditions && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>🌡️ Ideal Conditions</Text>
                      <Text style={styles.weatherText}>
                        Temperature: {disease.weatherConditions.idealTemperature?.min}°C -
                        {disease.weatherConditions.idealTemperature?.max}°C
                      </Text>
                      <Text style={styles.weatherText}>
                        Humidity: {disease.weatherConditions.idealHumidity}
                      </Text>
                    </View>
                  )}

                  {/* Research Link */}
                  {disease.researchLink && (
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() => Linking.openURL(disease.researchLink)}
                    >
                      <Text style={styles.linkText}>📚 Read More Research</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Expand Indicator */}
              <View style={styles.expandIndicator}>
                <Text style={styles.expandText}>
                  {expandedDiseaseIndex === index ? '▼' : '▶'} Details
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

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
  header: {
    backgroundColor: '#e74c3c',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  seasonFilter: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 15,
    gap: 8,
  },
  seasonButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  seasonButtonActive: {
    backgroundColor: '#e74c3c',
  },
  seasonButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e74c3c',
  },
  seasonButtonTextActive: {
    color: 'white',
  },
  loader: {
    marginTop: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 30,
  },
  diseaseCard: {
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  diseaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  diseaseInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  diseaseCrop: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 3,
  },
  severityBadge: {
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff3cd',
  },
  severitySevere: {
    backgroundColor: '#f8d7da',
  },
  severityModerate: {
    backgroundColor: '#fff3cd',
  },
  severityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
  },
  diseaseImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  expandedContent: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    marginRight: 10,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  listText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  treatmentText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  pesticideCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  pesticidesName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
  },
  pesticideDetail: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  weatherText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 5,
  },
  linkButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  expandIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  expandText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  spacing: {
    height: 20,
  },
});

export default DiseaseIdentificationScreen;

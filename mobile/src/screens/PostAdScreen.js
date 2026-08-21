import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { adAPI } from '../services/api';
import useAuth from '../hooks/useAuth';

const PostAdScreen = ({ navigation }) => {
  const { district, user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    shopLocation: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.shopLocation) {
      Alert.alert('Error', 'Title and shop location are required');
      return;
    }

    try {
      setIsLoading(true);
      await adAPI.createAdRequest(
        formData.title,
        formData.description,
        district,
        formData.category,
        formData.shopLocation,
        formData.contactPhone,
        formData.contactEmail
      );

      Alert.alert('Success', 'Ad request submitted for approval');
      setFormData({
        title: '',
        description: '',
        category: '',
        shopLocation: '',
        contactPhone: '',
        contactEmail: '',
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Post an Ad</Text>
        <Text style={styles.headerSubtitle}>District: {district}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ad title"
            value={formData.title}
            onChangeText={text => handleInputChange('title', text)}
            editable={!isLoading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your ad"
            value={formData.description}
            onChangeText={text => handleInputChange('description', text)}
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Retail, Service, Food"
            value={formData.category}
            onChangeText={text => handleInputChange('category', text)}
            editable={!isLoading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Shop Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="Shop address or location details"
            value={formData.shopLocation}
            onChangeText={text => handleInputChange('shopLocation', text)}
            editable={!isLoading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            value={formData.contactPhone}
            onChangeText={text => handleInputChange('contactPhone', text)}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={formData.contactEmail}
            onChangeText={text => handleInputChange('contactEmail', text)}
            keyboardType="email-address"
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit for Approval</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  form: {
    padding: 15,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PostAdScreen;

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adAPI } from '../services/api';
import useAuth from '../hooks/useAuth';
import ScreenHeader from '../components/ScreenHeader';
import { colors, radii, shadows, spacing } from '../theme';

const InfoChip = ({ icon, label }) => (
  <View style={styles.infoChip}>
    <MaterialCommunityIcons name={icon} size={14} color={colors.primary} />
    <Text style={styles.infoChipText} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  returnKeyType = 'next',
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      returnKeyType={returnKeyType}
    />
  </View>
);

const PostAdScreen = ({ navigation }) => {
  const { district } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    shopLocation: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const hasDistrict = Boolean(district);
  const districtLabel = district || 'Detecting your district';

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!hasDistrict) {
      Alert.alert(
        'Location required',
        'We need your district before posting an ad so it reaches the right audience.'
      );
      return;
    }

    if (!formData.title || !formData.shopLocation) {
      Alert.alert('Missing details', 'Title and shop location are required.');
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

      Alert.alert('Success', 'Ad request submitted for approval.');
      setFormData({
        title: '',
        description: '',
        category: '',
        shopLocation: '',
        contactPhone: '',
        contactEmail: '',
      });

      if (navigation?.canGoBack?.()) {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(
        'Submission failed',
        error?.response?.data?.error || error.message || 'Unable to submit ad'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Promote your shop"
          title="Post a district ad"
          subtitle="Create a clean, local-first ad that gets reviewed before it goes live."
          icon="plus-circle-outline"
          accent={colors.accent}
          badge={hasDistrict ? district : 'Detecting'}
        />

        <View style={styles.previewCard}>
          <Text style={styles.sectionLabel}>Live preview</Text>
          <View style={styles.previewRow}>
            <View style={styles.previewIcon}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={24}
                color={colors.accent}
              />
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle} numberOfLines={2}>
                {formData.title || 'Your ad title will appear here'}
              </Text>
              <Text style={styles.previewDescription} numberOfLines={2}>
                {formData.description ||
                  'Add a short description to make the offer easy to understand.'}
              </Text>
            </View>
          </View>

          <View style={styles.previewMetaRow}>
            <InfoChip icon="map-marker-outline" label={districtLabel} />
            <InfoChip icon="shield-check-outline" label="Requires approval" />
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>Ad details</Text>
          <Field
            label="Title"
            placeholder="Fresh vegetables from today"
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            returnKeyType="next"
          />

          <Field
            label="Description"
            placeholder="Tell people what you are selling or offering"
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
          />

          <Field
            label="Category"
            placeholder="Retail, Service, Food, Tools..."
            value={formData.category}
            onChangeText={(text) => handleInputChange('category', text)}
          />

          <Field
            label="Shop location"
            placeholder="Main market, road name, landmark..."
            value={formData.shopLocation}
            onChangeText={(text) => handleInputChange('shopLocation', text)}
          />

          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <Field
                label="Contact phone"
                placeholder="Phone number"
                value={formData.contactPhone}
                onChangeText={(text) => handleInputChange('contactPhone', text)}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inlineField}>
              <Field
                label="Contact email"
                placeholder="Email address"
                value={formData.contactEmail}
                onChangeText={(text) => handleInputChange('contactEmail', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={styles.tipCard}>
          <MaterialCommunityIcons
            name="sparkles"
            size={18}
            color={colors.accent}
          />
          <Text style={styles.tipText}>
            Keep the title short, lead with the offer, and make the shop
            location specific.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            (!hasDistrict || isLoading) && styles.submitButtonDisabled,
            pressed && !(!hasDistrict || isLoading) && styles.submitButtonPressed,
          ]}
          onPress={handleSubmit}
          disabled={!hasDistrict || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitButtonText}>Submit for approval</Text>
          )}
        </Pressable>

        {!hasDistrict ? (
          <Text style={styles.helperText}>
            Location is still loading. We will enable publishing as soon as we
            know your district.
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  previewCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  formCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  previewCopy: {
    flex: 1,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  previewDescription: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  previewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoChipText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 180,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  inlineFields: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inlineField: {
    flex: 1,
  },
  tipCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: '#FFF5E9',
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#F6D6A7',
  },
  tipText: {
    flex: 1,
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  submitButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  submitButtonPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  helperText: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
    color: colors.textSoft,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default PostAdScreen;

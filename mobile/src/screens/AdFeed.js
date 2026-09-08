import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adAPI } from '../services/api';
import useAuth from '../hooks/useAuth';
import ScreenHeader from '../components/ScreenHeader';
import MetricCard from '../components/MetricCard';
import EmptyState from '../components/EmptyState';
import { colors, radii, shadows, spacing } from '../theme';

const InfoChip = ({ icon, label }) => (
  <View style={styles.infoChip}>
    <MaterialCommunityIcons name={icon} size={14} color={colors.primary} />
    <Text style={styles.infoChipText} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const AdFeed = () => {
  const { district, isLoading: authLoading, error: authError } = useAuth();
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const trackedViewsRef = useRef(new Set());

  const loadAds = async ({ silent = false } = {}) => {
    if (!district) {
      setAds([]);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (!silent) {
        setIsLoading(true);
      }

      setError(null);
      const response = await adAPI.getFeed(district);
      setAds(response.data?.ads || []);
    } catch (err) {
      console.error('Error fetching ads:', err);
      setError(
        err?.response?.data?.error ||
          err.message ||
          'Unable to load nearby ads'
      );
      setAds([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadAds();
    }
  }, [district, authLoading]);

  const handleAdView = async (adId) => {
    if (trackedViewsRef.current.has(adId)) {
      return;
    }

    trackedViewsRef.current.add(adId);

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

  const summary = useMemo(() => {
    const totalImpressions = ads.reduce(
      (total, ad) => total + (ad.impressions || 0),
      0
    );
    const totalClicks = ads.reduce((total, ad) => total + (ad.clicks || 0), 0);

    return {
      totalImpressions,
      totalClicks,
    };
  }, [ads]);

  const renderAdItem = ({ item }) => {
    const imageUri = item.images?.[0];

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={() => handleAdClick(item._id)}
        onLayout={() => handleAdView(item._id)}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImageFallback}>
            <MaterialCommunityIcons
              name="image-outline"
              size={34}
              color={colors.primary}
            />
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>
                {item.category || 'Featured'}
              </Text>
            </View>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description || 'No description provided yet.'}
          </Text>

          <View style={styles.chipRow}>
            <InfoChip icon="map-marker-outline" label={item.district || district} />
            {item.contactPhone ? (
              <InfoChip icon="phone-outline" label={item.contactPhone} />
            ) : null}
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Views</Text>
              <Text style={styles.metricValue}>{item.impressions || 0}</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Clicks</Text>
              <Text style={styles.metricValue}>{item.clicks || 0}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const isInitialLoading =
    authLoading || (isLoading && !error && district && ads.length === 0);

  if (isInitialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const emptyTitle = error
    ? 'Feed unavailable'
    : district
    ? 'No approved ads yet'
    : 'Location still loading';

  const emptyMessage = error
    ? error
    : district
    ? 'Approved ads from your district will show up here as soon as they go live.'
    : authError || 'Allow location access so we can load district-specific ads.';

  const emptyIcon = error
    ? 'alert-circle-outline'
    : district
    ? 'bullhorn-outline'
    : 'map-marker-question-outline';

  return (
    <View style={styles.container}>
      <FlatList
        data={ads}
        renderItem={renderAdItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadAds({ silent: true });
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <ScreenHeader
              eyebrow="Location-aware feed"
              title="Nearby opportunities"
              subtitle={
                district
                  ? `Ads tuned for ${district}`
                  : 'Waiting for your district to load'
              }
              icon="bullhorn-outline"
              accent={colors.primary}
              badge={district ? 'Live feed' : 'Detecting location'}
            />

            <View style={styles.metricGrid}>
              <MetricCard
                label="Ads"
                value={ads.length}
                detail="Approved posts visible in your district"
                icon="bullhorn-outline"
                accent={colors.primary}
              />
              <MetricCard
                label="Views"
                value={summary.totalImpressions}
                detail="Total tracked impressions"
                icon="eye-outline"
                accent={colors.accent}
              />
              <MetricCard
                label="Clicks"
                value={summary.totalClicks}
                detail="User taps on active ads"
                icon="cursor-default-click-outline"
                accent={colors.success}
              />
            </View>

            {error ? (
              <View style={styles.inlineAlert}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.danger}
                />
                <Text style={styles.inlineAlertText}>{error}</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              title={emptyTitle}
              message={emptyMessage}
              icon={emptyIcon}
              actionLabel="Try again"
              onAction={() => loadAds()}
              accent={error ? colors.danger : colors.primary}
            />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  headerStack: {
    paddingBottom: spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  inlineAlert: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: '#FCEFEA',
    borderColor: '#F6C2B7',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineAlertText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  emptyWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  cardImage: {
    width: '100%',
    height: 190,
    backgroundColor: colors.surfaceAlt,
  },
  cardImageFallback: {
    width: '100%',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  cardBody: {
    padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardDescription: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
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
    maxWidth: 170,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metricPill: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  metricValue: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
});

export default AdFeed;

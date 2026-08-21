import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { adminAPI, itemAPI } from '../services/api';

const AdminDashboard = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [pendingAds, setPendingAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const statsResponse = await adminAPI.getDashboardStats();
      setStats(statsResponse.data);

      const adsResponse = await adminAPI.getPendingAds(1, 50);
      setPendingAds(adsResponse.data.ads);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAd = async (adId) => {
    try {
      await adminAPI.approveAd(adId);
      setPendingAds(prev => prev.filter(ad => ad._id !== adId));
      Alert.alert('Success', 'Ad approved');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRejectAd = async (adId) => {
    try {
      await adminAPI.rejectAd(adId, 'Rejected by admin');
      setPendingAds(prev => prev.filter(ad => ad._id !== adId));
      Alert.alert('Success', 'Ad rejected');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) {
      Alert.alert('Error', 'Item name required');
      return;
    }

    try {
      await itemAPI.addItem(newItem, 'General', 'kg', 'Admin added item', []);
      Alert.alert('Success', 'Item added');
      setNewItem('');
      loadDashboardData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderStats = () => (
    <ScrollView style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Ads</Text>
        <Text style={styles.statValue}>{stats?.totalAds || 0}</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Active Ads</Text>
        <Text style={[styles.statValue, { color: '#34C759' }]}>
          {stats?.totalActiveAds || 0}
        </Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Pending Ads</Text>
        <Text style={[styles.statValue, { color: '#FF9500' }]}>
          {stats?.totalPendingAds || 0}
        </Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Rejected Ads</Text>
        <Text style={[styles.statValue, { color: '#FF3B30' }]}>
          {stats?.totalRejectedAds || 0}
        </Text>
      </View>

      <View style={styles.distributionCard}>
        <Text style={styles.distributionTitle}>Ads by District</Text>
        {stats?.adsByDistrict?.map(item => (
          <View key={item._id} style={styles.distributionRow}>
            <Text style={styles.districtName}>{item._id}</Text>
            <Text style={styles.districtCount}>{item.count}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderPendingAds = () => (
    <FlatList
      data={pendingAds}
      renderItem={({ item }) => (
        <View style={styles.adApprovalCard}>
          <Text style={styles.adTitle}>{item.title}</Text>
          <Text style={styles.adDesc}>{item.description}</Text>
          <Text style={styles.adMeta}>District: {item.district}</Text>
          <Text style={styles.adMeta}>Shop: {item.shopLocation}</Text>

          <View style={styles.adActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApproveAd(item._id)}
            >
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectAd(item._id)}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      keyExtractor={item => item._id}
      contentContainerStyle={styles.listContent}
    />
  );

  const renderItems = () => (
    <ScrollView style={styles.itemsContainer}>
      <View style={styles.addItemForm}>
        <TextInput
          style={styles.itemInput}
          placeholder="Enter item name (e.g., Tomato)"
          value={newItem}
          onChangeText={setNewItem}
        />
        <TouchableOpacity
          style={styles.addItemButton}
          onPress={handleAddItem}
        >
          <Text style={styles.addItemButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

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
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'stats' && styles.activeTabText,
            ]}
          >
            Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ads' && styles.activeTab]}
          onPress={() => setActiveTab('ads')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'ads' && styles.activeTabText,
            ]}
          >
            Pending Ads
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'items' && styles.activeTab]}
          onPress={() => setActiveTab('items')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'items' && styles.activeTabText,
            ]}
          >
            Items
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'stats' && renderStats()}
      {activeTab === 'ads' && renderPendingAds()}
      {activeTab === 'items' && renderItems()}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  statsContainer: {
    flex: 1,
    padding: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  distributionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  districtName: {
    fontSize: 13,
    color: '#333',
  },
  districtCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  listContent: {
    padding: 15,
  },
  adApprovalCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  adDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 5,
  },
  adMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  adActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  itemsContainer: {
    flex: 1,
    padding: 15,
  },
  addItemForm: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  itemInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  addItemButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addItemButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AdminDashboard;

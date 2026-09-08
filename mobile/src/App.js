import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import AdFeed from './screens/AdFeed';
import PostAdScreen from './screens/PostAdScreen';
import PricePredictionScreen from './screens/PricePredictionScreen';
import AdminDashboard from './screens/AdminDashboard';
import { colors } from './theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const getTabIcon = (routeName, color, size) => {
  switch (routeName) {
    case 'Ads':
      return <MaterialCommunityIcons name="bullhorn-outline" color={color} size={size} />;
    case 'Post':
      return <MaterialCommunityIcons name="plus-circle-outline" color={color} size={size} />;
    case 'Prices':
      return <MaterialCommunityIcons name="chart-line" color={color} size={size} />;
    case 'Admin':
      return <MaterialCommunityIcons name="shield-account-outline" color={color} size={size} />;
    default:
      return <MaterialCommunityIcons name="circle-outline" color={color} size={size} />;
  }
};

function AdFeedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdFeedList" 
        component={AdFeed}
        options={{ title: 'Browse Ads' }}
      />
    </Stack.Navigator>
  );
}

function PostAdStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PostAdForm" 
        component={PostAdScreen}
        options={{ title: 'Post New Ad' }}
      />
    </Stack.Navigator>
  );
}

function PricePredictionStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PricePredictionList" 
        component={PricePredictionScreen}
        options={{ title: 'Price Predictions' }}
      />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdminPanel" 
        component={AdminDashboard}
        options={{ title: 'Admin Dashboard' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: '#A7B2A9',
          tabBarHideOnKeyboard: true,
          tabBarLabelPosition: 'below-icon',
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            height: 74,
            paddingTop: 10,
            paddingBottom: 14,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarIcon: ({ color, size }) => getTabIcon(route.name, color, size),
        })}
      >
        <Tab.Screen 
          name="Ads" 
          component={AdFeedStack}
          options={{
            tabBarLabel: 'Browse',
          }}
        />
        <Tab.Screen 
          name="Post" 
          component={PostAdStack}
          options={{
            tabBarLabel: 'Post',
          }}
        />
        <Tab.Screen 
          name="Prices" 
          component={PricePredictionStack}
          options={{
            tabBarLabel: 'Prices',
          }}
        />
        <Tab.Screen 
          name="Admin" 
          component={AdminStack}
          options={{
            tabBarLabel: 'Admin',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

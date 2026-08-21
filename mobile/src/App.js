import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import AdFeed from './screens/AdFeed';
import PostAdScreen from './screens/PostAdScreen';
import PricePredictionScreen from './screens/PricePredictionScreen';
import AdminDashboard from './screens/AdminDashboard';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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
          tabBarLabel: route.name,
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

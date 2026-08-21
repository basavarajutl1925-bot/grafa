/**
 * Price Prediction Examples
 * 
 * This file demonstrates how to use the price prediction API
 */

// Example 1: Get price prediction for tomatoes in Hassan
async function getPricePrediction() {
  const itemId = '507f1f77bcf86cd799439011'; // Replace with actual item ID
  
  const response = await fetch(
    'http://localhost:5000/api/items/' + itemId + '/predict?daysAhead=7&district=Hassan',
    {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    }
  );
  
  const data = await response.json();
  console.log('Price Prediction:', data);
  
  // Output:
  // {
  //   prediction: {
  //     predicted: 45.50,
  //     confidence: 92,
  //     trend: 'up',
  //     daysAhead: 7,
  //     minPrice: 40,
  //     maxPrice: 55,
  //     avgPrice: 47.25
  //   },
  //   stats: {
  //     mean: 47.25,
  //     median: 46.50,
  //     stdDev: 3.25,
  //     min: 40,
  //     max: 55,
  //     variance: 10.56
  //   }
  // }
}

// Example 2: Admin adds historical price data
async function addPriceData() {
  const itemId = '507f1f77bcf86cd799439011';
  
  const response = await fetch(
    'http://localhost:5000/api/items/' + itemId + '/price',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ADMIN_TOKEN'
      },
      body: JSON.stringify({
        price: 45.50,
        district: 'Hassan',
        source: 'market_survey'
      })
    }
  );
  
  const data = await response.json();
  console.log('Price added:', data);
}

// Example 3: Bulk import prices (for high volume)
async function bulkImportPrices() {
  const priceData = [
    { itemId: 'item-1', price: 45.50, district: 'Hassan' },
    { itemId: 'item-1', price: 46.00, district: 'Chikmagalur' },
    { itemId: 'item-2', price: 120.75, district: 'Hassan' },
    { itemId: 'item-2', price: 125.00, district: 'Bangalore' },
    // ... up to 1000s of records
  ];
  
  const response = await fetch(
    'http://localhost:5000/api/items/bulk/prices',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ADMIN_TOKEN'
      },
      body: JSON.stringify({ prices: priceData })
    }
  );
  
  const result = await response.json();
  console.log(`Inserted ${result.inserted} price records`);
}

// Example 4: Get current prices across districts
async function getCurrentPrices() {
  const itemId = '507f1f77bcf86cd799439011';
  
  const response = await fetch(
    'http://localhost:5000/api/items/' + itemId + '/prices',
    {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    }
  );
  
  const data = await response.json();
  console.log('Current prices by district:', data);
  
  // Output:
  // {
  //   prices: [
  //     { itemId: '...', price: 45.50, district: 'Hassan', timestamp: '2024-01-07T...' },
  //     { itemId: '...', price: 48.00, district: 'Bangalore', timestamp: '2024-01-07T...' },
  //     { itemId: '...', price: 46.75, district: 'Chikmagalur', timestamp: '2024-01-07T...' }
  //   ]
  // }
}

// Example 5: Create sample items for price tracking
async function createSampleItems() {
  const items = [
    { name: 'Tomato', category: 'Vegetable', unit: 'kg' },
    { name: 'Onion', category: 'Vegetable', unit: 'kg' },
    { name: 'Rice', category: 'Grain', unit: 'kg' },
    { name: 'Potato', category: 'Vegetable', unit: 'kg' }
  ];
  
  for (const item of items) {
    const response = await fetch(
      'http://localhost:5000/api/items',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ADMIN_TOKEN'
        },
        body: JSON.stringify({
          ...item,
          description: `Track price trends for ${item.name}`,
          districts: ['Hassan', 'Bangalore', 'Chikmagalur']
        })
      }
    );
    
    const data = await response.json();
    console.log(`Created item: ${item.name}`, data.item._id);
  }
}

// Example 6: Generate sample historical data (90 days)
async function generateHistoricalData() {
  const itemId = '507f1f77bcf86cd799439011';
  const districts = ['Hassan', 'Bangalore', 'Chikmagalur'];
  const basePrice = 40;
  const prices = [];
  
  // Generate 90 days of price history with trend
  for (let i = 0; i < 90; i++) {
    const trend = Math.sin(i / 15) * 5; // Seasonal trend
    const noise = (Math.random() - 0.5) * 3;
    const price = basePrice + trend + noise;
    
    for (const district of districts) {
      prices.push({
        itemId,
        price: Math.max(0, parseFloat(price.toFixed(2))),
        district,
        source: 'historical_import'
      });
    }
  }
  
  // Bulk import
  const response = await fetch(
    'http://localhost:5000/api/items/bulk/prices',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ADMIN_TOKEN'
      },
      body: JSON.stringify({ prices })
    }
  );
  
  const result = await response.json();
  console.log(`Generated ${result.inserted} historical price records`);
}

// Example 7: Compare predictions across districts
async function comparePredictions() {
  const itemId = '507f1f77bcf86cd799439011';
  const districts = ['Hassan', 'Bangalore', 'Chikmagalur'];
  
  const predictions = {};
  
  for (const district of districts) {
    const response = await fetch(
      `http://localhost:5000/api/items/${itemId}/predict?daysAhead=14&district=${district}`,
      {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      }
    );
    
    const data = await response.json();
    predictions[district] = data.prediction;
  }
  
  console.log('Price predictions by district:');
  for (const [district, prediction] of Object.entries(predictions)) {
    console.log(`${district}: ₹${prediction.predicted} (Trend: ${prediction.trend})`);
  }
}

// Example 8: Mobile app - Display price prediction
// React Native example
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

function PricePredictionWidget({ itemId, district }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/items/${itemId}/predict?district=${district}`
        );
        const data = await response.json();
        setPrediction(data.prediction);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrediction();
  }, [itemId, district]);
  
  if (loading) return <ActivityIndicator />;
  if (!prediction) return <Text>No prediction available</Text>;
  
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
        Predicted Price: ₹{prediction.predicted}
      </Text>
      <Text style={{ color: prediction.trend === 'up' ? 'green' : 'red' }}>
        Trend: {prediction.trend.toUpperCase()}
      </Text>
      <Text>Confidence: {prediction.confidence}%</Text>
    </View>
  );
}

export default PricePredictionWidget;

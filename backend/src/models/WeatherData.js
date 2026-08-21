const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    temperature: {
      min: {
        type: Number,
        required: true,
      },
      max: {
        type: Number,
        required: true,
      },
      avg: Number,
    },
    humidity: Number,
    rainfall: {
      type: Number,
      default: 0,
    },
    windSpeed: Number,
    soilMoisture: Number,
    condition: String, // Sunny, Cloudy, Rainy, etc.
    uvIndex: Number,
    source: {
      type: String,
      default: 'manual', // manual, api, sensor
    },
    forecast7Day: [
      {
        date: Date,
        tempMin: Number,
        tempMax: Number,
        condition: String,
        rainfall: Number,
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

weatherDataSchema.index({ district: 1, date: -1 });

module.exports = mongoose.model('WeatherData', weatherDataSchema);

const mongoose = require('mongoose');

const cropDetailsSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cropFamily: String,
    season: {
      type: [String],
      enum: ['Kharif', 'Rabi', 'Zaid'],
      required: true,
    },
    imageUrl: String,
    description: String,
    avgYield: {
      type: Number,
      default: 0, // kg/hectare
    },
    waterRequirement: {
      type: Number,
      default: 0, // mm
    },
    soilType: [String],
    tempRange: {
      min: Number,
      max: Number,
    },
    harvestDays: Number,
    commonDiseases: {
      type: [
        {
          name: String,
          symptoms: [String],
          treatment: String,
          severity: String,
        },
      ],
      default: [],
    },
    culturalPractices: String,
    districtAvailability: [String],
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priceUnit: {
      type: String,
      default: 'per kg',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CropDetails', cropDetailsSchema);

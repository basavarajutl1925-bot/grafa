const mongoose = require('mongoose');

const farmProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    farmName: String,
    location: {
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
      district: {
        type: String,
        required: true,
        index: true,
      },
      village: String,
      state: String,
    },
    areaInHectares: {
      type: Number,
      required: true,
    },
    cropsGrown: [
      {
        cropId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CropDetails',
        },
        season: String,
        areaInHectares: Number,
        plantingDate: Date,
        expectedHarvestDate: Date,
      },
    ],
    soilType: String,
    irrigationType: String, // Rainfed, Irrigated, Mixed
    documents: [
      {
        type: String, // Aadhaar, LandTitle, etc.
        url: String,
      },
    ],
    certifications: [String], // Organic, FairTrade, etc.
    yearsOfFarming: Number,
    profileImageUrl: String,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationDate: Date,
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

farmProfileSchema.index({ 'location.district': 1 });
farmProfileSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('FarmProfile', farmProfileSchema);

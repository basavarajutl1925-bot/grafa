const mongoose = require('mongoose');

const cropDiseaseSchema = new mongoose.Schema(
  {
    diseaseName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cropAffected: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropDetails',
      required: true,
      index: true,
    },
    symptoms: [String],
    treatment: String,
    preventiveMeasures: [String],
    pesticides: [
      {
        name: String,
        dosage: String,
        concentration: String,
        daysTillHarvest: Number,
      },
    ],
    organicAlternatives: [String],
    imageUrl: String,
    severity: {
      type: String,
      enum: ['MILD', 'MODERATE', 'SEVERE'],
      default: 'MODERATE',
    },
    seasonalOccurrence: [String], // Kharif, Rabi, Zaid
    affectedStages: [String], // Seedling, Growing, Flowering, Fruiting
    weatherConditions: {
      idealTemperature: {
        min: Number,
        max: Number,
      },
      idealHumidity: String,
      rainfall: String,
    },
    researchLink: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

cropDiseaseSchema.index({ cropAffected: 1 });
cropDiseaseSchema.index({ diseaseName: 'text' });

module.exports = mongoose.model('CropDisease', cropDiseaseSchema);

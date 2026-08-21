const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    district: {
      type: String,
      required: true,
      index: true,
    },
    latitude: Number,
    longitude: Number,
    shopLocation: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'expired'],
      default: 'pending',
    },
    category: String,
    images: [String],
    contactPhone: String,
    contactEmail: String,
    startDate: Date,
    endDate: Date,
    expiresAt: Date,
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// TTL index for automatic expiration
adSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for location-based queries
adSchema.index({ district: 1, status: 1 });

module.exports = mongoose.model('Ad', adSchema);

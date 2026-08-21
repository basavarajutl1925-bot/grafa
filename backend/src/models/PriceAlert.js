const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropDetails',
      required: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
    },
    alertType: {
      type: String,
      enum: ['PRICE_DROP', 'PRICE_SPIKE', 'TARGET_ACHIEVED', 'MARKET_TREND'],
      required: true,
    },
    targetPrice: {
      type: Number,
      required: true,
    },
    triggerThreshold: {
      type: Number,
      default: 10, // percentage
    },
    alertStatus: {
      type: String,
      enum: ['active', 'triggered', 'dismissed', 'inactive'],
      default: 'active',
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    currentPrice: Number,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    triggeredAt: Date,
    dismissedAt: Date,
    dismissReason: String,
  },
  { timestamps: true }
);

priceAlertSchema.index({ userId: 1, alertStatus: 1 });
priceAlertSchema.index({ cropId: 1, district: 1 });

module.exports = mongoose.model('PriceAlert', priceAlertSchema);

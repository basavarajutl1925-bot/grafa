const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['PRICE_ALERT', 'WEATHER_WARNING', 'DISEASE_ALERT', 'AD_APPROVED', 'GENERAL'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      cropId: mongoose.Schema.Types.ObjectId,
      cropName: String,
      price: Number,
      alertType: String,
      district: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ sentAt: -1 });

// TTL index to auto-delete old notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);

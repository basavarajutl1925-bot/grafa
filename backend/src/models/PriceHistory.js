const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
    },
    district: {
      type: String,
      index: true,
    },
    source: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

priceHistorySchema.index({ itemId: 1, timestamp: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);

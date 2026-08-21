const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: String,
    unit: {
      type: String,
      default: 'kg',
    },
    description: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    districts: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);

// models/StockSettings.js
const mongoose = require("mongoose");

const stockSettingsSchema = new mongoose.Schema(
  {
    // total amount company has paid so far (manual input from UI)
    manualPaid: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // optional: keeps createdAt / updatedAt
  }
);

module.exports = mongoose.model("StockSettings", stockSettingsSchema);

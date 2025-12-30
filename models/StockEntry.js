// models/StockEntry.js
const mongoose = require("mongoose");

const StockEntrySchema = new mongoose.Schema(
  {
    productType: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["BOOKED", "ON_WAY", "UNLOADED", "AVAILABLE", "SOLD"],
      default: "BOOKED",
    },

    // Support both old and new date field names
    date: Date,
    purchaseDate: Date,

    quantity: {
      type: Number,
      required: true,
      default: 0,
    },

    remainingQuantity: {
      type: Number,
      default: 0,
    },

    // Support both old and new rate field names
    rate: Number,
    purchaseRate: Number,

    // Supplier Information
    supplierName: String,
    supplierInvoiceNo: String,

    // Transportation
    transportCompany: String,
    vehicleNumber: String,
    warehouseLocation: String,

    // Additional Costs
    loadingCharges: {
      type: Number,
      default: 0,
    },
    unloadingCharges: {
      type: Number,
      default: 0,
    },
    transportCharges: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },
    otherChargesDescription: String,

    // Important Dates
    expectedArrivalDate: Date,
    actualArrivalDate: Date,
    unloadingDate: Date,

    // Quality Control
    qualityChecked: {
      type: Boolean,
      default: false,
    },
    qualityRemarks: String,
    damagedQuantity: {
      type: Number,
      default: 0,
    },

    notes: String,

    supplierPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupplierPayment",
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Pre-save hook WITHOUT next()
StockEntrySchema.pre("save", function () {
  // Sync date fields
  if (!this.date && this.purchaseDate) {
    this.date = this.purchaseDate;
  }
  if (!this.purchaseDate && this.date) {
    this.purchaseDate = this.date;
  }

  // Sync rate fields
  if (!this.rate && this.purchaseRate) {
    this.rate = this.purchaseRate;
  }
  if (!this.purchaseRate && this.rate) {
    this.purchaseRate = this.rate;
  }

  // Set remainingQuantity if not set (only for new docs)
  if (
    this.isNew &&
    (this.remainingQuantity === undefined || this.remainingQuantity === 0)
  ) {
    this.remainingQuantity = this.quantity || 0;
  }
});

module.exports = mongoose.model("StockEntry", StockEntrySchema);

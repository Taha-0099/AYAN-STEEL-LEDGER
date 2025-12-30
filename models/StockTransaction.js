// models/StockTransaction.js
const mongoose = require("mongoose");

const StockTransactionSchema = new mongoose.Schema(
  {
    // Transaction type
    type: {
      type: String,
      enum: ["SALE", "ADJUSTMENT", "RETURN", "DAMAGE"],
      required: true,
      index: true
    },

    // Link to stock entry
    stockEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockEntry",
      required: true,
      index: true
    },

    // Product details (denormalized for reporting)
    productType: {
      type: String,
      required: true,
      index: true
    },

    // Customer/Client details (for sales)
    clientName: {
      type: String,
      trim: true,
      index: true
    },

    // Transaction details
    transactionDate: {
      type: Date,
      required: true,
      index: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    // For sales
    saleRate: {
      type: Number,
      min: 0
    },

    costRate: {
      type: Number,
      required: true,
      min: 0
    },

    // Additional charges
    loadingCharges: {
      type: Number,
      default: 0
    },

    transportCharges: {
      type: Number,
      default: 0
    },

    otherCharges: {
      type: Number,
      default: 0
    },

    otherExpenseName: {
      type: String,
      trim: true
    },

    // Payment details (for sales)
    paymentType: {
      type: String,
      enum: ["CASH", "BANK", "CHEQUE", "CREDIT", "ONLINE"],
      default: "CASH"
    },

    bankName: {
      type: String,
      trim: true
    },

    chequeNo: {
      type: String,
      trim: true
    },

    chequeDate: {
      type: Date
    },

    transactionReference: {
      type: String,
      trim: true
    },

    // Delivery details
    deliveryDate: {
      type: Date
    },

    vehicleNumber: {
      type: String,
      trim: true
    },

    driverName: {
      type: String,
      trim: true
    },

    // Notes
    remarks: {
      type: String,
      trim: true
    },

    // Link to ledger entry if applicable
    ledgerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerEntry"
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals for calculated fields
StockTransactionSchema.virtual('totalSaleValue').get(function() {
  if (!this.saleRate) return 0;
  return this.quantity * this.saleRate;
});

StockTransactionSchema.virtual('totalCost').get(function() {
  const baseCost = this.quantity * this.costRate;
  const charges = (this.loadingCharges || 0) + (this.transportCharges || 0) + (this.otherCharges || 0);
  return baseCost + charges;
});

StockTransactionSchema.virtual('profit').get(function() {
  if (this.type !== 'SALE' || !this.saleRate) return 0;
  return this.totalSaleValue - this.totalCost;
});

StockTransactionSchema.virtual('profitMargin').get(function() {
  if (this.totalSaleValue === 0) return 0;
  return (this.profit / this.totalSaleValue) * 100;
});

// Indexes for better query performance
StockTransactionSchema.index({ type: 1, transactionDate: -1 });
StockTransactionSchema.index({ clientName: 1, transactionDate: -1 });
StockTransactionSchema.index({ productType: 1, type: 1 });
StockTransactionSchema.index({ stockEntryId: 1, type: 1 });

module.exports = mongoose.model("StockTransaction", StockTransactionSchema);
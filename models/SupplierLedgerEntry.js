const mongoose = require("mongoose");

const SupplierLedgerEntrySchema = new mongoose.Schema(
  {
    // Supplier / company / person name
    personName: {
      type: String,
      required: true,
      trim: true,
    },

    // "OPENING", "PURCHASE", "PAYMENT"
    type: {
      type: String,
      enum: ["OPENING", "PURCHASE", "PAYMENT"],
      default: "PAYMENT",
    },

    // When this entry happened
    paymentDate: {
      type: Date,
      default: Date.now,
    },

    // Bank or "CASH"
    bankName: {
      type: String,
      default: "",
    },

    // Main amount (for purchase / opening / payment)
    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    // Description of purchase/payment
    note: {
      type: String,
      default: "",
    },

    // Extra expense details
    otherExpenseName: {
      type: String,
      default: "",
    },

    otherExpenseAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SupplierLedgerEntry",
  SupplierLedgerEntrySchema
);

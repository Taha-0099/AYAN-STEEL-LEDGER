const mongoose = require("mongoose");

const SupplierLedgerSchema = new mongoose.Schema(
  {
    // Supplier / Company / Person name
    personName: {
      type: String,
      required: true,
      trim: true,
    },

    // OPENING | PURCHASE | PAYMENT
    type: {
      type: String,
      enum: ["OPENING", "PURCHASE", "PAYMENT"],
      default: "PAYMENT",
    },

    // Main date of transaction
    paymentDate: {
      type: Date,
      required: true,
    },

    // Description like "7652kg + loading 2328 Rs (ZEM)"
    description: {
      type: String,
      default: "",
    },

    // Extra note if needed
    note: {
      type: String,
      default: "",
    },

    // For purchase rows (optional)
    quantity: {
      type: Number,
      default: 0,
    },

    rate: {
      type: Number,
      default: 0,
    },

    // Main amount:
    //  - For OPENING / PURCHASE → invoice amount
    //  - For PAYMENT → amount paid
    amount: {
      type: Number,
      default: 0,
    },

    // Other expense (loading, labour, bank charges etc.)
    expenseName: {
      type: String,
      default: "",
    },

    expenseAmount: {
      type: Number,
      default: 0,
    },

    // CASH / BANK / ONLINE etc.
    paymentType: {
      type: String,
      default: "",
    },

    bankName: {
      type: String,
      default: "",
    },

    chequeNo: {
      type: String,
      default: "",
    },

    chequeDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupplierLedger", SupplierLedgerSchema);

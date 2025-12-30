// models/SupplierPayment.js
const mongoose = require("mongoose");

const SupplierPaymentSchema = new mongoose.Schema(
  {
    personName: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["OPENING", "PURCHASE", "PAYMENT", "ADJUSTMENT"],
      default: "PAYMENT",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE", "CREDIT"],
      default: "CASH",
    },

    bankName: String,
    chequeNo: String,
    chequeDate: Date,
    transactionReference: String,

    invoiceNumber: String,
    invoiceDate: Date,

    note: String,

    stockEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockEntry",
    },

    otherExpenseName: String,
    otherExpenseAmount: {
      type: Number,
      default: 0,
    },
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model("SupplierPayment", SupplierPaymentSchema);
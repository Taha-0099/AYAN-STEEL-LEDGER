// models/LedgerEntry.js
const mongoose = require("mongoose");

const LedgerEntrySchema = new mongoose.Schema(
  {
    // client / account name
    accountName: {
      type: String,
      required: true
    },
    category: {
  type: String,
  enum: ["SALE", "PURCHASE"],
  default: "SALE"
},


    date: {
      type: Date,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    // 🔹 product type for stock (CRC, GIRDER etc.)
    productType: {
      type: String,
      default: ""
    },

    quantity: {
      type: Number,
      default: 0
    },

    rate: {
      type: Number,
      default: 0
    },

    // Loading amount
    loading: {
      type: Number,
      default: 0
    },

    debit: {
      type: Number,
      default: 0
    },

    credit: {
      type: Number,
      default: 0
    },

    closingBalance: {
      type: Number,
      default: 0
    },

    mdays: {
      type: Number,
      default: 0
    },

    dueDate: {
      type: Date
    },

    liftingDate: {
      type: Date
    },

    // PAYMENT FIELDS
    paymentType: {
      type: String,
      enum: ["CASH", "BANK", "CHEQUE"],
      default: "CASH"
    },

    bankName: {
      type: String,
      default: ""
    },

    chequeNo: {
      type: String,
      default: ""
    },

    chequeDate: {
      type: Date
    },

    // 🔹 NEW: other expense per sale (for stock dashboard)
    otherExpenseName: {
      type: String,
      default: ""
    },

    otherExpenseAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LedgerEntry", LedgerEntrySchema);

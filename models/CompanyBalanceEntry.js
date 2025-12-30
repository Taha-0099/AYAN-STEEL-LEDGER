// models/CompanyBalanceEntry.js
const mongoose = require("mongoose");

const CompanyBalanceEntrySchema = new mongoose.Schema(
  {
    personName: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    debit: {
      type: Number,
      default: 0
    },
    credit: {
      type: Number,
      default: 0
    },
    // running remaining balance for this person
    closingBalance: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "CompanyBalanceEntry",
  CompanyBalanceEntrySchema
);

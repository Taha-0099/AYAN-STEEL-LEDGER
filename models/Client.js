const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    nameLower: { type: String, index: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    openingBalance: { type: Number, default: 0 },
    remarks: { type: String, default: "" }
  },
  { timestamps: true }
);

clientSchema.pre("save", function (next) {
  if (this.name) this.nameLower = this.name.toLowerCase();
  next();
});

module.exports = mongoose.model("Client", clientSchema);

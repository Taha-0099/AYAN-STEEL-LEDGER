// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const ledgerRoutes = require("./routes/ledgerRoutes");
const clientRoutes = require("./routes/clientRoutes");
const companyBalanceRoutes = require("./routes/companyBalanceRoutes");
const stockRoutes = require("./routes/stockRoutes");
const supplierLedgerRoutes = require("./routes/supplierLedgerRoutes");
const supplierPaymentRoutes = require("./routes/supplierPaymentRoutes");
const app = express();

app.use(cors());
app.use(express.json());

// ----- MongoDB -----
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ledger_db";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo connection error", err));

// ----- ROUTES -----

// 🔹 Ledger routes – mount on BOTH prefixes
app.use("/api/ledger", ledgerRoutes);   // new style
app.use("/ledger", ledgerRoutes);       // old style (for existing calls)

// 🔹 Client routes – same idea if you use them with/without /api
app.use("/api/clients", clientRoutes);
app.use("/clients", clientRoutes);

// 🔹 Company balance routes
app.use("/api/company-balance", companyBalanceRoutes);


app.use("/api/supplier-ledger", supplierLedgerRoutes);
app.use("/api/supplier-payments", supplierPaymentRoutes);

// health check

app.use("/api/stock", stockRoutes);
app.get("/", (req, res) => {
  res.send("Ledger backend running");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

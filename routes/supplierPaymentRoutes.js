// routes/supplierPaymentRoutes.js
const express = require("express");
const router = express.Router();
const SupplierPayment = require("../models/SupplierPayment");
const StockEntry = require("../models/StockEntry");

// GET /api/supplier-payments - Get all supplier payments with filters
router.get("/", async (req, res) => {
  try {
    const { personName, type, fromDate, toDate } = req.query;
    const query = {};

    if (personName) query.personName = personName;
    if (type) query.type = type;
    
    if (fromDate || toDate) {
      query.paymentDate = {};
      if (fromDate) query.paymentDate.$gte = new Date(fromDate);
      if (toDate) query.paymentDate.$lte = new Date(toDate);
    }

    const entries = await SupplierPayment.find(query)
      .sort({ paymentDate: 1, _id: 1 })
      .populate('stockEntryId');

    res.json(entries);
  } catch (err) {
    console.error("GET /api/supplier-payments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/supplier-payments/summary - Get supplier balances summary
router.get("/summary", async (req, res) => {
  try {
    const payments = await SupplierPayment.find().lean();
    
    const supplierBalances = {};
    
    payments.forEach(payment => {
      const name = payment.personName || "Unknown";
      
      if (!supplierBalances[name]) {
        supplierBalances[name] = {
          name,
          totalPurchases: 0,
          totalPayments: 0,
          openingBalance: 0,
          transactions: []
        };
      }
      
      const amount = Number(payment.amount) || 0;
      
      if (payment.type === "OPENING") {
        supplierBalances[name].openingBalance += amount;
        supplierBalances[name].totalPurchases += amount;
      } else if (payment.type === "PURCHASE") {
        supplierBalances[name].totalPurchases += amount;
      } else if (payment.type === "PAYMENT") {
        supplierBalances[name].totalPayments += amount;
      }
      
      supplierBalances[name].transactions.push({
        date: payment.paymentDate,
        type: payment.type,
        amount: amount,
        note: payment.note
      });
    });
    
    // Calculate outstanding for each supplier
    const summary = Object.values(supplierBalances).map(supplier => ({
      name: supplier.name,
      totalPurchases: supplier.totalPurchases,
      totalPayments: supplier.totalPayments,
      openingBalance: supplier.openingBalance,
      outstanding: supplier.totalPurchases - supplier.totalPayments,
      transactionCount: supplier.transactions.length
    }));
    
    res.json(summary);
  } catch (err) {
    console.error("GET /api/supplier-payments/summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/supplier-payments/:id - Get single payment
router.get("/:id", async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id)
      .populate('stockEntryId');
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    res.json(payment);
  } catch (err) {
    console.error("GET /api/supplier-payments/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/supplier-payments - Create new payment
router.post("/", async (req, res) => {
  try {
    const {
      personName,
      type,
      paymentDate,
      amount,
      paymentMethod,
      bankName,
      chequeNo,
      chequeDate,
      transactionReference,
      invoiceNumber,
      invoiceDate,
      note,
      stockEntryId,
      otherExpenseName,
      otherExpenseAmount
    } = req.body;

    if (!personName || amount == null) {
      return res.status(400).json({ 
        message: "personName and amount are required" 
      });
    }

    const payment = new SupplierPayment({
      personName: personName.trim(),
      type: type || "PAYMENT",
      paymentDate: paymentDate || new Date(),
      amount: Number(amount),
      paymentMethod: paymentMethod || "CASH",
      bankName: bankName?.trim(),
      chequeNo: chequeNo?.trim(),
      chequeDate,
      transactionReference: transactionReference?.trim(),
      invoiceNumber: invoiceNumber?.trim(),
      invoiceDate,
      note: note?.trim(),
      stockEntryId,
      otherExpenseName: otherExpenseName?.trim(),
      otherExpenseAmount: Number(otherExpenseAmount) || 0
    });

    const saved = await payment.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST /api/supplier-payments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/supplier-payments/:id - Update payment
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Trim string fields
    if (updateData.personName) updateData.personName = updateData.personName.trim();
    if (updateData.bankName) updateData.bankName = updateData.bankName.trim();
    if (updateData.note) updateData.note = updateData.note.trim();
    
    // Convert numeric fields
    if (updateData.amount !== undefined) updateData.amount = Number(updateData.amount);
    if (updateData.otherExpenseAmount !== undefined) {
      updateData.otherExpenseAmount = Number(updateData.otherExpenseAmount);
    }

    const updated = await SupplierPayment.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("PUT /api/supplier-payments/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/supplier-payments/:id - Delete payment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await SupplierPayment.findById(id);
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // If this is a purchase linked to stock, prevent deletion
    if (payment.type === "PURCHASE" && payment.stockEntryId) {
      const stockEntry = await StockEntry.findById(payment.stockEntryId);
      if (stockEntry) {
        return res.status(400).json({ 
          message: "Cannot delete purchase payment linked to stock entry. Delete the stock entry first." 
        });
      }
    }

    await SupplierPayment.findByIdAndDelete(id);
    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/supplier-payments/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/supplier-payments/opening - Set opening balance
router.post("/opening", async (req, res) => {
  try {
    const { personName, amount, note } = req.body;
    
    if (!personName) {
      return res.status(400).json({ 
        message: "personName is required for opening balance" 
      });
    }

    const numericAmount = Number(amount) || 0;

    // Delete existing opening balance
    await SupplierPayment.deleteMany({
      personName: personName.trim(),
      type: "OPENING",
    });

    // Create new opening balance
    const opening = new SupplierPayment({
      personName: personName.trim(),
      type: "OPENING",
      paymentDate: new Date(),
      amount: numericAmount,
      note: note || "Opening balance set",
    });

    const saved = await opening.save();
    res.json(saved);
  } catch (err) {
    console.error("POST /api/supplier-payments/opening error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/supplier-payments/ledger/:personName - Get ledger for specific supplier
router.get("/ledger/:personName", async (req, res) => {
  try {
    const { personName } = req.params;
    
    const payments = await SupplierPayment.find({ personName })
      .sort({ paymentDate: 1, _id: 1 })
      .populate('stockEntryId');
    
    let runningBalance = 0;
    const ledger = payments.map(payment => {
      const amount = Number(payment.amount) || 0;
      
      if (payment.type === "OPENING" || payment.type === "PURCHASE") {
        runningBalance += amount;
      } else if (payment.type === "PAYMENT") {
        runningBalance -= amount;
      }
      
      return {
        ...payment.toObject(),
        balance: runningBalance
      };
    });
    
    res.json({
      personName,
      ledger,
      closingBalance: runningBalance,
      totalPurchases: payments
        .filter(p => p.type === "PURCHASE" || p.type === "OPENING")
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
      totalPayments: payments
        .filter(p => p.type === "PAYMENT")
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    });
  } catch (err) {
    console.error("GET /api/supplier-payments/ledger/:personName error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
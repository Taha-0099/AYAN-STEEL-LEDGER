// routes/ledger.js
const express = require("express");
const router = express.Router();
const LedgerEntry = require("../models/LedgerEntry");

// =====================================================
// GET /api/ledger
// Supports:
//  - ?accountName=ABC
//  - ?category=SALE|PURCHASE
//  - ?from=YYYY-MM-DD&to=YYYY-MM-DD
// =====================================================
router.get("/", async (req, res) => {
  try {
    const { accountName, from, to, category } = req.query;

    const query = {};

    if (accountName) {
      query.accountName = accountName;
    }

    // ✅ NEW: category filter
    if (category) {
      query.category = category;
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const entries = await LedgerEntry.find(query).sort({ date: 1, _id: 1 });
    res.json(entries);
  } catch (err) {
    console.error("GET /api/ledger error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =====================================================
// POST /api/ledger
// ✅ NEW: accepts category
// =====================================================
router.post("/", async (req, res) => {
  try {
    const {
      category, // ✅ NEW

      accountName,
      date,
      description,
      productType,
      quantity,
      rate,
      loading,
      debit,
      credit,
      closingBalance,
      mdays,
      dueDate,
      liftingDate,
      paymentType,
      bankName,
      chequeNo,
      chequeDate,
      otherExpenseName,
      otherExpenseAmount,
    } = req.body;

    const entry = new LedgerEntry({
      // ✅ NEW
      category: category || "SALE",

      accountName,
      date,
      description,
      productType: productType || "",
      quantity,
      rate,
      loading,
      debit,
      credit,
      closingBalance,
      mdays,
      dueDate,
      liftingDate,

      paymentType: paymentType || "CASH",
      bankName: paymentType === "BANK" ? bankName : "",
      chequeNo: paymentType === "CHEQUE" ? chequeNo : "",
      chequeDate: paymentType === "CHEQUE" && chequeDate ? chequeDate : null,

      // keep compatible with your model
      otherExpenseName: otherExpenseName || "",
      otherExpenseAmount: Number(otherExpenseAmount) || 0,
    });

    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST /api/ledger error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =====================================================
// PUT /api/ledger/:id
// ✅ SAFE PARTIAL UPDATE
// ✅ NEW: supports category update
// =====================================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      category, // ✅ NEW

      accountName,
      date,
      description,
      productType,
      quantity,
      rate,
      loading,
      debit,
      credit,
      closingBalance,
      mdays,
      dueDate,
      liftingDate,
      paymentType,
      bankName,
      chequeNo,
      chequeDate,
      otherExpenseName,
      otherExpenseAmount,
    } = req.body;

    const update = {};

    // ✅ NEW
    if (category !== undefined) update.category = category;

    if (accountName !== undefined) update.accountName = accountName;
    if (date !== undefined) update.date = date;
    if (description !== undefined) update.description = description;
    if (productType !== undefined) update.productType = productType || "";

    if (quantity !== undefined) update.quantity = Number(quantity) || 0;
    if (rate !== undefined) update.rate = Number(rate) || 0;
    if (loading !== undefined) update.loading = Number(loading) || 0;
    if (debit !== undefined) update.debit = Number(debit) || 0;
    if (credit !== undefined) update.credit = Number(credit) || 0;

    if (closingBalance !== undefined)
      update.closingBalance = Number(closingBalance) || 0;

    if (mdays !== undefined) update.mdays = Number(mdays) || 0;
    if (dueDate !== undefined) update.dueDate = dueDate;
    if (liftingDate !== undefined) update.liftingDate = liftingDate;

    // Optional fields
    if (otherExpenseName !== undefined)
      update.otherExpenseName = otherExpenseName || "";
    if (otherExpenseAmount !== undefined)
      update.otherExpenseAmount = Number(otherExpenseAmount) || 0;

    // Payment safe handling
    if (paymentType !== undefined) {
      update.paymentType = paymentType || "CASH";
      update.bankName = paymentType === "BANK" ? (bankName || "") : "";
      update.chequeNo = paymentType === "CHEQUE" ? (chequeNo || "") : "";
      update.chequeDate =
        paymentType === "CHEQUE" && chequeDate ? chequeDate : null;
    }

    const updated = await LedgerEntry.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("PUT /api/ledger/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =====================================================
// PATCH /api/ledger/:id/expense
// =====================================================
router.patch("/:id/expense", async (req, res) => {
  try {
    const { id } = req.params;
    const { otherExpenseName, otherExpenseAmount } = req.body;

    const updated = await LedgerEntry.findByIdAndUpdate(
      id,
      {
        otherExpenseName: otherExpenseName || "",
        otherExpenseAmount: Number(otherExpenseAmount) || 0,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("PATCH /api/ledger/:id/expense error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =====================================================
// DELETE /api/ledger/:id
// =====================================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await LedgerEntry.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json({ message: "Entry deleted" });
  } catch (err) {
    console.error("DELETE /api/ledger/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

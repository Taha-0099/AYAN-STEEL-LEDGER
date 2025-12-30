const express = require("express");
const router = express.Router();
const SupplierLedgerEntry = require("../models/SupplierLedgerEntry");

// GET /api/supplier-ledger?personName=ABC
router.get("/", async (req, res) => {
  try {
    const { personName } = req.query;
    const query = {};

    if (personName) {
      query.personName = personName;
    }

    const entries = await SupplierLedgerEntry.find(query).sort({
      paymentDate: 1,
      _id: 1,
    });

    res.json(entries);
  } catch (err) {
    console.error("GET /api/supplier-ledger error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/supplier-ledger
router.post("/", async (req, res) => {
  try {
    const {
      personName,
      type,
      paymentDate,
      bankName,
      amount,
      note,
      otherExpenseName,
      otherExpenseAmount,
    } = req.body;

    if (!personName || amount == null) {
      return res
        .status(400)
        .json({ message: "personName and amount are required" });
    }

    const entry = new SupplierLedgerEntry({
      personName,
      type: type || "PAYMENT",
      paymentDate: paymentDate || new Date(),
      bankName: bankName || "",
      amount: Number(amount) || 0,
      note: note || "",
      otherExpenseName: otherExpenseName || "",
      otherExpenseAmount: Number(otherExpenseAmount) || 0,
    });

    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST /api/supplier-ledger error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/supplier-ledger/opening
router.post("/opening", async (req, res) => {
  try {
    const { personName, amount, note } = req.body;
    if (!personName) {
      return res
        .status(400)
        .json({ message: "personName is required for opening" });
    }

    const numericAmount = Number(amount) || 0;

    await SupplierLedgerEntry.deleteMany({
      personName,
      type: "OPENING",
    });

    const opening = new SupplierLedgerEntry({
      personName,
      type: "OPENING",
      paymentDate: new Date(),
      amount: numericAmount,
      note: note || "Opening balance set",
    });

    const saved = await opening.save();
    res.json(saved);
  } catch (err) {
    console.error("POST /api/supplier-ledger/opening error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/supplier-ledger/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SupplierLedgerEntry.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json({ message: "Entry deleted" });
  } catch (err) {
    console.error("DELETE /api/supplier-ledger/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/supplier-ledger/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      personName,
      type,
      paymentDate,
      bankName,
      amount,
      note,
      otherExpenseName,
      otherExpenseAmount,
    } = req.body;

    const update = {};

    if (personName !== undefined) update.personName = personName;
    if (type !== undefined) update.type = type;
    if (paymentDate) update.paymentDate = paymentDate;
    if (bankName !== undefined) update.bankName = bankName;
    if (amount !== undefined) update.amount = Number(amount) || 0;
    if (note !== undefined) update.note = note;
    if (otherExpenseName !== undefined) update.otherExpenseName = otherExpenseName;
    if (otherExpenseAmount !== undefined)
      update.otherExpenseAmount = Number(otherExpenseAmount) || 0;

    const updated = await SupplierLedgerEntry.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("PUT /api/supplier-ledger/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

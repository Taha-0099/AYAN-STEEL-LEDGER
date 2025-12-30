// routes/companyBalanceRoutes.js
const express = require("express");
const router = express.Router();
const CompanyBalanceEntry = require("../models/CompanyBalanceEntry");

// helper: recompute closing balance for one person
async function recomputePersonBalance(personName) {
  const entries = await CompanyBalanceEntry.find({ personName }).sort({
    date: 1,
    createdAt: 1
  });

  let bal = 0;
  for (const e of entries) {
    const debit = Number(e.debit) || 0;
    const credit = Number(e.credit) || 0;
    bal += credit - debit;
    e.closingBalance = bal;
    await e.save();
  }
}

// GET all entries (for all persons)
router.get("/", async (req, res) => {
  try {
    const entries = await CompanyBalanceEntry.find({}).sort({
      personName: 1,
      date: 1,
      createdAt: 1
    });
    res.json(entries);
  } catch (err) {
    console.error("Error getting company balances", err);
    res.status(500).json({ message: "Error getting company balances" });
  }
});

// POST new entry – starting balance or normal transaction
router.post("/", async (req, res) => {
  try {
    const { personName, date, description, debit = 0, credit = 0 } = req.body;

    if (!personName || !date) {
      return res
        .status(400)
        .json({ message: "personName and date are required" });
    }

    const entry = new CompanyBalanceEntry({
      personName,
      date,
      description,
      debit,
      credit
      // closingBalance will be computed below
    });

    await entry.save();
    await recomputePersonBalance(personName);

    const saved = await CompanyBalanceEntry.findById(entry._id);
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating company balance entry", err);
    res.status(500).json({ message: "Error creating entry" });
  }
});

// PUT update entry
router.put("/:id", async (req, res) => {
  try {
    const entry = await CompanyBalanceEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const { personName, date, description, debit, credit } = req.body;

    if (personName !== undefined) entry.personName = personName;
    if (date !== undefined) entry.date = date;
    if (description !== undefined) entry.description = description;
    if (debit !== undefined) entry.debit = debit;
    if (credit !== undefined) entry.credit = credit;

    await entry.save();
    await recomputePersonBalance(entry.personName);

    const updated = await CompanyBalanceEntry.findById(entry._id);
    res.json(updated);
  } catch (err) {
    console.error("Error updating company balance entry", err);
    res.status(500).json({ message: "Error updating entry" });
  }
});

// DELETE entry
router.delete("/:id", async (req, res) => {
  try {
    const entry = await CompanyBalanceEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const personName = entry.personName;
    await entry.deleteOne();
    await recomputePersonBalance(personName);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error deleting company balance entry", err);
    res.status(500).json({ message: "Error deleting entry" });
  }
});

module.exports = router;

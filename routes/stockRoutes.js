// routes/stockRoutes.js
const express = require("express");
const router = express.Router();
const StockEntry = require("../models/StockEntry");
const StockSettings = require("../models/StockSettings");

// Try to load SupplierPayment (optional)
let SupplierPayment = null;
try {
  SupplierPayment = require("../models/SupplierPayment");
  console.log("✅ SupplierPayment model loaded");
} catch (err) {
  console.log("⚠️  SupplierPayment model not found, continuing without it");
}

// GET /api/stock - Get all stock entries
router.get("/", async (req, res) => {
  try {
    const { status, productType, supplierName } = req.query;
    const query = {};

    if (status) query.status = status;
    if (productType) query.productType = productType;
    if (supplierName) query.supplierName = supplierName;

    const entries = await StockEntry.find(query).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    console.error("GET /api/stock error:", err);
    res.status(500).json({ 
      message: "Error fetching stock entries",
      error: err.message 
    });
  }
});

// ✅ FIXED: GET /api/stock/summary - Correctly calculates remaining from database
router.get("/summary", async (req, res) => {
  try {
    const all = await StockEntry.find().lean();

    let bookedQty = 0, bookedValue = 0;
    let onWayQty = 0, onWayValue = 0;
    let unloadedQty = 0, unloadedValue = 0;
    let availableQty = 0, availableValue = 0;

    const byProduct = {};

    all.forEach((s) => {
      const qty = Number(s.quantity) || 0;
      
      // ✅ FIX: Check if remainingQuantity exists in DB, don't fallback to qty
      const hasRemainingField = s.remainingQuantity !== undefined && s.remainingQuantity !== null;
      const remainingQty = hasRemainingField ? Number(s.remainingQuantity) : qty;
      
      const rate = Number(s.purchaseRate || s.rate) || 0;
      
      const additionalCosts = 
        (Number(s.loadingCharges) || 0) + 
        (Number(s.unloadingCharges) || 0) + 
        (Number(s.transportCharges) || 0) + 
        (Number(s.otherCharges) || 0);
      
      const totalCost = (qty * rate) + additionalCosts;
      const effectiveRate = qty > 0 ? totalCost / qty : rate;
      
      // ✅ FIX: Value should be based on remaining quantity
      const remainingValue = remainingQty * effectiveRate;

      // Group by status (using remaining quantity)
      switch (s.status) {
        case "BOOKED":
          bookedQty += remainingQty;
          bookedValue += remainingValue;
          break;
        case "ON_WAY":
          onWayQty += remainingQty;
          onWayValue += remainingValue;
          break;
        case "UNLOADED":
          unloadedQty += remainingQty;
          unloadedValue += remainingValue;
          break;
        case "AVAILABLE":
          availableQty += remainingQty;
          availableValue += remainingValue;
          break;
      }

      // ✅ FIX: Group by product type with accurate sold calculation
      const productType = s.productType || "Unknown";
      if (!byProduct[productType]) {
        byProduct[productType] = {
          totalPurchased: 0,
          remaining: 0,
          sold: 0,
          purchaseValue: 0,
          remainingValue: 0
        };
      }
      
      // Only count positive quantities as purchases
      if (qty > 0) {
        byProduct[productType].totalPurchased += qty;
        byProduct[productType].remaining += remainingQty;
        byProduct[productType].sold += (qty - remainingQty);
        byProduct[productType].purchaseValue += totalCost;
        byProduct[productType].remainingValue += remainingValue;
      }
    });

    const totalQty = bookedQty + onWayQty + unloadedQty + availableQty;
    const totalValue = bookedValue + onWayValue + unloadedValue + availableValue;

    const settings = await StockSettings.findOne().lean();
    const manualPaid = settings?.manualPaid || 0;

    console.log("📊 Summary byProduct:", JSON.stringify(byProduct, null, 2));

    res.json({
      bookedQty,
      bookedValue,
      onWayQty,
      onWayValue,
      unloadedQty,
      unloadedValue,
      availableQty,
      availableValue,
      totalQty,
      totalValue,
      manualPaid,
      byProduct
    });
  } catch (err) {
    console.error("GET /api/stock/summary error:", err);
    res.status(500).json({ 
      message: "Error getting summary",
      error: err.message 
    });
  }
});

// POST /api/stock - Create new stock entry
router.post("/", async (req, res) => {
  try {
    console.log("📦 Creating stock entry with data:", req.body);

    const {
      productType,
      status,
      date,
      purchaseDate,
      quantity,
      rate,
      purchaseRate,
      supplierName,
      supplierInvoiceNo,
      transportCompany,
      vehicleNumber,
      warehouseLocation,
      loadingCharges,
      unloadingCharges,
      transportCharges,
      otherCharges,
      otherChargesDescription,
      expectedArrivalDate,
      notes
    } = req.body;

    // Use either field name
    const finalDate = purchaseDate || date;
    const finalRate = purchaseRate || rate;

    if (!productType) {
      return res.status(400).json({ message: "Product type is required" });
    }
    if (!finalDate) {
      return res.status(400).json({ message: "Date is required" });
    }
    if (!quantity) {
      return res.status(400).json({ message: "Quantity is required" });
    }
    if (!finalRate) {
      return res.status(400).json({ message: "Rate is required" });
    }

    const entry = new StockEntry({
      productType,
      status: status || "BOOKED",
      date: finalDate,
      purchaseDate: finalDate,
      quantity: Number(quantity),
      remainingQuantity: Number(quantity), // ✅ Always set remaining = quantity for new entries
      rate: Number(finalRate),
      purchaseRate: Number(finalRate),
      supplierName,
      supplierInvoiceNo,
      transportCompany,
      vehicleNumber,
      warehouseLocation,
      loadingCharges: Number(loadingCharges) || 0,
      unloadingCharges: Number(unloadingCharges) || 0,
      transportCharges: Number(transportCharges) || 0,
      otherCharges: Number(otherCharges) || 0,
      otherChargesDescription,
      expectedArrivalDate,
      notes
    });

    await entry.save();
    console.log("✅ Stock entry saved:", entry._id);

    // Create supplier payment if model exists
    if (supplierName && SupplierPayment) {
      try {
        const baseCost = Number(quantity) * Number(finalRate);
        const totalCharges = 
          (Number(loadingCharges) || 0) +
          (Number(unloadingCharges) || 0) +
          (Number(transportCharges) || 0) +
          (Number(otherCharges) || 0);
        const totalCost = baseCost + totalCharges;

        const supplierPayment = new SupplierPayment({
          personName: supplierName,
          type: "PURCHASE",
          paymentDate: finalDate,
          amount: totalCost,
          invoiceNumber: supplierInvoiceNo,
          invoiceDate: finalDate,
          note: `Stock purchase: ${productType} - ${quantity} units @ ${finalRate}`,
          stockEntryId: entry._id
        });

        await supplierPayment.save();
        console.log("✅ Supplier payment created:", supplierPayment._id);
        
        entry.supplierPaymentId = supplierPayment._id;
        await entry.save();
      } catch (supplierErr) {
        console.error("⚠️  Supplier payment error (non-critical):", supplierErr.message);
      }
    }

    res.status(201).json(entry);
  } catch (err) {
    console.error("❌ POST /api/stock error:", err);
    res.status(500).json({ 
      message: "Error creating stock entry",
      error: err.message 
    });
  }
});

// PUT /api/stock/:id - Update stock entry
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Sync date fields
    if (updateData.date && !updateData.purchaseDate) {
      updateData.purchaseDate = updateData.date;
    }
    if (updateData.purchaseDate && !updateData.date) {
      updateData.date = updateData.purchaseDate;
    }

    // Sync rate fields
    if (updateData.rate && !updateData.purchaseRate) {
      updateData.purchaseRate = updateData.rate;
    }
    if (updateData.purchaseRate && !updateData.rate) {
      updateData.rate = updateData.purchaseRate;
    }

    const updated = await StockEntry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Stock entry not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("PUT /api/stock/:id error:", err);
    res.status(500).json({ 
      message: "Error updating stock entry",
      error: err.message 
    });
  }
});

// DELETE /api/stock/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await StockEntry.findById(id);
    
    if (!entry) {
      return res.status(404).json({ message: "Stock entry not found" });
    }

    // Check if stock has been sold
    const qty = entry.quantity || 0;
    const remaining = entry.remainingQuantity !== undefined ? entry.remainingQuantity : qty;
    
    if (remaining < qty) {
      return res.status(400).json({ 
        message: "Cannot delete stock entry with sales. Please adjust sales first." 
      });
    }

    // Delete supplier payment if exists
    if (entry.supplierPaymentId && SupplierPayment) {
      try {
        await SupplierPayment.findByIdAndDelete(entry.supplierPaymentId);
      } catch (err) {
        console.error("Supplier payment delete error:", err);
      }
    }

    await StockEntry.findByIdAndDelete(id);
    res.json({ message: "Stock entry deleted" });
  } catch (err) {
    console.error("DELETE /api/stock/:id error:", err);
    res.status(500).json({ 
      message: "Error deleting stock entry",
      error: err.message 
    });
  }
});

// POST /api/stock/manual-paid
router.post("/manual-paid", async (req, res) => {
  try {
    const { totalPaid } = req.body;
    const numeric = Number(totalPaid) || 0;

    const settings = await StockSettings.findOneAndUpdate(
      {},
      { manualPaid: numeric },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      manualPaid: settings.manualPaid,
    });
  } catch (err) {
    console.error("POST /api/stock/manual-paid error:", err);
    res.status(500).json({ 
      message: "Error saving manual paid",
      error: err.message 
    });
  }
});

// POST /api/stock/:id/update-status
router.post("/:id/update-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await StockEntry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Stock entry not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("POST /api/stock/:id/update-status error:", err);
    res.status(500).json({ 
      message: "Error updating status",
      error: err.message 
    });
  }
});

module.exports = router;
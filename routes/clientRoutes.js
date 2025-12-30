const express = require("express");
const Client = require("../models/Client");
const router = express.Router();

// create
router.post("/", async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create client", details: err.message });
  }
});

// list
router.get("/", async (req, res) => {
  const clients = await Client.find().sort({ nameLower: 1 });
  res.json(clients);
});

// get one
router.get("/:id", async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ error: "Not found" });
  res.json(client);
});

// update
router.put("/:id", async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!client) return res.status(404).json({ error: "Not found" });
    res.json(client);
  } catch (err) {
    res.status(400).json({ error: "Failed to update client", details: err.message });
  }
});

// delete
router.delete("/:id", async (req, res) => {
  await Client.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

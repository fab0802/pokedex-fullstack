const express = require("express");
const authMiddleware = require("../middleware/auth");
const CollectionEntry = require("../models/CollectionEntry");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { pokemonId, caught } = req.body;
    const entry = await CollectionEntry.findOneAndUpdate(
      { user: req.userId, pokemonId },
      { caught },
      { upsert: true, new: true },
    );
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

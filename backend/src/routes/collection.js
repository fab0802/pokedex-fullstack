const express = require("express");
const authMiddleware = require("../middleware/auth");
const CollectionEntry = require("../models/CollectionEntry");

const router = express.Router();

// Fangstatus fuer ein Pokemon in einem bestimmten Spiel setzen.
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { pokemonId, caught, game = "all" } = req.body;

    // Nur bekannte Spiel-IDs zulassen (Filter-Teil des Upserts wird nicht
    // automatisch ueber das Schema-enum validiert, daher hier explizit).
    if (!CollectionEntry.GAME_IDS.includes(game)) {
      return res.status(400).json({ error: "Invalid game" });
    }

    const entry = await CollectionEntry.findOneAndUpdate(
      { user: req.userId, pokemonId, game },
      { caught },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Alle Eintraege des Users (ueber alle Spiele). Das Frontend gruppiert selbst
// nach Spiel; so genuegt ein Abruf beim Login.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const entries = await CollectionEntry.find({ user: req.userId });
    res.json(entries);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

const express = require("express");
const authMiddleware = require("../middleware/auth");
const Comparison = require("../models/Comparison");

const router = express.Router();

// Vergleichsliste des Users lesen (leer, falls noch keine existiert).
router.get("/", authMiddleware, async (req, res) => {
  try {
    const list = await Comparison.findOne({ user: req.userId });
    res.json({ pokemonIds: list?.pokemonIds ?? [] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Komplette Liste setzen – Hinzufügen, Entfernen, Umsortieren und Leeren
// laufen alle über diesen einen Endpoint (Client hält immer die volle Liste).
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { pokemonIds } = req.body;
    if (!Array.isArray(pokemonIds)) {
      return res.status(400).json({ error: "pokemonIds muss ein Array sein" });
    }
    // Nur gültige, ganzzahlige IDs; Duplikate entfernen, Reihenfolge wahren.
    const cleaned = [
      ...new Set(
        pokemonIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];
    const list = await Comparison.findOneAndUpdate(
      { user: req.userId },
      { pokemonIds: cleaned },
      { upsert: true, new: true },
    );
    res.json({ pokemonIds: list.pokemonIds });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

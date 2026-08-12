const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Nur diese Schluessel darf der Client setzen (verhindert Mass-Assignment,
// z. B. dass jemand ueber settings.* fremde Felder ueberschreibt).
const ALLOWED_KEYS = ["theme", "ball", "displayStat", "game"];

// Aktuelle Einstellungen des eingeloggten Users lesen.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("settings");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Nur die mitgeschickten Felder aktualisieren (Teil-Update).
router.put("/", authMiddleware, async (req, res) => {
  try {
    // Erlaubte Keys einsammeln und auf settings.<key> mappen.
    const updates = {};
    for (const key of ALLOWED_KEYS) {
      if (req.body[key] !== undefined) {
        updates[`settings.${key}`] = req.body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid settings provided" });
    }

    // runValidators erzwingt die enum-Pruefung aus dem Schema -> ungueltige
    // Werte landen im catch und geben einen sauberen 400 zurueck.
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("settings");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

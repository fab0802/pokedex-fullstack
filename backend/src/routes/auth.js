const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Diese Einstellungs-Keys darf ein neuer User beim Registrieren mitgeben
// (die als Gast getroffenen Praeferenzen). Alles andere wird ignoriert.
const ALLOWED_SETTINGS = ["theme", "ball", "displayStat", "game"];

router.post("/register", async (req, res) => {
  try {
    const { email, password, settings } = req.body;

    // Nur erlaubte Keys uebernehmen; fehlende Felder bekommen ihre Defaults.
    // Ungueltige Werte fallen ueber die enum-Validierung des Schemas raus.
    const seededSettings = {};
    if (settings && typeof settings === "object") {
      for (const key of ALLOWED_SETTINGS) {
        if (settings[key] !== undefined) seededSettings[key] = settings[key];
      }
    }

    const user = await User.create({
      email,
      password,
      settings: seededSettings,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});

module.exports = router;

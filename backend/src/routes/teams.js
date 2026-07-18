const express = require("express");
const authMiddleware = require("../middleware/auth");
const Team = require("../models/Team");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({ user: req.userId });
    res.json(teams);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, pokemonIds } = req.body;
    const team = await Team.create({ user: req.userId, name, pokemonIds });
    res.status(201).json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, pokemonIds } = req.body;
    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { name, pokemonIds },
      { new: true, runValidators: true },
    );
    if (!team) return res.status(404).json({ error: "Team nicht gefunden" });
    res.json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const team = await Team.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json({ message: "Team deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

const express = require("express");
const authMiddleware = require("../middleware/auth");
const Team = require("../models/Team");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({ user: req.userId }).sort({
      order: 1,
      createdAt: 1,
    });
    res.json(teams);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, pokemonIds, game } = req.body;
    // Neues Team ans Ende einsortieren: order = Anzahl bestehender Teams.
    const order = await Team.countDocuments({ user: req.userId });
    const team = await Team.create({
      user: req.userId,
      name,
      pokemonIds,
      game: game || "all", // fehlt game => allgemeines Team
      order,
    });
    res.status(201).json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/reorder", authMiddleware, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: "orderedIds muss ein Array sein" });
    }
    // Jede ID bekommt ihren Index als neuen order-Wert – nur eigene Teams.
    const ops = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, user: req.userId },
        update: { order: index },
      },
    }));
    if (ops.length > 0) await Team.bulkWrite(ops);
    const teams = await Team.find({ user: req.userId }).sort({
      order: 1,
      createdAt: 1,
    });
    res.json(teams);
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
    if (!team) return res.status(404).json({ error: "Team not found" });
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

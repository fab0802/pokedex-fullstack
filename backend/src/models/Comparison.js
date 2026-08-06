const mongoose = require("mongoose");

const comparisonSchema = new mongoose.Schema(
  {
    // Genau eine Vergleichsliste pro User (unique).
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Reihenfolge zählt (Swipe/Umsortieren), daher ein geordnetes Array.
    pokemonIds: { type: [Number], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Comparison", comparisonSchema);

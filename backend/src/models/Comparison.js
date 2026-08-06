const mongoose = require("mongoose");

const comparisonSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    pokemonIds: { type: [Number], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Comparison", comparisonSchema);

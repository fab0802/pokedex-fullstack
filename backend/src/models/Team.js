const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    pokemonIds: {
      type: [Number],
      validate: [(arr) => arr.length <= 6, "Maximal 6 Pokémon pro Team"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Team", teamSchema);

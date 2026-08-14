const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    // Spiel-Zuordnung: "all" = allgemeines Team (in jedem Spiel sichtbar),
    // sonst eine Spiel-ID aus games.js (z. B. "rby"). Bestehende Teams ohne
    // Feld werden im Frontend-Filter als "all" behandelt.
    game: { type: String, default: "all" },
    pokemonIds: {
      type: [Number],
      validate: [(arr) => arr.length <= 6, "Maximal 6 Pokémon pro Team"],
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Team", teamSchema);

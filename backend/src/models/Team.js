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
    // Movesets je Team-Mitglied: Pokémon-ID (als String-Key) -> geordnete
    // Liste von Move-Slugs (Reihenfolge = Slot 1-4). Max. 4 pro Pokémon.
    // Fehlt das Feld (alte Teams), wird es im Frontend als leer behandelt.
    movesets: {
      type: Map,
      of: [String],
      validate: {
        validator(map) {
          if (!map) return true;
          for (const moves of map.values()) {
            if (!Array.isArray(moves) || moves.length > 4) return false;
          }
          return true;
        },
        message: "Maximal 4 Attacken pro Pokémon",
      },
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Team", teamSchema);

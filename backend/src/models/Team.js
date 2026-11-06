const mongoose = require("mongoose");

const MAX_NAME_LENGTH = 30;

const teamSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // trim entfernt Leerzeichen am Rand, maxlength begrenzt die Länge –
    // greift bei create() und (dank runValidators) auch bei Updates.
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [
        MAX_NAME_LENGTH,
        `Maximal ${MAX_NAME_LENGTH} Zeichen pro Teamname`,
      ],
    },
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

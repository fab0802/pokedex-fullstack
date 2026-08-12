const mongoose = require("mongoose");

// Erlaubte Spiel-IDs. "all" = allgemeiner Fangstatus, wenn kein Spiel gewaehlt
// ist. Muss mit den ids in frontend/src/components/games.js uebereinstimmen.
const GAME_IDS = [
  "all",
  "rby",
  "gsc",
  "rse",
  "dpp",
  "bw",
  "xy",
  "sm",
  "swsh",
  "sv",
];

const collectionEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pokemonId: { type: Number, required: true },
    // Der Fangstatus wird jetzt je Spiel getrennt gefuehrt.
    game: { type: String, enum: GAME_IDS, default: "all", required: true },
    caught: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Ein Eintrag pro (User, Pokemon, Spiel). Verhindert Doppel-Eintraege und
// macht den Upsert in der Route eindeutig.
collectionEntrySchema.index(
  { user: 1, pokemonId: 1, game: 1 },
  { unique: true },
);

collectionEntrySchema.statics.GAME_IDS = GAME_IDS;

module.exports = mongoose.model("CollectionEntry", collectionEntrySchema);

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Erlaubte Spiel-IDs fuer den persistierten Spielfilter.
// Muss mit den ids in frontend/src/components/games.js uebereinstimmen.
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

// Persoenliche UI-Einstellungen, 1:1 an den User gebunden.
// enum + default sorgen dafuer, dass nur gueltige Werte gespeichert werden
// und bestehende User automatisch sinnvolle Standardwerte bekommen.
const settingsSchema = new mongoose.Schema(
  {
    theme: {
      type: String,
      enum: ["system", "light", "dark"],
      default: "system",
    },
    ball: {
      type: String,
      enum: ["poke", "great", "ultra", "master"],
      default: "poke",
    },
    displayStat: {
      type: String,
      enum: [
        "off",
        "total",
        "hp",
        "attack",
        "defense",
        "special-attack",
        "special-defense",
        "speed",
      ],
      default: "total",
    },
    // Zuletzt gewaehlter Spielfilter. "all" = keine Einschraenkung.
    game: {
      type: String,
      enum: GAME_IDS,
      default: "all",
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // default: () => ({}) legt das Sub-Objekt mit den Feld-Defaults an.
    settings: { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("User", userSchema);

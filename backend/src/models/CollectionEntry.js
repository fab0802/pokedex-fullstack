const mongoose = require("mongoose");

const collectionEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pokemonId: { type: Number, required: true },
    caught: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CollectionEntry", collectionEntrySchema);

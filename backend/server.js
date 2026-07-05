require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", require("./src/routes/auth"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB verbunden"))
  .catch((err) => console.error("MongoDB Fehler:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));

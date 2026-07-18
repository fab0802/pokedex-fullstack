require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const allowedOrigins = [
  "http://localhost:5173", // Vite-Dev-Server (lokal)
  process.env.FRONTEND_URL, // Netlify-URL (aus Umgebungsvariable)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Anfragen ohne Origin (z.B. Postman/Server-zu-Server) erlauben
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);
app.use(express.json());
app.use("/auth", require("./src/routes/auth"));
app.use("/collection", require("./src/routes/collection"));
app.use("/teams", require("./src/routes/teams"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

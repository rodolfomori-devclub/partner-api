// backend/src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./routes/userRoutes");
const locationRoutes = require("./routes/locationRoutes");

const app = express();

// Middleware CORS - Ajustar para permitir solicitações do frontend
app.use(cors());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://partner.devclub.com.br",
    ], // Adicione todas as origens do frontend
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Rotas
app.use("/api/users", userRoutes);
app.use("/api/location", locationRoutes);

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "Encontre um Partner API" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Ocorreu um erro interno no servidor",
  });
});

module.exports = app;

"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const indexRouter = require("./routes/index");
const notesFromBRouter = require("./routes/notes_from_b");

const app = express();

function createCorsOptions() {
  const rawOrigins = process.env.CORS_ORIGINS || "*";

  if (rawOrigins.trim() === "*") {
    return { origin: "*", methods: ["GET", "OPTIONS"] };
  }

  const allowedOrigins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    methods: ["GET", "OPTIONS"],
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORSで許可されていないアクセス元です: ${origin}`));
    },
  };
}

app.disable("x-powered-by");
app.use(cors(createCorsOptions()));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.use("/", indexRouter);
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mongodb-display-backend",
    timestamp: new Date().toISOString(),
  });
});
app.use("/notes_from_b", notesFromBRouter);

app.use((req, res) => {
  res.status(404).json({ message: "指定されたURLは存在しません。" });
});

app.use((error, req, res, next) => {
  console.error(error);
  const isProduction = process.env.NODE_ENV === "production";
  res.status(500).json({
    message: error.publicMessage || "サーバ内部でエラーが発生しました。",
    ...(isProduction ? {} : { detail: error.message }),
  });
});

module.exports = app;

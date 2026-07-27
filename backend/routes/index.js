"use strict";

const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Vue.js + Node.js + MongoDB API",
    endpoints: {
      health: "/health",
      notes: "/notes_from_b",
    },
  });
});

module.exports = router;

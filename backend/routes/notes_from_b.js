"use strict";

const express = require("express");
const { getDatabase } = require("../db/mongo");
const router = express.Router();

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function parseLimit(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return DEFAULT_LIMIT;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
}

function normalizeDocument(document) {
  return {
    _id: document._id ? String(document._id) : "",
    name: document.name == null ? "" : String(document.name),
    mail: document.mail == null ? "" : String(document.mail),
    tel: document.tel == null ? "" : String(document.tel),
  };
}

router.get("/", async (req, res, next) => {
  try {
    const database = await getDatabase();
    const collectionName = process.env.MONGODB_COLLECTION_NAME || "notes";
    const limit = parseLimit(req.query.limit);

    const documents = await database
      .collection(collectionName)
      .find({})
      .sort({ _id: 1 })
      .limit(limit)
      .toArray();

    res.status(200).json(documents.map(normalizeDocument));
  } catch (error) {
    error.publicMessage = "MongoDBからデータを取得できませんでした。";
    next(error);
  }
});

module.exports = router;

"use strict";

const { MongoClient } = require("mongodb");

let client = null;
let database = null;

async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    throw new Error("環境変数 MONGODB_URI が設定されていません。");
  }
  if (!databaseName) {
    throw new Error("環境変数 MONGODB_DB_NAME が設定されていません。");
  }
  if (database) {
    return database;
  }

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  await client.db("admin").command({ ping: 1 });
  database = client.db(databaseName);
  console.log(`Connected to MongoDB database: ${databaseName}`);
  return database;
}

async function closeDatabase() {
  if (!client) return;
  await client.close();
  client = null;
  database = null;
  console.log("MongoDB connection closed.");
}

module.exports = { getDatabase, closeDatabase };

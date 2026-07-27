"use strict";

require("dotenv").config();
const { getDatabase, closeDatabase } = require("../db/mongo");

const sampleData = [
  { name: "Alice", mail: "alice@example.com", tel: "1111" },
  { name: "Bob", mail: "bob@example.com", tel: "4444" },
  { name: "Yoshi", mail: "yoshi@example.com", tel: "2222" },
  { name: "David", mail: "david@example.com", tel: "6666" },
  { name: "Eve", mail: "eve@example.com", tel: "7777" },
  { name: "Frank", mail: "frank@example.com", tel: "8888" },
  { name: "Grace", mail: "grace@example.com", tel: "9999" },
  { name: "Charlie", mail: "charlie@example.com", tel: "5555" },
  { name: "Henry", mail: "henry@example.com", tel: "0000" },
];

async function seed() {
  const database = await getDatabase();
  const collectionName = process.env.MONGODB_COLLECTION_NAME || "notes";
  const collection = database.collection(collectionName);
  const operations = sampleData.map((item) => ({
    updateOne: {
      filter: { mail: item.mail },
      update: { $set: item },
      upsert: true,
    },
  }));
  const result = await collection.bulkWrite(operations);
  console.log(`Collection: ${collectionName}`);
  console.log(`Inserted: ${result.upsertedCount}`);
  console.log(`Updated: ${result.modifiedCount}`);
  console.log(`Matched: ${result.matchedCount}`);
}

seed()
  .catch((error) => {
    console.error("サンプルデータの登録に失敗しました。", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });

const { MongoClient } = require("mongodb");

let db = null;

const connectDB = async () => {
  if (db) return db;

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    db = client.db("digital_life_lessons");
    console.log("MongoDB connected successfully");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
};

module.exports = { connectDB, getDB };

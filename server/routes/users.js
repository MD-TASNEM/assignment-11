const express = require("express");
const router = express.Router();
const { MongoClient, ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// Create user after signup
router.post("/create-user", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { name, email, photoURL } = req.body;
    const uid = req.userId;

    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ _id: uid });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = {
      _id: uid,
      name,
      email,
      photoURL: photoURL || "",
      isPremium: false,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      totalLessonsCreated: 0,
      totalFavorites: 0,
    };

    const result = await usersCollection.insertOne(newUser);
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user profile
router.get("/profile/:uid", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { uid } = req.params;
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ _id: uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user profile
router.patch("/profile/:uid", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { uid } = req.params;
    const { name, photoURL } = req.body;

    // Verify user is updating their own profile
    if (uid !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const usersCollection = db.collection("users");
    const updateData = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (photoURL !== undefined) updateData.photoURL = photoURL;

    const result = await usersCollection.updateOne(
      { _id: uid },
      { $set: updateData },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all users (admin)
router.get("/admin/all-users", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    // Verify admin
    const admin = await usersCollection.findOne({ _id: req.userId });
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const users = await usersCollection.find({}).toArray();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user role (admin)
router.patch("/admin/user-role", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { userId, role } = req.body;
    const usersCollection = db.collection("users");

    // Verify admin
    const admin = await usersCollection.findOne({ _id: req.userId });
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const result = await usersCollection.updateOne(
      { _id: userId },
      { $set: { role, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User role updated successfully" });
  } catch (error) {
    console.error("Error updating user role:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

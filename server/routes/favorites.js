const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getDB } = require("../config/db");

// Add lesson to favorites
router.post("/add-favorite", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { lessonId } = req.body;
    const favoritesCollection = db.collection("favorites");
    const lessonsCollection = db.collection("lessons");
    const usersCollection = db.collection("users");

    // Check if already favorited
    const existingFavorite = await favoritesCollection.findOne({
      userId: req.userId,
      lessonId,
    });

    if (existingFavorite) {
      return res.status(400).json({ message: "Already favorited" });
    }

    const favorite = {
      _id: new require("mongodb").ObjectId().toString(),
      userId: req.userId,
      lessonId,
      createdAt: new Date(),
    };

    await favoritesCollection.insertOne(favorite);

    // Update lesson favorite count
    await lessonsCollection.updateOne(
      { _id: lessonId },
      { $inc: { favoritesCount: 1 } },
    );

    // Update user favorite count
    await usersCollection.updateOne(
      { _id: req.userId },
      { $inc: { totalFavorites: 1 } },
    );

    res.status(201).json({ message: "Added to favorites" });
  } catch (error) {
    console.error("Error adding to favorites:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Remove lesson from favorites
router.delete("/favorite/:lessonId", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { lessonId } = req.params;
    const favoritesCollection = db.collection("favorites");
    const lessonsCollection = db.collection("lessons");
    const usersCollection = db.collection("users");

    const result = await favoritesCollection.deleteOne({
      userId: req.userId,
      lessonId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    // Update lesson favorite count
    await lessonsCollection.updateOne(
      { _id: lessonId },
      { $inc: { favoritesCount: -1 } },
    );

    // Update user favorite count
    await usersCollection.updateOne(
      { _id: req.userId },
      { $inc: { totalFavorites: -1 } },
    );

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error removing from favorites:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's favorites
router.get("/my-favorites", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const favoritesCollection = db.collection("favorites");
    const lessonsCollection = db.collection("lessons");

    const favorites = await favoritesCollection
      .find({ userId: req.userId })
      .toArray();

    const lessonIds = favorites.map((f) => f.lessonId);
    const lessons = await lessonsCollection
      .find({ _id: { $in: lessonIds } })
      .toArray();

    res.json(lessons);
  } catch (error) {
    console.error("Error fetching favorites:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Check if lesson is favorited
router.get("/is-favorite/:lessonId", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { lessonId } = req.params;
    const favoritesCollection = db.collection("favorites");

    const favorite = await favoritesCollection.findOne({
      userId: req.userId,
      lessonId,
    });

    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error("Error checking favorite:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

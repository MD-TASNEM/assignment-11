const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getDB } = require("../config/db");

// Add comment to lesson
router.post("/lesson/:id/comment", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { text } = req.body;

    const lessonsCollection = db.collection("lessons");
    const usersCollection = db.collection("users");

    const lesson = await lessonsCollection.findOne({ _id: id });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const user = await usersCollection.findOne({ _id: req.userId });

    const comment = {
      userId: req.userId,
      userName: user.name,
      userPhoto: user.photoURL,
      text,
      createdAt: new Date(),
    };

    const result = await lessonsCollection.updateOne(
      { _id: id },
      {
        $push: { comments: comment },
        $inc: { commentsCount: 1 },
      },
    );

    res.status(201).json({ message: "Comment added" });
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get comments for lesson
router.get("/lesson/:id/comments", async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const lessonsCollection = db.collection("lessons");

    const lesson = await lessonsCollection.findOne({ _id: id });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.json(lesson.comments || []);
  } catch (error) {
    console.error("Error fetching comments:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

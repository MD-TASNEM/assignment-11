const express = require("express");
const router = express.Router();
const { MongoClient, ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// Create a new lesson
router.post("/create-lesson", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const {
      title,
      description,
      category,
      emotionalTone,
      image,
      visibility,
      accessLevel,
    } = req.body;

    const lessonsCollection = db.collection("lessons");
    const usersCollection = db.collection("users");

    // Verify user exists
    const user = await usersCollection.findOne({ _id: req.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if free user trying to create premium lesson
    if (accessLevel === "premium" && !user.isPremium) {
      return res
        .status(403)
        .json({ message: "Only premium users can create premium lessons" });
    }

    const newLesson = {
      _id: new ObjectId().toString(),
      creatorId: req.userId,
      creatorName: user.name,
      creatorPhoto: user.photoURL,
      title,
      description,
      category,
      emotionalTone,
      image: image || "",
      visibility,
      accessLevel,
      likes: [],
      likesCount: 0,
      comments: [],
      commentsCount: 0,
      favorites: [],
      favoritesCount: 0,
      views: 0,
      featured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await lessonsCollection.insertOne(newLesson);

    // Update user's lesson count
    await usersCollection.updateOne(
      { _id: req.userId },
      { $inc: { totalLessonsCreated: 1 } },
    );

    res.status(201).json({
      message: "Lesson created successfully",
      lesson: newLesson,
    });
  } catch (error) {
    console.error("Error creating lesson:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all public lessons with pagination
router.get("/public-lessons", async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 10, category, emotionalTone, search } = req.query;

    const lessonsCollection = db.collection("lessons");

    // Build filter
    const filter = { visibility: "public" };

    if (category) filter.category = category;
    if (emotionalTone) filter.emotionalTone = emotionalTone;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const lessons = await lessonsCollection
      .find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .toArray();

    const total = await lessonsCollection.countDocuments(filter);

    res.json({
      lessons,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching public lessons:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's lessons
router.get("/my-lessons", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const lessonsCollection = db.collection("lessons");

    const lessons = await lessonsCollection
      .find({ creatorId: req.userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(lessons);
  } catch (error) {
    console.error("Error fetching user lessons:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get lesson by ID
router.get("/lesson/:id", async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const lessonsCollection = db.collection("lessons");

    const lesson = await lessonsCollection.findOne({ _id: id });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Increment views (if not creator)
    const userId = req.headers["x-user-id"];
    if (userId && userId !== lesson.creatorId) {
      await lessonsCollection.updateOne({ _id: id }, { $inc: { views: 1 } });
    }

    res.json(lesson);
  } catch (error) {
    console.error("Error fetching lesson:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update lesson
router.patch("/lesson/:id", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const {
      title,
      description,
      category,
      emotionalTone,
      image,
      visibility,
      accessLevel,
    } = req.body;

    const lessonsCollection = db.collection("lessons");
    const usersCollection = db.collection("users");

    // Verify ownership
    const lesson = await lessonsCollection.findOne({ _id: id });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    if (lesson.creatorId !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check premium access
    if (accessLevel === "premium") {
      const user = await usersCollection.findOne({ _id: req.userId });
      if (!user.isPremium) {
        return res
          .status(403)
          .json({ message: "Only premium users can create premium lessons" });
      }
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (emotionalTone) updateData.emotionalTone = emotionalTone;
    if (image !== undefined) updateData.image = image;
    if (visibility) updateData.visibility = visibility;
    if (accessLevel) updateData.accessLevel = accessLevel;

    const result = await lessonsCollection.updateOne(
      { _id: id },
      { $set: updateData },
    );

    res.json({ message: "Lesson updated successfully" });
  } catch (error) {
    console.error("Error updating lesson:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete lesson
router.delete("/lesson/:id", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const lessonsCollection = db.collection("lessons");
    const usersCollection = db.collection("users");

    const lesson = await lessonsCollection.findOne({ _id: id });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Verify ownership or admin
    const user = await usersCollection.findOne({ _id: req.userId });
    if (lesson.creatorId !== req.userId && user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await lessonsCollection.deleteOne({ _id: id });

    // Update user's lesson count
    if (lesson.creatorId !== req.userId) {
      await usersCollection.updateOne(
        { _id: lesson.creatorId },
        { $inc: { totalLessonsCreated: -1 } },
      );
    } else {
      await usersCollection.updateOne(
        { _id: req.userId },
        { $inc: { totalLessonsCreated: -1 } },
      );
    }

    res.json({ message: "Lesson deleted successfully" });
  } catch (error) {
    console.error("Error deleting lesson:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Toggle like on lesson
router.post("/lesson/:id/like", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const lessonsCollection = db.collection("lessons");

    const lesson = await lessonsCollection.findOne({ _id: id });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const isLiked = lesson.likes.includes(req.userId);

    if (isLiked) {
      await lessonsCollection.updateOne(
        { _id: id },
        {
          $pull: { likes: req.userId },
          $inc: { likesCount: -1 },
        },
      );
    } else {
      await lessonsCollection.updateOne(
        { _id: id },
        {
          $push: { likes: req.userId },
          $inc: { likesCount: 1 },
        },
      );
    }

    res.json({
      message: isLiked ? "Like removed" : "Like added",
      liked: !isLiked,
    });
  } catch (error) {
    console.error("Error toggling like:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get featured lessons (for home page)
router.get("/featured-lessons", async (req, res) => {
  try {
    const db = getDB();
    const lessonsCollection = db.collection("lessons");

    const lessons = await lessonsCollection
      .find({ featured: true, visibility: "public" })
      .limit(6)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(lessons);
  } catch (error) {
    console.error("Error fetching featured lessons:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark/unmark lesson as featured (admin)
router.patch("/admin/lesson/:id/featured", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { featured } = req.body;

    const lessonsCollection = db.collection("lessons");
    const usersCollection = db.collection("users");

    // Verify admin
    const user = await usersCollection.findOne({ _id: req.userId });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const result = await lessonsCollection.updateOne(
      { _id: id },
      { $set: { featured } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.json({ message: "Lesson featured status updated" });
  } catch (error) {
    console.error("Error updating featured status:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

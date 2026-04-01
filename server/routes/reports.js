const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getDB } = require("../config/db");

// Create a report
router.post("/create-report", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { lessonId, reason, description } = req.body;
    const reportsCollection = db.collection("reports");

    const report = {
      _id: new require("mongodb").ObjectId().toString(),
      lessonId,
      reporterUserId: req.userId,
      reporterEmail: req.userEmail,
      reason,
      description: description || "",
      status: "pending",
      createdAt: new Date(),
    };

    await reportsCollection.insertOne(report);
    res.status(201).json({ message: "Report submitted successfully" });
  } catch (error) {
    console.error("Error creating report:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all reports (admin)
router.get("/admin/all-reports", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const reportsCollection = db.collection("reports");
    const lessonsCollection = db.collection("lessons");
    const usersCollection = db.collection("users");

    // Verify admin
    const admin = await usersCollection.findOne({ _id: req.userId });
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const reports = await reportsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Group by lessonId
    const groupedReports = {};
    for (const report of reports) {
      if (!groupedReports[report.lessonId]) {
        const lesson = await lessonsCollection.findOne({
          _id: report.lessonId,
        });
        groupedReports[report.lessonId] = {
          lessonId: report.lessonId,
          lessonTitle: lesson?.title || "Deleted Lesson",
          reportCount: 0,
          reports: [],
        };
      }
      groupedReports[report.lessonId].reportCount++;
      groupedReports[report.lessonId].reports.push(report);
    }

    res.json(Object.values(groupedReports));
  } catch (error) {
    console.error("Error fetching reports:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Take action on report (admin)
router.patch(
  "/admin/report/:lessonId/action",
  verifyToken,
  async (req, res) => {
    try {
      const db = getDB();
      const { lessonId } = req.params;
      const { action } = req.body; // "delete" or "ignore"

      const usersCollection = db.collection("users");
      const reportsCollection = db.collection("reports");
      const lessonsCollection = db.collection("lessons");

      // Verify admin
      const admin = await usersCollection.findOne({ _id: req.userId });
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (action === "delete") {
        // Delete lesson
        const lesson = await lessonsCollection.findOne({ _id: lessonId });
        if (lesson) {
          await lessonsCollection.deleteOne({ _id: lessonId });
          await usersCollection.updateOne(
            { _id: lesson.creatorId },
            { $inc: { totalLessonsCreated: -1 } },
          );
        }
      }

      // Update all reports for this lesson
      await reportsCollection.updateMany(
        { lessonId },
        {
          $set: {
            status: "resolved",
            action,
            reviewedAt: new Date(),
            reviewedBy: req.userId,
          },
        },
      );

      res.json({
        message: `Report ${action === "delete" ? "deleted" : "ignored"}`,
      });
    } catch (error) {
      console.error("Error taking action on report:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

module.exports = router;

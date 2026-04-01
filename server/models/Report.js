const Report = {
  _id: String, // MongoDB ObjectId
  lessonId: String,
  reporterUserId: String, // Firebase UID
  reporterEmail: String,
  reason: String, // Inappropriate Content, Hate Speech, Misleading Info, Spam, Sensitive Content, Other
  description: String, // Optional additional details
  status: String, // "pending", "reviewed", "resolved"
  createdAt: Date,
  reviewedAt: Date,
  reviewedBy: String, // Admin UID
  action: String, // "deleted", "ignored", "warned"
};

module.exports = Report;

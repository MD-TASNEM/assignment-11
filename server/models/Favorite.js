const Favorite = {
  _id: String, // MongoDB ObjectId
  userId: String, // Firebase UID
  lessonId: String,
  createdAt: Date,
};

module.exports = Favorite;

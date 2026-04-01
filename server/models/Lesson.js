const Lesson = {
  _id: String, // MongoDB ObjectId
  creatorId: String, // Firebase UID
  creatorName: String,
  creatorPhoto: String,
  title: String,
  description: String,
  category: String, // Personal Growth, Career, Relationships, Mindset, Mistakes Learned
  emotionalTone: String, // Motivational, Sad, Realization, Gratitude
  image: String, // URL
  visibility: String, // "public" or "private"
  accessLevel: String, // "free" or "premium"
  likes: [String], // Array of user IDs
  likesCount: Number, // default: 0
  comments: [
    {
      userId: String,
      userName: String,
      userPhoto: String,
      text: String,
      createdAt: Date,
    },
  ],
  commentsCount: Number, // default: 0
  favorites: [String], // Array of user IDs who favorited
  favoritesCount: Number, // default: 0
  views: Number, // default: 0
  featured: Boolean, // default: false
  createdAt: Date,
  updatedAt: Date,
};

module.exports = Lesson;

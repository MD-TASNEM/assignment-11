const User = {
  _id: String, // Firebase UID
  name: String,
  email: String,
  photoURL: String,
  isPremium: Boolean, // default: false
  role: String, // "user" or "admin", default: "user"
  createdAt: Date,
  updatedAt: Date,
  totalLessonsCreated: Number, // default: 0
  totalFavorites: Number, // default: 0
};

module.exports = User;

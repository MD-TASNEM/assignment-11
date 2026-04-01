import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../config/api";
import { auth } from "../config/firebase";

export default function PublicLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);

  const filters = {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    emotionalTone: searchParams.get("tone") || "",
    page: parseInt(searchParams.get("page") || "1"),
    sort: searchParams.get("sort") || "newest",
  };

  const categories = [
    "Personal Growth",
    "Career",
    "Relationships",
    "Mindset",
    "Mistakes Learned",
  ];
  const emotions = ["Motivational", "Sad", "Realization", "Gratitude"];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [filters.search, filters.category, filters.emotionalTone, filters.page]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: 9,
      };

      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.emotionalTone) params.emotionalTone = filters.emotionalTone;

      const response = await apiClient.get("/lessons/public-lessons", {
        params,
      });

      setLessons(response.data.lessons);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const isPremiumContent = (lesson) => {
    return lesson.accessLevel === "premium" && !user?.isPremium;
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Explore Public Lessons</h1>

      {/* Filters */}
      <div className="bg-light-bg p-6 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search lessons..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="p-2 border rounded"
          />

          <select
            value={filters.category}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filters.emotionalTone}
            onChange={(e) => updateFilter("tone", e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Tones</option>
            {emotions.map((emotion) => (
              <option key={emotion} value={emotion}>
                {emotion}
              </option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="p-2 border rounded"
          >
            <option value="newest">Newest First</option>
            <option value="mostSaved">Most Saved</option>
            <option value="mostLiked">Most Liked</option>
          </select>
        </div>
      </div>

      {/* Lessons Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
          </div>
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-600">No lessons found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {lessons.map((lesson) => (
              <div
                key={lesson._id}
                className={`card relative ${
                  isPremiumContent(lesson)
                    ? "opacity-50 blur-sm cursor-not-allowed"
                    : "cursor-pointer hover:shadow-lg"
                }`}
              >
                {lesson.image && (
                  <img
                    src={lesson.image}
                    alt={lesson.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}

                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold flex-1">{lesson.title}</h3>
                  {lesson.accessLevel === "premium" && (
                    <span className="bg-accent-color text-white px-2 py-1 rounded text-xs">
                      Premium
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mb-3 line-clamp-2">
                  {lesson.description}
                </p>

                <div className="flex gap-2 mb-3 text-xs">
                  <span className="bg-primary-color/10 text-primary-color px-2 py-1 rounded">
                    {lesson.category}
                  </span>
                  <span className="bg-secondary-color/10 text-secondary-color px-2 py-1 rounded">
                    {lesson.emotionalTone}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                  {lesson.creatorPhoto && (
                    <img
                      src={lesson.creatorPhoto}
                      alt={lesson.creatorName}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span>{lesson.creatorName}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <span>❤️ {lesson.likesCount}</span>
                  <span>🔖 {lesson.favoritesCount}</span>
                  <span>👀 {lesson.views || 0}</span>
                </div>

                {isPremiumContent(lesson) ? (
                  <Link
                    to="/pricing"
                    className="w-full btn-secondary block text-center"
                  >
                    Unlock Premium
                  </Link>
                ) : (
                  <Link
                    to={`/lesson/${lesson._id}`}
                    className="w-full btn-primary block text-center"
                  >
                    Read Full Lesson
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mb-8">
              {pagination.page > 1 && (
                <button
                  onClick={() => updateFilter("page", pagination.page - 1)}
                  className="btn-outline"
                >
                  Previous
                </button>
              )}

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => updateFilter("page", page)}
                    className={
                      pagination.page === page ? "btn-primary" : "btn-outline"
                    }
                  >
                    {page}
                  </button>
                ),
              )}

              {pagination.page < pagination.pages && (
                <button
                  onClick={() => updateFilter("page", pagination.page + 1)}
                  className="btn-outline"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalFavorites: 0,
    recentLessons: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        localStorage.setItem("authToken", token);

        // Fetch user profile
        const userResponse = await apiClient.get(
          `/users/profile/${currentUser.uid}`,
        );
        setUser(userResponse.data);

        // Fetch user's lessons
        const lessonsResponse = await apiClient.get("/lessons/my-lessons");
        const lessons = lessonsResponse.data;

        setStats({
          totalLessons: lessons.length,
          totalFavorites: userResponse.data.totalFavorites,
          recentLessons: lessons.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          ),
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">
        Welcome, {user?.name || "User"}!
      </h1>

      {/* Premium Badge */}
      {user?.isPremium && (
        <div className="bg-accent-color/10 border border-accent-color text-accent-color p-4 rounded-lg mb-8">
          ✨ You have Premium access
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card">
          <h3 className="text-gray-600 mb-2">Total Lessons</h3>
          <p className="text-4xl font-bold text-primary-color">
            {stats.totalLessons}
          </p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 mb-2">Saved Lessons</h3>
          <p className="text-4xl font-bold text-secondary-color">
            {stats.totalFavorites}
          </p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 mb-2">Status</h3>
          <p className="text-2xl font-bold text-success-color">
            {user?.isPremium ? "Premium ⭐" : "Free"}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-primary-color text-white p-8 rounded-lg mb-12">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/dashboard/add-lesson" className="btn-outline">
            ✍️ Create Lesson
          </Link>
          <Link to="/dashboard/my-lessons" className="btn-outline">
            📚 My Lessons
          </Link>
          <Link to="/dashboard/my-favorites" className="btn-outline">
            🔖 My Favorites
          </Link>
          <Link to="/dashboard/profile" className="btn-outline">
            👤 Profile
          </Link>
          {!user?.isPremium && (
            <Link to="/pricing" className="btn-secondary">
              ⭐ Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Recent Lessons */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Recent Lessons</h2>
        {stats.recentLessons.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600 mb-4">
              You haven't created any lessons yet
            </p>
            <Link to="/dashboard/add-lesson" className="btn-primary">
              Create Your First Lesson
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.recentLessons.slice(0, 6).map((lesson) => (
              <Link
                key={lesson._id}
                to={`/lesson/${lesson._id}`}
                className="card hover:shadow-lg"
              >
                {lesson.image && (
                  <img
                    src={lesson.image}
                    alt={lesson.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-bold mb-2">{lesson.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {lesson.description}
                </p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{lesson.category}</span>
                  {lesson.accessLevel === "premium" && (
                    <span className="text-accent-color">Premium ⭐</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

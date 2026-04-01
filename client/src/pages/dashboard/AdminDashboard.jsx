import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLessons: 0,
    totalReports: 0,
    premiumUsers: 0,
    publishedLessons: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [topContributors, setTopContributors] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        localStorage.setItem("authToken", token);

        // Fetch admin stats
        const usersRes = await apiClient.get("/users/all-users");
        const lessonsRes = await apiClient.get("/lessons/all-lessons");
        const reportsRes = await apiClient.get("/reports/all-reports");

        const users = usersRes.data || [];
        const lessons = lessonsRes.data || [];

        const premiumCount = users.filter((u) => u.isPremium).length;
        const publishedLessonsCount = lessons.filter(
          (l) => l.visibility === "public",
        ).length;

        setStats({
          totalUsers: users.length,
          totalLessons: lessons.length,
          totalReports: reportsRes.data?.length || 0,
          premiumUsers: premiumCount,
          publishedLessons: publishedLessonsCount,
        });

        // Recent users (last 5)
        setRecentUsers(
          users
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5),
        );

        // Top contributors (users with most lessons)
        const contributorMap = {};
        lessons.forEach((lesson) => {
          if (!contributorMap[lesson.creatorId]) {
            contributorMap[lesson.creatorId] = {
              id: lesson.creatorId,
              name: lesson.creatorName,
              lessonCount: 0,
            };
          }
          contributorMap[lesson.creatorId].lessonCount++;
        });

        setTopContributors(
          Object.values(contributorMap)
            .sort((a, b) => b.lessonCount - a.lessonCount)
            .slice(0, 5),
        );
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Error loading admin data");
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

  const StatCard = ({ label, value, icon }) => (
    <div className="card">
      <p className="text-gray-600 text-sm mb-2">{label}</p>
      <p className="text-4xl font-bold text-primary-color mb-2">{value}</p>
      <p className="text-2xl">{icon}</p>
    </div>
  );

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Users" value={stats.totalUsers} icon="👥" />
        <StatCard label="Total Lessons" value={stats.totalLessons} icon="📚" />
        <StatCard label="Premium Users" value={stats.premiumUsers} icon="⭐" />
        <StatCard
          label="Published Lessons"
          value={stats.publishedLessons}
          icon="✅"
        />
        <StatCard label="Reports" value={stats.totalReports} icon="🚩" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="card">
          <h3 className="text-2xl font-bold mb-4">Recent Users</h3>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-gray-600">No users yet</p>
            ) : (
              recentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-light-bg rounded"
                >
                  <div>
                    <p className="font-bold">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  {user.isPremium && (
                    <span className="text-yellow-500">⭐</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="card">
          <h3 className="text-2xl font-bold mb-4">Top Contributors</h3>
          <div className="space-y-3">
            {topContributors.length === 0 ? (
              <p className="text-gray-600">No contributors yet</p>
            ) : (
              topContributors.map((contributor, idx) => (
                <div
                  key={contributor.id}
                  className="flex items-center justify-between p-3 bg-light-bg rounded"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary-color">
                      #{idx + 1}
                    </span>
                    <p className="font-bold">{contributor.name}</p>
                  </div>
                  <span className="bg-primary-color text-white px-3 py-1 rounded-full text-sm">
                    {contributor.lessonCount} lessons
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate("/dashboard/admin-manage-users")}
          className="card hover:shadow-lg text-center"
        >
          <p className="text-3xl mb-2">👥</p>
          <h3 className="font-bold">Manage Users</h3>
        </button>
        <button
          onClick={() => navigate("/dashboard/admin-manage-lessons")}
          className="card hover:shadow-lg text-center"
        >
          <p className="text-3xl mb-2">📚</p>
          <h3 className="font-bold">Manage Lessons</h3>
        </button>
        <button
          onClick={() => navigate("/dashboard/admin-reported-lessons")}
          className="card hover:shadow-lg text-center"
        >
          <p className="text-3xl mb-2">🚩</p>
          <h3 className="font-bold">Reported Lessons</h3>
        </button>
      </div>
    </div>
  );
}

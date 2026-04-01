import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";
import toast from "react-hot-toast";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({
    actionsThisMonth: 0,
    lessonsModerated: 0,
    reportsResolved: 0,
    usersManaged: 0,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        localStorage.setItem("authToken", token);

        const userRes = await apiClient.get(
          `/users/profile/${currentUser.uid}`,
        );
        setAdmin(userRes.data);

        // Fetch admin activity stats
        const lessonsRes = await apiClient.get("/lessons/all-lessons");
        const reportsRes = await apiClient.get("/reports/all-reports");
        const usersRes = await apiClient.get("/users/all-users");

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const lessonsThisMonth = (lessonsRes.data || []).filter((l) => {
          const date = new Date(l.createdAt);
          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          );
        }).length;

        const reportsThisMonth = (reportsRes.data || []).filter((r) => {
          const date = new Date(r.createdAt);
          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear &&
            r.status === "resolved"
          );
        }).length;

        setStats({
          actionsThisMonth: lessonsThisMonth + reportsThisMonth,
          lessonsModerated: lessonsRes.data?.length || 0,
          reportsResolved: (reportsRes.data || []).filter(
            (r) => r.status !== "pending",
          ).length,
          usersManaged: usersRes.data?.length || 0,
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading admin profile");
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

  if (!admin) {
    return <div className="container mx-auto py-10">Admin data not found</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Admin Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Admin Info */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <div className="text-center">
              {admin.photoURL && (
                <img
                  src={admin.photoURL}
                  alt={admin.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              )}
              <h2 className="text-2xl font-bold">{admin.name}</h2>
              <p className="text-gray-600 mb-2">{admin.email}</p>
              <span className="inline-block bg-primary-color text-white px-4 py-1 rounded-full font-bold">
                Admin 👑
              </span>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="card">
              <p className="text-gray-600 text-sm mb-2">Actions This Month</p>
              <p className="text-4xl font-bold text-primary-color">
                {stats.actionsThisMonth}
              </p>
              <p className="text-sm text-gray-600 mt-2">📊</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm mb-2">Lessons Moderated</p>
              <p className="text-4xl font-bold text-primary-color">
                {stats.lessonsModerated}
              </p>
              <p className="text-sm text-gray-600 mt-2">📚</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm mb-2">Reports Resolved</p>
              <p className="text-4xl font-bold text-success-color">
                {stats.reportsResolved}
              </p>
              <p className="text-sm text-gray-600 mt-2">✅</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm mb-2">Users Managed</p>
              <p className="text-4xl font-bold text-secondary-color">
                {stats.usersManaged}
              </p>
              <p className="text-sm text-gray-600 mt-2">👥</p>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="card">
            <h3 className="text-2xl font-bold mb-4">Quick Admin Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/dashboard/admin-manage-users")}
                className="w-full btn-primary text-left"
              >
                👥 Manage Users
              </button>
              <button
                onClick={() => navigate("/dashboard/admin-manage-lessons")}
                className="w-full btn-primary text-left"
              >
                📚 Manage Lessons
              </button>
              <button
                onClick={() => navigate("/dashboard/admin-reported-lessons")}
                className="w-full btn-primary text-left"
              >
                🚩 Review Reports
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full btn-outline text-left"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function AdminManageUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        localStorage.setItem("authToken", token);
        await fetchUsers();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading users");
      }
    });

    return unsubscribe;
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/users/all-users");
      setUsers(response.data || []);
    } catch (error) {
      toast.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePremium = async (userId, currentPremium) => {
    const result = await Swal.fire({
      title: "Update User Status?",
      text: `Change premium status to ${!currentPremium ? "Premium" : "Free"}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#6366f1",
      cancelButtonColor: "#ef4444",
    });

    if (result.isConfirmed) {
      try {
        await apiClient.patch(`/users/profile/${userId}`, {
          isPremium: !currentPremium,
        });
        toast.success("User status updated");
        fetchUsers();
      } catch (error) {
        toast.error("Error updating user");
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "" ||
      (roleFilter === "premium" && user.isPremium) ||
      (roleFilter === "free" && !user.isPremium);
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Manage Users</h1>

      {/* Filters */}
      <div className="bg-light-bg p-4 rounded-lg mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Users</option>
          <option value="premium">Premium Only</option>
          <option value="free">Free Only</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-light-bg">
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Lessons Created</th>
              <th className="p-4 text-left">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className="border-b hover:bg-light-bg">
                <td className="p-4 font-bold">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      user.isPremium
                        ? "bg-accent-color text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {user.isPremium ? "Premium ⭐" : "Free"}
                  </span>
                </td>
                <td className="p-4">{user.lessonsCreated || 0}</td>
                <td className="p-4">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() =>
                      handleTogglePremium(user._id, user.isPremium)
                    }
                    className="btn-primary text-xs"
                  >
                    {user.isPremium ? "Remove Premium" : "Make Premium"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";
import toast from "react-hot-toast";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    photoURL: "",
  });
  const [userLessons, setUserLessons] = useState([]);
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalFavorites: 0,
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

        const userResponse = await apiClient.get(
          `/users/profile/${currentUser.uid}`,
        );
        setUser(userResponse.data);
        setFormData({
          name: userResponse.data.name,
          photoURL: userResponse.data.photoURL,
        });

        const lessonsResponse = await apiClient.get("/lessons/my-lessons");
        const publicLessons = lessonsResponse.data.filter(
          (l) => l.visibility === "public",
        );
        setUserLessons(publicLessons);
        setStats({
          totalLessons: lessonsResponse.data.length,
          totalFavorites: userResponse.data.totalFavorites,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await apiClient.patch(`/users/profile/${user._id}`, formData);
      setUser({
        ...user,
        ...formData,
      });
      setEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Error updating profile");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <div className="text-center mb-6">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              )}
              <h2 className="text-2xl font-bold mb-2">{user?.name}</h2>
              <p className="text-gray-600 mb-4">{user?.email}</p>
              {user?.isPremium && (
                <span className="inline-block bg-accent-color text-white px-3 py-1 rounded-full text-sm font-bold">
                  Premium ⭐
                </span>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="mb-4">
                <p className="text-gray-600 text-sm">Total Lessons</p>
                <p className="text-2xl font-bold text-primary-color">
                  {stats.totalLessons}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 text-sm">Saved Lessons</p>
                <p className="text-2xl font-bold text-secondary-color">
                  {stats.totalFavorites}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Member Since</p>
                <p className="font-bold">
                  {user?.createdAt &&
                    new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile & Public Lessons */}
        <div className="lg:col-span-2">
          {/* Edit Form */}
          {editing ? (
            <form onSubmit={handleSaveProfile} className="card mb-8">
              <h3 className="text-2xl font-bold mb-4">Edit Profile</h3>
              <div className="mb-4">
                <label className="block font-bold mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
                />
              </div>
              <div className="mb-6">
                <label className="block font-bold mb-2">Photo URL</label>
                <input
                  type="url"
                  name="photoURL"
                  value={formData.photoURL}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
                />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="btn-primary flex-1">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary mb-8"
            >
              Edit Profile
            </button>
          )}

          {/* Public Lessons */}
          <div>
            <h3 className="text-2xl font-bold mb-6">My Public Lessons</h3>
            {userLessons.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-600">No public lessons yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userLessons.map((lesson) => (
                  <button
                    key={lesson._id}
                    onClick={() => navigate(`/lesson/${lesson._id}`)}
                    className="card hover:shadow-lg text-left"
                  >
                    {lesson.image && (
                      <img
                        src={lesson.image}
                        alt={lesson.title}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h4 className="font-bold mb-2">{lesson.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {lesson.description}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{lesson.category}</span>
                      <span>❤️ {lesson.likesCount}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

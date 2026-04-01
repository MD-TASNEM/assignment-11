import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function AdminManageLessons() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategory] = useState("");
  const [visibilityFilter, setVisibility] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");

  const categories = [
    "Personal Growth",
    "Career",
    "Relationships",
    "Mindset",
    "Mistakes Learned",
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        localStorage.setItem("authToken", token);
        await fetchLessons();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading lessons");
      }
    });

    return unsubscribe;
  }, [navigate]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/lessons/all-lessons");
      setLessons(response.data || []);
    } catch (error) {
      toast.error("Error fetching lessons");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    const result = await Swal.fire({
      title: "Delete Lesson?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6366f1",
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/lessons/lesson/${lessonId}`);
        toast.success("Lesson deleted");
        fetchLessons();
      } catch (error) {
        toast.error("Error deleting lesson");
      }
    }
  };

  const handleToggleFeatured = async (lessonId, currentFeatured) => {
    try {
      await apiClient.patch(`/lessons/lesson/${lessonId}`, {
        isFeatured: !currentFeatured,
      });
      toast.success(`Lesson ${!currentFeatured ? "featured" : "unfeatured"}`);
      fetchLessons();
    } catch (error) {
      toast.error("Error updating lesson");
    }
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "" || lesson.category === categoryFilter;
    const matchesVisibility =
      visibilityFilter === "" || lesson.visibility === visibilityFilter;
    const matchesFeatured =
      featuredFilter === "" ||
      (featuredFilter === "featured" && lesson.isFeatured) ||
      (featuredFilter === "not-featured" && !lesson.isFeatured);
    return (
      matchesSearch && matchesCategory && matchesVisibility && matchesFeatured
    );
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
      <h1 className="text-4xl font-bold mb-8">Manage Lessons</h1>

      {/* Filters */}
      <div className="bg-light-bg p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search lessons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategory(e.target.value)}
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
          value={visibilityFilter}
          onChange={(e) => setVisibility(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Visibility</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <select
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="featured">Featured</option>
          <option value="not-featured">Not Featured</option>
        </select>
      </div>

      {/* Lessons Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-light-bg">
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Creator</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Visibility</th>
              <th className="p-4 text-left">Likes</th>
              <th className="p-4 text-left">Featured</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLessons.map((lesson) => (
              <tr key={lesson._id} className="border-b hover:bg-light-bg">
                <td className="p-4">
                  <Link
                    to={`/lesson/${lesson._id}`}
                    className="font-bold text-primary-color hover:underline"
                  >
                    {lesson.title}
                  </Link>
                </td>
                <td className="p-4">{lesson.creatorName}</td>
                <td className="p-4">{lesson.category}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      lesson.visibility === "public"
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {lesson.visibility}
                  </span>
                </td>
                <td className="p-4">❤️ {lesson.likesCount}</td>
                <td className="p-4">{lesson.isFeatured ? "⭐ Yes" : "No"}</td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end flex-wrap">
                    <button
                      onClick={() =>
                        handleToggleFeatured(lesson._id, lesson.isFeatured)
                      }
                      className="btn-primary text-xs"
                    >
                      {lesson.isFeatured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson._id)}
                      className="btn-danger text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

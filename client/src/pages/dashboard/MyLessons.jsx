import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function MyLessons() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        localStorage.setItem("authToken", token);
        fetchLessons();
      } catch (error) {
        console.error("Error:", error);
        navigate("/login");
      }
    });

    return unsubscribe;
  }, [navigate]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/lessons/my-lessons");
      setLessons(response.data);
      setFilteredLessons(response.data);
    } catch (error) {
      toast.error("Error fetching lessons");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    if (type === "all") {
      setFilteredLessons(lessons);
    } else if (type === "public") {
      setFilteredLessons(lessons.filter((l) => l.visibility === "public"));
    } else if (type === "private") {
      setFilteredLessons(lessons.filter((l) => l.visibility === "private"));
    }
  };

  const handleToggleVisibility = async (lessonId, currentVisibility) => {
    try {
      const newVisibility =
        currentVisibility === "public" ? "private" : "public";
      await apiClient.patch(`/lessons/lesson/${lessonId}`, {
        visibility: newVisibility,
      });
      toast.success(`Lesson is now ${newVisibility}`);
      fetchLessons();
    } catch (error) {
      toast.error("Error updating lesson");
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    const result = await Swal.fire({
      title: "Delete Lesson?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Lessons</h1>
        <Link to="/dashboard/add-lesson" className="btn-primary">
          + Create New
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        {["all", "public", "private"].map((type) => (
          <button
            key={type}
            onClick={() => handleFilterChange(type)}
            className={filterType === type ? "btn-primary" : "btn-outline"}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {filteredLessons.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No lessons found</p>
          <Link to="/dashboard/add-lesson" className="btn-primary">
            Create Your First Lesson
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-light-bg">
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Likes</th>
                <th className="p-4 text-left">Saved</th>
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
                  <td className="p-4">{lesson.category}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        lesson.visibility === "public"
                          ? "bg-success-color/10 text-success-color"
                          : "bg-error-color/10 text-error-color"
                      }`}
                    >
                      {lesson.visibility}
                    </span>
                  </td>
                  <td className="p-4">❤️ {lesson.likesCount}</td>
                  <td className="p-4">🔖 {lesson.favoritesCount}</td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end flex-wrap">
                      <button
                        onClick={() =>
                          handleToggleVisibility(lesson._id, lesson.visibility)
                        }
                        className="btn-outline text-xs"
                      >
                        Toggle
                      </button>
                      <Link
                        to={`/dashboard/update-lesson/${lesson._id}`}
                        className="btn-secondary text-xs"
                      >
                        Edit
                      </Link>
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
      )}
    </div>
  );
}

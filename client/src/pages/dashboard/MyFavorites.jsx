import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";
import toast from "react-hot-toast";

export default function MyFavorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTone, setSelectedTone] = useState("");

  const categories = [
    "Personal Growth",
    "Career",
    "Relationships",
    "Mindset",
    "Mistakes Learned",
  ];
  const emotions = ["Motivational", "Sad", "Realization", "Gratitude"];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        localStorage.setItem("authToken", token);
        fetchFavorites();
      } catch (error) {
        console.error("Error:", error);
        navigate("/login");
      }
    });

    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    let filtered = favorites;

    if (selectedCategory) {
      filtered = filtered.filter((f) => f.category === selectedCategory);
    }

    if (selectedTone) {
      filtered = filtered.filter((f) => f.emotionalTone === selectedTone);
    }

    setFilteredFavorites(filtered);
  }, [favorites, selectedCategory, selectedTone]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/favorites/my-favorites");
      setFavorites(response.data);
    } catch (error) {
      toast.error("Error fetching favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (lessonId) => {
    try {
      await apiClient.delete(`/favorites/favorite/${lessonId}`);
      toast.success("Removed from favorites");
      fetchFavorites();
    } catch (error) {
      toast.error("Error removing favorite");
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
      <h1 className="text-4xl font-bold mb-8">My Saved Lessons</h1>

      {/* Filters */}
      <div className="bg-light-bg p-6 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Tones</option>
            {emotions.map((emotion) => (
              <option key={emotion} value={emotion}>
                {emotion}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredFavorites.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No saved lessons yet</p>
          <Link to="/public-lessons" className="btn-primary">
            Browse Lessons
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-light-bg">
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Author</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Tone</th>
                <th className="p-4 text-left">Likes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFavorites.map((lesson) => (
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
                  <td className="p-4">{lesson.emotionalTone}</td>
                  <td className="p-4">❤️ {lesson.likesCount}</td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end flex-wrap">
                      <Link
                        to={`/lesson/${lesson._id}`}
                        className="btn-primary text-xs"
                      >
                        Read
                      </Link>
                      <button
                        onClick={() => handleRemoveFavorite(lesson._id)}
                        className="btn-danger text-xs"
                      >
                        Remove
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

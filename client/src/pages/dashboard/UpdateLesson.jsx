import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";
import toast from "react-hot-toast";

export default function UpdateLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    emotionalTone: "",
    image: "",
    visibility: "public",
    accessLevel: "free",
  });

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
        await fetchLesson();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading lesson");
      }
    });

    return unsubscribe;
  }, [id, navigate]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/lessons/lesson/${id}`);
      const lesson = response.data;
      setFormData({
        title: lesson.title,
        description: lesson.description,
        category: lesson.category,
        emotionalTone: lesson.emotionalTone,
        image: lesson.image,
        visibility: lesson.visibility,
        accessLevel: lesson.accessLevel,
      });
    } catch (error) {
      toast.error("Error fetching lesson");
      navigate("/dashboard/my-lessons");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          image: event.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.title.length < 5) {
      toast.error("Title must be at least 5 characters");
      return;
    }
    if (formData.description.length < 20) {
      toast.error("Description must be at least 20 characters");
      return;
    }
    if (!formData.category || !formData.emotionalTone) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.patch(`/lessons/lesson/${id}`, formData);
      toast.success("Lesson updated successfully");
      navigate("/dashboard/my-lessons");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating lesson");
    } finally {
      setSubmitting(false);
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
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-4xl font-bold mb-2">Update Lesson</h1>
      <p className="text-gray-600 mb-8">Edit your lesson details</p>

      <form onSubmit={handleSubmit} className="card">
        {/* Title */}
        <div className="mb-6">
          <label className="block font-bold mb-2">Lesson Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter lesson title (min 5 characters)"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
          />
          <p className="text-sm text-gray-600 mt-1">
            {formData.title.length}/5+ characters
          </p>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block font-bold mb-2">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Write a detailed description (min 20 characters)"
            rows="5"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
          />
          <p className="text-sm text-gray-600 mt-1">
            {formData.description.length}/20+ characters
          </p>
        </div>

        {/* Image */}
        <div className="mb-6">
          <label className="block font-bold mb-2">Lesson Image</label>
          {formData.image && (
            <img
              src={formData.image}
              alt="Preview"
              className="w-full h-40 object-cover rounded-lg mb-3"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full"
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block font-bold mb-2">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Emotional Tone */}
        <div className="mb-6">
          <label className="block font-bold mb-2">Emotional Tone *</label>
          <select
            name="emotionalTone"
            value={formData.emotionalTone}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
          >
            <option value="">Select tone</option>
            {emotions.map((emotion) => (
              <option key={emotion} value={emotion}>
                {emotion}
              </option>
            ))}
          </select>
        </div>

        {/* Visibility */}
        <div className="mb-6">
          <label className="block font-bold mb-2">Visibility</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={formData.visibility === "public"}
                onChange={handleChange}
              />
              <span>Public</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={formData.visibility === "private"}
                onChange={handleChange}
              />
              <span>Private</span>
            </label>
          </div>
        </div>

        {/* Access Level */}
        <div className="mb-6">
          <label className="block font-bold mb-2">Access Level</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="accessLevel"
                value="free"
                checked={formData.accessLevel === "free"}
                onChange={handleChange}
              />
              <span>Free</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="accessLevel"
                value="premium"
                checked={formData.accessLevel === "premium"}
                onChange={handleChange}
              />
              <span>Premium (Only for premium members)</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={submitting}
          >
            {submitting ? "Updating..." : "Update Lesson"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard/my-lessons")}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

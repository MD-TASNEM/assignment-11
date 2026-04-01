import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";
import toast from "react-hot-toast";

export default function AddLesson() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

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
      setUser(currentUser);
      // Fetch user premium status
      try {
        const token = await currentUser.getIdToken();
        localStorage.setItem("authToken", token);
        const response = await apiClient.get(
          `/users/profile/${currentUser.uid}`,
        );
        setIsPremium(response.data.isPremium);
      } catch (error) {
        console.error("Error fetching user:", error);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, store image URL. In production, upload to cloud storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.emotionalTone
    ) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (formData.title.length < 5) {
      toast.error("Title must be at least 5 characters");
      setLoading(false);
      return;
    }

    if (formData.description.length < 20) {
      toast.error("Description must be at least 20 characters");
      setLoading(false);
      return;
    }

    if (formData.accessLevel === "premium" && !isPremium) {
      toast.error("Only premium users can create premium lessons");
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post("/lessons/create-lesson", formData);
      toast.success("Lesson created successfully!");
      navigate("/dashboard/my-lessons");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating lesson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Create a Life Lesson</h1>

      <form onSubmit={handleSubmit} className="card">
        {/* Title */}
        <div className="mb-6">
          <label className="block font-bold mb-2">
            Lesson Title <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Give your lesson a meaningful title"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 5 characters</p>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block font-bold mb-2">
            Description / Story <span className="text-red-600">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Share your full story, insights, and the lesson you learned..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
            rows="6"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 20 characters</p>
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block font-bold mb-2">
            Category <span className="text-red-600">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Emotional Tone */}
        <div className="mb-6">
          <label className="block font-bold mb-2">
            Emotional Tone <span className="text-red-600">*</span>
          </label>
          <select
            name="emotionalTone"
            value={formData.emotionalTone}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
            required
          >
            <option value="">Select the tone</option>
            {emotions.map((emotion) => (
              <option key={emotion} value={emotion}>
                {emotion}
              </option>
            ))}
          </select>
        </div>

        {/* Image */}
        <div className="mb-6">
          <label className="block font-bold mb-2">Featured Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-3 border rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Add a cover image for your lesson
          </p>
        </div>

        {/* Visibility */}
        <div className="mb-6">
          <label className="block font-bold mb-2">Visibility</label>
          <select
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color"
          >
            <option value="public">Public (Everyone can see)</option>
            <option value="private">Private (Only you can see)</option>
          </select>
        </div>

        {/* Access Level */}
        <div className="mb-6">
          <label className="block font-bold mb-2">Access Level</label>
          <select
            name="accessLevel"
            value={formData.accessLevel}
            onChange={handleChange}
            disabled={!isPremium}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-color ${
              !isPremium ? "opacity-50 cursor-not-allowed bg-gray-50" : ""
            }`}
            title={
              !isPremium ? "Upgrade to Premium to create premium lessons" : ""
            }
          >
            <option value="free">Free (Visible to everyone)</option>
            <option value="premium" disabled={!isPremium}>
              Premium (Visible to premium members only)
            </option>
          </select>
          {!isPremium && (
            <p className="text-xs text-warning-color mt-1">
              Upgrade to Premium to create premium lessons ⭐
            </p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary"
          >
            {loading ? "Creating..." : "Create Lesson"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex-1 btn-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

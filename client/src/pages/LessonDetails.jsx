import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../config/api";
import { auth } from "../config/firebase";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function LessonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [relatedLessons, setRelatedLessons] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchLesson();
  }, [id]);

  useEffect(() => {
    if (lesson && user) {
      checkFavoriteStatus();
      checkLikeStatus();
      fetchComments();
      fetchRelatedLessons();
    }
  }, [lesson, user]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/lessons/lesson/${id}`);
      setLesson(response.data);
    } catch (error) {
      toast.error("Lesson not found");
      navigate("/public-lessons");
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user) return;
    try {
      const response = await apiClient.get(`/favorites/is-favorite/${id}`);
      setIsFavorited(response.data.isFavorited);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const checkLikeStatus = async () => {
    if (!user || !lesson) return;
    setIsLiked(lesson.likes?.includes(user.uid));
  };

  const fetchComments = async () => {
    try {
      const response = await apiClient.get(`/comments/lesson/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchRelatedLessons = async () => {
    try {
      const response = await apiClient.get("/lessons/public-lessons", {
        params: {
          category: lesson.category,
          limit: 6,
        },
      });
      setRelatedLessons(
        response.data.lessons.filter((l) => l._id !== id).slice(0, 6),
      );
    } catch (error) {
      console.error("Error fetching related lessons:", error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please login to save lessons");
      navigate("/login");
      return;
    }

    try {
      if (isFavorited) {
        await apiClient.delete(`/favorites/favorite/${id}`);
        toast.success("Removed from favorites");
      } else {
        await apiClient.post("/favorites/add-favorite", { lessonId: id });
        toast.success("Added to favorites");
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating favorite");
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      toast.error("Please login to like lessons");
      navigate("/login");
      return;
    }

    try {
      const response = await apiClient.post(`/lessons/lesson/${id}/like`);
      setIsLiked(response.data.liked);
      setLesson({
        ...lesson,
        likesCount: response.data.liked
          ? lesson.likesCount + 1
          : lesson.likesCount - 1,
      });
      toast.success(response.data.message);
    } catch (error) {
      toast.error("Error updating like");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to comment");
      navigate("/login");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      await apiClient.post(`/comments/lesson/${id}/comment`, {
        text: newComment,
      });
      setNewComment("");
      fetchComments();
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Error adding comment");
    }
  };

  const handleReportLesson = async () => {
    if (!user) {
      toast.error("Please login to report");
      navigate("/login");
      return;
    }

    const { value: reason } = await Swal.fire({
      title: "Report Lesson",
      input: "select",
      inputOptions: {
        "Inappropriate Content": "Inappropriate Content",
        "Hate Speech or Harassment": "Hate Speech or Harassment",
        "Misleading or False Information": "Misleading or False Information",
        "Spam or Promotional Content": "Spam or Promotional Content",
        "Sensitive or Disturbing Content": "Sensitive or Disturbing Content",
        Other: "Other",
      },
      inputPlaceholder: "Select a reason",
      showCancelButton: true,
    });

    if (reason) {
      try {
        await apiClient.post("/reports/create-report", {
          lessonId: id,
          reason,
        });
        toast.success("Report submitted!");
      } catch (error) {
        toast.error("Error submitting report");
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

  if (!lesson) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="text-xl text-gray-600">Lesson not found</p>
      </div>
    );
  }

  // Check if premium content and user is not premium
  if (lesson.accessLevel === "premium" && user && !user.isPremium) {
    return (
      <div className="container mx-auto py-20">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-8">
          <h2 className="text-2xl font-bold mb-4">Premium Content</h2>
          <p className="mb-6">
            This is a premium lesson. Subscribe to unlock exclusive content from
            community members.
          </p>
          <button onClick={() => navigate("/pricing")} className="btn-primary">
            Upgrade to Premium ⭐
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Lesson Content */}
      <article className="max-w-4xl mx-auto mb-12">
        {lesson.image && (
          <img
            src={lesson.image}
            alt={lesson.title}
            className="w-full h-96 object-cover rounded-lg mb-8"
          />
        )}

        <h1 className="text-5xl font-bold mb-4">{lesson.title}</h1>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-600">
          <span>
            Created: {new Date(lesson.createdAt).toLocaleDateString()}
          </span>
          <span>Category: {lesson.category}</span>
          <span>Tone: {lesson.emotionalTone}</span>
          {lesson.accessLevel === "premium" && (
            <span className="bg-accent-color text-white px-2 py-1 rounded">
              Premium
            </span>
          )}
        </div>

        {/* Content */}
        <div className="prose max-w-none mb-8">
          <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
            {lesson.description}
          </p>
        </div>

        {/* Author Card */}
        <div className="bg-light-bg p-6 rounded-lg mb-8 flex items-center gap-4">
          {lesson.creatorPhoto && (
            <img
              src={lesson.creatorPhoto}
              alt={lesson.creatorName}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h3 className="font-bold text-lg">{lesson.creatorName}</h3>
            <p className="text-gray-600">
              {/* Total lessons would come from author data */}
              Author
            </p>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl mb-2">❤️</div>
            <p className="text-gray-600">{lesson.likesCount} Likes</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">🔖</div>
            <p className="text-gray-600">{lesson.favoritesCount} Saved</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">👀</div>
            <p className="text-gray-600">{lesson.views || 0} Views</p>
          </div>
        </div>

        {/* Interaction Buttons */}
        <div className="flex gap-4 mb-12 flex-wrap">
          <button
            onClick={handleToggleFavorite}
            className={isLiked ? "btn-primary" : "btn-outline"}
          >
            🔖 {isFavorited ? "Saved" : "Save"}
          </button>
          <button
            onClick={handleToggleLike}
            className={isLiked ? "btn-primary" : "btn-outline"}
          >
            ❤️ {isLiked ? "Liked" : "Like"}
          </button>
          <button onClick={handleReportLesson} className="btn-danger">
            🚩 Report
          </button>
        </div>

        {/* Comments Section */}
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>

          {user ? (
            <form onSubmit={handleAddComment} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-4 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary-color"
                rows="4"
              />
              <button type="submit" className="btn-primary">
                Post Comment
              </button>
            </form>
          ) : (
            <p className="text-gray-600 mb-8">
              Please{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-primary-color font-bold"
              >
                login
              </button>{" "}
              to comment
            </p>
          )}

          {comments.length === 0 ? (
            <p className="text-gray-600">No comments yet</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment, idx) => (
                <div key={idx} className="card">
                  <div className="flex items-center gap-3 mb-2">
                    {comment.userPhoto && (
                      <img
                        src={comment.userPhoto}
                        alt={comment.userName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-bold">{comment.userName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Related Lessons */}
      {relatedLessons.length > 0 && (
        <section className="border-t pt-12">
          <h2 className="text-3xl font-bold mb-8">Similar Lessons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedLessons.map((related) => (
              <button
                key={related._id}
                onClick={() => navigate(`/lesson/${related._id}`)}
                className="card hover:shadow-lg text-left"
              >
                {related.image && (
                  <img
                    src={related.image}
                    alt={related.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-bold mb-2">{related.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {related.description}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../config/api";
import toast from "react-hot-toast";

export default function Home() {
  const [featuredLessons, setFeaturedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchFeaturedLessons();
  }, []);

  const fetchFeaturedLessons = async () => {
    try {
      const response = await apiClient.get("/lessons/featured-lessons");
      setFeaturedLessons(response.data);
    } catch (error) {
      console.error("Error fetching featured lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const heroSlides = [
    {
      title: "Preserve Your Wisdom",
      description:
        "Capture and share the valuable lessons you've learned throughout your life journey.",
      image: "🎯",
    },
    {
      title: "Learn from Others",
      description:
        "Discover meaningful insights and growth wisdom from our global community.",
      image: "🌍",
    },
    {
      title: "Grow Every Day",
      description:
        "Transform your knowledge into personal growth and meaningful change.",
      image: "🌱",
    },
  ];

  const benefits = [
    {
      icon: "💾",
      title: "Preserve Memories",
      description: "Never forget the valuable lessons you've learned",
    },
    {
      icon: "👥",
      title: "Build Community",
      description: "Connect with others on meaningful personal growth",
    },
    {
      icon: "🔍",
      title: "Discover Wisdom",
      description: "Learn from the experiences of thousands",
    },
    {
      icon: "⭐",
      title: "Premium Content",
      description: "Access exclusive insights from premium members",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  return (
    <div>
      {/* Hero Slider */}
      <section className="relative bg-gradient-to-r from-primary-color to-secondary-color text-white py-20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={prevSlide}
              className="absolute left-4 z-10 bg-white text-primary-color p-2 rounded-full hover:bg-gray-100"
            >
              ❮
            </button>

            <div className="flex-1 text-center mx-12">
              <div className="text-6xl mb-6">
                {heroSlides[currentSlide].image}
              </div>
              <h1 className="text-5xl font-bold mb-4">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-xl mb-8">
                {heroSlides[currentSlide].description}
              </p>
              <Link to="/public-lessons" className="btn-primary">
                Explore Lessons
              </Link>
            </div>

            <button
              onClick={nextSlide}
              className="absolute right-4 z-10 bg-white text-primary-color p-2 rounded-full hover:bg-gray-100"
            >
              ❯
            </button>
          </div>

          {/* Slider indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition ${
                  idx === currentSlide ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Lessons */}
      {!loading && (
        <section className="container mx-auto py-20">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Featured Lessons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLessons.map((lesson) => (
              <Link
                key={lesson._id}
                to={`/lesson/${lesson._id}`}
                className="card hover:shadow-lg"
              >
                {lesson.image && (
                  <img
                    src={lesson.image}
                    alt={lesson.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-xl font-bold mb-2">{lesson.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {lesson.description}
                </p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{lesson.category}</span>
                  <span>{lesson.emotionalTone}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="bg-light-bg py-20">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Why Learning From Life Matters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="card text-center">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-color text-white py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Share Your Story?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of people preserving and sharing meaningful life
            lessons.
          </p>
          <Link to="/register" className="btn-outline">
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import apiClient from "../config/api";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function Pricing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);
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

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post(
        "/payments/create-checkout-session",
      );
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error creating checkout session",
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { name: "Lessons per month", free: "3", premium: "Unlimited" },
    { name: "Premium content access", free: "No", premium: "Yes" },
    { name: "Create premium lessons", free: "No", premium: "Yes" },
    { name: "Ad-free experience", free: "No", premium: "Yes" },
    { name: "Priority listing", free: "No", premium: "Yes" },
    { name: "Profile badges", free: "No", premium: "Yes ⭐" },
    { name: "Export as PDF", free: "No", premium: "Yes" },
    { name: "Analytics dashboard", free: "No", premium: "Yes" },
  ];

  if (isPremium) {
    return (
      <div className="container mx-auto py-20 text-center">
        <div className="bg-accent-color/10 border-2 border-accent-color rounded-lg p-12">
          <div className="text-6xl mb-4">⭐</div>
          <h1 className="text-4xl font-bold mb-4 text-accent-color">
            You're Premium!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Enjoy all the benefits of our premium membership
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light-bg min-h-screen py-16">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-gray-600">
            Unlock unlimited access to all premium features
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Free Plan</h2>
            <div className="mb-6">
              <p className="text-4xl font-bold text-primary-color">$0</p>
              <p className="text-gray-600">Forever free</p>
            </div>
            <button className="w-full btn-outline mb-8" disabled>
              Current Plan
            </button>
            <div className="space-y-3 text-left">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>
                    {feature.name}:
                    <span className="font-bold ml-2">{feature.free}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Plan */}
          <div className="card border-4 border-accent-color relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent-color text-white px-4 py-1 rounded-full text-sm font-bold">
              Best Value
            </div>
            <h2 className="text-2xl font-bold mb-4">Premium Plan</h2>
            <div className="mb-6">
              <p className="text-4xl font-bold text-accent-color">$15</p>
              <p className="text-gray-600">One-time payment</p>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full btn-primary mb-8"
            >
              {loading ? "Processing..." : "Upgrade Now ⭐"}
            </button>
            <div className="space-y-3 text-left">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-accent-color font-bold">✓</span>
                  <span>
                    {feature.name}:
                    <span className="font-bold ml-2">{feature.premium}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">FAQ</h2>
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-bold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                It's a one-time payment, so no recurring charges. Your premium
                access is permanent.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards through Stripe's secure payment
                gateway.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold mb-2">Do I get a refund?</h3>
              <p className="text-gray-600">
                Please contact support for refund requests within 30 days of
                purchase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
